'use strict';

const express = require('express');

const { authMiddleware } = require('../auth/middlewareAuth');
const { requireRoles } = require('../auth/roles');

const router = express.Router();

// Returns the currently authenticated admin user (verifies token + role).
// Frontend should call this on every admin page entry.
router.get('/me', authMiddleware, requireRoles(['admin']), (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

module.exports = router;

