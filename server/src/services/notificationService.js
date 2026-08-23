const Notification = require('../models/Notification');
const { emitNotification } = require('../config/socket');

const createNotification = async ({ owner, workflowId, executionId, type = 'info', title, message }) => {
  try {
    const notif = await Notification.create({
      owner,
      workflowId,
      executionId,
      type,
      title,
      message,
      isRead: false,
    });

    // Emit live via socket
    emitNotification(owner ? owner.toString() : null, {
      id: notif._id,
      workflowId,
      executionId,
      type,
      title,
      message,
      createdAt: notif.createdAt,
    });

    return notif;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
};

const getNotifications = async (userId, limit = 50) => {
  const query = userId ? { $or: [{ owner: userId }, { owner: null }] } : {};
  return Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('workflowId', 'name')
    .lean();
};

const markAsRead = async (notificationId, userId) => {
  const query = { _id: notificationId };
  if (userId) query.owner = userId;

  return Notification.findOneAndUpdate(query, { isRead: true }, { new: true });
};

const markAllAsRead = async (userId) => {
  const query = userId ? { owner: userId } : {};
  return Notification.updateMany(query, { isRead: true });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
