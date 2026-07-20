// Tests for admin media video upload routes.

jest.mock('../lib/supabaseStorage', () => ({
  uploadToSupabase: jest.fn(async () => 'https://example.com/videos/hero.mp4')
}));

jest.mock('../models/SiteSettings', () => {
  return {
    updateSettings: jest.fn(async (patch) => ({ ...patch })),
    getAllSettings: jest.fn(async () => ({ hero_video_url: 'old' }))
  };
});

const request = require('supertest');
const adminMediaRoutes = require('../routes/adminMediaRoutes');
const express = require('express');

function createApp() {
  const app = express();
  app.use('/api/admin/media', adminMediaRoutes);
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
  return app;
}

function setAuthRole(res, role) {
  // These route handlers use Clerk middleware in production.
  // For isolated route tests, we emulate the expected "role" by using
  // req.auth.sessionClaims.metadata.role via a test shim (see testServer).
  // Here we simply attach the role token string.
  return res.set('Authorization', `Bearer ${role}`);
}

describe('admin media video upload routes', () => {
  test('POST hero without file => 400 or 422', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/admin/media/video/hero')
      .set('Authorization', 'Bearer admin');


    expect([400, 422]).toContain(res.status);
  });

  test('POST hero with file => success JSON', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/admin/media/video/hero')
      .set('Authorization', 'Bearer admin')
      .attach('video', Buffer.from('fake-mp4'), 'hero.mp4');


    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('videoUrl');
  });
});

