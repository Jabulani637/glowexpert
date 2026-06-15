require('dotenv').config();
const { pool } = require('./src/db');
const bcrypt = require('bcrypt');

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_CELL = process.env.ADMIN_CELLPHONE;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_CELL) {
    throw new Error('Missing env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_CELLPHONE');
  }

  const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
  const normalizedCell = String(ADMIN_CELL).trim().replace(/[^\d+]/g, '').replace(/^00/, '+');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Ensure columns exist (OTP columns stored on the admin user row)
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(16);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_last_sent_at TIMESTAMPTZ;
  `);

  // Upsert the admin row (single admin keyed by email or cellphone)
  const existing = await pool.query(
    `SELECT * FROM users WHERE email = $1 OR cellphone = $2 LIMIT 1`,
    [normalizedEmail, normalizedCell]
  );

  if (existing.rowCount === 0) {
    await pool.query(
      `INSERT INTO users (name, email, cellphone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')`,
      ['GlowExpert Admin', normalizedEmail, normalizedCell, passwordHash]
    );
  } else {
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           role = 'admin',
           email = $2,
           cellphone = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [passwordHash, normalizedEmail, normalizedCell, existing.rows[0].id]
    );
  }

  // Optional: clear any stale OTP
  await pool.query(
    `UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0, otp_last_sent_at = NULL WHERE email = $1 OR cellphone = $2`,
    [normalizedEmail, normalizedCell]
  );

  console.log('✓ Admin seed complete');
  process.exit(0);
}

main().catch((e) => {
  console.error('✗ Seed failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});

