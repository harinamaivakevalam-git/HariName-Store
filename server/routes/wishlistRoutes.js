const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, wishlistController.getWishlist);
router.post('/toggle', authenticate, wishlistController.toggleWishlist);
router.delete('/:productId', authenticate, wishlistController.removeFromWishlist);

module.exports = router;
