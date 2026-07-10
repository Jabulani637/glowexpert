const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, run } = require('../db');
const { findByEmail, findByCellphone, createUser, updateFailedLogin, resetFailedLogin, findByGoogleId, updateOtp, getCurrentTimestamp } = require('../models/User');
const { signAccessToken } = require('../auth/jwt');
const { normalizeRole } = require('../auth/roles');

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

const logPath = path.join(__dirname, '..', 'admin_access.log');

function logAdminEvent(entry) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${entry}\n`;
  fs.appendFile(logPath, line, { encoding: 'utf8' }, () => {});
}

async function register(req, res) {
  const { name, email, cellphone, password } = req.body;

  const existing = await findByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  // Hardcode role to customer for public registration. 
  // Admins should be created via database seeds or internal tools.
  const normalizedRole = 'customer';
  const normalizedCellphone = cellphone ? normalizeCellphone(cellphone) : null;

  const user = await createUser({
    name,
    email: email.toLowerCase(),
    cellphone: normalizedCellphone,
    passwordHash,
    role: normalizedRole
  });

  return res.status(201).json({
    message: 'Registered successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      cellphone: user.cellphone,
      role: user.role
    }
  });
}

async function login(req, res) {
  const { cellphone, password } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const identifier = String(cellphone || '').trim();
  const normalizedCellphone = normalizeCellphone(identifier);

  let user;
  try {
    const looksLikeEmail = /@/.test(identifier) && /\./.test(identifier);

    user = looksLikeEmail
      ? await findByEmail(identifier.toLowerCase())
      : await findByCellphone(normalizedCellphone);

    if (!user && !looksLikeEmail) {
      user = await findByEmail(identifier.toLowerCase());
    }
  } catch (dbError) {
    console.error('Database connection error during login:', dbError.message);
    return res.status(503).json({ message: 'Service temporarily unavailable. Please try again later.' });
  }

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return res.status(403).json({ message: 'Account locked. Try again later.' });
  }

  if (!user.password_hash) {
    return res.status(401).json({ message: 'Please use social login for this account.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const failedAttempts = (user.failed_attempts || 0) + 1;
    let lockedUntil = null;
    let message = 'Invalid credentials';

    if (failedAttempts > 6) {
      lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      message = 'Account locked after too many failed login attempts. Try again later.';
    }

    await updateFailedLogin(user.id, failedAttempts, lockedUntil);
    return res.status(401).json({ message });
  }

  await resetFailedLogin(user.id);

  // OTP login disabled. Admins receive an access token directly like customers.
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  return res.status(200).json({
    message: 'Login successful',
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


async function socialAuth(req, res) {
  const { token: idToken } = req.body;
  // Note: In production, verify this token with Google's API (e.g., google-auth-library)
  // For this implementation, we assume the frontend sends verified user data after Google sign-in
  const { email, name, sub: googleId } = req.body; 

  if (!googleId || !email) {
    return res.status(400).json({ message: 'Invalid social auth data' });
  }

  let user = await findByGoogleId(googleId);
  
  if (!user) {
    // Check if email exists to link account, otherwise create
    user = await findByEmail(email.toLowerCase());
    if (user) {
      // Link existing account to Google
      await run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
    } else {
      user = await createUser({
        name,
        email: email.toLowerCase(),
        googleId,
        role: 'customer'
      });
    }
  }

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  return res.status(200).json({
    message: 'Social login successful',
    access_token: token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

module.exports = { register, login, socialAuth };

