const express = require('express');
const notificationController = require('../controllers/notificationController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, notificationController.getNotifications);
router.put('/:id/read', optionalAuth, notificationController.markRead);
router.post('/read-all', optionalAuth, notificationController.markAllRead);

module.exports = router;
