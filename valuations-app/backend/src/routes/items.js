const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { body, validationResult } = require('express-validator');

// Get all items for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT * FROM Items 
      WHERE OrderId = ${req.params.orderId}
      ORDER BY Category, ItemName
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new item
router.post('/', [
  body('orderId').isInt(),
  body('itemName').notEmpty(),
  body('category').notEmpty(),
  body('description').notEmpty(),
  body('estimatedValue').isFloat({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { orderId, itemName, category, description, estimatedValue, notes } = req.body;
    const result = await sql.query`
      INSERT INTO Items (OrderId, ItemName, Category, Description, EstimatedValue, Notes, Status)
      VALUES (${orderId}, ${itemName}, ${category}, ${description}, ${estimatedValue}, ${notes}, 'Pending')
      SELECT SCOPE_IDENTITY() as ItemId
    `;
    res.status(201).json({ 
      message: 'Item added successfully',
      itemId: result.recordset[0].ItemId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const { itemName, category, description, estimatedValue, notes, status } = req.body;
    await sql.query`
      UPDATE Items 
      SET ItemName = ${itemName},
          Category = ${category},
          Description = ${description},
          EstimatedValue = ${estimatedValue},
          Notes = ${notes},
          Status = ${status}
      WHERE ItemId = ${req.params.id}
    `;
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get items by category
router.get('/categories', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT DISTINCT Category 
      FROM Items 
      ORDER BY Category
    `;
    res.json(result.recordset.map(item => item.Category));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get items requiring valuation
router.get('/pending-valuation', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT i.*, o.ClientName, o.Address
      FROM Items i
      JOIN Orders o ON i.OrderId = o.OrderId
      WHERE i.Status = 'Pending'
      ORDER BY i.CreatedDate DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 