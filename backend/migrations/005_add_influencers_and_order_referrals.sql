-- Migration 005: Link influencers to users and add referral fields to orders
-- Safe, idempotent changes: uses IF NOT EXISTS where supported.
-- BACKUP your database before running in production.

BEGIN;

-- Create influencers table for fresh installs (keeps legacy columns for compatibility)
CREATE TABLE IF NOT EXISTS influencers (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  commission_rate REAL NOT NULL DEFAULT 5.00,
  total_commission_earned REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for quick lookup by referral_code
CREATE INDEX IF NOT EXISTS idx_influencers_referral_code ON influencers(referral_code);

-- Add user_id column if missing (safe on modern Postgres)
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add unique index on user_id but only for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_user_id ON influencers(user_id) WHERE user_id IS NOT NULL;

-- Orders: add referral tracking columns used by the application
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_id TEXT;

-- Index to speed up influencer analytics
CREATE INDEX IF NOT EXISTS idx_orders_influencer_id ON orders(influencer_id);

COMMIT;

-- Notes:
-- - This migration is intentionally conservative: it doesn't drop or rename existing columns.
-- - Run in a maintenance window if your DB is large; the CREATE INDEX operations may take time.
-- - On older Postgres versions that don't support "IF NOT EXISTS" for ALTER TABLE, wrap specific statements
--   in a DO $$ BEGIN ... EXCEPTION WHEN duplicate_column THEN END $$; block or run equivalent checks first.
