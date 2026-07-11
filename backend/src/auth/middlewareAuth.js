const { verifyAccessToken } = require('./jwt');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ message: 'Access denied' });
  }

  const token = header.slice('bearer '.length).trim();
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { sub, email, role, name }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Access denied' });
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

