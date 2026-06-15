const { pool } = require('../db');

async function ensureReviewSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_name VARCHAR(120) NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      is_verified BOOLEAN DEFAULT true,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`);
}

async function listReviews({ productId = null, onlyPublished = true } = {}) {
  let query = 'SELECT * FROM reviews WHERE 1=1';
  const params = [];
  if (productId) {
    params.push(productId);
    query += ` AND product_id = $${params.length}`;
  }
  if (onlyPublished) {
    query += ' AND is_published = true';
  }
  query += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

async function createReview({ author_name, content, rating = 5, product_id = null, is_published = false }) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (author_name, content, rating, product_id, is_published)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [author_name, content, rating, product_id, is_published]
  );
  return rows[0];
}

async function deleteReview(id) {
  const { rowCount } = await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { ensureReviewSchema, listReviews, createReview, deleteReview };