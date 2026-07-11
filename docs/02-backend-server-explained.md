## backend/src/server.js (Express app bootstrap)

**Purpose:**
This file creates and starts the Express backend API.
It configures:
- security headers (helmet)
- CORS allowlisting
- JSON body parsing + logging
- rate limiting
- static file serving
- API route mounting
- global 404 + error handling
- database schema checks on startup
- optional admin user seeding

---

## Step-by-step startup logic

### 1) Imports + Express app
`express()`, `cors()`, `helmet()`, `morgan()` and several route modules are imported.

An Express app instance is created:
- `const app = express();`

---

### 2) Security headers (helmet)
`helmet({ contentSecurityPolicy: false })`
- CSP is disabled because the app serves many static HTML files and likely uses inline scripts.

---

### 3) CORS allowlisting
The helper `getAllowedOrigins()` returns unique origins allowed to call the API.
- It reads `process.env.CORS_ALLOWED_ORIGINS` or `process.env.FRONTEND_URL`.
- It also hardcodes a fallback: `glowexpert.vercel.app`.

`app.options('*', cors())` allows preflight.

Then `app.use(cors({ origin: fn, credentials: true }))`:
- If `origin` is missing => allow (common for curl/mobile).
- Allows localhost origins for dev.
- Otherwise only allows origins present in the computed allowlist.
- If not allowed, it triggers the error handler via `new Error('Not allowed by CORS')`.

---

### 4) JSON parsing + request logging
- `app.use(express.json({ limit: '1mb' }))`
- `app.use(morgan(...))`:
  - “combined” logging in production
  - “dev” otherwise

---

### 5) Rate limiting
Two layers:
1. Global cap on `/api`:
   - 300 requests per 15 minutes
2. Tighter cap on `/api/auth`:
   - 20 requests per 15 minutes

This complements per-account failed login locking implemented in `authController`.

---

### 6) Static serving
- Uploads:
  - creates `backend/src/uploads/` (relative to this file) if missing
  - serves it at `/uploads`
- Frontend static files:
  - serves the whole `frontend/` directory at the backend root
  - if the directory doesn’t exist, it logs a warning.
- Route `/` redirects to `/admin.html`.

---

### 7) Mounting route modules
The backend mounts route handlers under these prefixes:
- `/api/auth` → `authRoutes`
- `/api/products` → `productsRoutes`
- `/api/admin` → `adminProductRoutes`
- `/api/admin/influencers` → `adminInfluencerRoutes`
- `/api/admin/media` → `adminMediaRoutes`
- `/api/influencer` → `influencerRoutes`
- plus other app features under `/api`:
  - site settings, subscribers, orders, blog, health

A key safety net:
- after mounting, any unmatched `/api/*` returns JSON 404 `{ message: 'Not found' }`.

---

### 8) Error handling
A global error handler always returns JSON.
Special case:
- if error message is exactly `'Not allowed by CORS'`, it returns 403 with `{ message: 'Origin not allowed' }`.

---

## Startup tasks: DB schema checks + admin seeding

### 9) `start()` function
Before listening, it performs:
- a list of schema-check steps:
  - products
  - site settings
  - subscribers
  - orders
  - blog posts
  - reviews
  - users
  - influencers

For each, it tries to call a `ensure*Schema()` function from the model.
- If the schema check fails, it logs a warning and continues.

### 10) Optional admin seeding
It attempts to seed an admin user *only if*:
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.

It hashes the password with bcrypt.
Then calls `ensureAdminUser()` to insert/update the admin.

If not configured:
- it warns and skips seeding (explicitly avoiding a known default password).

---

## Listening behavior
- Chooses port from `process.env.PORT` / `BACKEND_PORT` / default `8081`.
- Handles `EADDRINUSE` by trying incrementing ports (up to 5 attempts).
- Adds graceful shutdown handlers for SIGTERM/SIGINT.

---

## Net effect
Clients can call the API using JWT authentication and receive JSON errors.
The server also self-heals at startup by ensuring required DB schemas exist.
The initial admin account is provisioned via env vars (safer than hardcoding defaults).

