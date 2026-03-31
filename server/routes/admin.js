/* 最高管理者API（sql.js対応） */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll } = require('../db');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

router.use(authenticate, requireSuperAdmin);

// ダッシュボード
router.get('/dashboard', async (req, res) => {
  const totalTenants = (await dbGet("SELECT COUNT(*) as count FROM tenants", []) || {}).count || 0;
  const totalUsers = (await dbGet("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL", []) || {}).count || 0;
  const activeUsers = (await dbGet("SELECT COUNT(*) as count FROM users WHERE status = 'Active' AND deleted_at IS NULL", []) || {}).count || 0;
  const planDist = await dbAll("SELECT plan, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY plan", []);
  const apiStats = await dbGet("SELECT COUNT(*) as calls, COALESCE(SUM(cost), 0) as totalCost, COALESCE(SUM(input_tokens + output_tokens), 0) as totalTokens FROM api_usage", []) || {};
  const expiringSoon = (await dbGet("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND renewal_date < NOW() + INTERVAL '30 days'", []) || {}).count || 0;
  const recentLogs = await dbAll("SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 20", []);

  res.json({ totalTenants, totalUsers, activeUsers, planDist, apiStats, expiringSoon, recentLogs });
});

// ユーザー一覧
router.get('/users', async (req, res) => {
  const { search, plan, status, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT id, tenant_id, name, email, plan, status, role, joined_at, renewal_date, last_login, deleted_at FROM users WHERE 1=1';
  const params = [];

  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (plan) { sql += ' AND plan = ?'; params.push(plan); }
  if (status === 'Deleted') { sql += ' AND deleted_at IS NOT NULL'; }
  else if (status) { sql += ' AND status = ? AND deleted_at IS NULL'; params.push(status); }
  else { sql += ' AND deleted_at IS NULL'; }

  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as count FROM');
  const total = (await dbGet(countSql, params) || {}).count || 0;

  sql += ' ORDER BY joined_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const users = await dbAll(sql, params);
  users.forEach(u => {
    if (u.renewal_date) u.remaining_days = Math.ceil((new Date(u.renewal_date) - new Date()) / (1000 * 60 * 60 * 24));
  });

  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

// ユーザー追加
router.post('/users', async (req, res) => {
  const { name, email, plan, contractMonths, memo } = req.body;
  if (!name || !email) return res.status(400).json({ error: '氏名とメールアドレスは必須です' });

  const exists = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) return res.status(409).json({ error: 'このメールアドレスは既に使用されています' });

  const hash = bcrypt.hashSync('temppassword123', 10);
  const months = Number(contractMonths) || 12;
  const renewal = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

  const r = await dbRun('INSERT INTO users (name, email, password_hash, plan, renewal_date, memo) VALUES (?, ?, ?, ?, ?, ?)', [name, email, hash, plan || 'Free', renewal, memo || '']);

  // ライセンスキー自動生成（UUID v4形式）
  const licenseKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r2 = Math.random() * 16 | 0;
    return (c === 'x' ? r2 : (r2 & 0x3 | 0x8)).toString(16);
  });

  try {
    await dbRun('INSERT INTO license_keys (user_id, license_key, plan, expires_at) VALUES (?, ?, ?, ?)',
      [r.lastInsertRowid, licenseKey, plan || 'Free', renewal]);
  } catch(e) { /* ライセンステーブルが未作成の場合は無視 */ }

  await dbRun('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'ADMIN_ADD_USER', `ユーザー追加: ${email} / ライセンス: ${licenseKey}`]);
  res.json({ id: r.lastInsertRowid, licenseKey });
});

// ユーザー更新
router.put('/users/:id', async (req, res) => {
  const { name, plan, status, renewal_date, memo } = req.body;
  const user = await dbGet('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);
  if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });

  await dbRun('UPDATE users SET name=?, plan=?, status=?, renewal_date=?, memo=?, updated_at=datetime("now") WHERE id=?', [name || user.name, plan || user.plan, status || user.status, renewal_date || user.renewal_date, memo ?? user.memo, parseInt(req.params.id)]);

  await dbRun('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'ADMIN_UPDATE_USER', `ユーザー更新: id=${req.params.id}`]);
  res.json({ success: true });
});

// ユーザー論理削除
router.delete('/users/:id', async (req, res) => {
  await dbRun('UPDATE users SET status = "Deleted", deleted_at = datetime("now"), deleted_by = ?, updated_at = datetime("now") WHERE id = ?', [req.user.id, parseInt(req.params.id)]);
  await dbRun('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'ADMIN_DELETE_USER', `ユーザー論理削除: id=${req.params.id}`]);
  res.json({ success: true });
});

// ユーザー復元
router.post('/users/:id/restore', async (req, res) => {
  await dbRun('UPDATE users SET status = "Active", deleted_at = NULL, deleted_by = NULL, updated_at = NOW() WHERE id = ?', [parseInt(req.params.id)]);
  await dbRun('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'ADMIN_RESTORE_USER', `ユーザー復元: id=${req.params.id}`]);
  res.json({ success: true });
});

// =============================================
// テナント管理
// =============================================
router.get('/tenants', async (req, res) => {
  const rows = await dbAll('SELECT * FROM tenants ORDER BY created_at DESC');
  // 各テナントのユーザー数などを取得
  for (let t of rows) {
    t.user_count = (await dbGet('SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND deleted_at IS NULL', [t.id]) || {}).count || 0;
  }
  res.json(rows);
});

router.post('/tenants', async (req, res) => {
  const { name, plan } = req.body;
  if (!name) return res.status(400).json({ error: 'テナント名は必須です' });
  const r = await dbRun('INSERT INTO tenants (name, plan, status) VALUES (?, ?, ?)', [name, plan || 'Free', 'Active']);
  res.json({ id: r.lastInsertRowid });
});

router.put('/tenants/:id', async (req, res) => {
  const { name, plan, status, openai_api_key } = req.body;
  await dbRun('UPDATE tenants SET name=?, plan=?, status=?, openai_api_key=?, updated_at=NOW() WHERE id=?', [name, plan, status, openai_api_key, parseInt(req.params.id)]);
  res.json({ success: true });
});

// 監査ログ
router.get('/logs', async (req, res) => {
  const logs = await dbAll("SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 100", []);
  res.json(logs);
});

module.exports = router;
