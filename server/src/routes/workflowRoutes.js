const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { optionalAuth, authMiddleware } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public / Operator dashboard aggregated stats
router.get('/dashboard', optionalAuth, workflowController.getDashboard);

// List user workflows
router.get('/', optionalAuth, workflowController.getWorkflows);

// Create workflow manually
router.post(
  '/',
  optionalAuth,
  [
    body('name').trim().notEmpty().withMessage('Workflow name is required'),
    body('nodes').optional().isArray().withMessage('Nodes must be an array'),
    body('edges').optional().isArray().withMessage('Edges must be an array'),
  ],
  handleValidationErrors,
  workflowController.createWorkflow
);

// AI prompt-to-workflow generation
router.post(
  '/generate',
  optionalAuth,
  [
    body('prompt').trim().notEmpty().withMessage('Prompt text is required for AI generation'),
  ],
  handleValidationErrors,
  workflowController.generateWorkflowFromAI
);

// Get single workflow
router.get('/:id', optionalAuth, workflowController.getWorkflowById);

// Update workflow
router.put('/:id', optionalAuth, workflowController.updateWorkflow);

// Duplicate workflow
router.post('/:id/duplicate', optionalAuth, workflowController.duplicateWorkflow);

// Execute workflow
router.post('/:id/execute', optionalAuth, workflowController.executeWorkflow);

// Delete workflow
router.delete('/:id', optionalAuth, workflowController.deleteWorkflow);

module.exports = router;
