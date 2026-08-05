// Resolves a video src URL. Videos are now stored in Supabase Storage
// and served via the settings API. This function simply returns the
// URL provided (kept as a wrapper for future extensibility).

export async function resolveVideoSrc(_key, fallbackUrl) {
  return fallbackUrl || '';
}
