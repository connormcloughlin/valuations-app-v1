const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  dialect: 'mssql',
  port: config.db.port,
  dialectOptions: {
    options: {
      encrypt: true,
    },
  },
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

const Client = sequelize.define('Client', {
  name: { type: DataTypes.STRING, allowNull: false },
  contact_info: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
});

const Order = sequelize.define('Order', {
  policy_number: { type: DataTypes.STRING },
  order_source: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
});

const Appointment = sequelize.define('Appointment', {
  appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
  appointment_time: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'scheduled' },
});

const InventoryItem = sequelize.define('InventoryItem', {
  room: { type: DataTypes.STRING },
  item_name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  estimated_value: { type: DataTypes.DECIMAL(18,2) },
  category: { type: DataTypes.STRING },
  photo_url: { type: DataTypes.STRING },
});

const Report = sequelize.define('Report', {
  report_url: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

// Associations
Client.hasMany(Order);
Order.belongsTo(Client);

Order.hasMany(Appointment);
Appointment.belongsTo(Order);

User.hasMany(Appointment, { foreignKey: 'surveyor_id' });
Appointment.belongsTo(User, { foreignKey: 'surveyor_id' });

Appointment.hasMany(InventoryItem);
InventoryItem.belongsTo(Appointment);

Order.hasOne(Report);
Report.belongsTo(Order);

module.exports = {
  sequelize,
  User,
  Client,
  Order,
  Appointment,
  InventoryItem,
  Report,
}; 