const jwt = require('jsonwebtoken');

function requireAdminJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'glowexpert-dev-secret';

  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.adminUser = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { requireAdminJwt };
