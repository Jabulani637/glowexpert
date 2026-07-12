const { query, run } = require('../db');
const crypto = require('crypto');

function generateUUID() {
  return crypto.randomUUID();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensureHelpCentreMessageSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS help_centre_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      topic TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      handled_at TEXT
    )
  `);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/^00/, '+');
  return cleaned || null;
}

async function createHelpCentreMessage({ name, email, phone = null, topic = null, message }) {
  const id = generateUUID();
  const now = getCurrentTimestamp();

  await run(
    `INSERT INTO help_centre_messages (id, name, email, phone, topic, message, created_at, handled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [id, String(name), normalizeEmail(email), normalizePhone(phone), topic ? String(topic) : null, String(message), now]
  );

  const { rows } = await query('SELECT * FROM help_centre_messages WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function listHelpCentreMessages({ limit = 200 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit || 200), 500));
  const { rows } = await query(
    `SELECT *
     FROM help_centre_messages
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

async function markHelpCentreMessageHandled(id) {
  const now = getCurrentTimestamp();
  await run('UPDATE help_centre_messages SET handled_at = ? WHERE id = ?', [now, id]);
  const { rows } = await query('SELECT * FROM help_centre_messages WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

module.exports = {
  ensureHelpCentreMessageSchema,
  createHelpCentreMessage,
  listHelpCentreMessages,
  markHelpCentreMessageHandled
};

