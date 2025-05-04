const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @route   GET /api/clients
 * @desc    Get all clients with pagination and search
 * @access  Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
], async (req, res, next) => {
  try {
    // Validate query params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pool = req.db;
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query
    let countQuery = 'SELECT COUNT(*) AS total FROM Clients';
    let dataQuery = 'SELECT * FROM Clients';
    
    // Add search condition if provided
    const params = {};
    if (search) {
      const searchCondition = "ClientName LIKE @search OR Email LIKE @search OR Phone LIKE @search";
      countQuery += ` WHERE ${searchCondition}`;
      dataQuery += ` WHERE ${searchCondition}`;
      params.search = `%${search}%`;
    }
    
    // Add pagination and sorting
    dataQuery += ' ORDER BY ClientName OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    params.offset = offset;
    params.limit = parseInt(limit);
    
    // Execute queries
    const countRequest = pool.request();
    const dataRequest = pool.request();
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      countRequest.input(key, value);
      dataRequest.input(key, value);
    });
    
    // Get total count and data
    const countResult = await countRequest.query(countQuery);
    const dataResult = await dataRequest.query(dataQuery);
    
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      clients: dataResult.recordset,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID with their orders
 * @access  Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('Client ID must be a number')
], async (req, res, next) => {
  try {
    // Validate params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pool = req.db;
    const { id } = req.params;
    
    // Get client details
    const clientQuery = await pool.request()
      .input('id', id)
      .query('SELECT * FROM Clients WHERE ClientId = @id');
    
    if (clientQuery.recordset.length === 0) {
      throw new ApiError(404, 'Client not found');
    }
    
    const client = clientQuery.recordset[0];
    
    // Get client orders
    const ordersQuery = await pool.request()
      .input('clientId', id)
      .query(`
        SELECT OrderId, PolicyNumber, OrderType, Status, CreatedDate
        FROM Orders
        WHERE ClientId = @clientId
        ORDER BY CreatedDate DESC
      `);
    
    // Combine data
    const response = {
      ...client,
      orders: ordersQuery.recordset
    };
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Private
 */
router.post('/', [
  body('clientName').notEmpty().withMessage('Client name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('address').optional().isString(),
], async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientName, email, phone, address, notes } = req.body;
    const pool = req.db;
    
    // Check if client with same email already exists
    if (email) {
      const checkResult = await pool.request()
        .input('email', email)
        .query('SELECT ClientId FROM Clients WHERE Email = @email');
      
      if (checkResult.recordset.length > 0) {
        return res.status(400).json({ 
          message: 'A client with this email already exists',
          clientId: checkResult.recordset[0].ClientId
        });
      }
    }
    
    // Create new client
    const result = await pool.request()
      .input('clientName', clientName)
      .input('email', email)
      .input('phone', phone)
      .input('address', address)
      .input('notes', notes)
      .input('userId', req.user.id)
      .query(`
        INSERT INTO Clients (
          ClientName, Email, Phone, Address, Notes, 
          CreatedBy, CreatedDate
        )
        VALUES (
          @clientName, @email, @phone, @address, @notes, 
          @userId, GETDATE()
        );
        SELECT SCOPE_IDENTITY() as ClientId
      `);
    
    const clientId = result.recordset[0].ClientId;
    
    res.status(201).json({
      message: 'Client created successfully',
      clientId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/clients/:id
 * @desc    Update an existing client
 * @access  Private
 */
router.put('/:id', [
  param('id').isInt().withMessage('Client ID must be a number'),
  body('clientName').optional().notEmpty().withMessage('Client name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
], async (req, res, next) => {
  try {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { clientName, email, phone, address, notes } = req.body;
    const pool = req.db;
    
    // Check if client exists
    const checkResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM Clients WHERE ClientId = @id');
    
    if (checkResult.recordset.length === 0) {
      throw new ApiError(404, 'Client not found');
    }
    
    // Check email uniqueness if changing email
    if (email) {
      const emailCheck = await pool.request()
        .input('email', email)
        .input('id', id)
        .query('SELECT ClientId FROM Clients WHERE Email = @email AND ClientId != @id');
      
      if (emailCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Email already in use by another client' });
      }
    }
    
    // Build update query
    let query = 'UPDATE Clients SET ';
    const updates = [];
    const inputs = { id };
    
    if (clientName) {
      updates.push('ClientName = @clientName');
      inputs.clientName = clientName;
    }
    
    if (email !== undefined) {
      updates.push('Email = @email');
      inputs.email = email;
    }
    
    if (phone !== undefined) {
      updates.push('Phone = @phone');
      inputs.phone = phone;
    }
    
    if (address !== undefined) {
      updates.push('Address = @address');
      inputs.address = address;
    }
    
    if (notes !== undefined) {
      updates.push('Notes = @notes');
      inputs.notes = notes;
    }
    
    // Add last updated info
    updates.push('LastModifiedBy = @userId, LastModifiedDate = GETDATE()');
    inputs.userId = req.user.id;
    
    query += updates.join(', ') + ' WHERE ClientId = @id';
    
    // Execute update
    const request = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    await request.query(query);
    
    res.json({ 
      message: 'Client updated successfully',
      clientId: id
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/clients/search
 * @desc    Search clients by name, email, or phone
 * @access  Private
 */
router.get('/search', [
  query('term').notEmpty().withMessage('Search term is required'),
], async (req, res, next) => {
  try {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { term } = req.query;
    const pool = req.db;
    
    const result = await pool.request()
      .input('term', `%${term}%`)
      .query(`
        SELECT TOP 10 ClientId, ClientName, Email, Phone, Address
        FROM Clients
        WHERE 
          ClientName LIKE @term OR
          Email LIKE @term OR
          Phone LIKE @term
        ORDER BY ClientName
      `);
    
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 