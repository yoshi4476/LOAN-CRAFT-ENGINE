---
description: 新しいコマンド・機能をシステムに追加する標準手順
---

# 新機能追加手順

## 概要
LOAN CRAFT ENGINE v5.0に新しいコマンド/機能を追加する際の標準手順。

## 手順

### 1. フロントエンドモジュール作成

`public/js/` に新しいJSファイルを作成:

```javascript
/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - [機能名]
 * ============================================================ */
const NewModule = {
  // メインの表示関数
  show() {
    let html = `<div class="report-title">タイトル</div>`;
    // コンテンツ生成
    App.addSystemMessage(html);
  },

  // AI呼び出し例
  async aiAnalyze() {
    const data = Database.loadCompanyData();
    const messages = [
      { role: 'system', content: 'あなたは融資の専門家です。' },
      { role: 'user', content: `分析してください: ${JSON.stringify(data)}` }
    ];
    App.addSystemMessage(Utils.createAlert('info', '🤖', 'AIが分析中です...'));
    const result = await ApiClient.aiGenerate(messages);
    if (result?.choices?.[0]?.message?.content) {
      App.addSystemMessage(`<div class="report-content">${result.choices[0].message.content}</div>`);
    }
  }
};
```

### 2. HTML にスクリプトタグ追加

`public/index.html` の `app.js` の前に追加:
```html
<script src="js/new-module.js?v=20260331"></script>
```

### 3. コマンド登録

`public/js/app.js` の `commands` 配列に追加:
```javascript
{ cmd: '/新機能', label: '/新機能', desc: '新機能の説明', fn: () => NewModule.show() },
```

### 4. サイドバー追加

`public/index.html` の該当ステップ内に追加:
```html
<div class="nav-item" data-cmd="/新機能">
  <span class="icon">🆕</span> 新機能名<span class="ai-badge">AI</span>
</div>
```

### 5. サーバーAPIが必要な場合

`server/routes/` にルートファイル追加:
```javascript
const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  // 処理
  res.json({ success: true });
});

module.exports = router;
```

`server/index.js` にルート登録:
```javascript
app.use('/api/new-feature', require('./routes/new-feature'));
```

### 6. DBテーブルが必要な場合

`server/db.js` の `getDb()` 内に追加:
```sql
CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  -- カラム定義
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. 動作確認

- 開発サーバーを再起動
- コマンドパレット（Ctrl+K）で新コマンドが検索できること
- サイドバーから機能にアクセスできること
- API呼び出しが正常に動作すること
