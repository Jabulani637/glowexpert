const express = require('express');
const { getSettings } = require('../controllers/siteController');

const router = express.Router();

router.get('/settings', getSettings);

module.exports = router;
