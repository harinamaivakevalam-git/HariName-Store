const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authenticate, reviewController.createReview);

// Admin Review Moderation
router.get('/admin/all', authenticate, requireAdmin, reviewController.adminGetReviews);
router.put('/admin/:id/status', authenticate, requireAdmin, reviewController.adminModerateReview);
router.delete('/admin/:id', authenticate, requireAdmin, reviewController.adminDeleteReview);

module.exports = router;
