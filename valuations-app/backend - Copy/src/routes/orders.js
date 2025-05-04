const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { body, validationResult } = require('express-validator');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM Orders ORDER BY CreatedDate DESC`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM Orders WHERE OrderId = ${req.params.id}`;
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new order
router.post('/', [
  body('clientName').notEmpty(),
  body('address').notEmpty(),
  body('policyNumber').notEmpty(),
  body('orderType').isIn(['broker', 'insurer', 'private']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { clientName, address, policyNumber, orderType, notes } = req.body;
    const result = await sql.query`
      INSERT INTO Orders (ClientName, Address, PolicyNumber, OrderType, Notes, Status, CreatedDate)
      VALUES (${clientName}, ${address}, ${policyNumber}, ${orderType}, ${notes}, 'Pending', GETDATE())
      SELECT SCOPE_IDENTITY() as OrderId
    `;
    res.status(201).json({ 
      message: 'Order created successfully',
      orderId: result.recordset[0].OrderId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    await sql.query`
      UPDATE Orders 
      SET Status = ${status}, Notes = ${notes}
      WHERE OrderId = ${req.params.id}
    `;
    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 