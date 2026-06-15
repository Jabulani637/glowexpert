const { getAllSettings } = require('../models/SiteSettings');

async function getSettings(req, res) {
  const data = await getAllSettings();
  return res.json({ data });
}

module.exports = { getSettings };
