require('dotenv').config({ path: '../.env' });
const { ensureProductSchema } = require('./models/Product');
const { createProduct } = require('./models/Product');

async function run() {
  await ensureProductSchema();
  const prod = await createProduct({
    name: 'Test Product',
    price: 10.99
  });
  console.log('Product created:', prod);
}
run();
