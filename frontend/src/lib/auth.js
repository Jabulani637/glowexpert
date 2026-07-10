// Shared admin session helpers: centralizes localStorage access and the
// redirect rules that used to be duplicated across admin.js and login.js.

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

function normalizeSessionStorageKey() {
  return localStorage.getItem('auth_mode') === 'influencer' ? 'influencer_token' : TOKEN_KEY;
}

export function getToken() {
  return localStorage.getItem(normalizeSessionStorageKey()) || localStorage.getItem(TOKEN_KEY) || '';
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token || '');
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
  if (user?.role === 'influencer') {
    localStorage.setItem('auth_mode', 'influencer');
    localStorage.setItem('influencer_token', token || '');
  } else {
    localStorage.setItem('auth_mode', 'admin');
    localStorage.removeItem('influencer_token');
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('influencer_token');
  localStorage.removeItem('auth_mode');
}

export function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${getToken()}`
  };
}

/** Call at the top of an admin-only page. Redirects away if not logged in. */
export function requireLogin(redirectTo = 'login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

/** Call at the top of the login page. Redirects away if already logged in. */
export function redirectIfLoggedIn(redirectTo = 'admin.html') {
  if (isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

export function logout(redirectTo = 'login.html') {
  clearSession();
  window.location.href = redirectTo;
}
