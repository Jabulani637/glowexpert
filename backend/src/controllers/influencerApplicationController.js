const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createUser, findByEmail } = require('../models/User');
const { createInfluencer } = require('../models/Influencer');
const {
  listInfluencerApplications,
  updateApplicationStatus
} = require('../models/InfluencerApplication');

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

async function adminListApplications(req, res) {
  try {
    const applications = await listInfluencerApplications();
    return res.json({ success: true, data: applications });
  } catch (err) {
    console.error('Error listing influencer applications:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function adminApproveApplication(req, res) {
  try {
    const { id } = req.params;
    const { commission_rate } = req.body;

    const applications = await listInfluencerApplications();
    const application = applications.find(a => a.id === id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Application already ${application.status}` });
    }

    const existing = await findByEmail(application.email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }

    const tempPassword = crypto.randomBytes(9).toString('base64');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await createUser({
      name: application.name,
      email: application.email.toLowerCase(),
      cellphone: application.phone ? normalizeCellphone(application.phone) : null,
      passwordHash,
      role: 'influencer'
    });

    const influencer = await createInfluencer({
      userId: user.id,
      commission_rate: commission_rate || 5.0
    });

    await updateApplicationStatus(id, 'approved');

    return res.json({
      success: true,
      influencer,
      temp_password: tempPassword
    });
  } catch (err) {
    console.error('Error approving influencer application:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function adminRejectApplication(req, res) {
  try {
    const { id } = req.params;

    const applications = await listInfluencerApplications();
    const application = applications.find(a => a.id === id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Application already ${application.status}` });
    }

    await updateApplicationStatus(id, 'rejected');

    return res.json({ success: true });
  } catch (err) {
    console.error('Error rejecting influencer application:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  adminListApplications,
  adminApproveApplication,
  adminRejectApplication
};
