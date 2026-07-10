'use strict';

const path   = require('path');
const crypto = require('crypto');

const { listProducts, findProductById, createProduct, updateProduct, deleteProduct } = require('../models/Product');
const { createProductSchema, updateProductSchema } = require('../validation/productSchemas');
const { uploadToSupabase } = require('../lib/supabaseStorage');

// ---------------------------------------------------------------------------
// Internal helper – upload all multer buffers to Supabase Storage.
// Returns an array of permanent public URLs in the same order as req.files.
// ---------------------------------------------------------------------------
async function uploadProductImages(files) {
  const uploads = files.map(async (file) => {
    const ext      = path.extname(file.originalname) || '.bin';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    return uploadToSupabase(file.buffer, 'products', filename, file.mimetype);
  });
  return Promise.all(uploads);
}

// ---------------------------------------------------------------------------
// GET /api/admin/products
// ---------------------------------------------------------------------------
async function adminList(req, res) {
  const limit  = Math.min(Number(req.query.limit  || 50),  200);
  const offset = Math.max(Number(req.query.offset || 0),    0);
  const items  = await listProducts({ limit, offset });
  return res.json({ data: items });
}

// ---------------------------------------------------------------------------
// GET /api/admin/products/:id
// ---------------------------------------------------------------------------
async function adminGet(req, res) {
  const item = await findProductById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.json({ data: item });
}

// ---------------------------------------------------------------------------
// POST /api/admin/products   (multipart/form-data or JSON)
// ---------------------------------------------------------------------------
async function adminCreate(req, res) {
  let productData = { ...req.body };

  // Upload any attached images to Supabase Storage
  if (req.files && req.files.length > 0) {
    try {
      const urls = await uploadProductImages(req.files);
      productData.image_url   = urls[0];        // Primary image
      productData.gallery_urls = urls;           // Full gallery
    } catch (err) {
      console.error('[adminCreate] Supabase upload error:', err.message);
      return res.status(502).json({ message: 'Image upload failed', detail: err.message });
    }
  } else if (req.file) {
    try {
      const urls = await uploadProductImages([req.file]);
      productData.image_url   = urls[0];
      productData.gallery_urls = urls;
    } catch (err) {
      console.error('[adminCreate] Supabase upload error:', err.message);
      return res.status(502).json({ message: 'Image upload failed', detail: err.message });
    }
  }

  // Parse JSON fields that arrive as strings with FormData
  if (typeof productData.attributes === 'string') {
    try { productData.attributes = JSON.parse(productData.attributes); } catch { productData.attributes = null; }
  }
  if (typeof productData.gallery_urls === 'string') {
    try { productData.gallery_urls = JSON.parse(productData.gallery_urls); } catch {}
  }

  const parsed = createProductSchema.safeParse(productData);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  const item = await createProduct(parsed.data);
  return res.status(201).json({ data: item });
}

// ---------------------------------------------------------------------------
// PUT /api/admin/products/:id   (multipart/form-data or JSON)
// ---------------------------------------------------------------------------
async function adminUpdate(req, res) {
  const { id }    = req.params;
  let productData = { ...req.body };

  // Upload any new images to Supabase Storage
  if (req.files && req.files.length > 0) {
    try {
      const urls = await uploadProductImages(req.files);
      productData.image_url   = urls[0];
      productData.gallery_urls = urls;
    } catch (err) {
      console.error('[adminUpdate] Supabase upload error:', err.message);
      return res.status(502).json({ message: 'Image upload failed', detail: err.message });
    }
  } else if (req.file) {
    try {
      const urls = await uploadProductImages([req.file]);
      productData.image_url   = urls[0];
      productData.gallery_urls = urls;
    } catch (err) {
      console.error('[adminUpdate] Supabase upload error:', err.message);
      return res.status(502).json({ message: 'Image upload failed', detail: err.message });
    }
  }

  // Parse JSON fields
  if (typeof productData.attributes === 'string') {
    try { productData.attributes = JSON.parse(productData.attributes); } catch { productData.attributes = null; }
  }
  if (typeof productData.gallery_urls === 'string') {
    try { productData.gallery_urls = JSON.parse(productData.gallery_urls); } catch {}
  }

  const parsed = updateProductSchema.safeParse(productData);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  const updated = await updateProduct(id, parsed.data);
  if (!updated) return res.status(404).json({ message: 'Product not found' });
  return res.json({ data: updated });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/products/:id
// ---------------------------------------------------------------------------
async function adminDelete(req, res) {
  const ok = await deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Product not found' });
  return res.status(204).send();
}

module.exports = { adminList, adminGet, adminCreate, adminUpdate, adminDelete };
