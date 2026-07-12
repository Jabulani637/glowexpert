import { $ } from '../../lib/dom.js';
import { api, setStatus } from './status.js';


const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

const VIDEO_KEYS = {
  heroVideoUpload: 'hero',
  featuredVideoOneUpload: 'featured_one',
  featuredVideoTwoUpload: 'featured_two'
};

const STATUS_LABELS = { hero: 'Hero', featured_one: 'Featured 1', featured_two: 'Featured 2' };

// "storedXStatus" elements show the current saved state on page load;
// "XVideoStatus" elements show live feedback during/after an upload or
// delete action. These are two distinct sets of elements in admin.html,
// not duplicates of each other.
const STORED_STATUS_IDS = {
  hero: 'storedHeroStatus',
  featured_one: 'storedFeaturedOneStatus',
  featured_two: 'storedFeaturedTwoStatus'
};

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

function saveVideoBlob(key, blob) {
  return openVideoDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').put(blob, key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = (e) => reject(e.target.error);
      })
  );
}

function deleteVideoBlob(key) {
  return openVideoDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').delete(key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = (e) => reject(e.target.error);
      })
  );
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

export async function refreshVideoStorageStatus() {
  for (const key of Object.keys(STATUS_LABELS)) {
    try {
      const blob = await getVideoBlob(key);
      const el = $(STORED_STATUS_IDS[key]);
      if (!el) continue;

      el.innerHTML = blob
        ? `<span class="muted">${STATUS_LABELS[key]}:</span> <span style="color:#008000;">✓ Saved (${(blob.size / 1024 / 1024).toFixed(1)}MB)</span>`
        : `<span class="muted">${STATUS_LABELS[key]}:</span> <span style="color:#ff0000;">None</span>`;
    } catch {
      // ignore - IndexedDB unavailable
    }
  }
}

async function uploadVideoToIDB(inputId, statusId) {
  const input = $(inputId);
  const statusElLocal = $(statusId);
  const file = input?.files && input.files[0];
  if (!file) return;

  if (file.size > MAX_VIDEO_SIZE) {
    if (statusElLocal) {
      statusElLocal.textContent = `❌ File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 200MB.`;
      statusElLocal.style.color = '#b00020';
    }
    input.value = '';
    return;
  }

  if (statusElLocal) {
    statusElLocal.textContent = '⏳ Saving to browser storage…';
    statusElLocal.style.color = '#000080';
  }

  try {
    const key = VIDEO_KEYS[inputId];
    await saveVideoBlob(key, file);

    if (statusElLocal) {
      statusElLocal.textContent = `✅ Saved (${(file.size / 1024 / 1024).toFixed(2)}MB). Refresh the homepage to apply.`;
      statusElLocal.style.color = '#008000';
    }

    setStatus('Video saved — refresh the homepage to see it.');
    await refreshVideoStorageStatus();
  } catch (err) {
    if (statusElLocal) {
      statusElLocal.textContent = '❌ Error saving video: ' + err.message;
      statusElLocal.style.color = '#b00020';
    }
  }
}

async function uploadVideoToSupabaseAndIDB(inputId, statusId, endpoint) {
  const input = $(inputId);
  const statusElLocal = $(statusId);
  const file = input?.files && input.files[0];
  if (!file) return;

  if (file.size > MAX_VIDEO_SIZE) {
    if (statusElLocal) {
      statusElLocal.textContent = `❌ File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 200MB.`;
      statusElLocal.style.color = '#b00020';
    }
    input.value = '';
    return;
  }

  if (statusElLocal) {
    statusElLocal.textContent = '⏳ Uploading to server…';
    statusElLocal.style.color = '#000080';
  }

  try {
    const formData = new FormData();
    // backend multer expects field name "video"
    formData.append('video', file);

    await api(endpoint, { method: 'POST', body: formData });

    if (statusElLocal) {
      statusElLocal.textContent = '✅ Uploaded. Saving locally…';
      statusElLocal.style.color = '#008000';
    }

    // preserve existing behavior (homepage override from IndexedDB)
    await uploadVideoToIDB(inputId, statusId);

    setStatus('Video uploaded and saved.');
  } catch (err) {
    const msg = err?.message || err;
    if (statusElLocal) {
      statusElLocal.textContent = '❌ Upload failed: ' + msg;
      statusElLocal.style.color = '#b00020';
    }
    setStatus('Video upload failed.', true);
  }
}

async function deleteIndividualVideo(key, inputId, statusId) {
  if (!confirm('Remove this video and revert to API default?')) return;
  try {
    await deleteVideoBlob(key);
    if ($(inputId)) $(inputId).value = '';
    if ($(statusId)) $(statusId).textContent = 'Removed. Homepage will use API default.';
    await refreshVideoStorageStatus();
    setStatus('Video removed.');
  } catch (err) {
    setStatus('Error removing video: ' + err.message, true);
  }
}

export function setupVideoButtons() {

  // Also upload to backend so the videos persist for all users (Supabase storage)
  // in addition to saving locally in IndexedDB for instant overrides.
  $('saveHeroBtn')?.addEventListener('click', () =>
    uploadVideoToSupabaseAndIDB('heroVideoUpload', 'heroVideoStatus', '/api/admin/media/video/hero', 'hero')
  );
  $('deleteHeroBtn')?.addEventListener('click', () => deleteIndividualVideo('hero', 'heroVideoUpload', 'heroVideoStatus'));

  $('saveFeaturedOneBtn')?.addEventListener('click', () =>
    uploadVideoToSupabaseAndIDB(
      'featuredVideoOneUpload',
      'featuredVideoOneStatus',
      '/api/admin/media/video/featured-one',
      'featured_one'
    )
  );
  $('deleteFeaturedOneBtn')?.addEventListener('click', () =>
    deleteIndividualVideo('featured_one', 'featuredVideoOneUpload', 'featuredVideoOneStatus')
  );

  $('saveFeaturedTwoBtn')?.addEventListener('click', () =>
    uploadVideoToSupabaseAndIDB(
      'featuredVideoTwoUpload',
      'featuredVideoTwoStatus',
      '/api/admin/media/video/featured-two',
      'featured_two'
    )
  );
  $('deleteFeaturedTwoBtn')?.addEventListener('click', () =>
    deleteIndividualVideo('featured_two', 'featuredVideoTwoUpload', 'featuredVideoTwoStatus')
  );


  $('clearVideosBtn')?.addEventListener('click', async () => {
    if (!confirm('Remove all locally stored videos and revert to API defaults?')) return;
    try {
      await Promise.all([deleteVideoBlob('hero'), deleteVideoBlob('featured_one'), deleteVideoBlob('featured_two')]);
      if ($('heroVideoUpload')) $('heroVideoUpload').value = '';
      if ($('featuredVideoOneUpload')) $('featuredVideoOneUpload').value = '';
      if ($('featuredVideoTwoUpload')) $('featuredVideoTwoUpload').value = '';
      if ($('heroVideoStatus')) $('heroVideoStatus').textContent = '';
      if ($('featuredVideoOneStatus')) $('featuredVideoOneStatus').textContent = '';
      if ($('featuredVideoTwoStatus')) $('featuredVideoTwoStatus').textContent = '';
      await refreshVideoStorageStatus();
      setStatus('All locally stored videos cleared. Homepage will now use API defaults.');
    } catch (err) {
      setStatus('Error clearing videos: ' + err.message, true);
    }
  });
}
