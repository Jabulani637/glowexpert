const { run, query } = require('../db');
const crypto = require('crypto');

async function ensureInfluencerApplicationSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS influencer_applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      platform TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      reviewed_at TEXT
    );
  `);

  try {
    await run(`ALTER TABLE influencer_applications ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`);
  } catch (_) {}
  try {
    await run(`ALTER TABLE influencer_applications ADD COLUMN reviewed_at TEXT`);
  } catch (_) {}
}

async function createInfluencerApplication({ name, email, phone, platform, message }) {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  await run(
    `INSERT INTO influencer_applications (id, name, email, phone, platform, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, name, email, phone, platform, message, created_at]
  );
  return id;
}

async function findApplicationByEmail(email) {
  const { rows } = await query(
    "SELECT * FROM influencer_applications WHERE email = ? AND status = 'pending' LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function listInfluencerApplications() {
  const { rows } = await query(
    'SELECT * FROM influencer_applications ORDER BY created_at DESC'
  );
  return rows;
}

async function updateApplicationStatus(id, status) {
  const reviewed_at = new Date().toISOString();
  await run(
    'UPDATE influencer_applications SET status = ?, reviewed_at = ? WHERE id = ?',
    [status, reviewed_at, id]
  );
  const { rows } = await query('SELECT * FROM influencer_applications WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = {
  ensureInfluencerApplicationSchema,
  createInfluencerApplication,
  findApplicationByEmail,
  listInfluencerApplications,
  updateApplicationStatus
};
