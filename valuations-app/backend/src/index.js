require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const appointmentsRoutes = require('./routes/appointments');
const surveyorsRoutes = require('./routes/surveyors');
const itemsRoutes = require('./routes/items');
const clientsRoutes = require('./routes/clients');
const reportsRoutes = require('./routes/reports');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Global SQL pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('SQL Pool Error:', err);
});

// Make db connection available to routes
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', authenticateToken, ordersRoutes);
app.use('/api/appointments', authenticateToken, appointmentsRoutes);
app.use('/api/surveyors', authenticateToken, surveyorsRoutes);
app.use('/api/items', authenticateToken, itemsRoutes);
app.use('/api/clients', authenticateToken, clientsRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

poolConnect
  .then(() => {
    console.log('Connected to Azure SQL Database');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  }); 