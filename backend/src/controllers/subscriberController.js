const { createSubscriber } = require('../models/Subscriber');
const { deleteSubscriberByEmail } = require('../models/Subscriber');

async function subscribe(req, res) {
  const subscriber = await createSubscriber(req.body);
  return res.status(201).json({
    message: 'Subscribed successfully',
    data: subscriber
  });
}

module.exports = { subscribe };

async function unsubscribe(req, res) {
  try {
    const { email } = req.body;
    const ok = await deleteSubscriberByEmail(email);
    if (ok) return res.json({ message: 'Unsubscribed successfully' });
    // Return success even if not found to avoid leaking subscriber existence
    return res.json({ message: 'If this email existed, it has been unsubscribed' });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Unsubscribe failed' });
  }
}

module.exports.unsubscribe = unsubscribe;
