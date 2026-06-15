const { listProducts, findProductById, createProduct, updateProduct, deleteProduct } = require('../models/Product');
const { createProductSchema, updateProductSchema } = require('../validation/productSchemas');

async function adminList(req, res) {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const offset = Math.max(Number(req.query.offset || 0), 0);

  const items = await listProducts({ limit, offset });
  return res.json({ data: items });
}

async function adminGet(req, res) {
  const { id } = req.params;
  const item = await findProductById(id);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.json({ data: item });
}

async function adminCreate(req, res) {
  // Handle both JSON and FormData (with file upload)
  let productData = req.body;

  // Handle multiple file uploads for the gallery
  if (req.files && req.files.length > 0) {
    const paths = req.files.map(file => `/uploads/${file.filename}`);
    productData.image_url = paths[0]; // Primary image
    productData.gallery_urls = paths; // Full gallery
  } else if (req.file) {
    productData.image_url = `/uploads/${req.file.filename}`;
    productData.gallery_urls = [productData.image_url];
  }

  // Parse JSON fields if they come as strings (common with FormData/File uploads)
  if (typeof productData.attributes === 'string') {
    try {
      productData.attributes = JSON.parse(productData.attributes);
    } catch (e) {
      productData.attributes = null;
    }
  }
  if (typeof productData.gallery_urls === 'string') {
    try { productData.gallery_urls = JSON.parse(productData.gallery_urls); } catch (e) {}
  }

  const parsed = createProductSchema.safeParse(productData);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  const item = await createProduct(parsed.data);
  return res.status(201).json({ data: item });
}

async function adminUpdate(req, res) {
  const { id } = req.params;

  // Handle both JSON and FormData (with file upload)
  let productData = req.body;

  // Handle multiple file uploads for the gallery
  if (req.files && req.files.length > 0) {
    const paths = req.files.map(file => `/uploads/${file.filename}`);
    productData.image_url = paths[0];
    productData.gallery_urls = paths;
  } else if (req.file) {
    productData.image_url = `/uploads/${req.file.filename}`;
    productData.gallery_urls = [productData.image_url];
  }

  // Parse JSON fields if they come as strings
  if (typeof productData.attributes === 'string') {
    try {
      productData.attributes = JSON.parse(productData.attributes);
    } catch (e) {
      productData.attributes = null;
    }
  }
  if (typeof productData.gallery_urls === 'string') {
    try { productData.gallery_urls = JSON.parse(productData.gallery_urls); } catch (e) {}
  }

  const parsed = updateProductSchema.safeParse(productData);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  const updated = await updateProduct(id, parsed.data);
  if (!updated) return res.status(404).json({ message: 'Product not found' });
  return res.json({ data: updated });
}

async function adminDelete(req, res) {
  const { id } = req.params;
  const ok = await deleteProduct(id);
  if (!ok) return res.status(404).json({ message: 'Product not found' });
  return res.status(204).send();
}

module.exports = {
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete
};
