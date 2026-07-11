// adminInfluencerRoutes.js with auth protection
const express = require('express');
const router = express.Router();
const { findInfluencerByCode } = require('../models/Influencer');
const { authMiddleware, requireAdmin } = require('../auth/middlewareAuth');


const { influencerAdminCreateSchema } = require('../validation/authSchemas');
const { adminCreateInfluencer, adminListInfluencers } = require('../controllers/influencerAdminController');

// Apply authentication and admin authorization to all routes in this router
router.use(authMiddleware, requireAdmin);


// Register a new influencer (admin only)
router.post('/', async (req, res) => {
  const parsed = influencerAdminCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() });
  req.body = parsed.data;
  return adminCreateInfluencer(req, res);
});

// List influencers with stats (admin dashboard)
router.get('/', async (req, res) => {
  return adminListInfluencers(req, res);
});

// Get influencer by referral code
router.get('/code/:code', async (req, res) => {
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

