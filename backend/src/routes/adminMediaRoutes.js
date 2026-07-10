/**
 * adminMediaRoutes.js
 * -------------------
 * Handles hero and featured video uploads from the admin dashboard.
 *
 * Files are held in memory by multer (memoryStorage) and streamed directly
 * to Supabase Storage. No local disk writes occur, so uploads survive
 * Render redeploys cleanly.
 */

'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');

const { updateSettings }   = require('../models/SiteSettings');
const { authMiddleware }   = require('../auth/middlewareAuth');
const { requireRoles }     = require('../auth/roles');
const { uploadToSupabase } = require('../lib/supabaseStorage');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRoles(['admin']));

// ---------------------------------------------------------------------------
// Multer – memory storage only (no local disk writes).
// 100 MB limit per video upload.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }  // 100 MB
});

// ---------------------------------------------------------------------------
// Internal helper – upload a single video buffer to Supabase Storage.
// ---------------------------------------------------------------------------
async function uploadVideo(file, settingsKey, res) {
  if (!file) {
    return res.status(400).json({ success: false, error: 'No video uploaded' });
  }

  const ext      = path.extname(file.originalname) || '.mp4';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  let videoUrl;
  try {
    videoUrl = await uploadToSupabase(file.buffer, 'videos', filename, file.mimetype);
  } catch (err) {
    console.error(`[adminMedia] Supabase upload error (${settingsKey}):`, err.message);
    return res.status(502).json({ success: false, error: 'Video upload to storage failed', detail: err.message });
  }

  try {
    await updateSettings({ [settingsKey]: videoUrl });
    return res.json({ success: true, videoUrl });
  } catch (err) {
    console.error(`[adminMedia] DB update error (${settingsKey}):`, err.message);
    return res.status(500).json({ success: false, error: 'Failed to save video URL', detail: err.message });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/media/video/hero
// ---------------------------------------------------------------------------
router.post('/video/hero', upload.single('video'), (req, res) =>
  uploadVideo(req.file, 'hero_video_url', res)
);

// ---------------------------------------------------------------------------
// POST /api/admin/media/video/featured-one
// ---------------------------------------------------------------------------
router.post('/video/featured-one', upload.single('video'), (req, res) =>
  uploadVideo(req.file, 'featured_video_one_url', res)
);

// ---------------------------------------------------------------------------
// POST /api/admin/media/video/featured-two
// ---------------------------------------------------------------------------
router.post('/video/featured-two', upload.single('video'), (req, res) =>
  uploadVideo(req.file, 'featured_video_two_url', res)
);

module.exports = router;
