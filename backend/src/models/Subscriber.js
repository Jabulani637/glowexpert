const { pool } = require('../db');

async function ensureSubscriberSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC)`);
}

async function createSubscriber({ name = null, email } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO subscribers (name, email)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, subscribers.name)
     RETURNING *`,
    [name, email]
  );
  return rows[0];
}

async function listSubscribers() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM subscribers ORDER BY created_at DESC'
    );
    return rows;
  } catch (err) {
    console.warn('Database unavailable, returning empty subscribers list:', err.message);
    return [];
  }
}

module.exports = {
  ensureSubscriberSchema,
  createSubscriber,
  listSubscribers
};
