const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', brandController.getBrands);
router.post('/', authenticate, requireAdmin, brandController.createBrand);
router.put('/:id', authenticate, requireAdmin, brandController.updateBrand);
router.delete('/:id', authenticate, requireAdmin, brandController.deleteBrand);

module.exports = router;
