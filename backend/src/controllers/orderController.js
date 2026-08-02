const { createOrder } = require('../models/Order');
const { findOrderById } = require('../models/Order');
const { findInfluencerByCode } = require('../models/Influencer');

async function checkout(req, res) {
  try {
    const { customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, items, referral_code, clerk_user_id } = req.body;
    let influencerId = null;
    let persistedReferralCode = null;

    if (referral_code) {
      const matchedInfluencer = await findInfluencerByCode(referral_code);
      if (matchedInfluencer) {
        influencerId = matchedInfluencer.id;
        persistedReferralCode = matchedInfluencer.referral_code;
      }
    }

    const order = await createOrder({
      customerName,
      customerEmail,
      customerPhone,
      items,
      referralCode: persistedReferralCode,
      influencerId,
      clerkUserId: clerk_user_id
    });

    return res.status(201).json({
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Checkout failed' });
  }
}

module.exports = { checkout };
