describe('admin auth middleware (Clerk-based)', () => {
  test('missing bearer token => 401', async () => {
    const request = require('supertest');
    const app = require('./helpers/testServer').createAppForTests();

    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('non-admin => 403', async () => {
    const request = require('supertest');
    const app = require('./helpers/testServer').createAppForTests();

    // For these tests, the test server auth shim reads role from Authorization header token.
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer customer`);

    expect(res.status).toBe(403);
  });

  test('admin can reach route (may fail later due to mocked models/DB) => not 401/403', async () => {
    const request = require('supertest');
    const app = require('./helpers/testServer').createAppForTests();

    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer admin`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);

    request(app).get('/__noop__');
  });
});



