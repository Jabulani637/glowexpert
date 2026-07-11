# TODO - GlowExpert production readiness (blackboxai)

## Security & Auth (priority)
- [x] Unify JWT middleware: use `backend/src/auth/middlewareAuth.js` instead of `backend/src/middleware/auth.js` in active routers.
- [x] Standardize `req.user` payload shape across middlewares (role/email/sub/name/id) by ensuring routes use the same JWT middleware.
- [x] Update any remaining routes (or tests) using the older middleware to the unified one.


## Social auth correctness
- [x] Update `backend/src/controllers/authController.js` `socialAuth` to verify provider tokens server-side (do not trust frontend-provided idToken/claims).


## DB schema + production behavior
- [ ] Remove runtime DDL from `backend/src/models/User.js` (`ensureUserSchema`) in production.
- [ ] Remove/disable fallback-store behavior in production (fail fast on DB errors).
- [ ] Ensure migrations are run during deployment (document in README / scripts).

## Security headers / CSP
- [ ] Enable helmet security headers for production; remove `contentSecurityPolicy: false` or replace with tuned CSP.

## Frontend session security
- [ ] Replace localStorage token storage (`frontend/src/lib/auth.js`) with secure cookie-based approach (HttpOnly Secure + CSRF) OR document risk and apply compensating protections.
- [ ] If cookies are implemented, update fetch wrapper `frontend/src/lib/api.js` to use `credentials: 'include'`.

## Request validation & errors
- [ ] Verify each route uses Zod validation consistently.
- [ ] Standardize JSON error responses.

## Ops / logging / tests
- [ ] Add a logger (pino/winston) and request-id middleware.
- [ ] Add production smoke test script.
- [ ] Run/verify `npm test` (backend) and lints/build if present.

