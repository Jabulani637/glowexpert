const express = require('express');
const router = express.Router();
const { clerkMiddleware, requireAdminRole } = require('../auth/clerkMiddleware');
const {
  adminListApplications,
  adminApproveApplication,
  adminRejectApplication
} = require('../controllers/influencerApplicationController');

router.use(clerkMiddleware(), requireAdminRole);

router.get('/', adminListApplications);
router.post('/:id/approve', adminApproveApplication);
router.post('/:id/reject', adminRejectApplication);

module.exports = router;
