const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize, User, Client, Order, Appointment, InventoryItem, Report } = require('./models');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// JWT Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash: hash, role });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CRUD routes (protected)
// Users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const users = await User.findAll();
  res.json(users);
});

// Clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  const clients = await Client.findAll();
  res.json(clients);
});
app.post('/api/clients', authenticateToken, async (req, res) => {
  const client = await Client.create(req.body);
  res.json(client);
});

// Orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  const orders = await Order.findAll({ include: [Client] });
  res.json(orders);
});
app.post('/api/orders', authenticateToken, async (req, res) => {
  const order = await Order.create(req.body);
  res.json(order);
});

// Appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  const appointments = await Appointment.findAll({ include: [Order, User] });
  res.json(appointments);
});
app.post('/api/appointments', authenticateToken, async (req, res) => {
  const appointment = await Appointment.create(req.body);
  res.json(appointment);
});

// InventoryItems
app.get('/api/inventory', authenticateToken, async (req, res) => {
  const items = await InventoryItem.findAll({ include: [Appointment] });
  res.json(items);
});
app.post('/api/inventory', authenticateToken, async (req, res) => {
  const item = await InventoryItem.create(req.body);
  res.json(item);
});

// Reports
app.get('/api/reports', authenticateToken, async (req, res) => {
  const reports = await Report.findAll({ include: [Order] });
  res.json(reports);
});
app.post('/api/reports', authenticateToken, async (req, res) => {
  const report = await Report.create(req.body);
  res.json(report);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Sync DB and start server
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
})(); 