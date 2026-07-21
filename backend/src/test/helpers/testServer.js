const express = require('express');

const adminProductRoutes = require('../../routes/adminProductRoutes');
const adminInfluencerRoutes = require('../../routes/adminInfluencerRoutes');

function createAppForTests() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Test shim: do NOT use JWT signing/verification.
  // Instead, Authorization header token is treated as a role string.
  // Example: Authorization: Bearer admin  OR  Authorization: Bearer customer
  const roleShim = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ message: 'Access denied' });
    }

    const token = header.slice('bearer '.length).trim();
    if (!token) return res.status(401).json({ message: 'Access denied' });




    return next();
  };

  app.use('/api/admin', roleShim, adminProductRoutes);
  app.use('/api/admin/influencers', roleShim, adminInfluencerRoutes);

  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
  return app;
}

module.exports = { createAppForTests };



