/* 企業DNA API（sql.js対応） */
const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const row = await dbGet('SELECT data FROM company_data WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.tenant_id]);
  res.json(row ? JSON.parse(row.data) : {});
});

router.put('/', authenticate, async (req, res) => {
  const data = JSON.stringify(req.body);
  const existing = await dbGet('SELECT id FROM company_data WHERE tenant_id = ?', [req.user.tenant_id]);
  if (existing) {
    await dbRun('UPDATE company_data SET data = ?, updated_at = NOW() WHERE tenant_id = ?', [data, req.user.tenant_id]);
  } else {
    await dbRun('INSERT INTO company_data (user_id, tenant_id, data) VALUES (?, ?, ?)', [req.user.id, req.user.tenant_id, data]);
  }
  res.json({ success: true });
});

module.exports = router;
