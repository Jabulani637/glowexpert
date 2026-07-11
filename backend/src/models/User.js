const { query, run } = require('../db');
const crypto = require('crypto');
const { getFallbackStore, saveFallbackStore } = require('../lib/fallbackStore');

function normalizeCellphone(value = '') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/^00/, '+');

  if (/^0\d{10}$/.test(cleaned)) {
    return `+44${cleaned.slice(1)}`;
  }

  return cleaned;
}

// Helper to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensureUserSchema() {
  // First ensure the users table exists
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  } catch (err) {
    // Table might already exist, ignore error
  }

  // Add new columns if they don't exist
  try {
    await run(`ALTER TABLE users ADD COLUMN cellphone TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN locked_until TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN google_id TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN otp_code TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN otp_expires_at TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE users ADD COLUMN otp_last_sent_at TEXT`);
  } catch (err) {}

  // Create unique index only where cellphone is not null
  try {
    await run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cellphone ON users(cellphone) WHERE cellphone IS NOT NULL`
    );
  } catch (err) {
    // Index might already exist
  }
}

async function findByEmail(email) {
  try {
    const { rows } = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  } catch (err) {
    const store = getFallbackStore();
    return store.users.find((user) => user.email === email) || null;
  }
}

async function findByCellphone(cellphone) {
  try {
    const { rows } = await query('SELECT * FROM users WHERE cellphone = ? LIMIT 1', [cellphone]);
    return rows[0] || null;
  } catch (err) {
    const store = getFallbackStore();
    return store.users.find((user) => user.cellphone === cellphone) || null;
  }
}

async function findByGoogleId(googleId) {
  try {
    const { rows } = await query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
    return rows[0] || null;
  } catch (err) {
    const store = getFallbackStore();
    return store.users.find((user) => user.google_id === googleId) || null;
  }
}

async function createUser({
  name,
  email,
  cellphone = null,
  passwordHash = null,
  role = 'customer',
  googleId = null
} = {}) {
  try {
    const id = generateUUID();
    const now = getCurrentTimestamp();
    await run(
      `INSERT INTO users (id, name, email, cellphone, password_hash, role, google_id, created_at, updated_at, failed_attempts, otp_attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, name, email, cellphone, passwordHash, role, googleId, now, now]
    );
    const { rows } = await query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  } catch (err) {
    const store = getFallbackStore();
    const user = {
      id: generateUUID(),
      name,
      email,
      cellphone,
      password_hash: passwordHash,
      role,
      google_id: googleId,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
      failed_attempts: 0,
      otp_attempts: 0
    };
    store.users.push(user);
    saveFallbackStore(store);
    return user;
  }
}

async function updateFailedLogin(id, failedAttempts, lockedUntil = null) {
  try {
    const now = getCurrentTimestamp();
    await run(
      `UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`,
      [failedAttempts, lockedUntil, now, id]
    );
  } catch (err) {
    const store = getFallbackStore();
    const user = store.users.find((entry) => entry.id === id);
    if (user) {
      user.failed_attempts = failedAttempts;
      user.locked_until = lockedUntil;
      user.updated_at = getCurrentTimestamp();
      saveFallbackStore(store);
    }
  }
}

async function resetFailedLogin(id) {
  try {
    const now = getCurrentTimestamp();
    await run(
      `UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  } catch (err) {
    const store = getFallbackStore();
    const user = store.users.find((entry) => entry.id === id);
    if (user) {
      user.failed_attempts = 0;
      user.locked_until = null;
      user.updated_at = getCurrentTimestamp();
      saveFallbackStore(store);
    }
  }
}

async function findById(id) {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  } catch (err) {
    const store = getFallbackStore();
    return store.users.find((user) => user.id === id) || null;
  }
}

async function updateOtp(id, otpCode, otpExpiresAt) {
  const now = getCurrentTimestamp();
  await run(
    `UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0, otp_last_sent_at = ?, updated_at = ? WHERE id = ?`,
    [otpCode, otpExpiresAt, now, now, id]
  );
}

async function ensureAdminUser({ name, email, cellphone, passwordHash, role = 'admin' } = {}) {
  await ensureUserSchema();
  const normalizedCellphone = normalizeCellphone(cellphone);
  const normalizedEmail = String(email || '').toLowerCase();

  let admin = await findByCellphone(normalizedCellphone);
  if (!admin) {
    admin = await findByEmail(normalizedEmail);
  }

  if (!admin) {
    admin = await createUser({ name, email: normalizedEmail, cellphone: normalizedCellphone, passwordHash, role });
  } else {
    try {
      const now = getCurrentTimestamp();
      await run(
        'UPDATE users SET name = ?, email = ?, cellphone = ?, password_hash = ?, role = ?, updated_at = ? WHERE id = ?',
        [name, normalizedEmail, normalizedCellphone, passwordHash, role, now, admin.id]
      );
      admin = await findById(admin.id);
    } catch (err) {
      const store = getFallbackStore();
      const existing = store.users.find((entry) => entry.id === admin.id);
      if (existing) {
        existing.name = name;
        existing.email = normalizedEmail;
        existing.cellphone = normalizedCellphone;
        existing.password_hash = passwordHash;
        existing.role = role;
        existing.updated_at = getCurrentTimestamp();
        saveFallbackStore(store);
      }
      admin = existing || admin;
    }
  }

  return admin;
}

module.exports = {
  ensureUserSchema,
  findByEmail,
  findByCellphone,
  createUser,
  updateFailedLogin,
  resetFailedLogin,
  findById,
  ensureAdminUser,
  findByGoogleId,
  updateOtp,
  getCurrentTimestamp
};

