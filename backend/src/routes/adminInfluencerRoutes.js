// adminInfluencerRoutes.js with auth protection
const express = require('express');
const router = express.Router();
const { createInfluencer, findInfluencerByCode, addCommission } = require('../models/Influencer');
const { authenticate, ensureAdmin } = require('../middleware/auth');

// Apply authentication and admin authorization to all routes in this router
router.use(authenticate, ensureAdmin);

// Register a new influencer (admin only)
router.post('/influencers', async (req, res) => {
  const { name, email, commission_rate } = req.body;
  try {
    const influencer = await createInfluencer({ name, email, commission_rate });
    res.json({ success: true, influencer });
  } catch (err) {
    console.error('Error creating influencer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get influencer by referral code
router.get('/influencers/code/:code', async (req, res) => {
  try {
    const influencer = await findInfluencerByCode(req.params.code);
    if (!influencer) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, influencer });
  } catch (err) {
    console.error('Error finding influencer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

