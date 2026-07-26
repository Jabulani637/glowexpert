const { createOrder } = require('../models/Order');
const { findOrderById } = require('../models/Order');
const { findInfluencerByCode, addCommission } = require('../models/Influencer');

async function checkout(req, res) {
  try {
    const { customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, items, referral_code } = req.body;
    let influencerId = null;
    let persistedReferralCode = null;
    let matchedInfluencer = null;

    if (referral_code) {
      matchedInfluencer = await findInfluencerByCode(referral_code);
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
      influencerId
    });

    if (matchedInfluencer) {
      const commissionRate = Number(matchedInfluencer.commission_rate) / 100;
      const commission = parseFloat(order.total_amount) * commissionRate;
      await addCommission(matchedInfluencer.id, commission);
    }

    return res.status(201).json({
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Checkout failed' });
  }
}

module.exports = { checkout };
