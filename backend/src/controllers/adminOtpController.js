const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { findByEmail, updateOtp, getCurrentTimestamp } = require('../models/User');
const { sendOtpEmail } = require('../lib/email');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await findByEmail(email.toLowerCase());
    if (!user || user.role !== 'admin') {
      // Don't reveal whether the email exists
      return res.json({ success: true, message: 'If the email is registered, a code has been sent.' });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

    await updateOtp(user.id, otpCode, otpExpiresAt);

    try {
      await sendOtpEmail(user.email, user.name, otpCode);
    } catch (emailErr) {
      console.error('[adminOtp] Failed to send OTP email:', emailErr.message);
    }

    return res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('[adminOtp] requestOtp error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const user = await findByEmail(email.toLowerCase());
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.otp_code) {
      return res.status(401).json({ success: false, message: 'No verification code found. Request a new one.' });
    }

    if (user.otp_attempts >= MAX_OTP_ATTEMPTS) {
      await updateOtp(user.id, null, null);
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Request a new code.' });
    }

    if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
      await updateOtp(user.id, null, null);
      return res.status(401).json({ success: false, message: 'Code expired. Request a new one.' });
    }

    if (user.otp_code !== String(otp).trim()) {
      const { run } = require('../db');
      await run(
        'UPDATE users SET otp_attempts = otp_attempts + 1, updated_at = ? WHERE id = ?',
        [getCurrentTimestamp(), user.id]
      );
      return res.status(401).json({ success: false, message: 'Invalid code' });
    }

    // Clear OTP after successful verification
    await updateOtp(user.id, null, null);

    // Issue JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'glowexpert-dev-secret';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[adminOtp] verifyOtp error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { requestOtp, verifyOtp };
