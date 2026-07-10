const { query, run, pool, getClient } = require('../db');
const crypto = require('crypto');

// Helper to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Transaction wrapper for PostgreSQL connection pool
// Ensures all queries in the callback run on the same connection
async function serializeTransaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ensureOrderSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      currency TEXT NOT NULL DEFAULT 'ZAR',
      total_amount REAL NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)`);
  // Migrate: add referral_code and influencer_id columns if missing
  try {
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT`);
  } catch (err) {
    // ignore
  }
  try {
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_id TEXT`);
  } catch (err) {
    // ignore
  }
  try {
    await run(`CREATE INDEX IF NOT EXISTS idx_orders_influencer_id ON orders(influencer_id)`);
  } catch (err) {
    // ignore
  }
}

async function createOrder({ customerName, customerEmail, customerPhone, items, referralCode = null, influencerId = null } = {}) {
  return serializeTransaction(async (client) => {
    const normalizedItems = [];
    let total = 0;
    let currency = 'ZAR';

    for (const requestedItem of items) {
      const result = await client.queryTx(
        'SELECT * FROM products WHERE id = $1 LIMIT 1',
        [requestedItem.product_id]
      );
      const product = result.rows[0];
      if (!product) {
        throw new Error('A selected product no longer exists.');
      }

      const quantity = Number(requestedItem.quantity || 0);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Invalid cart quantity.');
      }
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }

      const unitPrice = Number(product.price);
      currency = product.currency || currency;
      total += unitPrice * quantity;
      normalizedItems.push({
        product_id: product.id,
        name: product.name,
        quantity,
        unit_price: unitPrice,
        line_total: unitPrice * quantity,
        currency: product.currency,
        image_url: product.image_url
      });

      await client.queryTx(
        'UPDATE products SET stock = stock - $1, updated_at = $2 WHERE id = $3',
        [quantity, getCurrentTimestamp(), product.id]
      );
    }

    const id = generateUUID();
    await client.queryTx(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, status, currency, total_amount, items_json, referral_code, influencer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11)`,
      [id, customerName, customerEmail, customerPhone, currency, total, JSON.stringify(normalizedItems), referralCode, influencerId, getCurrentTimestamp(), getCurrentTimestamp()]
    );

    const result = await client.queryTx('SELECT * FROM orders WHERE id = $1', [id]);
    return {
      ...result.rows[0],
      items_json: JSON.parse(result.rows[0].items_json)
    };
  });
}

async function listOrders() {
  try {
    const { rows } = await query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    return rows.map(row => ({
      ...row,
      items_json: JSON.parse(row.items_json)
    }));
  } catch (err) {
    console.warn('Database unavailable, returning empty orders list:', err.message);
    return [];
  }
}

async function listCustomers() {
  try {
    const { rows } = await query(`
      SELECT
        customer_email AS email,
        MAX(customer_name) AS name,
        MAX(customer_phone) AS cellphone,
        COUNT(*) AS order_count,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        MAX(created_at) AS last_order_at
      FROM orders
      GROUP BY customer_email
      ORDER BY MAX(created_at) DESC
    `);
    return rows;
  } catch (err) {
    console.warn('Database unavailable, returning empty customers list:', err.message);
    return [];
  }
}

async function listOrdersByInfluencer(influencerId) {
  try {
    const { rows } = await query(
      'SELECT * FROM orders WHERE influencer_id = ? ORDER BY created_at DESC',
      [influencerId]
    );
    return rows.map(row => ({
      ...row,
      items_json: JSON.parse(row.items_json)
    }));
  } catch (err) {
    console.warn('Database unavailable, returning empty influencer orders list:', err.message);
    return [];
  }
}

async function listInfluencerOrderStats() {
  try {
    const { rows } = await query(`
      SELECT influencer_id, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_sales
      FROM orders
      WHERE influencer_id IS NOT NULL
      GROUP BY influencer_id
      ORDER BY total_sales DESC
    `);
    return rows;
  } catch (err) {
    console.warn('Database unavailable, returning empty influencer stats:', err.message);
    return [];
  }
}

module.exports = {
  ensureOrderSchema,
  createOrder,
  listOrders,
  listCustomers,
  listOrdersByInfluencer,
  listInfluencerOrderStats
};

// Find a single order by id (reference)
async function findOrderById(id) {
  try {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      items_json: JSON.parse(row.items_json)
    };
  } catch (err) {
    console.warn('findOrderById error:', err.message);
    return null;
  }
}

module.exports.findOrderById = findOrderById;
