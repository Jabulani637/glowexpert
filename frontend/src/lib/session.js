import { getClerk } from './clerk.js';

const USER_KEY = 'admin_user';

// Legacy constants retained only for compatibility with older session payloads.
const TOKEN_KEY = 'admin_token';
const INFLUENCER_TOKEN_KEY = 'influencer_token';
const AUTH_MODE_KEY = 'auth_mode';
const ADMIN_OTP_TOKEN_KEY = 'glowexpert_admin_token';

function safeParseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function getToken() {
  // Check for custom OTP JWT token first
  const otpToken = localStorage.getItem(ADMIN_OTP_TOKEN_KEY);
  if (otpToken) {
    try {
      const payload = JSON.parse(atob(otpToken.split('.')[1]));
      if (payload.role === 'admin' && payload.exp * 1000 > Date.now()) {
        return otpToken;
      } else {
        localStorage.removeItem(ADMIN_OTP_TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(ADMIN_OTP_TOKEN_KEY);
    }
  }

  // Fall back to Clerk session token
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
  localStorage.removeItem(ADMIN_OTP_TOKEN_KEY);
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
