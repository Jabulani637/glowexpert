// Read API base from environment variable (Vite) or fall back to the same origin.
// This prevents production builds from accidentally calling localhost.
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  window.__API_BASE__ ||
  window.location.origin;

// Preserve global contract for existing JS files
window.__API_BASE__ = API_BASE;


