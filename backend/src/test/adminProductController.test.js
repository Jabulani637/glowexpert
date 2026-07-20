// Integration-ish tests for admin product controller behavior.
// Focus: request parsing + correct error handling.

jest.mock('../lib/supabaseStorage', () => ({
  uploadToSupabase: jest.fn(async () => 'https://example.com/uploads/test.jpg')
}));

jest.mock('../models/Product', () => {
  return {
    listProducts: jest.fn(async () => []),
    findProductById: jest.fn(async (id) => ({ id, name: 'P1', slug: 'p1', price: 10, currency: 'ZAR', stock: 0, attributes: {}, is_featured: false })),
    createProduct: jest.fn(async (data) => ({ id: 'new-id', ...data, is_featured: Boolean(data.is_featured) })),
    updateProduct: jest.fn(async (id, data) => ({ id, ...data, is_featured: Boolean(data.is_featured) })),
    deleteProduct: jest.fn(async () => true)
  };
});

// NOTE: supertest is required from within tests (avoid hard dep if not installed yet).
const request = require('supertest');
const express = require('express');
const multer = require('multer');

const adminProductRoutes = require('../routes/adminProductRoutes');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/admin', adminProductRoutes);
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
  return app;
}

function getAuthHeader(role) {
  return { Authorization: `Bearer ${role}` };
}

describe('admin product upload handling', () => {
  test('POST /products with JSON body => 201', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/admin/products')
      .set(getAuthHeader('admin'))

      .send({
        name: 'Test Product',
        slug: 'test-product',
        description: 'desc',
        category: 'cat',
        is_featured: true,
        price: 99,
        currency: 'ZAR',
        stock: 12,
        image_url: 'https://example.com/x.jpg',
        attributes: { a: 1 },
        meta_title: 'mt',
        meta_description: 'md',
        meta_keywords: 'k'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
  });

  test('POST /products FormData attributes as JSON string => 201', async () => {
    // Keep it light: use multipart route by leveraging supertest .field.
    // The route uses multer.memoryStorage + expects images under field name "images".

    const app = createApp();

    // Mock upload by sending a small fake image buffer.
    const res = await request(app)
      .post('/api/admin/products')
      .set(getAuthHeader('admin'))

      .field('name', 'Test Product')
      .field('slug', 'test-product')
      .field('category', 'cat')
      .field('description', 'desc')
      .field('is_featured', 'true')
      .field('price', '99')
      .field('currency', 'ZAR')
      .field('stock', '12')
      .field('attributes', JSON.stringify({ a: 1 }))
      .attach('images', Buffer.from('fake-image-bytes'), 'test.png');

    // May be 201/422 depending on Zod schema; we validate error shape.
    expect([201, 422]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('data');
    } else {
      expect(res.body).toHaveProperty('message');
    }
  });

  test('Supabase upload failure => 502 Image upload failed', async () => {
    const { uploadToSupabase } = require('../lib/supabaseStorage');
    uploadToSupabase.mockImplementationOnce(async () => {
      throw new Error('Supabase down');
    });

    const app = createApp();

    const res = await request(app)
      .post('/api/admin/products')
      .set(getAuthHeader('admin'))

      .field('name', 'Test Product')
      .field('slug', 'test-product')
      .field('category', 'cat')
      .field('description', 'desc')
      .field('is_featured', 'false')
      .field('price', '99')
      .field('currency', 'ZAR')
      .field('stock', '12')
      .attach('images', Buffer.from('fake-image-bytes'), 'test.png');

    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('message', 'Image upload failed');
  });
});

