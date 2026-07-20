const { query, run } = require('../db');
const crypto = require('crypto');
const { getFallbackStore, saveFallbackStore, clone } = require('../lib/fallbackStore');

// Helper to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensureProductSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NULL UNIQUE,
      category TEXT NULL,
      description TEXT NULL,
      price REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ZAR',
      image_url TEXT NULL,
      gallery_urls TEXT NULL,
      attributes TEXT NULL,
      stock INTEGER NOT NULL DEFAULT 0,

      is_featured INTEGER NOT NULL DEFAULT 0,
      is_new_arrival INTEGER NOT NULL DEFAULT 0,
      is_best_seller INTEGER NOT NULL DEFAULT 0,
      is_on_sale INTEGER NOT NULL DEFAULT 0,
      sale_percent_off REAL NOT NULL DEFAULT 0,
      is_wholesale INTEGER NOT NULL DEFAULT 0,

      meta_title TEXT NULL,
      meta_description TEXT NULL,
      meta_keywords TEXT NULL,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)`);

  // Migration for new columns
  try {
    await run(`ALTER TABLE products ADD COLUMN category TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN gallery_urls TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN attributes TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN meta_title TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN meta_description TEXT`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN meta_keywords TEXT`);
  } catch (err) {}

  // New badge/sale/wholesale columns
  try {
    await run(`ALTER TABLE products ADD COLUMN is_new_arrival INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN is_best_seller INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN is_on_sale INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN sale_percent_off REAL NOT NULL DEFAULT 0`);
  } catch (err) {}
  try {
    await run(`ALTER TABLE products ADD COLUMN is_wholesale INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {}

  await run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
  try {
    await run(`CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = 1`);
  } catch (err) {}
  try {
    await run(`CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale) WHERE is_on_sale = 1`);
  } catch (err) {}
}


async function listProducts({ limit = 50, offset = 0, category = null, isFeatured = null } = {}) {
  try {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (category) {
      params.push(category);
      sql += ` AND category = ?`;
    }
    if (isFeatured !== null) {
      params.push(isFeatured ? 1 : 0);
      sql += ` AND is_featured = ?`;
    }
    
    params.push(limit, offset);
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    
    const { rows } = await query(sql, params);
    return rows.map(row => ({
      ...row,
      gallery_urls: row.gallery_urls ? JSON.parse(row.gallery_urls) : null,
      attributes: row.attributes ? JSON.parse(row.attributes) : null,
      is_featured: !!row.is_featured
    }));
  } catch (err) {
    const store = getFallbackStore();
    const items = store.products
      .filter((p) => (category ? p.category === category : true))
      .filter((p) => (isFeatured !== null ? Boolean(p.is_featured) === Boolean(isFeatured) : true))
      .slice(offset, offset + limit);
    return items.map((item) => ({ ...item, is_featured: Boolean(item.is_featured) }));
  }
}

async function findProductById(id) {
  try {
    const { rows } = await query(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      gallery_urls: rows[0].gallery_urls ? JSON.parse(rows[0].gallery_urls) : null,
      attributes: rows[0].attributes ? JSON.parse(rows[0].attributes) : null,
      is_featured: !!rows[0].is_featured
    };
  } catch (err) {
    const store = getFallbackStore();
    const item = store.products.find((product) => product.id === id);
    return item ? { ...item, is_featured: Boolean(item.is_featured) } : null;
  }
}

async function createProduct({
  name,
  slug = null,
  category = null,
  description = null,
  price,
  currency = 'ZAR',
  image_url = null,
  gallery_urls = null,
  attributes = null,
  stock = 0,
  is_featured = false,
  is_new_arrival = false,
  is_best_seller = false,
  is_on_sale = false,
  sale_percent_off = 0,
  is_wholesale = false,
  meta_title = null,
  meta_description = null,
  meta_keywords = null
} = {}) {
  try {
    const id = generateUUID();
    const now = getCurrentTimestamp();
    await run(
      `INSERT INTO products (
        id,
        name,
        slug,
        category,
        description,
        price,
        currency,
        image_url,
        gallery_urls,
        attributes,
        stock,
        is_featured,
        is_new_arrival,
        is_best_seller,
        is_on_sale,
        sale_percent_off,
        is_wholesale,
        meta_title,
        meta_description,
        meta_keywords,
        created_at,
        updated_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        slug,
        category,
        description,
        price,
        currency,
        image_url,
        JSON.stringify(gallery_urls),
        JSON.stringify(attributes),
        stock,
        is_featured ? 1 : 0,
        is_new_arrival ? 1 : 0,
        is_best_seller ? 1 : 0,
        is_on_sale ? 1 : 0,
        Number(sale_percent_off) || 0,
        is_wholesale ? 1 : 0,
        meta_title,
        meta_description,
        meta_keywords,
        now,
        now
      ]
    );
    return await findProductById(id);
  } catch (err) {
    console.error('[createProduct] DB insert failed, using fallback:', err.message);
    const store = getFallbackStore();
    const item = {
      id: generateUUID(),
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      description,
      price,
      currency,
      image_url,
      gallery_urls: gallery_urls || [],
      attributes: attributes || {},
      stock,
      is_featured: Boolean(is_featured),
      is_new_arrival: Boolean(is_new_arrival),
      is_best_seller: Boolean(is_best_seller),
      is_on_sale: Boolean(is_on_sale),
      sale_percent_off: Number(sale_percent_off) || 0,
      is_wholesale: Boolean(is_wholesale),
      meta_title,
      meta_description,
      meta_keywords,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };

    store.products.unshift(item);
    try { saveFallbackStore(store); } catch (fsErr) {
      console.warn('[createProduct] Could not persist fallback store:', fsErr.message);
    }
    return { ...item, is_featured: Boolean(item.is_featured) };
  }
}

