const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/customers', adminController.getCustomers);
router.put('/customers/:id/status', adminController.updateCustomerStatus);

module.exports = router;
