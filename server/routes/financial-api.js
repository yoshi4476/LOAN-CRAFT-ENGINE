/* 財務分析・事業計画・格付判定 API */
const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// =============================================
// 財務諸表 API
// =============================================

// 一覧取得
router.get('/statements', async (req, res) => {
  const rows = await dbAll('SELECT id, company_name, statement_type, period_label, is_consolidated, created_at, updated_at FROM financial_statements WHERE tenant_id = ? ORDER BY updated_at DESC', [req.user.tenant_id]);
  res.json(rows);
});

// 個別取得
router.get('/statements/:id', async (req, res) => {
  const row = await dbGet('SELECT * FROM financial_statements WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  if (!row) return res.status(404).json({ error: '財務諸表が見つかりません' });
  ['pl_data', 'bs_data', 'cf_data', 'adjustments', 'validation_errors', 'subsidiaries'].forEach(k => {
    try { if (row[k]) row[k] = JSON.parse(row[k]); } catch(e) {}
  });
  res.json(row);
});

// 保存
router.post('/statements', async (req, res) => {
  const { company_name, statement_type, period_label, period_months, unit, pl_data, bs_data, cf_data, adjustments, validation_errors, is_consolidated, subsidiaries } = req.body;
  const r = await dbRun(
    'INSERT INTO financial_statements (user_id, tenant_id, company_name, statement_type, period_label, period_months, unit, pl_data, bs_data, cf_data, adjustments, validation_errors, is_consolidated, subsidiaries) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, req.user.tenant_id, company_name || '', statement_type || 'standalone', period_label || '', period_months || 12, unit || 'thousand',
     JSON.stringify(pl_data || {}), JSON.stringify(bs_data || {}), JSON.stringify(cf_data || {}),
     JSON.stringify(adjustments || {}), JSON.stringify(validation_errors || []),
     is_consolidated ? 1 : 0, JSON.stringify(subsidiaries || [])]
  );
  res.json({ id: r.lastInsertRowid });
});

