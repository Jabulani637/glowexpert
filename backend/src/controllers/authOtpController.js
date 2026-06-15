const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { findByCellphone, findByEmail } = require('../models/User');
const { signAccessToken } = require('../auth/jwt');

function normalizeCellphone(value = '') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/^00/, '+');

  if (/^0\d{10}$/.test(cleaned)) {
    return `+44${cleaned.slice(1)}`;
  }
  return cleaned;
}

function isValidOtp(otp) {
  return typeof otp === 'string' && /^\d{6}$/.test(otp);
}

async function verifyOtpLogin(req, res) {
  const { cellphone, otp } = req.body;
  const identifier = String(cellphone || '').trim();
  if (!identifier || !isValidOtp(String(otp || ''))) {
    return res.status(422).json({ message: 'cellphone and 6-digit otp are required' });
  }

  const looksLikeEmail = /@/.test(identifier) && /\./.test(identifier);
  const normalizedCell = normalizeCellphone(identifier);

  const user = looksLikeEmail
    ? await findByEmail(identifier.toLowerCase())
    : await findByCellphone(normalizedCell);

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

  if (!user.otp_code || !user.otp_expires_at) {
    return res.status(401).json({ message: 'OTP expired or not requested' });
  }

  const now = new Date();
  const expiresAt = new Date(user.otp_expires_at);
  if (expiresAt <= now) {
    return res.status(401).json({ message: 'OTP expired' });
  }

  if (String(user.otp_code) !== String(otp)) {
    await pool.query(
      `UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1`,
      [user.id]
    );
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  // Consume OTP
  await pool.query(
    `UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0, otp_last_sent_at = NULL WHERE id = $1`,
    [user.id]
  );

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  return res.status(200).json({
    message: 'OTP verified',
    access_token: token,
    token_type: 'Bearer',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      cellphone: user.cellphone,
      role: user.role
    }
  });
}

module.exports = { verifyOtpLogin };

