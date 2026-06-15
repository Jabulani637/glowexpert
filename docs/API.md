# API Documentation (GlowExpert)

Base URL
- Default (local): `http://localhost:8081`
- All API routes are mounted under `/api` (except static frontend files and `/uploads`).

Authentication / Authorization
- JWT bearer token auth is required for all routes protected by `authMiddleware` / `requireAuth`.
- Admin-only routes require `admin` role (`requireRoles(['admin'])` or `requireAdmin`).
- Admin login uses OTP verification.

## Health

### `GET /api/health/health`
Response
- `200`:
```json
{ "ok": true }
```

## Auth

### `POST /api/auth/register`
Public

Request body
- `name` (string)
- `email` (string, unique)
- `cellphone` (string, optional)
- `password` (string)

Notes
- Role is hardcoded to `customer`.

Success
- `201`:
```json
{
  "message": "Registered successfully",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "cellphone": "...",
    "role": "customer"
  }
}
```

Errors
- `409` Email already in use
- `422` Validation failed

### `POST /api/auth/login`
Public

Request body
- `cellphone` (string) **or** email in the same field (code attempts to detect email by presence of `@` and `.`)
- `password` (string)

Behavior
- If `user.role !== 'admin'`: returns JWT immediately.
- If `user.role === 'admin'`: returns OTP challenge.

Success (customer)
- `200`:
```json
{
  "message": "Login successful",
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "cellphone": "...",
    "role": "customer"
  }
}
```

Success (admin OTP required)
- `200`:
```json
{
  "message": "OTP required",
  "otp_required": true,
  "otp": "123456",
  "token_type": null,
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "cellphone": "...",
    "role": "admin"
  }
}
```
> Note: OTP is returned in the response for demo purposes.

Errors
- `401` Invalid credentials
- `403` Account locked or admin-only constraints
- `503` Database temporarily unavailable
- `422` Validation failed

### `POST /api/auth/login/verify-otp`
Admin OTP verification

Request body
- `cellphone` (string)
- `otp` (string, 6 digits)

Success
- `200`:
```json
{
  "message": "OTP verified",
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "cellphone": "...",
    "role": "admin"
  }
}
```

Errors
- `422` Missing/invalid `cellphone` or OTP format
- `401` Invalid credentials / OTP expired / OTP mismatch
- `403` Admin access required

### `POST /api/auth/social`
Social login (demo / simplified)

Request body
- `token` (id token; **not verified** on backend)
- `email` (string)
- `name` (string)
- `sub` (string; Google user id)

Success
- `200`:
```json
{
  "message": "Social login successful",
  "access_token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "role": "customer" }
}
```

## Public Products

### `GET /api/products`
Query params
- `limit` (number, default 50; max 200)
- `offset` (number, default 0)

Success
- `200`:
```json
{ "data": [ /* products */ ] }
```

### `GET /api/products/:id`
Success
- `200`:
```json
{ "data": { /* product */ } }
```

Errors
- `404` Product not found

## Admin Products + Settings + Reviews
All routes below require JWT auth and `admin` role.

Router mount: `/api/admin` (from `server.js`)

### `GET /api/admin/products`
Query params: `limit`, `offset` (same constraints as public list)

### `GET /api/admin/products/:id`

### `POST /api/admin/products`
Consumes
- `multipart/form-data` (supports file uploads)

Uploads
- field: `images` (array, up to 10)

Notes
- Stored files are served under `/uploads`.
- This controller also accepts JSON fields and parses `attributes` and `gallery_urls` if passed as strings.

Success
- `201`:
```json
{ "data": { /* product */ } }
```

### `PUT /api/admin/products/:id`
Same as create.

### `DELETE /api/admin/products/:id`
- `204` on success

### `GET /api/admin/settings`

### `PUT /api/admin/settings`

### `GET /api/admin/subscribers`

### `GET /api/admin/orders`

### `GET /api/admin/customers`

### `GET /api/admin/reviews`
- Returns reviews with `onlyPublished: false`

### `POST /api/admin/reviews`

### `DELETE /api/admin/reviews/:id`
- `204` on success

## Blog

Router mount: `/api` for blog routes.

Public

### `GET /api/posts`

### `GET /api/posts/featured`

### `GET /api/posts/:slug`

Admin
- Admin router is mounted at `/api/admin/blog`
- Requires JWT auth and `admin` role.

### `GET /api/admin/blog`

### `GET /api/admin/blog/stats`

### `GET /api/admin/blog/:id`

### `POST /api/admin/blog`

### `PUT /api/admin/blog/:id`

### `DELETE /api/admin/blog/:id`

## Orders Checkout

### `POST /api/orders/checkout`
Public

Request body (validated by `checkoutSchema`)
- `customer_name`
- `customer_email`
- `customer_phone`
- `items` (structure defined by schema)
- optional `referral_code`

Behavior
- Creates order.
- If `referral_code` is provided and influencer exists, calculates commission:
  - `commission = order.total_amount * (commission_rate / 100)`

Success
- `201`:
```json
{
  "message": "Order placed successfully",
  "data": { /* order */ }
}
```

Errors
- `400` Checkout failed (uses `error.message` when thrown)
- `422` Validation failed

## Subscribers

### `POST /api/subscribers`
Public

Request body
- validated by `subscriberSchema`

Success
- `201`:
```json
{
  "message": "Subscribed successfully",
  "data": { /* subscriber */ }
}
```

Errors
- `422` Validation failed

## Site Settings

### `GET /api/settings`
Public

Success
- `200`:
```json
{ "data": { /* site settings */ } }
```

## Influencers (Admin)

Router mount: `/api/admin/influencers`

All routes require JWT auth and admin role.

### `POST /api/admin/influencers`
Request body
- `name`
- `email`
- `commission_rate`

Success
- `200`:
```json
{ "success": true, "influencer": { /* influencer */ } }
```

### `GET /api/admin/influencers/code/:code`
Success
- `200`:
```json
{ "success": true, "influencer": { /* influencer */ } }
```

Errors
- `404` Not found

## Static Files

### `GET /uploads/*`
- Uploaded images and gallery files are served from the backend `src/uploads` directory via `express.static`.

### Frontend
- Backend serves static frontend from `/frontend` directory if present.
- `/` redirects to `/admin.html`.

