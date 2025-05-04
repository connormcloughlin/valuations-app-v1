const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all surveyors
router.get('/', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT SurveyorId, Name, Email, Phone, Status, Specializations
      FROM Surveyors
      ORDER BY Name
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new surveyor
router.post('/', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, phone, specializations } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await sql.query`
      INSERT INTO Surveyors (Name, Email, Password, Phone, Specializations, Status)
      VALUES (${name}, ${email}, ${hashedPassword}, ${phone}, ${specializations}, 'Active')
      SELECT SCOPE_IDENTITY() as SurveyorId
    `;
    
    res.status(201).json({ 
      message: 'Surveyor created successfully',
      surveyorId: result.recordset[0].SurveyorId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update surveyor
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, specializations, status } = req.body;
    await sql.query`
      UPDATE Surveyors 
      SET Name = ${name},
          Email = ${email},
          Phone = ${phone},
          Specializations = ${specializations},
          Status = ${status}
      WHERE SurveyorId = ${req.params.id}
    `;
    res.json({ message: 'Surveyor updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get surveyor's appointments
router.get('/:id/appointments', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT a.*, o.ClientName, o.Address
      FROM Appointments a
      JOIN Orders o ON a.OrderId = o.OrderId
      WHERE a.SurveyorId = ${req.params.id}
      ORDER BY a.AppointmentDate DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Surveyor login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const result = await sql.query`
      SELECT SurveyorId, Name, Email, Password
      FROM Surveyors
      WHERE Email = ${email}
    `;

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const surveyor = result.recordset[0];
    const validPassword = await bcrypt.compare(password, surveyor.Password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // In a real application, you would generate a JWT token here
    res.json({
      message: 'Login successful',
      surveyorId: surveyor.SurveyorId,
      name: surveyor.Name
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 