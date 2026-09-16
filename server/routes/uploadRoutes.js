const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/image', authenticate, requireAdmin, upload.single('image'), uploadController.uploadImage);
router.post('/video', authenticate, requireAdmin, upload.single('video'), uploadController.uploadMedia);
router.post('/media', authenticate, requireAdmin, upload.single('media'), uploadController.uploadMedia);
router.post('/file', authenticate, requireAdmin, upload.single('file'), uploadController.uploadMedia);
router.post('/images', authenticate, requireAdmin, upload.array('images', 10), uploadController.uploadImages);

module.exports = router;
