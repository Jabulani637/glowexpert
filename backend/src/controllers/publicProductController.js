const { listProducts, findProductById } = require('../models/Product');

async function list(req, res) {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const offset = Math.max(Number(req.query.offset || 0), 0);
  const items = await listProducts({ limit, offset });
  return res.json({ data: items });
}

async function get(req, res) {
  const { id } = req.params;
  const item = await findProductById(id);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.json({ data: item });
}

module.exports = { list, get };

