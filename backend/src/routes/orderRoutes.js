const express = require('express');
const { checkout } = require('../controllers/orderController');
const { checkoutSchema } = require('../validation/siteSchemas');
const { orderLookupSchema } = require('../validation/siteSchemas');
const { lookup } = require('../controllers/orderController');

const router = express.Router();

router.post('/orders/checkout', async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  req.body = parsed.data;
  return checkout(req, res);
});

router.post('/orders/lookup', async (req, res) => {
  const parsed = orderLookupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  req.body = parsed.data;
  return lookup(req, res);
});

module.exports = router;
