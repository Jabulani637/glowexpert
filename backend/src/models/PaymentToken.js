const { query, run } = require('../db');
const crypto = require('crypto');

// Helper to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensurePaymentTokenSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS payment_tokens (
      id TEXT PRIMARY KEY,
      clerk_user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      card_brand TEXT,
      card_last_four TEXT,
      is_default BOOLEAN NOT NULL DEFAULT true,
      created_at TEXT NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_payment_tokens_clerk_user_id ON payment_tokens(clerk_user_id)`);
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tokens_user_token ON payment_tokens(clerk_user_id, token) WHERE clerk_user_id IS NOT NULL`);
}

/**
 * Upsert a payment token for a user
 * @param {Object} param0
 */
async function upsertPaymentToken({ clerkUserId, token, cardBrand, cardLastFour, isDefault = true } = {}) {
  try {
    // Check if token already exists for this user
    const { rows } = await query(
      'SELECT * FROM payment_tokens WHERE clerk_user_id = $1 AND token = $2 LIMIT 1',
      [clerkUserId, token]
    );

    if (rows && rows.length > 0) {
      // Update existing token
      const existingId = rows[0].id;
      await run(
        `UPDATE payment_tokens SET card_brand = $1, card_last_four = $2, is_default = $3 WHERE id = $4`,
        [cardBrand, cardLastFour, isDefault, existingId]
      );
      const { rows: updatedRows } = await query('SELECT * FROM payment_tokens WHERE id = $1', [existingId]);
      return updatedRows[0];
    } else {
      // If setting as default, unset other defaults for this user
      if (isDefault) {
        await run(
          `UPDATE payment_tokens SET is_default = false WHERE clerk_user_id = $1`,
          [clerkUserId]
        );
      }

      // Insert new token
      const id = generateUUID();
      await run(
        `INSERT INTO payment_tokens (id, clerk_user_id, token, card_brand, card_last_four, is_default, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, clerkUserId, token, cardBrand, cardLastFour, isDefault, getCurrentTimestamp()]
      );
      const { rows: newRows } = await query('SELECT * FROM payment_tokens WHERE id = $1', [id]);
      return newRows[0];
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[upsertPaymentToken] error:', err.message);
    }
    throw err;
  }
}

/**
 * Find default payment token for a user
 */
async function findDefaultTokenByClerkUserId(clerkUserId) {
  try {
    const { rows } = await query(
      'SELECT * FROM payment_tokens WHERE clerk_user_id = $1 AND is_default = true LIMIT 1',
      [clerkUserId]
    );
    return rows[0] || null;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[findDefaultTokenByClerkUserId] error:', err.message);
    }
    throw err;
  }
}

/**
 * Find all payment tokens for a user
 */
async function findTokensByClerkUserId(clerkUserId) {
  try {
    const { rows } = await query(
      'SELECT * FROM payment_tokens WHERE clerk_user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [clerkUserId]
    );
    return rows;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[findTokensByClerkUserId] error:', err.message);
    }
    throw err;
  }
}

module.exports = {
  ensurePaymentTokenSchema,
  upsertPaymentToken,
  findDefaultTokenByClerkUserId,
  findTokensByClerkUserId,
};
