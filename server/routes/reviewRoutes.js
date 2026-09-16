const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', reviewController.getRecentReviews);
router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authenticate, reviewController.createReview);

// Admin Review Moderation & Management
router.get('/admin/all', authenticate, requireAdmin, reviewController.adminGetReviews);
router.post('/admin/create', authenticate, requireAdmin, reviewController.adminCreateReview);
router.put('/admin/:id', authenticate, requireAdmin, reviewController.adminUpdateReview);
router.put('/admin/:id/status', authenticate, requireAdmin, reviewController.adminModerateReview);
router.delete('/admin/:id', authenticate, requireAdmin, reviewController.adminDeleteReview);

module.exports = router;
