-- Users table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL, -- office, surveyor, admin
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Clients table
CREATE TABLE Clients (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    contact_info NVARCHAR(255),
    address NVARCHAR(255)
);

-- Orders table
CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    ClientName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(200) NOT NULL,
    PolicyNumber NVARCHAR(50) NOT NULL,
    OrderType NVARCHAR(20) NOT NULL CHECK (OrderType IN ('broker', 'insurer', 'private')),
    Status NVARCHAR(50) NOT NULL,
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE()
);

-- Surveyors table
CREATE TABLE Surveyors (
    SurveyorId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    Specializations NVARCHAR(MAX),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Appointments table
CREATE TABLE Appointments (
    AppointmentId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    SurveyorId INT NOT NULL,
    AppointmentDate DATETIME NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    FOREIGN KEY (SurveyorId) REFERENCES Surveyors(SurveyorId)
);

-- Items table
CREATE TABLE Items (
    ItemId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    ItemName NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    EstimatedValue DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);

-- Reports table
CREATE TABLE Reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    report_url NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(OrderId)
);

-- Create Indexes
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Appointments_SurveyorId ON Appointments(SurveyorId);
CREATE INDEX IX_Appointments_OrderId ON Appointments(OrderId);
CREATE INDEX IX_Items_OrderId ON Items(OrderId);
CREATE INDEX IX_Items_Category ON Items(Category);
CREATE INDEX IX_Items_Status ON Items(Status); 