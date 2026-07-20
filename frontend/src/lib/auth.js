// Shared admin session helpers.
// NOTE: storing bearer tokens in localStorage is inherently vulnerable to
// XSS. Backend-side mitigation (HttpOnly Secure cookies + CSRF protection)
// is the real fix, but we can still improve robustness/consistency here.

import { getClerk } from './clerk.js';

const USER_KEY = 'admin_user';

// Legacy constants retained only for compatibility with older session payloads.
// Admin auth is validated server-side via Clerk on protected routes.
const TOKEN_KEY = 'admin_token';
const INFLUENCER_TOKEN_KEY = 'influencer_token';
const AUTH_MODE_KEY = 'auth_mode';


function safeParseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}


export async function getToken() {
  const clerk = await getClerk();
  if (clerk.session) {
    return await clerk.session.getToken();
  }
  return '';
}


export function getUser() {
  return safeParseJson(localStorage.getItem(USER_KEY)) || null;
}

export async function isLoggedIn() {
  return Boolean(await getToken());
}

export function setSession(_token, user) {
  const safeUser = user && typeof user === 'object' ? user : null;
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
}


export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(INFLUENCER_TOKEN_KEY);
  localStorage.removeItem(AUTH_MODE_KEY);
}



export async function authHeaders(extra = {}) {

  // Avoid sending an empty token if not logged in.
  const token = await getToken();
  if (!token) return { ...extra };

  return {
    ...extra,
    Authorization: `Bearer ${token}`
  };
}

/** Call at the top of an admin-only page.
 * Performs a backend verification of the bearer token + admin role.
 * Redirects away if not authenticated.
 */
export async function requireLogin(redirectTo = 'index.html') {
  // Always re-validate admin access on page entry.
  // Do NOT trust localStorage alone; it may contain a stale/invalid token.

  // Import lazily to avoid circular deps in some bundlers.
  const { api } = await import('./api.js');

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

