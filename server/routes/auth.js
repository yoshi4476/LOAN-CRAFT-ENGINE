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

    const result = await dbRun('INSERT INTO users (name, email, password_hash, role, plan, renewal_date) VALUES (?, ?, ?, ?, ?, ?)', [name, email, hash, role, 'Free', renewalDate]);

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(user);
    await dbRun('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)', [user.id, 'REGISTER', `新規登録: ${email}`]);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, renewalDate: user.renewal_date } });
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

    await dbRun('UPDATE users SET last_login = datetime("now"), updated_at = datetime("now") WHERE id = ?', [user.id]);
    const token = generateToken(user);
    await dbRun('INSERT INTO audit_logs (user_id, action) VALUES (?, ?)', [user.id, 'LOGIN']);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, renewalDate: user.renewal_date } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 自分の情報
router.get('/me', authenticate, async (req, res) => {
  const user = await dbGet('SELECT id, name, email, role, plan, status, renewal_date, joined_at, last_login FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
  res.json(user);
});

module.exports = router;
