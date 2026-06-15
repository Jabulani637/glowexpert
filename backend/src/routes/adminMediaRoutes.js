// backend/src/routes/adminMediaRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { updateSettings } = require('../models/SiteSettings');

const router = express.Router();

// Store uploads in the existing uploads directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Keep original filename but ensure uniqueness
    const ext = path.extname(file.originalname);
    const name = `advert${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

// Admin uploads advert video (single file)
router.post('/advert/video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No video uploaded' });
  }
  // Build relative URL for serving static files
  const videoUrl = `/uploads/${req.file.filename}`;
  try {
    await updateSettings({ hero_video_url: videoUrl });
    return res.json({ success: true, videoUrl });
  } catch (err) {
    console.error('Error updating hero video URL:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
