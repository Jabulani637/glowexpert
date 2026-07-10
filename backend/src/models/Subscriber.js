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

async function ensureSubscriberSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      name TEXT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC)`);
}

async function createSubscriber({ name = null, email } = {}) {
  // Check if subscriber exists
  const existing = await query('SELECT * FROM subscribers WHERE email = ?', [email]);
  if (existing.rows.length > 0) {
    // Update name if provided
    if (name) {
      await run('UPDATE subscribers SET name = ? WHERE email = ?', [name, email]);
    }
    const { rows } = await query('SELECT * FROM subscribers WHERE email = ?', [email]);
    return rows[0];
  } else {
    // Insert new
    const id = generateUUID();
    await run(
      `INSERT INTO subscribers (id, name, email, created_at)
       VALUES (?, ?, ?, ?)`,
      [id, name, email, getCurrentTimestamp()]
    );
    const { rows } = await query('SELECT * FROM subscribers WHERE id = ?', [id]);
    return rows[0];
  }
}

async function listSubscribers() {
  try {
    const { rows } = await query(
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

async function deleteSubscriberByEmail(email) {
  try {
    const res = await query('DELETE FROM subscribers WHERE email = ? RETURNING *', [email]);
    return res.rows && res.rows.length > 0;
  } catch (err) {
    console.warn('deleteSubscriberByEmail error:', err.message);
    return false;
  }
}

module.exports.deleteSubscriberByEmail = deleteSubscriberByEmail;
