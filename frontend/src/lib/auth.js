// Shared admin session helpers.
// NOTE: storing bearer tokens in localStorage is inherently vulnerable to
// XSS. Backend-side mitigation (HttpOnly Secure cookies + CSRF protection)
// is the real fix, but we can still improve robustness/consistency here.

import { api } from './api.js';
import { clearSession, isLoggedIn } from './session.js';

export {
  getToken,
  getUser,
  isLoggedIn,
  setSession,
  clearSession,
  authHeaders
} from './session.js';

/** Call at the top of an admin-only page.
 * Performs a backend verification of the bearer token + admin role.
 * Redirects away if not authenticated.
 */
export async function requireLogin(redirectTo = 'index.html') {
  // Always re-validate admin access on page entry.
  // Do NOT trust localStorage alone; it may contain a stale/invalid token.

  try {
    // Force backend validation: verifies token + admin role.
    await api('/api/admin/me', { method: 'GET', requireAuth: true });
  } catch (_err) {
    // `api()` clears session + redirects on 401/403 when requireAuth=true,
    // but enforce a defensive redirect here as well.
    window.location.href = redirectTo;
  }
}



/** Call at the top of the login page. Redirects away if already logged in. */
export async function redirectIfLoggedIn(redirectTo = 'admin.html') {
  if (await isLoggedIn()) window.location.href = redirectTo;
}

export function logout(redirectTo = 'index.html') {
  clearSession();
  window.location.href = redirectTo;
}
