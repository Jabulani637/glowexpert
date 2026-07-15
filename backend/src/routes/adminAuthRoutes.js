'use strict';

const express = require('express');

const { clerkMiddleware, requireAdminRole } = require('../auth/clerkMiddleware');
const { getAuth } = require('@clerk/express');

const router = express.Router();

// Returns the currently authenticated admin user.
router.get('/me', clerkMiddleware(), requireAdminRole, (req, res) => {
  const auth = getAuth(req);
  res.json({
    authenticated: true,
    user: {
      id: auth?.userId || null,
      role: auth?.sessionClaims?.metadata?.role || null,
      email: auth?.sessionClaims?.email || null,
      name: auth?.sessionClaims?.name || null
    }
  });
});

module.exports = router;


