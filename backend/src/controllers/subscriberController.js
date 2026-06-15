const { createSubscriber } = require('../models/Subscriber');

async function subscribe(req, res) {
  const subscriber = await createSubscriber(req.body);
  return res.status(201).json({
    message: 'Subscribed successfully',
    data: subscriber
  });
}

module.exports = { subscribe };
