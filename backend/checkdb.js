const { Pool } = require('pg');
require('dotenv').config({ path: './.env' }); // Load .env file

async function test(user, pass) {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'glowexpert',
    user,
    password: pass,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false // Use SSL from .env, rejectUnauthorized for self-signed certs
  });
  try {
    await pool.query('SELECT 1');
    console.log('SUCCESS', user, pass);
  } catch (err) {
    console.log('FAIL', user, pass, err.message.replace(/\n/g, ' '));
  } finally {
    await pool.end();
  }
}

(async () => {
  const defaultCandidates = [
    ['glowexpert', 'glowexpert'],
    ['postgres', 'postgres'],
    ['postgres', ''],
    ['postgres', null],
    ['postgres', 'password'],
  ];
  
  let candidatesToTest = [...defaultCandidates];

  // If DB_USER and DB_PASSWORD are set in .env, prioritize them
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    // Add .env credentials to the beginning of the list to test first
    candidatesToTest.unshift([process.env.DB_USER, process.env.DB_PASSWORD]);
    // Remove duplicates if .env credentials are already in defaultCandidates
    candidatesToTest = [...new Map(candidatesToTest.map(item => [`${item[0]}:${item[1]}`, item])).values()];
  }

  for (const [user, pass] of candidatesToTest) {
    await test(user, pass);
  }
})();
