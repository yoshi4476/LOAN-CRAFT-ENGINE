/* 認証API（sql.js対応） */
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../db');
const { authenticate, generateToken } = require('../middleware/auth');
const SUPER_ADMIN = process.env.SUPER_ADMIN_EMAIL || 'y.wakata.linkdesign@gmail.com';

// 新規登録
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: '全項目を入力してください' });
    if (password.length < 6) return res.status(400).json({ error: 'パスワードは6文字以上' });

    const exists = await dbGet('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    if (exists) return res.status(409).json({ error: 'このメールアドレスは既に登録済みです' });

    const hash = bcrypt.hashSync(password, 10);
    const role = email === SUPER_ADMIN ? 'super_admin' : 'user';
    const renewalDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // デフォルトテナント（1）に所属させる（※本運用ではテナント作成APIで対応）
    const result = await dbRun('INSERT INTO users (name, email, password_hash, role, plan, renewal_date, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, email, hash, role, 'Free', renewalDate, 1]);

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(user);
    await dbRun('INSERT INTO audit_logs (user_id, action, detail, tenant_id) VALUES (?, ?, ?, ?)', [user.id, 'REGISTER', `新規登録: ${email}`, 1]);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, renewalDate: user.renewal_date, tenant_id: user.tenant_id, terms_agreed_at: user.terms_agreed_at } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ライセンスキーログイン
router.post('/license-login', async (req, res) => {
  try {
    const { license_key } = req.body;
    if (!license_key) return res.status(400).json({ error: 'ライセンスキーを入力してください' });

    // マスターキー対応（SaaS管理用）
    const MASTER_KEY = process.env.MASTER_LICENSE_KEY || 'SUPER-ADMIN-MASTER-KEY';
    if (license_key === MASTER_KEY) {
      const user = { id: 1, email: SUPER_ADMIN, name: 'SaaS管理者', role: 'super_admin', tenant_id: 1 };
      const token = generateToken(user);
      return res.json({ token, user, role: 'super_admin' });
    }

    const lk = await dbGet('SELECT * FROM license_keys WHERE license_key = ?', [license_key]);
    if (!lk) return res.status(401).json({ error: '無効なライセンスキーです' });

    if (lk.is_active === 0 || lk.is_active === false) {
      return res.status(403).json({ error: '現在ご利用のライセンスは無効化されています。管理者へご連絡ください。', code: 'LICENSE_EXPIRED' });
    }

    if (lk.expires_at && new Date(lk.expires_at) < new Date()) {
      return res.status(403).json({ error: 'ご契約の有効期限が終了しました。利用を再開するには更新手続きをお願いします。', code: 'LICENSE_EXPIRED' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [lk.user_id]);
    if (!user) return res.status(401).json({ error: 'ライセンスに紐づくユーザーが存在しません' });
    if (user.status === 'Suspended') return res.status(403).json({ error: 'アカウントが停止されています' });

    await dbRun('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?', [user.id]);
    const token = generateToken(user);
    await dbRun('INSERT INTO audit_logs (user_id, action, tenant_id) VALUES (?, ?, ?)', [user.id, 'LICENSE_LOGIN', user.tenant_id]);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, renewalDate: user.renewal_date, tenant_id: user.tenant_id, terms_agreed_at: user.terms_agreed_at } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'メールとパスワードを入力してください' });

    const user = await dbGet('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    if (!user) return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    if (user.status === 'Suspended') return res.status(403).json({ error: 'アカウントが停止されています' });

    await dbRun('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?', [user.id]);
    const token = generateToken(user);
    await dbRun('INSERT INTO audit_logs (user_id, action, tenant_id) VALUES (?, ?, ?)', [user.id, 'LOGIN', user.tenant_id]);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, renewalDate: user.renewal_date, tenant_id: user.tenant_id, terms_agreed_at: user.terms_agreed_at } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 自分の情報
router.get('/me', authenticate, async (req, res) => {
  const user = await dbGet('SELECT id, name, email, role, plan, status, renewal_date, joined_at, last_login, terms_agreed_at, tenant_id FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
  
  const tenant = await dbGet('SELECT * FROM tenants WHERE id = ?', [user.tenant_id]);
  user.tenant = tenant || null;
  
  res.json(user);
});

// 利用規約に同意する
router.post('/agree-terms', authenticate, async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    await dbRun('UPDATE users SET terms_agreed_at = NOW(), updated_at = NOW() WHERE id = ?', [req.user.id]);
    await dbRun('INSERT INTO audit_logs (user_id, action, detail, ip, tenant_id) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'TERMS_AGREE', '利用規約・プライバシーポリシーに同意しました', ip, req.user.tenant_id]);
    res.json({ success: true, message: '利用規約に同意しました' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
