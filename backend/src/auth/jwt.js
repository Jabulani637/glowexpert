const jwt = require('jsonwebtoken');

function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  // Avoid accepting arbitrary claims as authority.
  const safePayload = {
    sub: payload?.sub,
    email: payload?.email,
    name: payload?.name,
    role: payload?.role,
  };

  return jwt.sign(safePayload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  // Use expected algorithm whitelist to reduce algorithm-confusion risk.
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}


module.exports = { signAccessToken, verifyAccessToken };

