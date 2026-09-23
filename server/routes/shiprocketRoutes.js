const express = require('express');
const router = express.Router();
const shiprocketController = require('../controllers/shiprocketController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 1. Connection Test Endpoint
router.get('/test', shiprocketController.testConnection);

// 2. Live Shipping Rate & Courier Serviceability (Public Checkout Endpoint)
router.post('/check-rate', shiprocketController.checkRate);

// 3. Tracking Endpoint (Public / Customer Facing Fallback)
router.get('/track/:awb', shiprocketController.trackShipment);

// 4. Webhook Receiver Endpoint (Public / Shiprocket System Facing)
router.post('/webhook', shiprocketController.handleWebhook);
router.post('/sync-order', shiprocketController.syncOrder);

// 5. Admin Shipment Fulfillment & Operations
router.post('/create-order', authenticate, requireAdmin, shiprocketController.createOrder);
router.post('/assign-awb', authenticate, requireAdmin, shiprocketController.assignAwb);
router.post('/pickup', authenticate, requireAdmin, shiprocketController.requestPickup);
router.post('/label', authenticate, requireAdmin, shiprocketController.generateLabel);
router.post('/manifest', authenticate, requireAdmin, shiprocketController.generateManifest);
router.post('/cancel', authenticate, requireAdmin, shiprocketController.cancelShipment);

module.exports = router;
