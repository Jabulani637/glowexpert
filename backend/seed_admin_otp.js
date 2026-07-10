require('dotenv').config();
const { query, run } = require('./src/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getCurrentTimestamp } = require('./src/models/User');

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

  // Check if admin exists
  const existingRes = await query(
    `SELECT * FROM users WHERE email = ? OR cellphone = ? LIMIT 1`,
    [normalizedEmail, normalizedCell]
  );

  if (existingRes.rows.length === 0) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await run(
      `INSERT INTO users (id, name, email, cellphone, password_hash, role, created_at, updated_at, failed_attempts)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, ?, 0)`,
      [id, 'GlowExpert Admin', normalizedEmail, normalizedCell, passwordHash, now, now]
    );
  } else {
    const now = new Date().toISOString();
    await run(
      `UPDATE users
       SET password_hash = ?,
           role = 'admin',
           email = ?,
           cellphone = ?,
           updated_at = ?
       WHERE id = ?`,
      [passwordHash, normalizedEmail, normalizedCell, now, existingRes.rows[0].id]
    );
  }

  console.log('✓ Admin seed complete');
  process.exit(0);
}

main().catch((e) => {
  console.error('✗ Seed failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
