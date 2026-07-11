// Read API base from environment variable (Vite) or fall back to the same origin.
// This prevents production builds from accidentally calling localhost.

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  window.__API_BASE__ ||
  window.location.origin;

// Preserve global contract for existing JS files that may still rely on it.
window.__API_BASE__ = API_BASE;



