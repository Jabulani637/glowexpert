const ALLOWED_ROLES = new Set(['customer', 'admin', 'influencer']);

function normalizeRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (!ALLOWED_ROLES.has(r)) return null;
  return r;
}

function requireRoles(roles) {
  const allowed = roles.map(r => String(r).toLowerCase());
  return function roleGuard(req, res, next) {
    const userRole = req.user?.role;
    if (!userRole || !allowed.includes(String(userRole).toLowerCase())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = { normalizeRole, requireRoles };

