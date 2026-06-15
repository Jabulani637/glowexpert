# Database Documentation (Postgres)

## Connection
Backend uses `backend/src/db.js`:
- Pool configuration:
  - host: `DB_HOST`
  - port: `DB_PORT` (default 5432)
  - database: `DB_NAME`
  - user: `DB_USER`
  - password: `DB_PASSWORD`
  - ssl: if `DB_SSL === 'true'`

## Bootstrap SQL
`backend/setup_db.sql` creates:
- Role `glowexpert` (if missing) and grants `CREATEDB`
- Database `glowexpert` (if missing)

This is typically executed as part of container startup or a setup job.

## Schema & Migrations
Migrations exist in:
- `backend/src/migrations/001_create_users.sql`
- `backend/src/migrations/002_create_products.sql`
- `backend/src/migrations/003_admin_login_fields.sql`
- `backend/src/migrations/004_create_blog_posts.sql`

Additionally, runtime schema checks are performed during API startup in:
- `backend/src/server.js`

The server calls:
- `ensureProductSchema()`
- `ensureSiteSettingsSchema()`
- `ensureSubscriberSchema()`
- `ensureOrderSchema()`
- `ensureBlogPostSchema()`
- `ensureReviewSchema()`
- `ensureUserSchema()`
- `ensureInfluencerSchema()`

These `ensure*` functions are defined in model files under:
- `backend/src/models/`

## Key Tables (as implied by models)
From model names and route behavior:
- `users`
  - Supports password auth and admin OTP fields (`otp_code`, `otp_expires_at`, etc.)
- `products`
- `site_settings`
- `subscribers`
- `orders`
- `influencers` (referral codes + commission rate)
- `blog_posts`
- `reviews`

## Admin OTP Login Fields
`backend/src/migrations/003_admin_login_fields.sql` indicates additional columns for admin OTP login.

OTP flow overview:
- Login returns OTP for admin role (demo)
- Verification consumes OTP and clears OTP columns


