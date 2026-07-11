## adminAuthMiddleware.test.js (active editor)

**Purpose:**
This test verifies that the backend’s *admin-only* route guard behaves correctly depending on the presence and contents of a JWT.

Specifically it checks that:
- missing token => **401 Unauthorized**
- non-admin token => **403 Forbidden**
- admin token => request does **not** return 401/403 (so it can reach the route logic)

---

## How the test works

### JWT helper functions
The file defines:
- `signAdminToken()`
- `signCustomerToken()`

Each helper uses `jsonwebtoken.sign()` with:
- `process.env.JWT_SECRET`
- HS256
- `expiresIn: '1h'`

The important part is the payload field:
- admin token includes `role: 'admin'`
- customer token includes `role: 'customer'`

### Creating the Express app under test
Each test creates a server app:
- `const app = createAppForTests();`

`createAppForTests()` (imported from `./helpers/testServer`) is responsible for wiring the Express routes and middlewares used by the test (including the admin route protection).

### Calling an admin-protected route
All tests call the same endpoint:
- `GET /api/admin/products`

The difference between tests is whether `Authorization: Bearer <token>` is included and what `role` is inside the JWT.

---

## Test cases

### 1) Missing bearer token => 401
- request made without setting `Authorization`
- expects `res.status === 401`

This validates the middleware’s “authentication required” branch.

### 2) Non-admin token => 403
- uses `signCustomerToken()`
- sets header: `Authorization: Bearer ${token}`
- expects `res.status === 403`

This validates the “authenticated but not authorized” branch (role check).

### 3) Admin token => not 401/403
- uses `signAdminToken()`
- expects the response status is neither 401 nor 403.

The test notes it may still fail later due to mocked models/DB—meaning authorization is being tested, not the full controller behavior.

The test also performs a `GET /__noop__` to reduce Jest open-handle warnings.

---

## What this test implies about the codebase
The backend admin guard likely follows this contract:
1. Reject requests without a valid Bearer JWT.
2. If JWT is valid, accept only if `req.user.role === 'admin'`.

