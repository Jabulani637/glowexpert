require('dotenv').config();
const { pool } = require('./src/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✓ Database connection successful');
    console.log('  Current time:', result.rows[0].current_time);
    
    // Test a simple query with placeholder conversion
    const { query } = require('./src/db');
    const testResult = await query('SELECT $1 as test_value', ['hello']);
    console.log('✓ Placeholder conversion working');
    console.log('  Test value:', testResult.rows[0].test_value);
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    console.error('  Details:', err.stack);
    process.exit(1);
  }
}

testConnection();
