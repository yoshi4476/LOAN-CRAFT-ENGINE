/* JWT認証ミドルウェア */
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'lce-default-secret';
const SUPER_ADMIN = process.env.SUPER_ADMIN_EMAIL || 'y.wakata.linkdesign@gmail.com';

// トークン検証（トークン必須）
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), SECRET);
      req.user = decoded;
      return next();
    } catch (e) {
      return res.status(401).json({ error: '無効なトークンです' });
    }
  }
  return res.status(401).json({ error: 'ライセンス認証が必要です' });
}

// 最高管理者チェック
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.email !== SUPER_ADMIN) {
    return res.status(403).json({ error: '最高管理者権限が必要です' });
  }
  next();
}

// トークン生成
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id },
    SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { authenticate, requireSuperAdmin, generateToken };
