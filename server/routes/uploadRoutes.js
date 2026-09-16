const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/image', authenticate, requireAdmin, upload.single('image'), uploadController.uploadImage);
router.post('/images', authenticate, requireAdmin, upload.array('images', 5), uploadController.uploadImages);

module.exports = router;
