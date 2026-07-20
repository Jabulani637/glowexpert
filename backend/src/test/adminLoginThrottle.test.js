const bcrypt = require('bcryptjs');

jest.mock('../models/User', () => {
  return {
    findByEmail: jest.fn(async () => ({
      id: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
      cellphone: null,
      password_hash: 'hashed',
      failed_attempts: 0,
      locked_until: null
    })),
    findByCellphone: jest.fn(async () => ({
      id: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
      cellphone: '+441234567890',
      password_hash: 'hashed',
      failed_attempts: 0,
      locked_until: null
    })),
    updateFailedLogin: jest.fn(async () => {}),
    resetFailedLogin: jest.fn(async () => {}),
    createUser: jest.fn(async () => ({})),
    findByGoogleId: jest.fn(async () => null),
    updateOtp: jest.fn(async () => {}),
    getCurrentTimestamp: jest.fn(() => new Date().toISOString())
  };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

const { login } = require('../controllers/authController');
const { updateFailedLogin } = require('../models/User');

function makeRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('admin login throttle (password login endpoint)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    bcrypt.compare.mockReset();
    updateFailedLogin.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('first wrong password returns 401 Invalid credentials and does not lock', async () => {
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { cellphone: '+441234567890', password: 'bad' }, ip: '127.0.0.1', connection: { remoteAddress: '127.0.0.1' } };
    const res = makeRes();

    await login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
    expect(updateFailedLogin).toHaveBeenCalled();
    const [, failedAttempts, lockedUntil] = updateFailedLogin.mock.calls[0];
    expect(failedAttempts).toBe(1);
    expect(lockedUntil).toBeNull();
  });

  test('third wrong password locks for 2 hours and returns friendly message + retry_after_ms', async () => {
    // Always fail compare.
    bcrypt.compare.mockResolvedValue(false);

    // For this test, we need failed_attempts to be 2 on the 3rd attempt.
    // We re-require module mocks by mutating the mocked findByCellphone return.
    const user = {
      id: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
      cellphone: '+441234567890',
      password_hash: 'hashed',
      failed_attempts: 2,
      locked_until: null
    };

    const { findByCellphone } = require('../models/User');
    findByCellphone.mockResolvedValue(user);

    const req = { body: { cellphone: '+441234567890', password: 'bad' }, ip: '127.0.0.1', connection: { remoteAddress: '127.0.0.1' } };
    const res = makeRes();

    await login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Too many failed login attempts. Try again in 2 hours.');
    expect(typeof res.body.retry_after_ms).toBe('number');
    expect(res.body.retry_after_ms).toBeGreaterThan(0);

    const [, failedAttempts, lockedUntil] = updateFailedLogin.mock.calls[0];
    expect(failedAttempts).toBe(3);
    expect(lockedUntil).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('locked admin attempt returns friendly message immediately and does not call bcrypt.compare', async () => {
    const { findByCellphone } = require('../models/User');

    findByCellphone.mockResolvedValue({
      id: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
      cellphone: '+441234567890',
      password_hash: 'hashed',
      failed_attempts: 3,
      locked_until: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour remaining
    });

    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { cellphone: '+441234567890', password: 'bad' }, ip: '127.0.0.1', connection: { remoteAddress: '127.0.0.1' } };
    const res = makeRes();

    await login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/^Too many failed login attempts\. Try again in /);
    expect(typeof res.body.retry_after_ms).toBe('number');
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
});

