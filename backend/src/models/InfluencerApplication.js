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
      created_at TEXT NOT NULL
    );
  `);
}

async function createInfluencerApplication({ name, email, phone, platform, message }) {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  await run(
    `INSERT INTO influencer_applications (id, name, email, phone, platform, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, phone, platform, message, created_at]
  );
  return id;
}

module.exports = {
  ensureInfluencerApplicationSchema,
  createInfluencerApplication
};
