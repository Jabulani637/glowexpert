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
  hero_video_url: './advert-media/Hair%20tea%20%20Hair%2030%E2%80%9D%20Black%20Curly%2013x4%20HD%20lace%20100%25%20Virgin%20human%20hair%20%20link%20in%20bio.mp4',
  featured_video_one_url: './advert-media/Hair%20tea%20%20Hair%2030%E2%80%9D%20Black%20Curly%2013x4%20HD%20lace%20100%25%20Virgin%20human%20hair%20%20link%20in%20bio.mp4',
  featured_video_one_title: 'Virgin Hair Collection',
  featured_video_one_description: '30" Black Curly HD Lace Wig - 100% Virgin Human Hair',
  featured_video_two_url: './advert-media/Slay%20every%20day%20with%20a%20wig%20that%20matches%20your%20energyHair%20info-%20%20Glueless%20butterfly%20cut%20wig%206x5%20lace%2024inch%20in%20my%20bio.%20Excl%20discount%20code%20%EF%AC%93%EF%AC%8B%EF%AC%B2%EF%AC%B0%20for%2020%25%20off.mp4',
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
    data[row.key] = row.value;
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
