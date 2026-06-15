# Project Architecture

## Overview
- Express server (Node.js) in `backend/src/server.js`
- Static serving:
  - Frontend from `/frontend` (admin/blog pages)
  - Uploaded images from `/uploads`
- Postgres for persistence
- JWT-based authentication with admin role gating

## Request Flow
1. Express receives request.
2. Security middleware:
   - `helmet`
   - `cors` (origin allowlist in production)
3. Route mounting (in `server.js`):
   - `/api/auth` -> authRoutes
   - `/api/products` -> public products routes
   - `/api/admin` -> admin products + settings + reviews
   - `/api/admin/influencers` -> admin influencer routes
   - `/api` -> blog + site settings + subscribers + orders + health
4. Protected routes:
   - `authMiddleware` or `requireAuth` checks JWT
   - `requireRoles(['admin'])` / `requireAdmin` checks `role === 'admin'`

## Directory Layout
- `backend/src/`:
  - `server.js` Express app & route mount
  - `routes/` express routers
  - `controllers/` request handlers
  - `models/` database access and schema ensuring
  - `auth/` JWT + roles helpers
  - `middleware/` auth/authorization middleware
  - `validation/` zod schemas
  - `uploads/` stored file path (served statically)


