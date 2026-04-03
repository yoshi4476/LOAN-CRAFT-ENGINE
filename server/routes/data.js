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

// データポータビリティ: テナント単位の全データエクスポート
router.get('/export', authenticate, async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const exportData = {
      timestamp: new Date().toISOString(),
      user_metadata: { email: req.user.email, name: req.user.name, tenant_id },
      company_data: await dbAll('SELECT * FROM company_data WHERE tenant_id = ?', [tenant_id]),
      financial_statements: await dbAll('SELECT * FROM financial_statements WHERE tenant_id = ?', [tenant_id]),
      business_plans: await dbAll('SELECT * FROM business_plans WHERE tenant_id = ?', [tenant_id]),
      credit_ratings: await dbAll('SELECT * FROM credit_ratings WHERE tenant_id = ?', [tenant_id]),
      rating_results: await dbAll('SELECT * FROM rating_results WHERE tenant_id = ?', [tenant_id]),
      cases: await dbAll('SELECT * FROM cases WHERE tenant_id = ?', [tenant_id]),
      schedules: await dbAll('SELECT * FROM schedules WHERE tenant_id = ?', [tenant_id]),
      saved_documents: await dbAll('SELECT * FROM saved_documents WHERE tenant_id = ?', [tenant_id])
    };
    
    // JSON文字列として保存されているカラムを可能ならパースしてネスト構造に整形（ポータビリティのため）
    const parseField = (row, field) => { if (row[field]) { try { row[field] = JSON.parse(row[field]); } catch(e) {} } };
    exportData.company_data.forEach(r => parseField(r, 'data'));
    exportData.financial_statements.forEach(r => { parseField(r, 'pl_data'); parseField(r, 'bs_data'); parseField(r, 'cf_data'); });
    exportData.business_plans.forEach(r => { parseField(r, 'pl_plan'); parseField(r, 'bs_plan'); parseField(r, 'cf_plan'); });
    exportData.credit_ratings.forEach(r => { parseField(r, 'quantitative_scores'); parseField(r, 'qualitative_scores'); });
    exportData.rating_results.forEach(r => parseField(r, 'detail'));
    exportData.cases.forEach(r => parseField(r, 'detail'));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="loan_craft_export_${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
