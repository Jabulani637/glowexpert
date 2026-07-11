const jwt = require('jsonwebtoken');

const { createAppForTests } = require('./helpers/testServer');

function signAdminToken() {
  const payload = { sub: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' };
  return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

function signCustomerToken() {
  const payload = { sub: '2', email: 'cust@test.com', name: 'Cust', role: 'customer' };
  return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

describe('admin auth middleware', () => {
  test('missing bearer token => 401', async () => {
    const request = require('supertest');
    const app = createAppForTests();

    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('non-admin => 403', async () => {
    const request = require('supertest');
    const app = createAppForTests();

    const token = signCustomerToken();
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('admin can reach route (may fail later due to mocked models/DB) => not 401/403', async () => {
    const request = require('supertest');
    const app = createAppForTests();

    const token = signAdminToken();
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);

    // Helps avoid Jest open-handle warnings caused by Supertest internals.
    request(app).get('/__noop__');
  });
});

