const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { clerkMiddleware, requireAdminRole } = require('../auth/clerkMiddleware');


// Public routes
router.get('/posts', blogController.getBlogPosts);
router.get('/posts/featured', blogController.getFeaturedPosts);
router.get('/posts/:slug', blogController.getBlogPost);

// Admin routes
router.use('/admin', clerkMiddleware(), requireAdminRole);


router.get('/admin/blog', blogController.getAllPosts);
router.get('/admin/blog/stats', blogController.getStats);
router.get('/admin/blog/:id', blogController.getPostById);
router.post('/admin/blog', blogController.createPost);
router.put('/admin/blog/:id', blogController.updatePost);
router.delete('/admin/blog/:id', blogController.deletePost);

module.exports = router;