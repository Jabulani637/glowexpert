// Shared admin session helpers.
// NOTE: storing bearer tokens in localStorage is inherently vulnerable to
// XSS. Backend-side mitigation (HttpOnly Secure cookies + CSRF protection)
// is the real fix, but we can still improve robustness/consistency here.

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';
const INFLUENCER_TOKEN_KEY = 'influencer_token';
const AUTH_MODE_KEY = 'auth_mode';

function normalizeTokenKey() {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  return mode === 'influencer' ? INFLUENCER_TOKEN_KEY : TOKEN_KEY;
}

function safeParseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getToken() {
  // Prefer mode-specific token; fall back for backward compatibility.
  return (
    localStorage.getItem(normalizeTokenKey()) ||
    localStorage.getItem(TOKEN_KEY) ||
    ''
  );
}

export function getUser() {
  return safeParseJson(localStorage.getItem(USER_KEY)) || null;
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function setSession(token, user) {
  const safeToken = typeof token === 'string' ? token : '';
  const safeUser = user && typeof user === 'object' ? user : null;

  localStorage.setItem(TOKEN_KEY, safeToken);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));

  if (safeUser?.role === 'influencer') {
    localStorage.setItem(AUTH_MODE_KEY, 'influencer');
    localStorage.setItem(INFLUENCER_TOKEN_KEY, safeToken);
  } else {
    localStorage.setItem(AUTH_MODE_KEY, 'admin');
    localStorage.removeItem(INFLUENCER_TOKEN_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(INFLUENCER_TOKEN_KEY);
  localStorage.removeItem(AUTH_MODE_KEY);
}

export function authHeaders(extra = {}) {
  // Avoid sending an empty token if not logged in.
  const token = getToken();
  if (!token) return { ...extra };

  return {
    ...extra,
    Authorization: `Bearer ${token}`
  };
}

/** Call at the top of an admin-only page. Redirects away if not logged in. */
export function requireLogin(redirectTo = 'login.html') {
  if (!isLoggedIn()) window.location.href = redirectTo;
}

/** Call at the top of the login page. Redirects away if already logged in. */
export function redirectIfLoggedIn(redirectTo = 'admin.html') {
  if (isLoggedIn()) window.location.href = redirectTo;
}

export function logout(redirectTo = 'login.html') {
  clearSession();
  window.location.href = redirectTo;
}

