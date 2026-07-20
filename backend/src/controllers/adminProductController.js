'use strict';

const path   = require('path');
const crypto = require('crypto');

const { listProducts, findProductById, createProduct, updateProduct, deleteProduct } = require('../models/Product');
const { createProductSchema, updateProductSchema } = require('../validation/productSchemas');
const { uploadToSupabase } = require('../lib/supabaseStorage');

// ---------------------------------------------------------------------------
// Internal helper – upload multer buffers to Supabase Storage.
// Returns an array of permanent public URLs in the same order as the input.
// ---------------------------------------------------------------------------
function buildSupabaseFilename(originalname) {
  const ext = path.extname(originalname) || '.bin';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

async function uploadProductImages(files = []) {
  const uploads = files.map(async (file) => {
    const filename = buildSupabaseFilename(file.originalname);
    return uploadToSupabase(file.buffer, 'products', filename, file.mimetype);
  });
  return Promise.all(uploads);
}

function parseJsonField(value) {
  if (typeof value !== 'string') return { ok: true, value };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (e) {
    return { ok: false };
  }
}

async function maybeUploadImages(req) {
  if (req.files && req.files.length > 0) {
    const urls = await uploadProductImages(req.files);
    return { image_url: urls[0], gallery_urls: urls };
  }

  if (req.file) {
    const urls = await uploadProductImages([req.file]);
    return { image_url: urls[0], gallery_urls: urls };
  }

  return {};
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


  try {
    const uploaded = await maybeUploadImages(req);
    if (Object.keys(uploaded).length) {
      productData = { ...productData, ...uploaded };
    }
  } catch (err) {
    console.error('[adminCreate] Supabase upload error:', err.message);
    return res.status(502).json({ message: 'Image upload failed', detail: err.message });
  }




  // Parse JSON fields that arrive as strings with FormData

  const attrs = parseJsonField(productData.attributes);
  if (attrs.ok) productData.attributes = attrs.value;

  const gallery = parseJsonField(productData.gallery_urls);
  if (gallery.ok) productData.gallery_urls = gallery.value;



  const parsed = createProductSchema.safeParse(productData);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  try {
    const item = await createProduct(parsed.data);
    return res.status(201).json({ data: item });
  } catch (err) {
    console.error('[adminCreate] DB error:', err);
    return res.status(500).json({ message: 'Failed to create product', detail: err.message });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/products/:id   (multipart/form-data or JSON)
// ---------------------------------------------------------------------------
async function adminUpdate(req, res) {
  const { id }    = req.params;
  let productData = { ...req.body };

  // Upload any new images to Supabase Storage
  try {
    const uploaded = await maybeUploadImages(req);
    if (Object.keys(uploaded).length) {
      productData = { ...productData, ...uploaded };
    }
  } catch (err) {
    console.error('[adminUpdate] Supabase upload error:', err.message);
    return res.status(502).json({ message: 'Image upload failed', detail: err.message });
  }

  // Parse JSON fields
  const attrs = parseJsonField(productData.attributes);
  if (attrs.ok) productData.attributes = attrs.value;

  const gallery = parseJsonField(productData.gallery_urls);
  if (gallery.ok) productData.gallery_urls = gallery.value;


  const parsed = updateProductSchema.safeParse(productData);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  try {
    const updated = await updateProduct(id, parsed.data);
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    return res.json({ data: updated });
  } catch (err) {
    console.error('[adminUpdate] DB error:', err);
    return res.status(500).json({ message: 'Failed to update product', detail: err.message });
  }
}

async function adminDelete(req, res) {
  try {
    const ok = await deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Product not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('[adminDelete] DB error:', err);
    return res.status(500).json({ message: 'Failed to delete product', detail: err.message });
  }
}

module.exports = { adminList, adminGet, adminCreate, adminUpdate, adminDelete };
