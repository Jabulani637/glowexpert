CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NULL UNIQUE,
  description TEXT NULL,

  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(5) NOT NULL DEFAULT 'ZAR',
  image_url TEXT NULL,

  stock INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

