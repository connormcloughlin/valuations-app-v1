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

// Get appointments list view with filtering and pagination
router.get('/list-view', async (req, res) => {
  try {
    const pool = req.db;
    const {
      inviteStatus,
      orderId,
      clientsName,
      location,
      surveyor,
      client,
      title,
      email,
      phoneNo,
      cell,
      region,
      city,
      orderStatus,
      startDateFrom,
      startDateTo,
      page = 1,
      pageSize = 20
    } = req.query;

    // Build dynamic query based on filters
    let query = `
      SELECT 
        a.AppointmentId as AppointmentID,
        a.OrderId as OrderID,
        CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) as Start_Time,
        DATEADD(MINUTE, a.Duration, CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME)) as End_Time,
        NULL as Follow_Up_Date,
        NULL as Arrival_Time,
        NULL as Departure_Time,
        a.Status as Invite_Status,
        a.Status as Meeting_Status,
        o.Address as Location,
        a.Notes as Comments,
        'Valuation' as Category,
        'No' as Outoftown,
        a.Notes as surveyor_comments,
        NULL as event_id,
        u.Email as surveyoremail,
        a.LastModifiedDate as date_modified,
        o.Status as 'Order Status',
        o.PolicyNumber as Policy,
        c.ClientName as ClientsName,
        c.ClientId as ClientID,
        c.ClientName as Client,
        NULL as Title,
        NULL as TitleID,
        c.Phone as Cell,
        c.Phone as PhoneNo,
        c.Email as Email,
        NULL as Initials,
        o.CreatedBy as 'Requested By',
        u.Name as Surveyor,
        NULL as 'PO No',
        NULL as 'PO No 2',
        o.CreatedBy as CapturedBy,
        o.SumInsured as 'Sum Insured',
        o.CreatedBy as RequestedBy,
        o.Address as FullAddress,
        NULL as Region,
        NULL as City,
        u.UserId as SurveyorID,
        o.CreatedDate as Orderdate,
        o.LastModifiedDate as DateModified,
        o.CreatedDate as DateAdded,
        NULL as DateCompleted,
        NULL as Insurer,
        NULL as Broker,
        MONTH(o.CreatedDate) as Month,
        YEAR(o.CreatedDate) as Year
      FROM Appointments a
      JOIN Orders o ON a.OrderId = o.OrderId
      JOIN Clients c ON o.ClientId = c.ClientId
      LEFT JOIN Users u ON a.SurveyorId = u.UserId
    `;
    
    const conditions = [];
    const inputs = {};

    if (inviteStatus) {
      conditions.push('a.Status = @inviteStatus');
      inputs.inviteStatus = inviteStatus;
    }
    
    if (orderId) {
      conditions.push('a.OrderId = @orderId');
      inputs.orderId = parseInt(orderId);
    }
    
    if (clientsName) {
      conditions.push('c.ClientName LIKE @clientsName');
      inputs.clientsName = `%${clientsName}%`;
    }
    
    if (location) {
      conditions.push('o.Address LIKE @location');
      inputs.location = `%${location}%`;
    }
    
    if (surveyor) {
      conditions.push('u.Name LIKE @surveyor');
      inputs.surveyor = `%${surveyor}%`;
    }
    
    if (client) {
      conditions.push('c.ClientName LIKE @client');
      inputs.client = `%${client}%`;
    }
    
    if (title) {
      conditions.push('c.ClientName LIKE @title');
      inputs.title = `%${title}%`;
    }
    
    if (email) {
      conditions.push('c.Email LIKE @email');
      inputs.email = `%${email}%`;
    }
    
    if (phoneNo) {
      conditions.push('c.Phone LIKE @phoneNo');
      inputs.phoneNo = `%${phoneNo}%`;
    }
    
    if (cell) {
      conditions.push('c.Phone LIKE @cell');
      inputs.cell = `%${cell}%`;
    }
    
    if (region) {
      conditions.push('o.Address LIKE @region');
      inputs.region = `%${region}%`;
    }
    
    if (city) {
      conditions.push('o.Address LIKE @city');
      inputs.city = `%${city}%`;
    }
    
    if (orderStatus) {
      conditions.push('o.Status = @orderStatus');
      inputs.orderStatus = orderStatus;
    }
    
    if (startDateFrom) {
      conditions.push('CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) >= @startDateFrom');
      inputs.startDateFrom = new Date(startDateFrom);
    }
    
    if (startDateTo) {
      conditions.push('CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) <= @startDateTo');
      inputs.startDateTo = new Date(startDateTo);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) DESC';
    
    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countRequest = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      countRequest.input(key, value);
    });
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    query += ' OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY';
    inputs.offset = offset;
    inputs.pageSize = parseInt(pageSize);
    
    // Execute main query
    const request = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    res.json({
      data: result.recordset,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages
    });
  } catch (err) {
    console.error('Error in /list-view endpoint:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve appointment list view data',
      details: err.message 
    });
  }
});

