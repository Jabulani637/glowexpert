const express = require('express');
const controller = require('../controllers/publicProductController');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.get);

module.exports = router;

