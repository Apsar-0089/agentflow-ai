const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const list = await notificationService.getNotifications(req.user?.id, req.query.limit);
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user?.id);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user?.id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
};
