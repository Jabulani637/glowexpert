require('dotenv').config();
const { ensureAdminUser } = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@glowexpert.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const ADMIN_CELL = process.env.ADMIN_CELLPHONE || '+1234567890';
  const ADMIN_NAME = 'GlowExpert Admin';

  console.log('Seeding admin user...');
  
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  
  const admin = await ensureAdminUser({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    cellphone: ADMIN_CELL,
    passwordHash: passwordHash,
    role: 'admin'
  });

  console.log('✓ Admin user created/updated successfully');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
  console.log('Cellphone:', ADMIN_CELL);
  
  process.exit(0);
}

main().catch((e) => {
  console.error('✗ Seed failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
