// Reads video blobs the admin dashboard may have saved locally to
// IndexedDB (see src/pages/admin/video-storage.js, which owns writes to
// this same 'glowexpert_videos' store) and resolves a usable <video> src,
// falling back to the API-provided URL when nothing is stored locally.

function openVideoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('glowexpert_videos', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('videos');
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getVideoBlob(key) {
  return openVideoDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readonly');
        const req = tx.objectStore('videos').get(key);
        req.onsuccess = (e) => resolve(e.target.result || null);
        req.onerror = (e) => reject(e.target.error);
        tx.oncomplete = () => db.close();
      })
  );
}

const objectURLCache = {};

export async function resolveVideoSrc(key, fallbackUrl) {
  try {
    const blob = await getVideoBlob(key);
    if (blob) {
      if (objectURLCache[key]) URL.revokeObjectURL(objectURLCache[key]);
      objectURLCache[key] = URL.createObjectURL(blob);
      return objectURLCache[key];
    }
  } catch {
    // IndexedDB unavailable - use fallback
  }
  return fallbackUrl;
}
