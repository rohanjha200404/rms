const { Notification } = require('../../db');

class SequelizeNotificationRepository {
  async listForUser(userId) {
    return Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 30 });
  }

  async createMany(notifications) {
    return Notification.bulkCreate(notifications);
  }

  async markAllRead(userId) {
    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
  }
}

module.exports = { SequelizeNotificationRepository };