// 更新
router.put('/statements/:id', async (req, res) => {
  const existing = await dbGet('SELECT id FROM financial_statements WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  if (!existing) return res.status(404).json({ error: '財務諸表が見つかりません' });
  const { company_name, statement_type, period_label, period_months, unit, pl_data, bs_data, cf_data, adjustments, validation_errors, is_consolidated, subsidiaries } = req.body;
  await dbRun(
    'UPDATE financial_statements SET company_name=?, statement_type=?, period_label=?, period_months=?, unit=?, pl_data=?, bs_data=?, cf_data=?, adjustments=?, validation_errors=?, is_consolidated=?, subsidiaries=?, updated_at=NOW() WHERE id=?',
    [company_name || '', statement_type || 'standalone', period_label || '', period_months || 12, unit || 'thousand',
     JSON.stringify(pl_data || {}), JSON.stringify(bs_data || {}), JSON.stringify(cf_data || {}),
     JSON.stringify(adjustments || {}), JSON.stringify(validation_errors || []),
     is_consolidated ? 1 : 0, JSON.stringify(subsidiaries || []), parseInt(req.params.id)]
  );
  res.json({ success: true });
});

// 削除
router.delete('/statements/:id', async (req, res) => {
  await dbRun('DELETE FROM financial_statements WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  res.json({ success: true });
});

// =============================================
// 事業計画 API
// =============================================

// 一覧取得
router.get('/plans', async (req, res) => {
  const rows = await dbAll('SELECT id, version_name, company_name, plan_years, actual_periods, is_locked, created_at, updated_at FROM business_plans WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.tenant_id]);
  res.json(rows);
});

// 個別取得
router.get('/plans/:id', async (req, res) => {
  const row = await dbGet('SELECT * FROM business_plans WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  if (!row) return res.status(404).json({ error: '事業計画が見つかりません' });
  ['pl_plan', 'bs_plan', 'cf_plan', 'fixed_assets', 'debt_schedule', 'segment_details'].forEach(k => {
    try { if (row[k]) row[k] = JSON.parse(row[k]); } catch(e) {}
  });
  res.json(row);
});

// 新規作成
router.post('/plans', async (req, res) => {
  const { version_name, company_name, plan_years, actual_periods, stress_factor, corporate_tax_rate, pl_plan, bs_plan, cf_plan, fixed_assets, debt_schedule, segment_details } = req.body;
  if (!version_name) return res.status(400).json({ error: 'バージョン名は必須です' });
  const r = await dbRun(
    'INSERT INTO business_plans (user_id, tenant_id, version_name, company_name, plan_years, actual_periods, stress_factor, corporate_tax_rate, pl_plan, bs_plan, cf_plan, fixed_assets, debt_schedule, segment_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, req.user.tenant_id, version_name, company_name || '', plan_years || 10, actual_periods || 3,
     stress_factor || 1.03, corporate_tax_rate || 0.35,
     JSON.stringify(pl_plan || {}), JSON.stringify(bs_plan || {}), JSON.stringify(cf_plan || {}),
     JSON.stringify(fixed_assets || {}), JSON.stringify(debt_schedule || {}), JSON.stringify(segment_details || {})]
  );
  res.json({ id: r.lastInsertRowid });
});

// 更新（ロック前のみ）
router.put('/plans/:id', async (req, res) => {
  const existing = await dbGet('SELECT id, is_locked FROM business_plans WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  if (!existing) return res.status(404).json({ error: '事業計画が見つかりません' });
  if (existing.is_locked) return res.status(403).json({ error: 'ロック済みの計画は編集できません。新バージョンを作成してください。' });
  const { version_name, company_name, plan_years, actual_periods, stress_factor, corporate_tax_rate, pl_plan, bs_plan, cf_plan, fixed_assets, debt_schedule, segment_details } = req.body;
  await dbRun(
    'UPDATE business_plans SET version_name=?, company_name=?, plan_years=?, actual_periods=?, stress_factor=?, corporate_tax_rate=?, pl_plan=?, bs_plan=?, cf_plan=?, fixed_assets=?, debt_schedule=?, segment_details=?, updated_at=NOW() WHERE id=?',
    [version_name, company_name || '', plan_years || 10, actual_periods || 3,
     stress_factor || 1.03, corporate_tax_rate || 0.35,
     JSON.stringify(pl_plan || {}), JSON.stringify(bs_plan || {}), JSON.stringify(cf_plan || {}),
     JSON.stringify(fixed_assets || {}), JSON.stringify(debt_schedule || {}), JSON.stringify(segment_details || {}), parseInt(req.params.id)]
  );
  res.json({ success: true });
});

// 削除
router.delete('/plans/:id', async (req, res) => {
  await dbRun('DELETE FROM business_plans WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  res.json({ success: true });
});

// バージョンロック（確定）処理
router.post('/plans/:id/lock', async (req, res) => {
  const existing = await dbGet('SELECT id FROM business_plans WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  if (!existing) return res.status(404).json({ error: '事業計画が見つかりません' });
  await dbRun('UPDATE business_plans SET is_locked = 1, updated_at = NOW() WHERE id = ?', [parseInt(req.params.id)]);
  res.json({ success: true, message: 'バージョンをロックしました。以降の編集はできません。' });
});

// =============================================
// 格付判定 API
// =============================================

// 一覧取得
router.get('/ratings', async (req, res) => {
  const rows = await dbAll('SELECT id, company_name, debtor_category, adjusted_category, rating_date, created_at FROM credit_ratings WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.tenant_id]);
  res.json(rows);
});

// 個別取得
router.get('/ratings/:id', async (req, res) => {
  const row = await dbGet('SELECT * FROM credit_ratings WHERE id = ? AND tenant_id = ?', [parseInt(req.params.id), req.user.tenant_id]);
  if (!row) return res.status(404).json({ error: '格付結果が見つかりません' });
  ['quantitative_scores', 'qualitative_scores', 'real_bs_adj', 'real_pl_adj', 'personal_assets'].forEach(k => {
    try { if (row[k]) row[k] = JSON.parse(row[k]); } catch(e) {}
  });
  res.json(row);
});

// 新規保存
router.post('/ratings', async (req, res) => {
  const { company_name, rating_date, quantitative_scores, qualitative_scores, real_bs_adj, real_pl_adj, operating_cf, repayment_years, debtor_category, personal_assets, adjusted_category, report_html } = req.body;
  const r = await dbRun(
    'INSERT INTO credit_ratings (user_id, tenant_id, company_name, rating_date, quantitative_scores, qualitative_scores, real_bs_adj, real_pl_adj, operating_cf, repayment_years, debtor_category, personal_assets, adjusted_category, report_html) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, req.user.tenant_id, company_name || '', rating_date || new Date().toISOString(),
     JSON.stringify(quantitative_scores || {}), JSON.stringify(qualitative_scores || {}),
     JSON.stringify(real_bs_adj || {}), JSON.stringify(real_pl_adj || {}),
     operating_cf || 0, repayment_years || 0,
     debtor_category || '', JSON.stringify(personal_assets || {}),
     adjusted_category || '', report_html || '']
  );
  res.json({ id: r.lastInsertRowid });
});

module.exports = router;
