function createNotificationService({ notificationRepository }) {
  async function list(userId) {
    const notifications = await notificationRepository.listForUser(userId);
    return {
      notifications: notifications.map((notification) => notification.toJSON()),
      unreadCount: notifications.filter((notification) => !notification.isRead).length
    };
  }

  async function markAllRead(userId) {
    await notificationRepository.markAllRead(userId);
  }

  return { list, markAllRead };
}

module.exports = { createNotificationService };
