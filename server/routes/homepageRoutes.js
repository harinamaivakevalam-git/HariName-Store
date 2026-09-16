const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public route to get home page content
router.get('/', homepageController.getHomepageConfig);

// Admin-protected routes to update homepage sections
router.put('/', authenticate, requireAdmin, homepageController.updateAllSections);
router.put('/:sectionId', authenticate, requireAdmin, homepageController.updateHomepageSection);
router.post('/reset', authenticate, requireAdmin, homepageController.resetHomepageDefaults);

module.exports = router;
