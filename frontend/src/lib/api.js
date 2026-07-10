// Shared fetch wrapper used across every page script. Replaces the four
// near-identical copies that used to live in home.js, admin.js, blog.js,
// and login.js.

import { authHeaders, clearSession } from './auth.js';

export const API_BASE = import.meta.env.VITE_API_BASE || window.__API_BASE__ || window.location.origin;

async function parseBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * api(path, options)
 * - `options.requireAuth` (default false) attaches the admin bearer token
 *   and, on a 401/403 response, clears the stored session and redirects
 *   to login.html. Public storefront/blog/login calls should leave this
 *   unset; admin calls should pass `requireAuth: true`.
 */
export async function api(path, options = {}) {
  const { requireAuth = false, headers = {}, ...rest } = options;

  const res = await fetch(API_BASE + path, {
    ...rest,
    headers: requireAuth ? authHeaders(headers) : headers
  });

  const json = await parseBody(res);

  if (!res.ok) {
    if (requireAuth && (res.status === 401 || res.status === 403)) {
      clearSession();
      window.location.href = 'login.html';
    }
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

/** Resolves an /uploads/... relative path against the API host. */
export function normalizeAsset(url) {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}
