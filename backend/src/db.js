const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.mysql.database, config.mysql.username, config.mysql.password, {
  host: config.mysql.host,
  port: config.mysql.port,
  dialect: 'mysql',
  logging: false,
  define: { underscored: true, timestamps: true }
});

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'manager', 'agent'), allowNull: false, defaultValue: 'agent' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  accessPermissions: { type: DataTypes.JSON, allowNull: false, defaultValue: {} }
});

const Policy = sequelize.define('Policy', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  policyNo: { type: DataTypes.STRING(80), allowNull: false, unique: true, field: 'policy_number' },
  name: { type: DataTypes.STRING(160), allowNull: false, field: 'customer_name' },
  plan: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'Renewal policy' },
  premium: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'policy_start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'renewal_date' },
  customerDob: { type: DataTypes.DATEONLY, allowNull: true, field: 'customer_dob' },
  status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Pending' },
  disposition: { type: DataTypes.STRING(255), allowNull: true },
  agentName: { type: DataTypes.STRING(120), allowNull: true, field: 'agent_name' }
});

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  type: { type: DataTypes.STRING(40), allowNull: false },
  title: { type: DataTypes.STRING(160), allowNull: false },
  message: { type: DataTypes.STRING(500), allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_read' },
  policyNo: { type: DataTypes.STRING(80), allowNull: true, field: 'policy_number' }
});

module.exports = { sequelize, User, Policy, Notification };
