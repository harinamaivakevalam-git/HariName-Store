const db = require('../models/db');

exports.getUserNotifications = (req, res, next) => {
  try {
    const notifications = db.filter('notifications', n => n.user_id === req.user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      unread_count: notifications.filter(n => !n.is_read).length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      const userNotifs = db.filter('notifications', n => n.user_id === req.user.id);
      userNotifs.forEach(n => db.update('notifications', n.id, { is_read: true }));
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    const updated = db.update('notifications', id, { is_read: true });
    res.json({ success: true, message: 'Notification marked as read.', data: updated });
  } catch (err) {
    next(err);
  }
};
