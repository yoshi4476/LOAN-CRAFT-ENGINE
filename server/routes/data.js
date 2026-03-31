/* 格付け & 案件 API（sql.js対応） */
const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../db');
const { authenticate } = require('../middleware/auth');

// 格付け
router.post('/rating', authenticate, async (req, res) => {
  const { score, grade, mode, detail } = req.body;
  const r = await dbRun('INSERT INTO rating_results (user_id, tenant_id, score, grade, mode, detail) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, req.user.tenant_id, score, grade, mode, JSON.stringify(detail || {})]);
  res.json({ id: r.lastInsertRowid });
});

router.get('/rating', authenticate, async (req, res) => {
  const rows = await dbAll('SELECT * FROM rating_results WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.tenant_id]);
  rows.forEach(r => { try { r.detail = JSON.parse(r.detail); } catch(e) {} });
  res.json(rows);
});

router.get('/rating/latest', authenticate, async (req, res) => {
  const row = await dbGet('SELECT * FROM rating_results WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.tenant_id]);
  if (row) { try { row.detail = JSON.parse(row.detail); } catch(e) {} }
  res.json(row || null);
});

// 案件
router.get('/cases', authenticate, async (req, res) => {
  const rows = await dbAll('SELECT * FROM cases WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.tenant_id]);
  rows.forEach(r => { try { r.detail = JSON.parse(r.detail); } catch(e) {} });
  res.json(rows);
});

router.post('/cases', authenticate, async (req, res) => {
  const { case_id, institution, amount, purpose, result: cr, detail } = req.body;
  const r = await dbRun('INSERT INTO cases (user_id, tenant_id, case_id, institution, amount, purpose, result, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, req.user.tenant_id, case_id, institution, amount, purpose, cr, JSON.stringify(detail || {})]);
  res.json({ id: r.lastInsertRowid });
});

module.exports = router;
