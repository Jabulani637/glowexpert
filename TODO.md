# TODO - Clerk admin authentication + code quality/security review

## Clerk frontend multi-page integration
- [x] Create `frontend/src/lib/clerk.js` with shared lazy loader + `getClerk()` helper.
- [x] Update `frontend/login.html` to replace login form markup with `<div id="sign-in"></div>`.
- [x] Update `frontend/src/pages/login/index.js` to use Clerk `mountSignIn()` and redirect by `publicMetadata.role`.
- [x] Update `frontend/admin.html` to add mount point `<div id="user-button"></div>`.
- [x] Update `frontend/src/pages/admin/index.js` to guard with Clerk user role + mount UserButton.
- [x] Remove legacy admin logout click handler from admin page.
- [x] Fix remaining runtime reference to legacy `getUser()` in admin loader.
- [ ] Ensure Clerk frontend env is set/validated (e.g. `VITE_CLERK_PUBLISHABLE_KEY`).

## Backend Clerk protection (NOT YET IMPLEMENTED)
- [ ] Add `clerkMiddleware()` to `backend/src/server.js`.
- [ ] Rewrite `backend/src/routes/adminAuthRoutes.js` to use Clerk auth verification + role check (admin).
- [ ] Update all admin-only routes (products/blog/media/etc) to use `requireAuth()` + role check from Clerk.
- [ ] Add Clerk env vars to `backend/.env` (e.g. `CLERK_SECRET_KEY`) and frontend envs.

## Code quality & maintainability review
- [ ] Tidy up `frontend/src/pages/admin/index.js` imports (remove unused `refreshVideoStorageStatus` if applicable).
- [ ] Ensure consistent boot order: auth guard/mount should complete before API calls.

## Security review
- [ ] Verify backend rejects non-admins for every `/api/admin/*` endpoint.
- [ ] Ensure no JWT-based auth endpoints remain reachable for admin when Clerk is intended replacement.
- [ ] Review JWT secret verification error handling + algorithm allowlists (existing code).

