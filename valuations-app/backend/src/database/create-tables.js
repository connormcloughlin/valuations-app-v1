require('dotenv').config();
const sql = require('mssql');

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

// SQL to create tables
const createTablesSQL = `
-- Users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[Users] (
    [UserId] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(100) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL,
    [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [LastLoginDate] DATETIME NULL,
    [IsActive] BIT NOT NULL DEFAULT 1
  );
END

-- Clients table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[Clients] (
    [ClientId] INT PRIMARY KEY IDENTITY(1,1),
    [ClientName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(100) NULL,
    [Phone] NVARCHAR(20) NULL,
    [Address] NVARCHAR(255) NULL,
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [LastModifiedBy] INT NULL,
    [LastModifiedDate] DATETIME NULL,
    FOREIGN KEY ([CreatedBy]) REFERENCES [Users]([UserId]),
    FOREIGN KEY ([LastModifiedBy]) REFERENCES [Users]([UserId])
  );
END

-- Orders table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[Orders] (
    [OrderId] INT PRIMARY KEY IDENTITY(1,1),
    [ClientId] INT NOT NULL,
    [PolicyNumber] NVARCHAR(50) NOT NULL,
    [OrderType] NVARCHAR(20) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [LastModifiedBy] INT NULL,
    [LastModifiedDate] DATETIME NULL,
    FOREIGN KEY ([ClientId]) REFERENCES [Clients]([ClientId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [Users]([UserId]),
    FOREIGN KEY ([LastModifiedBy]) REFERENCES [Users]([UserId])
  );
END

-- Appointments table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Appointments]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[Appointments] (
    [AppointmentId] INT PRIMARY KEY IDENTITY(1,1),
    [OrderId] INT NOT NULL,
    [SurveyorId] INT NOT NULL,
    [AppointmentDate] DATE NOT NULL,
    [AppointmentTime] TIME NOT NULL,
    [Duration] INT NOT NULL DEFAULT 60,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [LastModifiedBy] INT NULL,
    [LastModifiedDate] DATETIME NULL,
    FOREIGN KEY ([OrderId]) REFERENCES [Orders]([OrderId]),
    FOREIGN KEY ([SurveyorId]) REFERENCES [Users]([UserId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [Users]([UserId]),
    FOREIGN KEY ([LastModifiedBy]) REFERENCES [Users]([UserId])
  );
END

-- InventoryItems table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[InventoryItems] (
    [ItemId] INT PRIMARY KEY IDENTITY(1,1),
    [AppointmentId] INT NOT NULL,
    [Room] NVARCHAR(50) NULL,
    [ItemName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Category] NVARCHAR(50) NULL,
    [Quantity] INT NOT NULL DEFAULT 1,
    [EstimatedValue] DECIMAL(18,2) NULL,
    [PhotoUrl] NVARCHAR(255) NULL,
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [LastModifiedBy] INT NULL,
    [LastModifiedDate] DATETIME NULL,
    FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments]([AppointmentId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [Users]([UserId]),
    FOREIGN KEY ([LastModifiedBy]) REFERENCES [Users]([UserId])
  );
END

-- Reports table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[Reports] (
    [ReportId] INT PRIMARY KEY IDENTITY(1,1),
    [OrderId] INT NOT NULL,
    [ReportType] NVARCHAR(20) NOT NULL,
    [ReportFilename] NVARCHAR(255) NOT NULL,
    [ReportUrl] NVARCHAR(255) NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Processing',
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [CompletedDate] DATETIME NULL,
    [LastModifiedBy] INT NULL,
    [LastModifiedDate] DATETIME NULL,
    FOREIGN KEY ([OrderId]) REFERENCES [Orders]([OrderId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [Users]([UserId]),
    FOREIGN KEY ([LastModifiedBy]) REFERENCES [Users]([UserId])
  );
END

-- Create sample admin user if no users exist
IF NOT EXISTS (SELECT * FROM [Users])
BEGIN
  -- Password: Admin123! (hashed)
  INSERT INTO [Users] ([Name], [Email], [PasswordHash], [Role], [CreatedDate])
  VALUES ('Admin', 'admin@valuationsapp.com', '$2a$10$JmIi8kHfJ2F6Z1Z5tZ9Xh.6lgQz1ZAuGdRl5bZY5Z9eR8oZXvZJXi', 'admin', GETDATE());
END
`;

// Connect to SQL Server and create tables
async function setupDatabase() {
  try {
    // Connect to database
    const pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server');

    // Execute create tables query
    await pool.request().query(createTablesSQL);
    console.log('Database tables created or verified');

    await sql.close();
    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase(); 