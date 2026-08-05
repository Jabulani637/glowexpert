import { $ } from '../../lib/dom.js';
import { api, setStatus } from './status.js';

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

const SLOT_MAP = {
  featuredVideoOneUpload: 'featured_one',
  featuredVideoTwoUpload: 'featured_two'
};

const BTN_MAP = {
  featuredVideoOneUpload: 'saveFeaturedOneBtn',
  featuredVideoTwoUpload: 'saveFeaturedTwoBtn'
};

const STATUS_MAP = {
  featuredVideoOneUpload: 'featuredVideoOneStatus',
  featuredVideoTwoUpload: 'featuredVideoTwoStatus'
};

function setButtonLoading(btnId, loading, originalText) {
  const btn = $(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = '<span class="btn-spinner"></span>Uploading...';
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = originalText;
  }
}

async function uploadVideoToServer(inputId) {
  const input = $(inputId);
  const statusEl = $(STATUS_MAP[inputId]);
  const btnId = BTN_MAP[inputId];
  const slot = SLOT_MAP[inputId];
  const file = input?.files && input.files[0];
  if (!file) return;

  if (file.size > MAX_VIDEO_SIZE) {
    if (statusEl) {
      statusEl.textContent = `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 200MB.`;
      statusEl.style.color = '#b00020';
    }
    input.value = '';
    return;
  }

  const originalBtnText = $(btnId)?.textContent || 'Save';
  setButtonLoading(btnId, true, originalBtnText);

  if (statusEl) {
    statusEl.textContent = `Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB...`;
    statusEl.style.color = '#000080';
  }

  try {
    const formData = new FormData();
    formData.append('video', file);

    const res = await fetch(`${window.__API_BASE || ''}/api/admin/videos/${slot}`, {
      method: 'POST',
      body: formData,
      headers: await (async () => {
        const { authHeaders } = await import('../../lib/session.js');
        return authHeaders();
      })()
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');

    if (statusEl) {
      statusEl.textContent = 'Video uploaded and saved successfully.';
      statusEl.style.color = '#008000';
    }
    setStatus('Video uploaded — it will appear on the homepage.');
    input.value = '';
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = 'Upload failed: ' + err.message;
      statusEl.style.color = '#b00020';
    }
    setStatus('Video upload failed.', true);
  } finally {
    setButtonLoading(btnId, false, originalBtnText);
  }
}

async function deleteVideoFromServer(inputId) {
  const input = $(inputId);
  const statusEl = $(STATUS_MAP[inputId]);
  const slot = SLOT_MAP[inputId];

  if (!confirm('Remove this video?')) return;

  try {
    await api(`/api/admin/videos/${slot}`, { method: 'DELETE' });
    if (input) input.value = '';
    if (statusEl) {
      statusEl.textContent = 'Video removed.';
      statusEl.style.color = '#008000';
    }
    setStatus('Video removed.');
  } catch (err) {
    setStatus('Error removing video: ' + err.message, true);
  }
}

export function setupVideoButtons() {
  $('saveFeaturedOneBtn')?.addEventListener('click', () => uploadVideoToServer('featuredVideoOneUpload'));
  $('saveFeaturedTwoBtn')?.addEventListener('click', () => uploadVideoToServer('featuredVideoTwoUpload'));

  $('deleteFeaturedOneBtn')?.addEventListener('click', () => deleteVideoFromServer('featuredVideoOneUpload'));
  $('deleteFeaturedTwoBtn')?.addEventListener('click', () => deleteVideoFromServer('featuredVideoTwoUpload'));

  $('clearVideosBtn')?.addEventListener('click', async () => {
    if (!confirm('Remove all uploaded videos?')) return;
    try {
      await Promise.all([
        api('/api/admin/videos/featured_one', { method: 'DELETE' }),
        api('/api/admin/videos/featured_two', { method: 'DELETE' })
      ]);
      if ($('featuredVideoOneUpload')) $('featuredVideoOneUpload').value = '';
      if ($('featuredVideoTwoUpload')) $('featuredVideoTwoUpload').value = '';
      if ($('featuredVideoOneStatus')) $('featuredVideoOneStatus').textContent = '';
      if ($('featuredVideoTwoStatus')) $('featuredVideoTwoStatus').textContent = '';
      setStatus('All videos cleared.');
    } catch (err) {
      setStatus('Error clearing videos: ' + err.message, true);
    }
  });
}
