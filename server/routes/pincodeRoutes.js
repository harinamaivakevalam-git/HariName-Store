const express = require('express');
const router = express.Router();
const pincodeController = require('../controllers/pincodeController');

// GET /api/pincode/:pincode
router.get('/:pincode', pincodeController.getPincodeDetails);

// GET /api/pincode?pin=281121
router.get('/', pincodeController.getPincodeDetails);

module.exports = router;
