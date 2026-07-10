const express = require('express');
const multer  = require('multer');
const path    = require('path');

const { authMiddleware } = require('../auth/middlewareAuth');
const { requireRoles }   = require('../auth/roles');

const controller      = require('../controllers/adminProductController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles(['admin']));

// ---------------------------------------------------------------------------
// Multer – memory storage only.
// Files are held in req.file.buffer / req.files[].buffer and uploaded to
// Supabase Storage by the controller. Nothing is written to local disk.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024   // 10 MB per image
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Product CRUD
router.get('/products',      controller.adminList);
router.get('/products/:id',  controller.adminGet);
router.post('/products',     upload.array('images', 10), controller.adminCreate);
router.put('/products/:id',  upload.array('images', 10), controller.adminUpdate);
router.delete('/products/:id', controller.adminDelete);

// Admin settings / ops
router.get('/settings',        adminController.getSettingsController);
router.put('/settings',        adminController.updateSettingsController);
router.get('/subscribers',     adminController.getSubscribers);
router.get('/orders',          adminController.getOrders);
router.get('/customers',       adminController.getCustomers);
router.get('/reviews',         adminController.getReviews);
router.post('/reviews',        adminController.addReview);
router.delete('/reviews/:id',  adminController.removeReview);

module.exports = router;
