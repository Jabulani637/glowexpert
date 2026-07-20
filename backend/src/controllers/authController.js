const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, run } = require('../db');
const { findByEmail, findByCellphone, createUser, updateFailedLogin, resetFailedLogin, findByGoogleId, updateOtp, getCurrentTimestamp } = require('../models/User');
const { evaluateAdminLoginThrottle, computeAdminLockout } = require('../auth/adminLoginThrottle');

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

  // Normalize to reduce user enumeration.
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isAdmin = user.role === 'admin';

  if (isAdmin) {
    const throttle = evaluateAdminLoginThrottle(user);
    if (!throttle.allowed) {
      return res.status(401).json({ message: throttle.message, retry_after_ms: throttle.retryAfterMs });
    }
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    // Non-admin lockout behavior: keep existing UX-neutral response.
    // (Admin lockout is handled above with a user-friendly message.)
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.password_hash) {
    return res.status(401).json({ message: 'Please use social login for this account.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const failedAttempts = (user.failed_attempts || 0) + 1;

    let lockedUntil = null;
    let message = 'Invalid credentials';

    // Admin-only throttle: after 3 failed attempts, lock admin logins for 2 hours.
    if (isAdmin && failedAttempts >= 3) {
      lockedUntil = computeAdminLockout({
        nowMs: Date.now(),
        durationMs: 2 * 60 * 60 * 1000
      });
      message = 'Too many failed login attempts. Try again in 2 hours.';
    } else if (!isAdmin) {
      // Keep existing non-admin global behavior unchanged.
      if (failedAttempts > 6) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        message = 'Account locked after too many failed login attempts. Try again later.';
      }
    }

    await updateFailedLogin(user.id, failedAttempts, lockedUntil);

    // If admin was just locked, include a friendly retry-after hint.
    if (isAdmin && lockedUntil) {
      const retryAfterMs = new Date(lockedUntil).getTime() - Date.now();
      return res.status(401).json({
        message: message,
        retry_after_ms: Math.max(0, retryAfterMs)
      });
    }

    return res.status(401).json({ message });
  }

  await resetFailedLogin(user.id);

  // OTP login disabled.
  // Clerk-only auth: do not issue non-Clerk JWT/Bearer tokens.
  return res.status(403).json({ message: 'Use Clerk authentication' });
}


async function socialAuth(req, res) {
  // Verify Google ID token server-side.
  // Frontend must send ONLY `token` (idToken). We never trust frontend claims.

  const { token: idToken } = req.body;
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid idToken' });
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({ message: 'Server misconfigured: GOOGLE_CLIENT_ID not set' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: 'Invalid idToken payload' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || payload.given_name || payload.family_name || 'Google User';

    if (!googleId || !email) {
      return res.status(400).json({ message: 'idToken missing required claims' });
    }

    let user = await findByGoogleId(googleId);

    if (!user) {
      // Link existing account by email, otherwise create.
      user = await findByEmail(email.toLowerCase());
      if (user) {
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

    // Clerk-only auth: do not issue non-Clerk JWT/Bearer tokens.
    return res.status(403).json({ message: 'Use Clerk authentication' });
  } catch (err) {
    console.error('socialAuth verification error:', err?.message || err);
    return res.status(401).json({ message: 'Invalid social auth token' });
  }
}



module.exports = { register, login, socialAuth };

