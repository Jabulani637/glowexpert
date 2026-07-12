# TODO - glowexpert improvements (mobile + hero media + maintainability)

## 1. Responsive & admin desktop-only
- [x] Verify mobile breakpoints in `frontend/src/styles/luxury.css` and ensure storefront layouts behave on <720px.
- [x] Add “desktop-only” guard for admin in `frontend/src/styles/admin-retro.css` (e.g. message / disable small-screen layouts).
- [x] Add desktop-only message container in `frontend/admin.html`.


- [ ] Remove key inline styles from `frontend/index.html` and replace with CSS classes.


## 2. Frontend code quality
- [ ] Reduce empty catch blocks in `frontend/src/pages/home/index.js` and improve logging in dev.
- [ ] Ensure hero/featured video loads are robust without redundant reload calls.

## 3. DB-backed hero background items (images/videos) with animation
- [x] Extend `backend/src/models/SiteSettings.js` with `hero_background_items_json` default.


- [ ] Add admin upload endpoints for hero background images/videos if not already covered by `adminMediaRoutes.js`.
- [ ] Update admin UI (Website Content section) to manage multiple hero background items (add, reorder, enable/disable).
- [ ] Implement a background rotator on storefront that supports animated slide/fade between items.
- [ ] Respect `prefers-reduced-motion`.

## 4. Tests / verification
- [ ] Run backend tests.
- [ ] Smoke-test: home mobile layout, cart panel, hero background rotation.
- [ ] Smoke-test: admin works on desktop and is blocked/notice shown on mobile widths.

