const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createPaymentOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook);
router.post('/webhook/:provider', paymentController.handleWebhook);
router.post('/razorpay/webhook', paymentController.handleWebhook);

module.exports = router;
