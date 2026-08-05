const { uploadToSupabase, deleteFromSupabase } = require('../lib/supabaseStorage');
const { updateSettings, getAllSettings } = require('../models/SiteSettings');

const VIDEO_SLOT_MAP = {
  featured_one: 'featured_video_one_url',
  featured_two: 'featured_video_two_url'
};

async function uploadVideo(req, res) {
  try {
    const slot = req.params.slot;
    const settingsKey = VIDEO_SLOT_MAP[slot];

    if (!settingsKey) {
      return res.status(400).json({ success: false, message: 'Invalid video slot' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const ext = req.file.originalname.match(/\.\w+$/)?.[0] || '.mp4';
    const filename = `${slot}-${Date.now()}${ext}`;
    const publicUrl = await uploadToSupabase(req.file.buffer, 'videos', filename, req.file.mimetype);

    // Delete old video from Supabase if it was previously uploaded there
    const currentSettings = await getAllSettings();
    const oldUrl = currentSettings[settingsKey];
    if (oldUrl && oldUrl.includes('supabase')) {
      await deleteFromSupabase(oldUrl);
    }

    // Update settings with new video URL
    await updateSettings({ [settingsKey]: publicUrl });

    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('[adminVideo] upload error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteVideo(req, res) {
  try {
    const slot = req.params.slot;
    const settingsKey = VIDEO_SLOT_MAP[slot];

    if (!settingsKey) {
      return res.status(400).json({ success: false, message: 'Invalid video slot' });
    }

    const currentSettings = await getAllSettings();
    const oldUrl = currentSettings[settingsKey];
    if (oldUrl && oldUrl.includes('supabase')) {
      await deleteFromSupabase(oldUrl);
    }

    await updateSettings({ [settingsKey]: '' });

    return res.json({ success: true });
  } catch (err) {
    console.error('[adminVideo] delete error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { uploadVideo, deleteVideo };
