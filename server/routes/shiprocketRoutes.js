const express = require('express');
const router = express.Router();
const shiprocketController = require('../controllers/shiprocketController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 1. Connection Test Endpoint
router.get('/test', shiprocketController.testConnection);

// 2. Tracking Endpoint (Public / Customer Facing Fallback)
router.get('/track/:awb', shiprocketController.trackShipment);

// 3. Webhook Receiver Endpoint (Public / Shiprocket System Facing)
router.post('/webhook', shiprocketController.handleWebhook);

// 4. Admin Shipment Fulfillment & Operations
router.post('/create-order', authenticate, requireAdmin, shiprocketController.createOrder);
router.post('/assign-awb', authenticate, requireAdmin, shiprocketController.assignAwb);
router.post('/pickup', authenticate, requireAdmin, shiprocketController.requestPickup);
router.post('/label', authenticate, requireAdmin, shiprocketController.generateLabel);
router.post('/manifest', authenticate, requireAdmin, shiprocketController.generateManifest);
router.post('/cancel', authenticate, requireAdmin, shiprocketController.cancelShipment);

module.exports = router;
