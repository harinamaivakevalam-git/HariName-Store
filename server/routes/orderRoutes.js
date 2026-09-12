const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getUserOrders);
router.get('/:identifier', optionalAuth, orderController.getOrderDetails);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

// Admin Order Management
router.get('/admin/all', authenticate, requireAdmin, orderController.adminGetOrders);
router.put('/admin/:id/status', authenticate, requireAdmin, orderController.adminUpdateOrderStatus);

module.exports = router;
