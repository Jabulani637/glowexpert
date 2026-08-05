const { query, run } = require('../db');

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

const DEFAULT_SETTINGS = {
  brand_name: 'GlowExpert',
  hero_title: 'GlowExpert',
  hero_subtitle: 'Where luxury hair meets timeless elegance—now in golden glow. Discover our collection of handcrafted wigs and extensions made from the finest virgin human hair.',
  hero_cta_label: 'Explore Gold Collection',
  hero_video_url: '',
  featured_video_one_url: '',
  featured_video_one_title: 'Virgin Hair Collection',
  featured_video_one_description: '30" Black Curly HD Lace Wig - 100% Virgin Human Hair',
  featured_video_two_url: '',
  featured_video_two_title: 'Butterfly Cut Collection',
  featured_video_two_description: 'Glueless 6x5 Lace Wig - 24" Length - Use code TK20 for 20% off',
  newsletter_heading: 'Join The Glow List',
  newsletter_copy: 'Get product drops, restocks, and luxury hair updates first.',
  support_email: 'support@glowexpert.com',
  support_phone: '+27 00 000 0000',
  seo_default_title: 'GlowExpert | Luxury Virgin Human Hair Wigs & Extensions',
  seo_default_description: 'Discover premium handcrafted wigs and extensions made from the finest virgin human hair.',
  seo_keywords: 'luxury hair, virgin hair, HD lace wigs, glueless wigs, human hair extensions',
  brand_story_title: 'Our Heritage',
  brand_story_content: 'GlowExpert was founded on the principle that luxury hair should be an investment in confidence.',
  brand_values_json: '["Uncompromising Quality", "Ethical Sourcing", "Timeless Elegance"]'
};

async function ensureSiteSettingsSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    // Check if key exists first
    const { rows } = await query('SELECT 1 FROM site_settings WHERE key = ?', [key]);
    if (rows.length === 0) {
      await run(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES (?, ?, ?)`,
        [key, value, getCurrentTimestamp()]
      );
    }
  }
}

async function getAllSettings() {
  const { rows } = await query('SELECT key, value FROM site_settings ORDER BY key ASC');
  const data = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    const raw = row.value;
    const val = typeof raw === 'string' ? raw.trim() : raw;

    // Skip empty values
    if (val === '' || val === null || val === undefined) continue;

    // Skip legacy advert-media paths (files no longer exist)
    if (typeof val === 'string' && val.includes('advert-media')) continue;

    data[row.key] = String(raw);
  }

  return data;
}

async function updateSettings(patch = {}) {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined && value !== null);
  for (const [key, value] of entries) {
    // Check if key exists
    const { rows } = await query('SELECT 1 FROM site_settings WHERE key = ?', [key]);
    if (rows.length === 0) {
      // Insert
      await run(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES (?, ?, ?)`,
        [key, String(value), getCurrentTimestamp()]
      );
    } else {
      // Update
      await run(
        `UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?`,
        [String(value), getCurrentTimestamp(), key]
      );
    }
  }
  return getAllSettings();
}

module.exports = {
  DEFAULT_SETTINGS,
  ensureSiteSettingsSchema,
  getAllSettings,
  updateSettings
};
