const { createOrder } = require('../models/Order');
const { findInfluencerByCode, addCommission } = require('../models/Influencer');

async function checkout(req, res) {
  try {
    const { customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, items, referral_code } = req.body;
    const order = await createOrder({ customerName, customerEmail, customerPhone, items });
    // Process referral commission if code provided
    if (referral_code) {
      const influencer = await findInfluencerByCode(referral_code);
      if (influencer) {
        const commissionRate = Number(influencer.commission_rate) / 100;
        const commission = parseFloat(order.total_amount) * commissionRate;
        await addCommission(influencer.id, commission);
      }
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
