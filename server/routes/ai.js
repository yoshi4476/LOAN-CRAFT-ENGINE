/* OpenAI APIプロキシ（sql.js対応） */
const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../db');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, async (req, res) => {
  try {
    let apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const row = await dbGet("SELECT value FROM settings WHERE key = 'openai_api_key'", []);
      apiKey = row?.value;
    }
    if (!apiKey) return res.status(400).json({ error: 'OpenAI APIキーが未設定です。管理コンソールから設定してください。' });

    const model = req.body.model || 'gpt-4o-mini';
    const messages = req.body.messages;
    if (!messages) return res.status(400).json({ error: 'messagesが必要です' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: req.body.max_tokens || 4000, temperature: req.body.temperature || 0.4 })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const usage = data.usage || {};
    const costRates = { 'gpt-4o-mini': { i: 0.00015, o: 0.0006 }, 'gpt-4o': { i: 0.005, o: 0.015 }, 'gpt-4-turbo': { i: 0.01, o: 0.03 } };
    const rates = costRates[model] || costRates['gpt-4o-mini'];
    const cost = (usage.prompt_tokens || 0) / 1000 * rates.i + (usage.completion_tokens || 0) / 1000 * rates.o;

    await dbRun('INSERT INTO api_usage (user_id, model, input_tokens, output_tokens, cost) VALUES (?, ?, ?, ?, ?)', [req.user.id, model, usage.prompt_tokens || 0, usage.completion_tokens || 0, cost]);

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/usage', authenticate, async (req, res) => {
  const stats = await dbGet('SELECT COUNT(*) as calls, COALESCE(SUM(input_tokens + output_tokens), 0) as tokens, COALESCE(SUM(cost), 0) as cost FROM api_usage WHERE user_id = ?', [req.user.id]);
  res.json(stats || { calls: 0, tokens: 0, cost: 0 });
});

router.put('/settings', authenticate, async (req, res) => {
  const { apiKey, model } = req.body;
  if (apiKey) await dbRun("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('openai_api_key', ?, datetime('now'))", [apiKey]);
  if (model) await dbRun("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('openai_model', ?, datetime('now'))", [model]);
  res.json({ success: true });
});

module.exports = router;
