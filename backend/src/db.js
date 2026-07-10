const { Pool } = require('pg');

// Build connection string from .env variables. Prefer DATABASE_URL if set.
// NOTE: intentionally do NOT fall back to the generic process.env.USER / HOST / PORT
// variables here. Those names collide with unrelated env vars (PORT is the app's own
// HTTP listen port, USER/HOST are often set by the OS or hosting platform), which
// previously caused the pool to try to connect to Postgres on the API's HTTP port.
// Only DB_-prefixed vars (or DATABASE_URL) should ever drive the DB connection.
const connectionString = process.env.DATABASE_URL || (() => {
  const user = process.env.DB_USER || '';
  const password = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'glowexpert';
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
})();

const pool = new Pool({
  connectionString,
  // Supabase Transaction Pooler requires SSL.
  // DB_SSL=true in .env / Render dashboard enables it.
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }  // Supabase uses valid certs but pooler needs this flag
    : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Helper to convert '?' placeholders to Postgres '$1', '$2', ...
function convertQuery(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

async function query(sql, params = []) {
  const result = await pool.query(convertQuery(sql), params);
  return { rows: result.rows };
}

async function run(sql, params = []) {
  const result = await pool.query(convertQuery(sql), params);
  return { changes: result.rowCount };
}

/**
 * Check out a single client from the pool.
 * The caller MUST call client.release() in a finally block.
 * Use this for multi-statement transactions that require one connection.
 *
 * The returned client exposes a queryTx(sql, params) helper that
 * automatically converts '?' placeholders to Postgres '$N'.
 */
async function getClient() {
  const client = await pool.connect();
  // Attach a helper so transaction code reads the same as pool queries
  client.queryTx = (sql, params = []) => client.query(convertQuery(sql), params);
  return client;
}

module.exports = { pool, query, run, getClient };

