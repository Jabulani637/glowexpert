const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createUser, findByEmail } = require('../models/User');
const { createInfluencer, listInfluencers } = require('../models/Influencer');
const { listInfluencerOrderStats } = require('../models/Order');

function normalizeCellphone(value = '') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/^00/, '+');

  if (/^0\d{10}$/.test(cleaned)) {
    return `+44${cleaned.slice(1)}`;
  }

  return cleaned || null;
}

async function adminCreateInfluencer(req, res) {
  const { name, email, cellphone, commission_rate } = req.body;

  // Prevent duplicate email users
  const existing = await findByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use' });
  }

  // Generate secure temporary password (random bytes -> base64)
  const tempPassword = crypto.randomBytes(9).toString('base64');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const normalizedCell = cellphone ? normalizeCellphone(cellphone) : null;

  // Create user with role 'influencer'
  const user = await createUser({
    name,
    email: email.toLowerCase(),
    cellphone: normalizedCell,
    passwordHash,
    role: 'influencer'
  });

  // Create influencer linked to the user
  const influencer = await createInfluencer({ userId: user.id, commission_rate });

  // Return influencer record and the plaintext temp password once
  return res.status(201).json({ success: true, influencer, temp_password: tempPassword });
}

async function adminListInfluencers(req, res) {
  try {
    const influencers = await listInfluencers();
    const stats = await listInfluencerOrderStats();
    const statsById = {};
    for (const s of stats) statsById[s.influencer_id] = s;

    const rows = influencers.map(i => ({
      ...i,
      order_stats: statsById[i.id] || { order_count: 0, total_sales: 0 }
    }));

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error listing influencers:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { adminCreateInfluencer, adminListInfluencers };
