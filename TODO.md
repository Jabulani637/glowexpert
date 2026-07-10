# TODO - Backend env placeholders cleanup

- [x] Inspect backend code sections that require env vars (jwt.js, db.js, supabaseStorage.js, server.js).
- [x] Create `backend/.env.example` with safe non-breaking placeholder values for all required keys.
- [ ] (Blocked by tooling) Update the real `backend/.env` file placeholders in-place.
- [ ] Add a runtime env validator (optional) to fail fast with a clear message when required env vars are missing.
- [ ] Run backend start/test to confirm no missing env issues.

