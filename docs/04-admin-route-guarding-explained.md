## Admin route guarding (backend)

**Goal:** Only allow requests with a valid JWT whose `role` is exactly `admin`.

---

## Middleware layering
Different routes use different admin guards, but the common strategy is:
1) Authenticate the JWT (token validity)
2) Authorize by role

### 1) Authentication middleware
From `backend/src/auth/middlewareAuth.js`:
- Verifies JWT from `Authorization: Bearer ...`
- Populates `req.user`
- Rejects with 401 if missing/invalid

### 2) Role enforcement
Routes typically use `requireRoles(['admin'])` (from `backend/src/auth/roles.js`) or a `requireAdmin` helper.

In the route file we inspected:
- `backend/src/routes/adminProductRoutes.js`:
  - `router.use(authMiddleware);`
  - `router.use(requireRoles(['admin']));`

That means *all* endpoints in that router require admin.

---

## Example: adminProductRoutes.js

The router begins with:
- `router.use(authMiddleware)`
- `router.use(requireRoles(['admin']))`

Then it defines admin CRUD operations for products:
- `GET /products` → controller.adminList
- `GET /products/:id` → controller.adminGet
- `POST /products` → multer upload.array('images', 10) + controller.adminCreate
- `PUT /products/:id` → upload.array('images', 10) + controller.adminUpdate
- `DELETE /products/:id` → controller.adminDelete

Then it defines admin “ops” endpoints (settings/customers/orders/reviews).

**Effect of the guard:**
- If no Authorization header exists → 401
- If token is valid but role is not `admin` → 403
- If role is `admin` → request continues to multer/controller

---

## Test validation
`backend/src/test/adminAuthMiddleware.test.js` confirms the status codes for:
- missing bearer token (401)
- non-admin token (403)
- admin token (not 401/403)

So the guard is treated as a primary contract in this repo.

