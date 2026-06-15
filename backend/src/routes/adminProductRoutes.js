const express = require('express');
const multer = require('multer');
const path = require('path');

const { authMiddleware } = require('../auth/middlewareAuth');
const { requireRoles } = require('../auth/roles');

const controller = require('../controllers/adminProductController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles(['admin']));

// Configure multer for file uploads (same as in server.js)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.get('/products', controller.adminList);
router.get('/products/:id', controller.adminGet);
router.post('/products', upload.array('images', 10), controller.adminCreate);
router.put('/products/:id', upload.array('images', 10), controller.adminUpdate);
router.delete('/products/:id', controller.adminDelete);
router.get('/settings', adminController.getSettingsController);
router.put('/settings', adminController.updateSettingsController);
router.get('/subscribers', adminController.getSubscribers);
router.get('/orders', adminController.getOrders);
router.get('/customers', adminController.getCustomers);
router.get('/reviews', adminController.getReviews);
router.post('/reviews', adminController.addReview);
router.delete('/reviews/:id', adminController.removeReview);

module.exports = router;
