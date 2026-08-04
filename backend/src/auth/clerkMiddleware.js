const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');
const jwt = require('jsonwebtoken');


async function requireAdminRole(req, res, next) {
  // Try JWT Bearer token first (from custom OTP login)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'glowexpert-dev-secret';
    try {
      const payload = jwt.verify(token, secret);
      if (payload.role === 'admin') {
        req.adminUser = payload;
        return next();
      }
    } catch (_) {
      // Not a valid JWT — fall through to Clerk
    }
  }

  // Fall back to Clerk auth
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: 'Please sign in to access the admin area.' });
    }


    let role = auth.sessionClaims?.metadata?.role;

    if (!role) {
      const user = await clerkClient.users.getUser(auth.userId);
      role = user.publicMetadata?.role;
    }

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
  } catch (error) {
    console.error('Error in requireAdminRole:', error);
    return res.status(500).json({ message: 'Internal server error verifying role' });
  }
}

module.exports = { clerkMiddleware, requireAdminRole };

