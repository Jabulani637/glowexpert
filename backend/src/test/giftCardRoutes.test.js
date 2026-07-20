const request = require('supertest');
const express = require('express');
const giftCardRoutes = require('../routes/giftCardRoutes');

jest.mock('../models/GiftCard', () => {
  const cards = {
    'GLOW-TEST-0001': {
      id: 'gc_1',
      code: 'GLOW-TEST-0001',
      balance: 500,
      currency: 'ZAR',
      status: 'active',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
  };

  return {
    ensureGiftCardSchema: jest.fn(async () => {}),
    findGiftCardByCode: jest.fn(async (code) => cards[code] || null),
    redeemGiftCard: jest.fn(async () => ({}))
  };
});

describe('Gift card routes', () => {
  function createApp() {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use('/api', giftCardRoutes);
    app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
    return app;
  }

  test('POST /api/gift-cards/check-balance returns 200 with valid code', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/gift-cards/check-balance')
      .send({ code: 'GLOW-TEST-0001' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Gift card found');
    expect(res.body.data).toEqual({
      code: 'GLOW-TEST-0001',
      balance: 500,
      currency: 'ZAR',
      status: 'active'
    });
  });

  test('POST /api/gift-cards/check-balance returns 404 for unknown code', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/gift-cards/check-balance')
      .send({ code: 'DOES-NOT-EXIST' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Gift card not found');
  });

  test('POST /api/gift-cards/check-balance returns 422 on missing code', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/gift-cards/check-balance')
      .send({})
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Validation failed');
  });

  test('POST /api/gift-cards/check-balance returns 422 on code too short', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/gift-cards/check-balance')
      .send({ code: 'AB' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(422);
  });
});
