const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { optionalAuth } = require('../middleware/auth');

router.post('/calculate', optionalAuth, checkoutController.calculateCheckout);

module.exports = router;
