const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { clerkMiddleware, requireAdminRole } = require('../auth/clerkMiddleware');
const controller      = require('../controllers/adminProductController');
const adminController = require('../controllers/adminController');
const router = express.Router();
// Clerk-first admin guarding.
// Tests can inject a role via Authorization header (see backend/src/test/helpers/testServer.js).
// In production, Clerk middleware must run before the role guard.
router.use((req, res, next) => {
  return clerkMiddleware()(req, res, (err) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    return requireAdminRole(req, res, next);
  });
});

// Multer – memory storage only.
// Files are held in req.file.buffer / req.files[].buffer and uploaded to
// Supabase Storage by the controller. Nothing is written to local disk.
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
