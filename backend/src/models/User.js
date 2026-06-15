const { pool } = require('../db');

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

async function ensureUserSchema() {
  // First ensure the users table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'customer',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (err) {
    // Table might already exist, ignore error
  }
  
  // Add new columns if they don't exist
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cellphone VARCHAR(32)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE`);
  
  // Create unique index only where cellphone is not null
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cellphone ON users((cellphone)) WHERE cellphone IS NOT NULL`);
  } catch (err) {
    // Index might already exist
  }
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findByCellphone(cellphone) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE cellphone = $1 LIMIT 1',
    [cellphone]
  );
  return rows[0] || null;
}

async function findByGoogleId(googleId) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE google_id = $1 LIMIT 1',
    [googleId]
  );
  return rows[0] || null;
}

async function createUser({ name, email, cellphone = null, passwordHash = null, role = 'customer', googleId = null } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, cellphone, password_hash, role, google_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, email, cellphone, passwordHash, role, googleId]
  );
  return rows[0];
}

async function updateFailedLogin(id, failedAttempts, lockedUntil = null) {
  await pool.query(
    `UPDATE users SET failed_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3`,
    [failedAttempts, lockedUntil, id]
  );
}

async function resetFailedLogin(id) {
  await pool.query(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function ensureAdminUser({ name, email, cellphone, passwordHash, role = 'admin' } = {}) {
  await ensureUserSchema();
  const normalizedCellphone = normalizeCellphone(cellphone);
  let admin = await findByCellphone(normalizedCellphone);
  if (!admin) {
    admin = await findByEmail(email.toLowerCase());
  }
  if (!admin) {
    admin = await createUser({ name, email: email.toLowerCase(), cellphone: normalizedCellphone, passwordHash, role });
  } else {
    // Update existing admin with current credentials from server.js
    const { pool } = require('../db');
    await pool.query(
      'UPDATE users SET name = $1, password_hash = $2, role = $3, updated_at = NOW() WHERE id = $4',
      [name, passwordHash, role, admin.id]
    );
    // Refresh the admin object with updated values
    admin = await findById(admin.id);
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
  findByGoogleId
};
