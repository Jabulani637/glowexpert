// Shared fetch wrapper used across every page script.
// Centralizes auth header attachment, safe URL construction, timeouts,
// and consistent JSON/error parsing.

import { authHeaders, clearSession } from './auth.js';
import { API_BASE } from '../config.js';

function isProbablyApiPath(path) {
  // Require either a relative path (/something) or an already-safe absolute URL
  // on the same origin. This prevents accidental usage of external URLs.
  if (typeof path !== 'string') return false;
  if (path.startsWith('/')) return true;
  if (path.startsWith(API_BASE)) return true;
  return false;
}

async function parseBody(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Avoid trying to JSON.parse non-JSON responses (e.g. HTML errors).
    const text = await res.text();
    return text ? { message: text } : {};
  }

  try {
    return await res.json();
  } catch {
    return { message: 'Invalid JSON response' };
  }
}

/**
 * api(path, options)
 * - `options.requireAuth` attaches the bearer token and clears session+redirects
 *   on 401/403.
 */
export async function api(path, options = {}) {
  const { requireAuth = false, headers = {}, timeoutMs = 15000, ...rest } = options;

  if (!isProbablyApiPath(path)) {
    throw new Error('Invalid API path');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : ''}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(requireAuth ? authHeaders(headers) : headers)
      }
    });

    const payload = await parseBody(res);

    if (!res.ok) {
      if (requireAuth && (res.status === 401 || res.status === 403)) {
        clearSession();
        window.location.href = 'login.html';
      }
      // Avoid reflecting unexpected server messages that might not be user-safe.
      const message = typeof payload?.message === 'string' ? payload.message : 'Request failed';
      throw new Error(message);
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Resolves an /uploads/... relative path against the API host. */
export function normalizeAsset(url) {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

