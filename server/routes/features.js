/* ドキュメント保存・学習データ・スケジュール API */
const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// =============================================
// ドキュメント保存 API
// =============================================

// 保存済みドキュメント一覧
router.get('/documents', async (req, res) => {
  const rows = await dbAll('SELECT id, doc_id, doc_name, mode, created_at, updated_at FROM saved_documents WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
  res.json(rows);
});

// ドキュメント取得（個別）
router.get('/documents/:docId', async (req, res) => {
  const row = await dbGet('SELECT * FROM saved_documents WHERE user_id = ? AND doc_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id, req.params.docId]);
  if (row) { try { row.content = JSON.parse(row.content); } catch(e) {} }
  res.json(row || null);
});

// ドキュメント保存（upsert）
router.put('/documents/:docId', async (req, res) => {
  const { doc_name, content, mode } = req.body;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const existing = await dbGet('SELECT id FROM saved_documents WHERE user_id = ? AND doc_id = ?', [req.user.id, req.params.docId]);
  if (existing) {
    await dbRun('UPDATE saved_documents SET doc_name=?, content=?, mode=?, updated_at=datetime("now") WHERE id=?', [doc_name, contentStr, mode || 'template', existing.id]);
    res.json({ id: existing.id, updated: true });
  } else {
    const r = await dbRun('INSERT INTO saved_documents (user_id, doc_id, doc_name, content, mode) VALUES (?, ?, ?, ?, ?)', [req.user.id, req.params.docId, doc_name, contentStr, mode || 'template']);
    res.json({ id: r.lastInsertRowid, created: true });
  }
});

// ドキュメント削除
router.delete('/documents/:id', async (req, res) => {
  await dbRun('DELETE FROM saved_documents WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  res.json({ success: true });
});

// =============================================
// 学習データ API
// =============================================

// 学習データ一覧
router.get('/learning', async (req, res) => {
  const rows = await dbAll('SELECT * FROM learning_cases WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  rows.forEach(r => {
    try { r.company_snapshot = JSON.parse(r.company_snapshot); } catch(e) {}
    try { r.doc_snapshot = JSON.parse(r.doc_snapshot); } catch(e) {}
  });
  res.json(rows);
});

// 学習データ登録
router.post('/learning', async (req, res) => {
  const { result, bank, amount, fail_reason, memo, company_snapshot, doc_snapshot } = req.body;
  if (!result) return res.status(400).json({ error: 'resultは必須です' });
  const r = await dbRun(
    'INSERT INTO learning_cases (user_id, result, bank, amount, fail_reason, memo, company_snapshot, doc_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, result, bank || '', amount || 0, fail_reason || '', memo || '', JSON.stringify(company_snapshot || {}), JSON.stringify(doc_snapshot || {})]
  );
  res.json({ id: r.lastInsertRowid });
});

// 学習データ削除
router.delete('/learning/:id', async (req, res) => {
  await dbRun('DELETE FROM learning_cases WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  res.json({ success: true });
});

// 学習分析（統計）
router.get('/learning/stats', async (req, res) => {
  const total = (await dbGet('SELECT COUNT(*) as count FROM learning_cases WHERE user_id = ?', [req.user.id]) || {}).count || 0;
  const success = (await dbGet("SELECT COUNT(*) as count FROM learning_cases WHERE user_id = ? AND result = 'success'", [req.user.id]) || {}).count || 0;
  const fail = (await dbGet("SELECT COUNT(*) as count FROM learning_cases WHERE user_id = ? AND result = 'fail'", [req.user.id]) || {}).count || 0;
  const failReasons = await dbAll("SELECT fail_reason FROM learning_cases WHERE user_id = ? AND result = 'fail' AND fail_reason != ''", [req.user.id]);
  res.json({ total, success, fail, successRate: total > 0 ? Math.round(success / total * 100) : 0, failReasons: failReasons.map(r => r.fail_reason) });
});

// =============================================
// スケジュール API
// =============================================

// スケジュール一覧
router.get('/schedules', async (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM schedules WHERE user_id = ?';
  const params = [req.user.id];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date ASC, time ASC';
  res.json(await dbAll(sql, params));
});

// スケジュール追加
router.post('/schedules', async (req, res) => {
  const { title, date, time, type, bank, memo } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'タイトルと日付は必須です' });
  const r = await dbRun(
    'INSERT INTO schedules (user_id, title, date, time, type, bank, memo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, title, date, time || '', type || 'meeting', bank || '', memo || '']
  );
  res.json({ id: r.lastInsertRowid });
});

// スケジュール更新
router.put('/schedules/:id', async (req, res) => {
  const { title, date, time, type, bank, memo, completed } = req.body;
  const existing = await dbGet('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (!existing) return res.status(404).json({ error: 'スケジュールが見つかりません' });
  await dbRun(
    'UPDATE schedules SET title=?, date=?, time=?, type=?, bank=?, memo=?, completed=?, updated_at=datetime("now") WHERE id=?',
    [title || existing.title, date || existing.date, time ?? existing.time, type || existing.type, bank ?? existing.bank, memo ?? existing.memo, completed ?? existing.completed, parseInt(req.params.id)]
  );
  res.json({ success: true });
});

// スケジュール削除
router.delete('/schedules/:id', async (req, res) => {
  await dbRun('DELETE FROM schedules WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  res.json({ success: true });
});

// スケジュール完了トグル
router.post('/schedules/:id/toggle', async (req, res) => {
  const existing = await dbGet('SELECT completed FROM schedules WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (!existing) return res.status(404).json({ error: 'スケジュールが見つかりません' });
  await dbRun('UPDATE schedules SET completed = ?, updated_at = datetime("now") WHERE id = ?', [existing.completed ? 0 : 1, parseInt(req.params.id)]);
  res.json({ completed: !existing.completed });
});

module.exports = router;
