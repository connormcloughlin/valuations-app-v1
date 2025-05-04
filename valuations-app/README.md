# Valuations App

A comprehensive web and mobile application for managing household content valuations, appointments, and inventory.

## Features

- Order management for brokers, insurers, and private clients
- Appointment scheduling and management
- Surveyor management and assignment
- Inventory item tracking and valuation
- Mobile app for surveyors to capture inventory on-site
- Real-time updates and notifications
- Report generation and client management
- User authentication and role-based access control

## Tech Stack

### Backend
- Node.js with Express
- Azure SQL Database
- JWT authentication
- RESTful API with Swagger documentation
- Error handling middleware
- Data validation

### Web Frontend
- React
- Material-UI
- React Router
- Axios for API calls

### Mobile App
- React Native
- Expo
- Offline capabilities
- Secure storage

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Azure SQL Database
- Azure account for hosting

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_SERVER=your_server.database.windows.net
   DB_NAME=valuations_db
   DB_PORT=1433
   
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=8h
   
   LOG_LEVEL=info
   CORS_ORIGIN=http://localhost:3000
   
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   ```

4. Create the database tables:
   ```bash
   npm run db:create
   ```

5. Start the server:
   ```bash
   npm start
   ```

6. For development with auto-reload:
   ```bash
   npm run dev
   ```

### Web Frontend Setup
1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Mobile App Setup
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

## Usage

### Web Application
- Access the web application at `http://localhost:3000`
- Login with your credentials
- Manage orders, appointments, and inventory items
- Generate reports and track valuations

### Mobile Application
- Install the Expo Go app on your mobile device
- Scan the QR code from the Expo development server
- Login with your surveyor credentials
- Capture inventory items during site visits
- Submit completed surveys to the office

## API Documentation

The backend API provides comprehensive endpoints for all app features:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Orders
- `GET /api/orders` - Get all orders (with filtering)
- `GET /api/orders/:id` - Get a specific order with related data
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order (admin only)

### Clients
- `GET /api/clients` - Get all clients (with pagination and search)
- `GET /api/clients/:id` - Get a client with their orders
- `POST /api/clients` - Create a new client
- `PUT /api/clients/:id` - Update a client
- `GET /api/clients/search` - Search clients

### Appointments
- `GET /api/appointments` - Get all appointments (with filtering)
- `GET /api/appointments/:id` - Get an appointment with details
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update an appointment
- `PUT /api/appointments/:id/status` - Update appointment status

### Inventory Items
- `GET /api/items` - Get inventory items (with filtering)
- `GET /api/items/:id` - Get a specific item
- `POST /api/items` - Add a new item
- `PUT /api/items/:id` - Update an item
- `DELETE /api/items/:id` - Delete an item
- `POST /api/items/bulk` - Bulk upload items

### Reports
- `GET /api/reports` - Get all reports (with filtering)
- `GET /api/reports/:id` - Get a specific report with inventory
- `POST /api/reports/generate` - Generate a new report
- `PUT /api/reports/:id` - Update report status (admin)

## API Documentation

The API is fully documented using Swagger. When the backend is running, access the documentation at:

```
http://localhost:5000/api-docs
```

## Database Schema

The application uses the following key tables:
- Users - User management and authentication
- Clients - Client information
- Orders - Valuation order details
- Appointments - Scheduled surveyor appointments
- InventoryItems - Items cataloged during assessments
- Reports - Generated valuation reports

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 