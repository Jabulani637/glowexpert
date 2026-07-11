## Frontend client-side auth & API behavior

This section explains how the frontend attaches tokens and reacts to auth failures.

---

## 1) API configuration: `frontend/src/config.js`
`API_BASE` is computed as:
- `import.meta.env.VITE_API_BASE` OR
- `window.__API_BASE__` OR
- `window.location.origin`

It then sets `window.__API_BASE__ = API_BASE` so older/non-module scripts can still discover the base URL.

---

## 2) Shared API wrapper: `frontend/src/lib/api.js`
The exported `api(path, options)` function centralizes:
- safe URL building
- timeouts
- JSON/text parsing
- auth failure handling

### Path safety guard
`isProbablyApiPath(path)` only allows:
- relative paths starting with `/`, or
- absolute URLs that start with `API_BASE`.

If the input path doesn’t match these patterns, `api()` throws `Error('Invalid API path')`.

### Timeout handling
It uses:
- `AbortController`
- a timer (`timeoutMs`, default `15000`)

If the request exceeds the timeout, the controller aborts the fetch.

### Consistent body parsing
`parseBody(res)` checks `content-type`:
- if it’s not JSON, it reads `res.text()` and returns `{ message: text }` (or `{}`)
- if it is JSON, it attempts `res.json()`; on JSON parse failure it returns `{ message: 'Invalid JSON response' }`

### Auth failure behavior
If the request fails and `options.requireAuth === true`, then:
- on HTTP `401` or `403`:
  1. `clearSession()` removes tokens/user from `localStorage`
  2. browser navigates to `login.html`

### Error message surfaced
For non-OK responses it throws an `Error(message)` where `message` comes from `payload.message` if present.

---

## 3) Session/token storage: `frontend/src/lib/auth.js`
This module manages auth state in `localStorage`.

### Token keys
- Default/admin mode:
  - token: `admin_token`
  - user: `admin_user`
- Influencer mode:
  - token: `influencer_token`

It also stores `AUTH_MODE_KEY` to decide which token key is “active”.

### `setSession(token, user)`
- stores `admin_token` and `admin_user`
- if the stored user role is `influencer`, it also sets `AUTH_MODE_KEY` to `influencer` and copies token into `influencer_token`

### `authHeaders(extra)`
- reads the current token via `getToken()`
- if token exists, adds:
  - `Authorization: Bearer <token>`
- otherwise it returns headers without Authorization.

### Redirect helpers
- `requireLogin()` sends user to `login.html` when not logged in.
- `redirectIfLoggedIn()` sends already-logged-in users to `admin.html`.

### Logout
`logout()` clears session and redirects.

---

## Security note from code comments
The frontend explicitly warns that storing Bearer tokens in `localStorage` is vulnerable to XSS.
The code notes the real mitigation is backend-side HttpOnly + Secure cookies and CSRF protection.

---

## Net effect in the app
1. After login, the JWT is stored client-side.
2. Pages call `api(..., { requireAuth: true })`.
3. `api()` injects `Authorization: Bearer ...`.
4. If token is missing/expired/invalid, backend returns 401/403.
5. Frontend clears session and redirects to `login.html`.

