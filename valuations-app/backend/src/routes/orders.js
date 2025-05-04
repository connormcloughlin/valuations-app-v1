const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { body, param, validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');
const { isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/orders
 * @desc    Get all orders with optional filtering
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const pool = req.db;
    const { status, clientId, startDate, endDate, limit = 100 } = req.query;
    
    // Build dynamic query based on filters
    let query = 'SELECT * FROM Orders';
    const conditions = [];
    const inputs = {};

    if (status) {
      conditions.push('Status = @status');
      inputs.status = status;
    }
    
    if (clientId) {
      conditions.push('ClientId = @clientId');
      inputs.clientId = clientId;
    }
    
    if (startDate) {
      conditions.push('CreatedDate >= @startDate');
      inputs.startDate = new Date(startDate);
    }
    
    if (endDate) {
      conditions.push('CreatedDate <= @endDate');
      inputs.endDate = new Date(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY CreatedDate DESC';

    // Add limit
    query += ' OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY';
    inputs.limit = parseInt(limit);
    
    // Create request with inputs
    const request = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID with related data
 * @access  Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('Order ID must be a number')
], async (req, res, next) => {
  try {
    // Validate params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pool = req.db;
    const { id } = req.params;

    // Get order details
    const orderQuery = await pool.request()
      .input('id', id)
      .query(`
        SELECT o.*, c.ClientName, c.Email, c.Phone 
        FROM Orders o
        LEFT JOIN Clients c ON o.ClientId = c.ClientId
        WHERE o.OrderId = @id
      `);

    if (orderQuery.recordset.length === 0) {
      throw new ApiError(404, 'Order not found');
    }

    const order = orderQuery.recordset[0];

    // Get associated appointments
    const appointmentsQuery = await pool.request()
      .input('orderId', id)
      .query(`
        SELECT * FROM Appointments 
        WHERE OrderId = @orderId
        ORDER BY AppointmentDate, AppointmentTime
      `);

    // Combine data
    const response = {
      ...order,
      appointments: appointmentsQuery.recordset
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', [
  body('clientName').notEmpty().withMessage('Client name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('policyNumber').notEmpty().withMessage('Policy number is required'),
  body('orderType').isIn(['broker', 'insurer', 'private']).withMessage('Invalid order type'),
], async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientName, address, policyNumber, orderType, clientId, notes } = req.body;
    const pool = req.db;
    
    // First, ensure client exists or create a new one
    let actualClientId = clientId;
    
    if (!clientId) {
      // Create new client
      const clientResult = await pool.request()
        .input('clientName', clientName)
        .input('address', address)
        .query(`
          INSERT INTO Clients (ClientName, Address, CreatedDate)
          VALUES (@clientName, @address, GETDATE());
          SELECT SCOPE_IDENTITY() as ClientId
        `);
      
      actualClientId = clientResult.recordset[0].ClientId;
    }
    
    // Now create the order
    const orderResult = await pool.request()
      .input('clientId', actualClientId)
      .input('policyNumber', policyNumber)
      .input('orderType', orderType)
      .input('notes', notes)
      .input('userId', req.user.id)
      .query(`
        INSERT INTO Orders (
          ClientId, PolicyNumber, OrderType, Notes, 
          Status, CreatedBy, CreatedDate
        )
        VALUES (
          @clientId, @policyNumber, @orderType, @notes, 
          'Pending', @userId, GETDATE()
        );
        SELECT SCOPE_IDENTITY() as OrderId
      `);
    
    const orderId = orderResult.recordset[0].OrderId;
    
    res.status(201).json({ 
      message: 'Order created successfully',
      orderId,
      clientId: actualClientId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/orders/:id
 * @desc    Update an existing order
 * @access  Private
 */
router.put('/:id', [
  param('id').isInt().withMessage('Order ID must be a number'),
  body('status').optional().isIn(['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'])
    .withMessage('Invalid status'),
], async (req, res, next) => {
  try {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes, policyNumber } = req.body;
    const pool = req.db;
    
    // Check if order exists
    const checkResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM Orders WHERE OrderId = @id');
    
    if (checkResult.recordset.length === 0) {
      throw new ApiError(404, 'Order not found');
    }
    
    // Build update query
    let query = 'UPDATE Orders SET ';
    const updates = [];
    const inputs = { id };
    
    if (status) {
      updates.push('Status = @status');
      inputs.status = status;
    }
    
    if (notes !== undefined) {
      updates.push('Notes = @notes');
      inputs.notes = notes;
    }
    
    if (policyNumber) {
      updates.push('PolicyNumber = @policyNumber');
      inputs.policyNumber = policyNumber;
    }
    
    // Add last updated info
    updates.push('LastModifiedBy = @userId, LastModifiedDate = GETDATE()');
    inputs.userId = req.user.id;
    
    query += updates.join(', ') + ' WHERE OrderId = @id';
    
    // Execute update
    const request = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    await request.query(query);
    
    res.json({ 
      message: 'Order updated successfully',
      orderId: id
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete an order (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', isAdmin, [
  param('id').isInt().withMessage('Order ID must be a number')
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = req.db;
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Delete related appointments
      await transaction.request()
        .input('orderId', id)
        .query('DELETE FROM Appointments WHERE OrderId = @orderId');
        
      // Delete order
      const deleteResult = await transaction.request()
        .input('orderId', id)
        .query('DELETE FROM Orders WHERE OrderId = @orderId');
      
      if (deleteResult.rowsAffected[0] === 0) {
        throw new ApiError(404, 'Order not found');
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.json({ message: 'Order deleted successfully' });
    } catch (err) {
      // Rollback on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router; 