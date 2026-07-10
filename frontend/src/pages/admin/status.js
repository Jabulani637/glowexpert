import { api as sharedApi } from '../../lib/api.js';
import { $ } from '../../lib/dom.js';

const statusEl = $('status');

export function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff0000' : '#000080';
}

/** Every admin API call requires auth by default (matching the previous
 * behavior); pass { requireAuth: false } to opt out if ever needed. */
export function api(path, options = {}) {
  return sharedApi(path, { requireAuth: true, ...options });
}
