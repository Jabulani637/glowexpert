const { verifyAccessToken } = require('./jwt');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = header.slice('bearer '.length).trim();
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { sub, email, role, name }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAuth(req, res, next) {
  return authMiddleware(req, res, next);
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}

module.exports = { authMiddleware, requireAuth, requireAdmin };

