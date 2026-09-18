const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/image', authenticate, requireAdmin, upload.any(), uploadController.uploadImage);
router.post('/video', authenticate, requireAdmin, upload.any(), uploadController.uploadMedia);
router.post('/media', authenticate, requireAdmin, upload.any(), uploadController.uploadMedia);
router.post('/file', authenticate, requireAdmin, upload.any(), uploadController.uploadMedia);
router.post('/images', authenticate, requireAdmin, upload.any(), uploadController.uploadImages);

module.exports = router;
