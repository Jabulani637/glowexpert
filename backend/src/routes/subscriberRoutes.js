const express = require('express');
const { subscribe } = require('../controllers/subscriberController');
const { subscriberSchema } = require('../validation/siteSchemas');
const { unsubscribeSchema } = require('../validation/siteSchemas');
const { unsubscribe } = require('../controllers/subscriberController');

const router = express.Router();

router.post('/subscribers', async (req, res) => {
  const parsed = subscriberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  req.body = parsed.data;
  return subscribe(req, res);
});

router.post('/subscribers/unsubscribe', async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  req.body = parsed.data;
  return unsubscribe(req, res);
});

module.exports = router;
