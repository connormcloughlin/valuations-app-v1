const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');
const { isAdmin, isSurveyor } = require('../middleware/auth');

/**
 * @route   GET /api/reports
 * @desc    Get all reports with filtering
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const pool = req.db;
    const { orderId, status, startDate, endDate, clientId, limit = 50 } = req.query;
    
    // Build dynamic query based on filters
    let query = `
      SELECT r.*, o.PolicyNumber, o.OrderType, c.ClientName
      FROM Reports r
      JOIN Orders o ON r.OrderId = o.OrderId
      JOIN Clients c ON o.ClientId = c.ClientId
    `;
    
    const conditions = [];
    const inputs = {};
    
    if (orderId) {
      conditions.push('r.OrderId = @orderId');
      inputs.orderId = orderId;
    }
    
    if (status) {
      conditions.push('r.Status = @status');
      inputs.status = status;
    }
    
    if (clientId) {
      conditions.push('o.ClientId = @clientId');
      inputs.clientId = clientId;
    }
    
    if (startDate) {
      conditions.push('r.CreatedDate >= @startDate');
      inputs.startDate = new Date(startDate);
    }
    
    if (endDate) {
      conditions.push('r.CreatedDate <= @endDate');
      inputs.endDate = new Date(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY r.CreatedDate DESC';
    
    // Add limit
    query += ' OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY';
    inputs.limit = parseInt(limit);
    
    // Execute query
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
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('Report ID must be a number')
], async (req, res, next) => {
  try {
    // Validate params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pool = req.db;
    const { id } = req.params;
    
    // Get report details
    const reportQuery = await pool.request()
      .input('id', id)
      .query(`
        SELECT r.*, o.PolicyNumber, o.OrderType, c.ClientName, c.Address
        FROM Reports r
        JOIN Orders o ON r.OrderId = o.OrderId
        JOIN Clients c ON o.ClientId = c.ClientId
        WHERE r.ReportId = @id
      `);
    
    if (reportQuery.recordset.length === 0) {
      throw new ApiError(404, 'Report not found');
    }
    
    const report = reportQuery.recordset[0];
    
    // Get inventory items for the report
    const itemsQuery = await pool.request()
      .input('orderId', report.OrderId)
      .query(`
        SELECT i.*, a.AppointmentDate 
        FROM InventoryItems i
        JOIN Appointments a ON i.AppointmentId = a.AppointmentId
        WHERE a.OrderId = @orderId
        ORDER BY a.AppointmentDate, i.Room, i.ItemName
      `);
    
    // Calculate total value
    let totalValue = 0;
    itemsQuery.recordset.forEach(item => {
      if (item.EstimatedValue) {
        totalValue += parseFloat(item.EstimatedValue);
      }
    });
    
    // Combine data
    const response = {
      ...report,
      totalValue,
      items: itemsQuery.recordset
    };
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/reports/generate
 * @desc    Generate a new report for an order
 * @access  Private (Surveyor or Admin)
 */
router.post('/generate', [
  body('orderId').isInt().withMessage('Order ID is required'),
  body('reportType').isIn(['valuation', 'inventory', 'insurance']).withMessage('Invalid report type'),
  body('notes').optional().isString(),
], async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, reportType, notes } = req.body;
    const pool = req.db;
    
    // Check if order exists
    const orderCheck = await pool.request()
      .input('orderId', orderId)
      .query(`
        SELECT o.*, c.ClientName
        FROM Orders o
        JOIN Clients c ON o.ClientId = c.ClientId
        WHERE o.OrderId = @orderId
      `);
    
    if (orderCheck.recordset.length === 0) {
      throw new ApiError(404, 'Order not found');
    }
    
    const order = orderCheck.recordset[0];
    
    // Check if inventory items exist for this order
    const itemCheck = await pool.request()
      .input('orderId', orderId)
      .query(`
        SELECT COUNT(*) as ItemCount
        FROM InventoryItems i
        JOIN Appointments a ON i.AppointmentId = a.AppointmentId
        WHERE a.OrderId = @orderId
      `);
    
    if (itemCheck.recordset[0].ItemCount === 0) {
      throw new ApiError(400, 'Cannot generate report: No inventory items found for this order');
    }
    
    // Generate report filename
    const reportDate = new Date().toISOString().split('T')[0];
    const reportFilename = `${reportType.toUpperCase()}_${order.ClientName.replace(/\s+/g, '_')}_${reportDate}.pdf`;
    
    // Create the report record
    const result = await pool.request()
      .input('orderId', orderId)
      .input('reportType', reportType)
      .input('reportFilename', reportFilename)
      .input('status', 'Processing')
      .input('notes', notes)
      .input('userId', req.user.id)
      .query(`
        INSERT INTO Reports (
          OrderId, ReportType, ReportFilename, Status,
          Notes, CreatedBy, CreatedDate
        )
        VALUES (
          @orderId, @reportType, @reportFilename, @status,
          @notes, @userId, GETDATE()
        );
        SELECT SCOPE_IDENTITY() as ReportId
      `);
    
    const reportId = result.recordset[0].ReportId;
    
    // In a real system, this is where you'd queue the report generation job
    // For now, we'll simulate it by updating the status after a delay
    setTimeout(async () => {
      try {
        await pool.request()
          .input('reportId', reportId)
          .input('reportUrl', `/reports/${reportFilename}`)
          .query(`
            UPDATE Reports
            SET Status = 'Completed', ReportUrl = @reportUrl, CompletedDate = GETDATE()
            WHERE ReportId = @reportId
          `);
      } catch (error) {
        console.error('Error updating report status:', error);
      }
    }, 5000);
    
    res.status(201).json({
      message: 'Report generation started',
      reportId,
      status: 'Processing'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/reports/:id
 * @desc    Update report status or details
 * @access  Private (Admin)
 */
router.put('/:id', isAdmin, [
  param('id').isInt().withMessage('Report ID must be a number'),
  body('status').optional().isIn(['Processing', 'Completed', 'Failed']).withMessage('Invalid status'),
], async (req, res, next) => {
  try {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes, reportUrl } = req.body;
    const pool = req.db;
    
    // Check if report exists
    const checkResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM Reports WHERE ReportId = @id');
    
    if (checkResult.recordset.length === 0) {
      throw new ApiError(404, 'Report not found');
    }
    
    // Build update query
    let query = 'UPDATE Reports SET ';
    const updates = [];
    const inputs = { id };
    
    if (status) {
      updates.push('Status = @status');
      inputs.status = status;
      
      // If status is completed, add completion date
      if (status === 'Completed') {
        updates.push('CompletedDate = GETDATE()');
      }
    }
    
    if (notes !== undefined) {
      updates.push('Notes = @notes');
      inputs.notes = notes;
    }
    
    if (reportUrl) {
      updates.push('ReportUrl = @reportUrl');
      inputs.reportUrl = reportUrl;
    }
    
    // Add last updated info
    updates.push('LastModifiedBy = @userId, LastModifiedDate = GETDATE()');
    inputs.userId = req.user.id;
    
    query += updates.join(', ') + ' WHERE ReportId = @id';
    
    // Execute update
    const request = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    await request.query(query);
    
    res.json({ 
      message: 'Report updated successfully',
      reportId: id
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 