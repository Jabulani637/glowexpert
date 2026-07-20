const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');


async function requireAdminRole(req, res, next) {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      // Friendly non-hard-fail: keep consistent auth messaging for normal users.
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

