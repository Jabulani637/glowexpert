// backend/src/models/Influencer.js
// Influencer model for referral and commission tracking
// Generated schema uses PostgreSQL UUID primary key and JSON-compatible fields.

const { pool } = require('../db');

async function ensureInfluencerSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS influencers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      referral_code VARCHAR(32) NOT NULL UNIQUE,
      commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
      total_commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Index for quick lookup by referral_code
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_influencers_referral_code ON influencers(referral_code);`);
}

/**
 * Create a new influencer record.
 * @param {Object} param0
 */
async function createInfluencer({ name, email, commission_rate = 5.0 } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const referral_code = generateReferralCode();
    const { rows } = await client.query(
      `INSERT INTO influencers (name, email, referral_code, commission_rate)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, referral_code, commission_rate]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Generate a simple alphanumeric referral code */
function generateReferralCode() {
  // 8-character code
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function findInfluencerByCode(referralCode) {
  const { rows } = await pool.query(
    'SELECT * FROM influencers WHERE referral_code = $1 LIMIT 1',
    [referralCode]
  );
  return rows[0];
}

async function addCommission(influencerId, amount) {
  await pool.query(
    `UPDATE influencers SET total_commission_earned = total_commission_earned + $1, updated_at = NOW() WHERE id = $2`,
    [amount, influencerId]
  );
}

module.exports = {
  ensureInfluencerSchema,
  createInfluencer,
  findInfluencerByCode,
  addCommission
};