async function updateProduct(id, {
  name,
  slug = null,
  category = null,
  description = null,
  price,
  currency = 'ZAR',
  image_url = null,
  gallery_urls = null,
  attributes = null,
  stock = 0,
  is_featured = false,
  is_new_arrival = false,
  is_best_seller = false,
  is_on_sale = false,
  sale_percent_off = 0,
  is_wholesale = false,
  meta_title = null,
  meta_description = null,
  meta_keywords = null
} = {}) {
  try {
    const now = getCurrentTimestamp();
    await run(
      `UPDATE products
       SET name = ?,
           slug = ?,
           category = ?,
           description = ?,
           price = ?,
           currency = ?,
           image_url = ?,
           gallery_urls = ?,
           attributes = ?,
           stock = ?,
           is_featured = ?,
           is_new_arrival = ?,
           is_best_seller = ?,
           is_on_sale = ?,
           sale_percent_off = ?,
           is_wholesale = ?,
           meta_title = ?,
           meta_description = ?,
           meta_keywords = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        name,
        slug,
        category,
        description,
        price,
        currency,
        image_url,
        JSON.stringify(gallery_urls),
        JSON.stringify(attributes),
        stock,
        is_featured ? 1 : 0,
        is_new_arrival ? 1 : 0,
        is_best_seller ? 1 : 0,
        is_on_sale ? 1 : 0,
        Number(sale_percent_off) || 0,
        is_wholesale ? 1 : 0,
        meta_title,
        meta_description,
        meta_keywords,
        now,
        id
      ]
    );
    return await findProductById(id);
  } catch (err) {
    const store = getFallbackStore();
    const index = store.products.findIndex((product) => product.id === id);
    if (index < 0) return null;
    store.products[index] = {
      ...store.products[index],
      name,
      slug: slug || store.products[index].slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      description,
      price,
      currency,
      image_url,
      gallery_urls: gallery_urls || [],
      attributes: attributes || {},
      stock,
      is_featured: Boolean(is_featured),
      is_new_arrival: Boolean(is_new_arrival),
      is_best_seller: Boolean(is_best_seller),
      is_on_sale: Boolean(is_on_sale),
      sale_percent_off: Number(sale_percent_off) || 0,
      is_wholesale: Boolean(is_wholesale),
      meta_title,
      meta_description,
      meta_keywords,
      updated_at: getCurrentTimestamp()
    };

    try { saveFallbackStore(store); } catch (fsErr) {
      console.warn('[updateProduct] Could not persist fallback store:', fsErr.message);
    }
    return { ...store.products[index], is_featured: Boolean(store.products[index].is_featured) };
  }
}

async function deleteProduct(id) {
  try {
    const result = await run('DELETE FROM products WHERE id = ?', [id]);
    return result.changes > 0;
  } catch (err) {
    const store = getFallbackStore();
    const before = store.products.length;
    store.products = store.products.filter((product) => product.id !== id);
    try { saveFallbackStore(store); } catch (fsErr) {
      console.warn('[deleteProduct] Could not persist fallback store:', fsErr.message);
    }
    return store.products.length < before;
  }
}

module.exports = {
  ensureProductSchema,
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
