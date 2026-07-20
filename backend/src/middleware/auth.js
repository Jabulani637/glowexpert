// This module previously contained JWT-based auth.
// JWT helpers have been removed in favor of Clerk-only authentication.
//
// Keep this file to avoid breaking older imports, but hard-fail so non-Clerk
// auth is never used.

function authenticate(_req, res) {
  return res.status(401).json({ message: 'Access denied' });
}

function ensureAdmin(_req, res) {
  return res.status(403).json({ message: 'Access denied. Admins only.' });
}

module.exports = { authenticate, ensureAdmin };

