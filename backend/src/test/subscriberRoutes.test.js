const request = require('supertest');

const express = require('express');
const subscriberRoutes = require('../routes/subscriberRoutes');

jest.mock('../models/Subscriber', () => {
  return {
    createSubscriber: jest.fn(async (body) => ({
      id: 'sub_1',
      name: body.name ?? null,
      email: body.email,
      created_at: new Date().toISOString()
    })),
    deleteSubscriberByEmail: jest.fn(async (email) => email === 'exists@example.com')
  };
});

describe('Subscriber routes', () => {
  function createApp() {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use('/api', subscriberRoutes);
    app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
    return app;
  }

  test('POST /api/subscribers returns 201 on valid subscribe', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/subscribers')
      .send({ name: 'Jane', email: 'jane@example.com' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Subscribed successfully');
    expect(res.body.data.email).toBe('jane@example.com');
  });

  test('POST /api/subscribers/unsubscribe returns 200 (even if missing) on valid payload', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/subscribers/unsubscribe')
      .send({ email: 'unknown@example.com' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/subscribers returns 422 on invalid payload', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/subscribers')
      .send({ email: 'not-an-email' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(422);
  });
});

