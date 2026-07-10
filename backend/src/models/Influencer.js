// backend/src/models/Influencer.js
// Influencer model for referral and commission tracking

const { query, run } = require('../db');
const crypto = require('crypto');
const { getFallbackStore, saveFallbackStore } = require('../lib/fallbackStore');

// Helper to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensureInfluencerSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS influencers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      -- legacy columns left for compatibility
      name TEXT,
      email TEXT,
      referral_code TEXT NOT NULL UNIQUE,
      commission_rate REAL NOT NULL DEFAULT 5.00,
      total_commission_earned REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  // Index for quick lookup by referral_code
  await run(`CREATE INDEX IF NOT EXISTS idx_influencers_referral_code ON influencers(referral_code);`);

  // Migrate: add user_id column if missing and add unique index constrained to non-null values
  try {
    await run(`ALTER TABLE influencers ADD COLUMN IF NOT EXISTS user_id TEXT`);
  } catch (err) {
    // ignore; column may already exist on older Postgres versions
  }
  try {
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_user_id ON influencers(user_id) WHERE user_id IS NOT NULL`);
  } catch (err) {
    // ignore index creation errors
  }
}

/**
 * Create a new influencer record.
 * @param {Object} param0
 */
async function createInfluencer({ userId = null, commission_rate = 5.0 } = {}) {
  try {
    const id = generateUUID();
    const referral_code = generateReferralCode();
    await run(
      `INSERT INTO influencers (id, user_id, referral_code, commission_rate, total_commission_earned, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, userId, referral_code, commission_rate, getCurrentTimestamp(), getCurrentTimestamp()]
    );
    const { rows } = await query('SELECT * FROM influencers WHERE id = ?', [id]);
    return rows[0];
  } catch (err) {
    const store = getFallbackStore();
    const influencer = {
      id: generateUUID(),
      user_id: userId,
      referral_code: generateReferralCode(),
      commission_rate,
      total_commission_earned: 0,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    store.influencers.push(influencer);
    saveFallbackStore(store);
    return influencer;
  }
}

/** Generate a simple alphanumeric referral code */
function generateReferralCode() {
  // 8-character code
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function findInfluencerByCode(referralCode) {
  try {
    const { rows } = await query(
      'SELECT * FROM influencers WHERE referral_code = ? LIMIT 1',
      [referralCode]
    );
    return rows[0];
  } catch (err) {
    const store = getFallbackStore();
    return store.influencers.find((item) => item.referral_code === referralCode) || null;
  }
}

async function findInfluencerByUserId(userId) {
  try {
    const { rows } = await query(`
      SELECT i.*, u.name AS user_name, u.email AS user_email, u.cellphone AS user_cellphone
      FROM influencers i
      LEFT JOIN users u ON u.id = i.user_id
      WHERE i.user_id = ?
      LIMIT 1
    `, [userId]);
    return rows[0] || null;
  } catch (err) {
    const store = getFallbackStore();
    return store.influencers.find((item) => item.user_id === userId) || null;
  }
}

async function listInfluencers() {
  try {
    const { rows } = await query(`
      SELECT i.*, u.name AS user_name, u.email AS user_email, u.cellphone AS user_cellphone
      FROM influencers i
      LEFT JOIN users u ON u.id = i.user_id
      ORDER BY i.created_at DESC
    `);
    return rows;
  } catch (err) {
    const store = getFallbackStore();
    return store.influencers;
  }
}

async function addCommission(influencerId, amount) {
  await run(
    `UPDATE influencers SET total_commission_earned = total_commission_earned + ?, updated_at = ? WHERE id = ?`,
    [amount, getCurrentTimestamp(), influencerId]
  );
}

module.exports = {
  ensureInfluencerSchema,
  createInfluencer,
  findInfluencerByCode,
  addCommission
};

module.exports.findInfluencerByUserId = findInfluencerByUserId;
module.exports.listInfluencers = listInfluencers;
module.exports.generateReferralCode = generateReferralCode;
