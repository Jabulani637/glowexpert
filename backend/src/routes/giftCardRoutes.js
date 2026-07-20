const express = require('express');
const { giftCardCheckSchema } = require('../validation/giftCardSchemas');
const { checkBalance } = require('../controllers/giftCardController');

const router = express.Router();

router.post('/gift-cards/check-balance', async (req, res) => {
  const parsed = giftCardCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  req.body = parsed.data;
  return checkBalance(req, res);
});

module.exports = router;
