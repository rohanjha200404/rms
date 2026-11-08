const { Policy, Notification } = require('../../db');
const { Op } = require('sequelize');

class SequelizePolicyRepository {
  async findRenewals({ page, pageSize, search, status, dueDays }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { policyNo: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.status = status.charAt(0).toUpperCase() + status.slice(1);
    if (dueDays) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + dueDays);
      const rangeStart = dueDays === 45 ? start : new Date(start);
      if (dueDays === 60) rangeStart.setDate(rangeStart.getDate() + 45);
      if (dueDays === 90) rangeStart.setDate(rangeStart.getDate() + 60);
      where.endDate = {
        ...(dueDays > 45 ? { [Op.gt]: rangeStart.toISOString().slice(0, 10) } : {}),
        [Op.lte]: end.toISOString().slice(0, 10)
      };
    }
    return Policy.findAndCountAll({
      where,
      order: [['endDate', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  async upsertMany(policies) {
    const existing = await Policy.findAll({
      where: { policyNo: policies.map(({ policyNo }) => policyNo) },
      attributes: ['policyNo', 'endDate'],
      raw: true
    });
    const existingByNumber = new Map(existing.map((policy) => [policy.policyNo, policy]));
    return Policy.bulkCreate(policies, {
      updateOnDuplicate: ['name', 'startDate', 'endDate', 'customerDob', 'plan', 'premium']
    }).then(async (result) => ({ result, existingByNumber }));
  }

  async createNotifications(notifications) {
    return Notification.bulkCreate(notifications);
  }

  async updateStatus(id, status) {
    return Policy.update({ status }, { where: { id } });
  }

  async updateDisposition(id, disposition) {
    return Policy.update({ disposition }, { where: { id } });
  }

  async counts() {
    const [total, pending, quoted, renewed, lapsed] = await Promise.all([
      Policy.count(),
      Policy.count({ where: { status: 'Pending' } }),
      Policy.count({ where: { status: 'Quoted' } }),
      Policy.count({ where: { status: 'Renewed' } }),
      Policy.count({ where: { status: 'Lapsed' } })
    ]);
    return { total, pending, quoted, renewed, lapsed };
  }

  async findRenewalDates() {
    return Policy.findAll({ attributes: ['endDate'], raw: true });
  }
}

module.exports = { SequelizePolicyRepository };
