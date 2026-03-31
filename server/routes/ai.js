/* OpenAI APIプロキシ（sql.js対応） */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { dbRun, dbGet } = require('../db');
const { authenticate } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

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

// PDF読込 → AI解析
router.post('/parse-pdf', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ファイルがアップロードされていません' });

    let apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const row = await dbGet("SELECT value FROM settings WHERE key = 'openai_api_key'", []);
      apiKey = row?.value;
    }
    if (!apiKey) return res.status(400).json({ error: 'OpenAI APIキーが未設定です。管理コンソールから設定してください。' });

    // 1. PDFからテキスト抽出
    const pdfData = await pdfParse(req.file.buffer);
    const textData = pdfData.text.slice(0, 30000); // トークン節約のため先頭3万文字に制限

    // 2. OpenAI APIでJSON構造化
    const systemPrompt = `あなたはプロの財務コンサルタントです。提供される決算書のテキストデータ（OCR・PDF抽出）から以下の勘定科目の数値を抽出し、JSON形式で返答してください。
抽出できない項目は null を設定してください。単位が「千円」や「百万円」で記載されている場合は、実際の数値（千円単位ならそのままの設定、円単位なら千円単位になどはしなくて良いので書かれている文字通りの数字）を出力してください。
マークダウン表記（\`\`\`json）は使用せず、生のJSONオブジェクトのみを出力してください。

【抽出項目（キーと内容の説明）】
- revenue: 売上高
- opProfit: 営業利益
- ordProfit: 経常利益
- netProfit: 当期純利益
- totalAssets: 資産合計（総資産）
- netAssets: 純資産合計（自己資本）
- deprecTotal: 減価償却費合計
- interestExp: 支払利息
- shortDebt: 短期借入金
- longDebt: 長期借入金
- bonds: 社債
- cash: 現金及び預貯金
- accountsRec: 売掛金（および受取手形）
- inventory: 棚卸資産（商品製品など）
- accountsPay: 買掛金（および支払手形）
- currentAssets: 流動資産合計
- fixedAssets: 固定資産合計
- currentLiab: 流動負債合計
- capital: 資本金`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `以下の決算書データから抽出してください：\n\n${textData}` }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    // 3. JSONパースして返却
    const rawContent = data.choices[0].message.content.trim();
    const cleanJsonStr = rawContent.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanJsonStr);

    res.json(parsedData);

  } catch (err) {
    console.error('PDF Parse Error:', err);
    res.status(500).json({ error: 'PDFの解析に失敗しました: ' + err.message });
  }
});

module.exports = router;
