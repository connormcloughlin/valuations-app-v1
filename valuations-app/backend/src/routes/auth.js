const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['admin', 'surveyor', 'manager']).withMessage('Invalid role'),
  ],
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role } = req.body;
      const pool = req.db;

      // Check if user already exists
      const userCheck = await pool.request()
        .input('email', email)
        .query('SELECT * FROM Users WHERE Email = @email');

      if (userCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const result = await pool.request()
        .input('name', name)
        .input('email', email)
        .input('password', hashedPassword)
        .input('role', role)
        .query(`
          INSERT INTO Users (Name, Email, PasswordHash, Role, CreatedDate)
          VALUES (@name, @email, @password, @role, GETDATE());
          SELECT SCOPE_IDENTITY() AS UserId;
        `);

      const userId = result.recordset[0].UserId;

      // Create JWT token
      const token = jwt.sign(
        { id: userId, email, role, name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.status(201).json({
        token,
        user: {
          id: userId,
          name,
          email,
          role
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const pool = req.db;

      // Find user
      const result = await pool.request()
        .input('email', email)
        .query('SELECT * FROM Users WHERE Email = @email');

      if (result.recordset.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.recordset[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.PasswordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          id: user.UserId, 
          email: user.Email, 
          role: user.Role,
          name: user.Name
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Update last login
      await pool.request()
        .input('userId', user.UserId)
        .query('UPDATE Users SET LastLoginDate = GETDATE() WHERE UserId = @userId');

      res.json({
        token,
        user: {
          id: user.UserId,
          name: user.Name,
          email: user.Email,
          role: user.Role
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Verify token
router.get('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token', valid: false });
      }
      
      res.json({ 
        valid: true,
        user: {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        } 
      });
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 