## Authentication & JWT flow (backend + frontend)

This project uses **JWT Bearer tokens** for authentication.
The backend verifies the JWT and attaches the decoded payload as `req.user`.
Authorization (admin-only) then checks `req.user.role`.

---

## Backend pieces

### 1) JWT signing/verifying: backend/src/auth/jwt.js
- `signAccessToken(payload)`:
  - requires `process.env.JWT_SECRET`
  - builds a *safe payload* containing only:
    - `sub`, `email`, `name`, `role`
  - signs with `jwt.sign(..., { expiresIn })`

- `verifyAccessToken(token)`:
  - requires `process.env.JWT_SECRET`
  - verifies signature with algorithm whitelist:
    - `algorithms: ['HS256']`

**Why safe payload matters:** It prevents clients from smuggling extra claims into the token payload.

---

### 2) JWT middleware: backend/src/auth/middlewareAuth.js
This is the middleware used by admin/product/media routes.

Logic:
1. Read `req.headers.authorization`.
2. Require it to exist and start with case-insensitive `bearer `.
3. Extract the token part.
4. Verify JWT via `verifyAccessToken(token)`.
5. Put decoded token on `req.user`.
6. If anything fails:
   - return `401 { message: 'Access denied' }`.

Also provided:
- `requireAdmin(req,res,next)`:
  - `403 { message: 'Admin access required' }` if `req.user.role !== 'admin'`.

---

### 3) Login/register routes: backend/src/routes/authRoutes.js + controllers/authController.js
Routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/social`

OTP verification exists in the codebase (`authOtpController.js`), but **the route is commented out**, so “OTP login disabled”.

Controller logic highlights:

#### a) Register (register)
- Validates uniqueness by email.
- Hashes password with bcrypt.
- Creates a user with `role = 'customer'`.

Admins are not created through public registration.

#### b) Login (login)
- Accepts `cellphone` and/or email-like identifiers.
- Normalizes cellphone formats (notably converts `0XXXXXXXXXX` to `+44...`).
- Looks up user by:
  - email if it “looks like” an email
  - otherwise by cellphone
- If password hash is missing:
  - returns `401` with `Please use social login...`.
- If password comparison fails:
  - increments failed attempts
  - locks the account for 30 minutes after too many failures (threshold `> 6`).
- On success:
  - resets failed login counters
  - issues access token with `role` embedded.

#### c) Social login (socialAuth)
- Expects `{ token: idToken }` plus `{ email, name, sub: googleId }` in the body.
- If googleId exists, it reuses user; otherwise it links to an email user or creates a new one.
- Issues an access token the same way as login.

---

## Frontend pieces

### 1) API wrapper: frontend/src/lib/api.js
- Ensures you only call “probably API paths” (either relative paths starting with `/` or absolute URLs starting with `API_BASE`).
- Uses `fetch` with a timeout (AbortController).
- Parses response body:
  - JSON if `content-type` includes `application/json`
  - otherwise reads as text.
- If the response is non-OK:
  - when `requireAuth` is true and status is 401/403:
    - clears session
    - redirects to `login.html`
  - throws an Error with server message.

### 2) Auth token storage + headers: frontend/src/lib/auth.js
- Stores token and user in `localStorage`.
  - `admin_token` + `admin_user`
  - special handling for influencers with `AUTH_MODE_KEY`.
- `authHeaders()` reads token and attaches:
  - `Authorization: Bearer <token>`

**Important security note from code comments:**
Storing bearer tokens in `localStorage` is vulnerable to XSS.
A more secure fix is backend-side HttpOnly Secure cookies + CSRF protection.

---

## End-to-end flow (typical)
1. User logs in via `/api/auth/login`.
2. Backend returns `access_token` (JWT).
3. Frontend stores it in localStorage.
4. Frontend calls protected endpoints using `api(path, { requireAuth: true })`.
5. Backend middleware verifies JWT and sets `req.user`.
6. Admin routes additionally check `req.user.role === 'admin'`.

