const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth, authenticate } = require('../middleware/auth');

router.get('/', optionalAuth, cartController.getCart);
router.post('/add', optionalAuth, cartController.addToCart);
router.put('/items/:itemId', optionalAuth, cartController.updateQuantity);
router.delete('/items/:itemId', optionalAuth, cartController.removeItem);
router.post('/merge', authenticate, cartController.mergeCart);

module.exports = router;
