const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');

/**
 * Require admin role via Clerk claims.
 *
 * Convention: `req.auth?.sessionClaims?.metadata?.role === 'admin'`.
 * This assumes the admin role is stored in user public metadata.
 */
async function requireAdminRole(req, res, next) {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
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

