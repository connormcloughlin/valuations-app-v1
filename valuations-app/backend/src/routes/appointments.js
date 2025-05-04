const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { body, validationResult } = require('express-validator');

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT a.*, o.ClientName, o.Address, s.Name as SurveyorName
      FROM Appointments a
      JOIN Orders o ON a.OrderId = o.OrderId
      LEFT JOIN Surveyors s ON a.SurveyorId = s.SurveyorId
      ORDER BY a.AppointmentDate DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new appointment
router.post('/', [
  body('orderId').isInt(),
  body('appointmentDate').isISO8601(),
  body('surveyorId').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { orderId, appointmentDate, surveyorId, notes } = req.body;
    const result = await sql.query`
      INSERT INTO Appointments (OrderId, AppointmentDate, SurveyorId, Notes, Status)
      VALUES (${orderId}, ${appointmentDate}, ${surveyorId}, ${notes}, 'Scheduled')
      SELECT SCOPE_IDENTITY() as AppointmentId
    `;
    
    // Update order status
    await sql.query`
      UPDATE Orders 
      SET Status = 'Appointment Scheduled'
      WHERE OrderId = ${orderId}
    `;

    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointmentId: result.recordset[0].AppointmentId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update appointment status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await sql.query`
      UPDATE Appointments 
      SET Status = ${status}
      WHERE AppointmentId = ${req.params.id}
    `;
    res.json({ message: 'Appointment status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get appointments for a surveyor
router.get('/surveyor/:surveyorId', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT a.*, o.ClientName, o.Address
      FROM Appointments a
      JOIN Orders o ON a.OrderId = o.OrderId
      WHERE a.SurveyorId = ${req.params.surveyorId}
      ORDER BY a.AppointmentDate DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 