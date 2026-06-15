const { pool } = require('../db');

async function ensureProductSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(180) NOT NULL,
      slug VARCHAR(200) NULL UNIQUE,
      category VARCHAR(100) NULL,
      description TEXT NULL,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency VARCHAR(5) NOT NULL DEFAULT 'ZAR',
      image_url TEXT NULL,
      gallery_urls JSONB NULL,
      attributes JSONB NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      meta_title VARCHAR(255) NULL,
      meta_description TEXT NULL,
      meta_keywords TEXT NULL,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)`);

  // Migration for new columns
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_urls JSONB NULL`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB NULL`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) NULL`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT NULL`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords TEXT NULL`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true`);
}

async function listProducts({ limit = 50, offset = 0, category = null, isFeatured = null } = {}) {
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (isFeatured !== null) {
      params.push(isFeatured);
      query += ` AND is_featured = $${params.length}`;
    }
    
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.warn('Database unavailable, returning empty products list:', err.message);
    return [];
  }
}

async function findProductById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function createProduct({ name, slug = null, category = null, description = null, price, currency = 'ZAR', image_url = null, gallery_urls = null, attributes = null, stock = 0, is_featured = false, meta_title = null, meta_description = null, meta_keywords = null } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, slug, category, description, price, currency, image_url, gallery_urls, attributes, stock, is_featured, meta_title, meta_description, meta_keywords)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [name, slug, category, description, price, currency, image_url, JSON.stringify(gallery_urls), JSON.stringify(attributes), stock, is_featured, meta_title, meta_description, meta_keywords]
  );
  return rows[0];
}

async function updateProduct(id, { name, slug = null, category = null, description = null, price, currency = 'ZAR', image_url = null, gallery_urls = null, attributes = null, stock = 0, is_featured = false, meta_title = null, meta_description = null, meta_keywords = null } = {}) {
  const { rows } = await pool.query(
    `UPDATE products
     SET name = $1,
         slug = $2,
         category = $3,
         description = $4,
         price = $5,
         currency = $6,
         image_url = $7,
         gallery_urls = $8,
         attributes = $9,
         stock = $10,
         is_featured = $11,
         meta_title = $12,
         meta_description = $13,
         meta_keywords = $14,
         updated_at = NOW()
     WHERE id = $15
     RETURNING *`,
    [name, slug, category, description, price, currency, image_url, JSON.stringify(gallery_urls), JSON.stringify(attributes), stock, is_featured, meta_title, meta_description, meta_keywords, id]
  );
  return rows[0] || null;
}

async function deleteProduct(id) {
  const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

module.exports = {
  ensureProductSchema,
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
