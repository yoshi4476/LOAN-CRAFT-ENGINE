/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - Expressサーバー
 * ============================================================ */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 静的ファイル
app.use(express.static(path.join(__dirname, '..', 'public')));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '5.0.0', time: new Date().toISOString() });
});

// 非同期起動（sql.jsのDB初期化後にルートを登録）
async function startServer() {
  // DB初期化（接続失敗時もサーバーは起動）
  const { getDb, dbGet, dbRun, pool } = require('./db');
  try {
    await getDb();
    console.log('  ✅ DB接続成功');
  } catch(dbErr) {
    console.warn('  ⚠️ DB接続失敗（サーバーは起動を継続）:', dbErr.message);
  }

  // デフォルトユーザー自動作成（ログイン不要モード用）
  try {
    const res = await pool.query('SELECT id FROM users WHERE id = 1');
    if (res.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, plan) VALUES ($1, $2, $3, $4, $5)',
        ['管理者', process.env.SUPER_ADMIN_EMAIL || 'y.wakata.linkdesign@gmail.com', bcrypt.hashSync('default', 10), 'super_admin', 'Free']
      );
      console.log('  ✅ デフォルトユーザーを作成しました');
    }
  } catch(e) {
    console.warn('  ⚠️ デフォルトユーザー確認スキップ:', e.message);
  }

  // APIルート
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/company', require('./routes/company'));
  app.use('/api/data', require('./routes/data'));
  app.use('/api/ai', require('./routes/ai'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/features', require('./routes/features'));
  app.use('/api/financial', require('./routes/financial-api'));

  // SPAフォールバック
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
  app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));

  // エラーハンドリング
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  });

  app.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════════╗`);
    console.log(`║   LOAN CRAFT ENGINE v5.0 — Server         ║`);
    console.log(`║   http://localhost:${PORT}                    ║`);
    console.log(`╚═══════════════════════════════════════════╝\n`);
  });
}

startServer().catch(err => {
  console.error('起動エラー:', err);
  process.exit(1);
});
