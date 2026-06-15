// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and attach user info to req
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // expects payload contains role, e.g., { id, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
}

// Authorization middleware: only allow admin users
function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
}

module.exports = { authenticate, ensureAdmin };
