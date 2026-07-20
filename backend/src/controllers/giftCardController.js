const { findGiftCardByCode } = require('../models/GiftCard');

async function checkBalance(req, res) {
  try {
    const { code } = req.body;
    const card = await findGiftCardByCode(code);
    if (!card) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    return res.json({
      message: 'Gift card found',
      data: {
        code: card.code,
        balance: card.balance,
        currency: card.currency,
        status: card.status
      }
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Balance check failed' });
  }
}

module.exports = { checkBalance };
