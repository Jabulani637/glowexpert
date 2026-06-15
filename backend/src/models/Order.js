const { pool } = require('../db');

async function ensureOrderSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name VARCHAR(120) NOT NULL,
      customer_email VARCHAR(190) NOT NULL,
      customer_phone VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      currency VARCHAR(5) NOT NULL DEFAULT 'ZAR',
      total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      items_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)`);
}

async function createOrder({ customerName, customerEmail, customerPhone, items } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const normalizedItems = [];
    let total = 0;
    let currency = 'ZAR';

    for (const requestedItem of items) {
      // Lock the row to prevent concurrent modifications (pessimistic locking)
      const { rows } = await client.query(
        'SELECT * FROM products WHERE id = $1 LIMIT 1 FOR UPDATE',
        [requestedItem.product_id]
      );
      const product = rows[0];
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

      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
        [quantity, product.id]
      );
    }

    const { rows } = await client.query(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, status, currency, total_amount, items_json)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6::jsonb)
       RETURNING *`,
      [customerName, customerEmail, customerPhone, currency, total.toFixed(2), JSON.stringify(normalizedItems)]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listOrders() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    return rows;
  } catch (err) {
    console.warn('Database unavailable, returning empty orders list:', err.message);
    return [];
  }
}

async function listCustomers() {
  try {
    const { rows } = await pool.query(`
      SELECT
        customer_email AS email,
        MAX(customer_name) AS name,
        MAX(customer_phone) AS cellphone,
        COUNT(*)::INTEGER AS order_count,
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

module.exports = {
  ensureOrderSchema,
  createOrder,
  listOrders,
  listCustomers
};
