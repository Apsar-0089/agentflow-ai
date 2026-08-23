const express = require('express');
const executionController = require('../controllers/executionController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, executionController.getExecutions);
router.get('/:id', optionalAuth, executionController.getExecutionById);
router.get('/:id/timeline', optionalAuth, executionController.getExecutionTimeline);
router.post('/:id/pause', optionalAuth, executionController.pauseExecution);
router.post('/:id/resume', optionalAuth, executionController.resumeExecution);
router.post('/:id/cancel', optionalAuth, executionController.cancelExecution);

module.exports = router;
