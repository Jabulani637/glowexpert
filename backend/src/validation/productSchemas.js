const { z } = require('zod');

const imageUrlSchema = z.string().refine((value) => {
  if (!value) return true;
  return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
}, 'Image URL must be an http(s) URL or uploaded file path');

const booleanField = z.union([
  z.boolean(),
  z.string().transform((value) => value.toLowerCase() === 'true')
]).optional().default(false);

const base = {
  name: z.string().min(2).max(180),
  slug: z.string().min(2).max(200).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  price: z.coerce.number().nonnegative(),
  currency: z.string().min(2).max(5).optional().default('ZAR'),
  image_url: imageUrlSchema.optional().nullable(),
  gallery_urls: z.array(z.string()).optional().nullable(),
  attributes: z.record(z.any()).optional().nullable(),
  stock: z.coerce.number().int().nonnegative().optional().default(0),

  is_featured: booleanField,
  is_new_arrival: booleanField,
  is_best_seller: booleanField,
  is_on_sale: booleanField,
  sale_percent_off: z
    .coerce.number()
    .min(0)
    .max(100)
    .optional()
    .default(0),
  is_wholesale: booleanField,

  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().optional().nullable(),
  meta_keywords: z.string().optional().nullable()
};

const createProductSchema = z.object(base);

const updateProductSchema = z.object({
  ...base,
  id: z.string().uuid().optional()
});

module.exports = { createProductSchema, updateProductSchema };
