const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/validate', couponController.validateCoupon);

// Admin Coupon Management
router.get('/', authenticate, requireAdmin, couponController.getCoupons);
router.post('/', authenticate, requireAdmin, couponController.createCoupon);
router.put('/:id', authenticate, requireAdmin, couponController.updateCoupon);
router.delete('/:id', authenticate, requireAdmin, couponController.deleteCoupon);

module.exports = router;
