const express = require('express');
const { authenticate } = require('../middleware/auth');
const { findInfluencerByUserId } = require('../models/Influencer');
const { listOrdersByInfluencer } = require('../models/Order');

const router = express.Router();
router.use(authenticate);

function ensureInfluencer(req, res, next) {
  if (req.user && req.user.role === 'influencer') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Influencers only.' });
}

router.use(ensureInfluencer);

router.get('/me', async (req, res) => {
  try {
    const influencer = await findInfluencerByUserId(req.user.id);
    if (!influencer) {
      return res.status(404).json({ message: 'Influencer profile not found.' });
    }

    return res.json({
      referral_code: influencer.referral_code,
      commission_rate: influencer.commission_rate,
      total_commission_earned: influencer.total_commission_earned,
      name: influencer.user_name || influencer.name,
      email: influencer.user_email || influencer.email
    });
  } catch (err) {
    console.error('Influencer /me error:', err.message);
    return res.status(500).json({ message: 'Unable to load influencer profile.' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const influencer = await findInfluencerByUserId(req.user.id);
    if (!influencer) {
      return res.status(404).json({ message: 'Influencer profile not found.' });
    }

    const orders = await listOrdersByInfluencer(influencer.id);
    return res.json({ data: orders });
  } catch (err) {
    console.error('Influencer /orders error:', err.message);
    return res.status(500).json({ message: 'Unable to load influencer orders.' });
  }
});

module.exports = router;
