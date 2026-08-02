-- Migration 006: Add PayFast payment tracking fields
-- Safe, idempotent changes: uses IF NOT EXISTS where supported.
-- BACKUP your database before running in production.

BEGIN;

-- Add payment tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payfast_m_payment_id TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add check constraint for payment_status values (Postgres syntax)
-- Note: IF NOT EXISTS not supported for constraints, so we use a DO block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'chk_orders_payment_status'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT chk_orders_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

-- Create payment_tokens table for saved payment methods
CREATE TABLE IF NOT EXISTS payment_tokens (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  card_brand TEXT,
  card_last_four TEXT,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL
);

-- Index for quick lookup by clerk_user_id
CREATE INDEX IF NOT EXISTS idx_payment_tokens_clerk_user_id ON payment_tokens(clerk_user_id);

-- Index for token uniqueness per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tokens_user_token ON payment_tokens(clerk_user_id, token) WHERE clerk_user_id IS NOT NULL;

COMMIT;

-- Notes:
-- - payment_status defaults to 'pending' and only allows: pending, paid, failed, refunded
-- - payfast_m_payment_id stores the unique reference sent to PayFast
-- - paid_at is null until payment is confirmed
-- - payment_tokens stores saved payment methods for future adhoc charges
-- - Run in a maintenance window if your DB is large; the CREATE INDEX operations may take time.
