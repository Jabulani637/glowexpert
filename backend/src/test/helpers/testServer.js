const express = require('express');

const adminProductRoutes = require('../../routes/adminProductRoutes');
const adminMediaRoutes = require('../../routes/adminMediaRoutes');
const adminInfluencerRoutes = require('../../routes/adminInfluencerRoutes');

function createAppForTests() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/admin', adminProductRoutes);
  app.use('/api/admin/media', adminMediaRoutes);
  app.use('/api/admin/influencers', adminInfluencerRoutes);

  // Mimic API 404 JSON behavior.
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
  return app;
}

module.exports = { createAppForTests };

