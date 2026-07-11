const { verifyAccessToken } = require('../auth/jwt');

/**
 * DEPRECATED: prefer `backend/src/auth/middlewareAuth.js`.
 * This file is kept for backwards compatibility with older imports.
 *
 * It now uses the same JWT verification logic + payload shape as auth middleware,
 * so `req.user` is consistent across the codebase.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (
    !authHeader ||
    typeof authHeader !== 'string' ||
    !authHeader.toLowerCase().startsWith('bearer ')
  ) {
    return res.status(401).json({ message: 'Access denied' });
  }

  const token = authHeader.slice('bearer '.length).trim();
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = verifyAccessToken(token);
    // decoded is the safe payload from backend/src/auth/jwt.js: { sub, email, name, role }
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Access denied' });
  }
}

/** Authorization middleware: only allow admin users */
function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Admins only.' });
}

module.exports = { authenticate, ensureAdmin };
