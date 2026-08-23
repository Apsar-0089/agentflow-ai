const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', optionalAuth, integrationController.getIntegrations);
router.get('/status', optionalAuth, integrationController.getStatus);

// OAuth Start & Callback Routes
router.get('/oauth/error', integrationController.oauthError);
router.get('/oauth/:provider/start', optionalAuth, integrationController.oauthStart);
router.get('/oauth/:provider/callback', optionalAuth, integrationController.oauthCallback);

// Manual setup & disconnect
router.post(
  '/',
  optionalAuth,
  [
    body('provider').notEmpty().withMessage('Provider is required'),
  ],
  handleValidationErrors,
  integrationController.saveManualCredentials
);

router.delete('/:provider', optionalAuth, integrationController.disconnect);

module.exports = router;