// POST version of list-view for request body filtering
router.post('/list-view', async (req, res) => {
  try {
    const pool = req.db;
    const {
      inviteStatus,
      orderId,
      clientsName,
      location,
      surveyor,
      client,
      title,
      email,
      phoneNo,
      cell,
      region,
      city,
      orderStatus,
      startDateFrom,
      startDateTo,
      page = 1,
      pageSize = 20
    } = req.body;

    // Build dynamic query based on filters
    let query = `
      SELECT 
        a.AppointmentId as AppointmentID,
        a.OrderId as OrderID,
        CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) as Start_Time,
        DATEADD(MINUTE, a.Duration, CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME)) as End_Time,
        NULL as Follow_Up_Date,
        NULL as Arrival_Time,
        NULL as Departure_Time,
        a.Status as Invite_Status,
        a.Status as Meeting_Status,
        o.Address as Location,
        a.Notes as Comments,
        'Valuation' as Category,
        'No' as Outoftown,
        a.Notes as surveyor_comments,
        NULL as event_id,
        u.Email as surveyoremail,
        a.LastModifiedDate as date_modified,
        o.Status as 'Order Status',
        o.PolicyNumber as Policy,
        c.ClientName as ClientsName,
        c.ClientId as ClientID,
        c.ClientName as Client,
        NULL as Title,
        NULL as TitleID,
        c.Phone as Cell,
        c.Phone as PhoneNo,
        c.Email as Email,
        NULL as Initials,
        o.CreatedBy as 'Requested By',
        u.Name as Surveyor,
        NULL as 'PO No',
        NULL as 'PO No 2',
        o.CreatedBy as CapturedBy,
        o.SumInsured as 'Sum Insured',
        o.CreatedBy as RequestedBy,
        o.Address as FullAddress,
        NULL as Region,
        NULL as City,
        u.UserId as SurveyorID,
        o.CreatedDate as Orderdate,
        o.LastModifiedDate as DateModified,
        o.CreatedDate as DateAdded,
        NULL as DateCompleted,
        NULL as Insurer,
        NULL as Broker,
        MONTH(o.CreatedDate) as Month,
        YEAR(o.CreatedDate) as Year
      FROM Appointments a
      JOIN Orders o ON a.OrderId = o.OrderId
      JOIN Clients c ON o.ClientId = c.ClientId
      LEFT JOIN Users u ON a.SurveyorId = u.UserId
    `;
    
    const conditions = [];
    const inputs = {};

    if (inviteStatus) {
      conditions.push('a.Status = @inviteStatus');
      inputs.inviteStatus = inviteStatus;
    }
    
    if (orderId) {
      conditions.push('a.OrderId = @orderId');
      inputs.orderId = parseInt(orderId);
    }
    
    if (clientsName) {
      conditions.push('c.ClientName LIKE @clientsName');
      inputs.clientsName = `%${clientsName}%`;
    }
    
    if (location) {
      conditions.push('o.Address LIKE @location');
      inputs.location = `%${location}%`;
    }
    
    if (surveyor) {
      conditions.push('u.Name LIKE @surveyor');
      inputs.surveyor = `%${surveyor}%`;
    }
    
    if (client) {
      conditions.push('c.ClientName LIKE @client');
      inputs.client = `%${client}%`;
    }
    
    if (title) {
      conditions.push('c.ClientName LIKE @title');
      inputs.title = `%${title}%`;
    }
    
    if (email) {
      conditions.push('c.Email LIKE @email');
      inputs.email = `%${email}%`;
    }
    
    if (phoneNo) {
      conditions.push('c.Phone LIKE @phoneNo');
      inputs.phoneNo = `%${phoneNo}%`;
    }
    
    if (cell) {
      conditions.push('c.Phone LIKE @cell');
      inputs.cell = `%${cell}%`;
    }
    
    if (region) {
      conditions.push('o.Address LIKE @region');
      inputs.region = `%${region}%`;
    }
    
    if (city) {
      conditions.push('o.Address LIKE @city');
      inputs.city = `%${city}%`;
    }
    
    if (orderStatus) {
      conditions.push('o.Status = @orderStatus');
      inputs.orderStatus = orderStatus;
    }
    
    if (startDateFrom) {
      conditions.push('CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) >= @startDateFrom');
      inputs.startDateFrom = new Date(startDateFrom);
    }
    
    if (startDateTo) {
      conditions.push('CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) <= @startDateTo');
      inputs.startDateTo = new Date(startDateTo);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY CAST(a.AppointmentDate AS DATETIME) + CAST(a.AppointmentTime AS DATETIME) DESC';
    
    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countRequest = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      countRequest.input(key, value);
    });
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    query += ' OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY';
    inputs.offset = offset;
    inputs.pageSize = parseInt(pageSize);
    
    // Execute main query
    const request = pool.request();
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    res.json({
      data: result.recordset,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages
    });
  } catch (err) {
    console.error('Error in POST /list-view endpoint:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve appointment list view data',
      details: err.message 
    });
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