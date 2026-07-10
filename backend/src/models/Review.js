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

async function ensureReviewSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      is_verified INTEGER DEFAULT 1,
      product_id TEXT,
      is_published INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`);
}

async function listReviews({ productId = null, onlyPublished = true } = {}) {
  let sql = 'SELECT * FROM reviews WHERE 1=1';
  const params = [];
  if (productId) {
    params.push(productId);
    sql += ` AND product_id = ?`;
  }
  if (onlyPublished) {
    sql += ' AND is_published = 1';
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  return rows.map(row => ({
    ...row,
    is_verified: !!row.is_verified,
    is_published: !!row.is_published
  }));
}

async function createReview({ author_name, content, rating = 5, product_id = null, is_published = false }) {
  const id = generateUUID();
  await run(
    `INSERT INTO reviews (id, author_name, content, rating, is_verified, product_id, is_published, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
    [id, author_name, content, rating, product_id, is_published ? 1 : 0, getCurrentTimestamp()]
  );
  const { rows } = await query('SELECT * FROM reviews WHERE id = ?', [id]);
  return {
    ...rows[0],
    is_verified: !!rows[0].is_verified,
    is_published: !!rows[0].is_published
  };
}

async function deleteReview(id) {
  const result = await run('DELETE FROM reviews WHERE id = ?', [id]);
  return result.changes > 0;
}

module.exports = { ensureReviewSchema, listReviews, createReview, deleteReview };
