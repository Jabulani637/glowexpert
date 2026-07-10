// Shared DOM helpers used across every page script.

/** Shorthand for document.getElementById. */
export const $ = (id) => document.getElementById(id);

/**
 * Escapes a value for safe insertion into innerHTML.
 * (The previous per-file copies of this function had a bug where '&', '<',
 * '>', and '"' were replaced with themselves — a no-op that left markup
 * unescaped. Fixed here since every page now shares this one copy.)
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
