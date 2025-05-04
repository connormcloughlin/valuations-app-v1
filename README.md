# Valuations App

A comprehensive solution for managing property valuations, surveys, and assessments.

## Overview

This application allows for:
- Managing client orders for different types of valuations (building, contents, or both)
- Scheduling and managing appointments for surveyors
- Conducting on-site valuations using mobile/tablet interfaces
- Generating reports based on collected data

## Project Structure

- `valuations-app/web/` - Web interface for administrators and office staff
- `valuations-app/mobile/` - Mobile app for surveyors (smartphone optimized)
- `valuations-app/mobile-tablet/` - Tablet-optimized interface for surveyors
- `valuations-app/backend/` - API and server-side logic
- `valuations-app/database/` - Database schema and migrations

## Setup Instructions

### Prerequisites
- Node.js v16+
- npm or yarn
- SQL Server database

### Installation

1. Clone the repository
```
git clone <repository-url>
cd valuations-app-v1
```

2. Install dependencies for each component
```
# Backend
cd valuations-app/backend
npm install

# Web
cd ../web
npm install

# Mobile
cd ../mobile
npm install
```

3. Set up environment variables
Create `.env` files in the respective directories with the necessary configuration.

4. Initialize the database
Run the schema creation script found in `valuations-app/database/schema.sql`

### Configuration and Secrets

The application uses several configuration files that contain sensitive information:

#### Backend Configuration
- Copy `valuations-app/backend/config.template.js` to `valuations-app/backend/config.js`
- Fill in your database credentials and JWT secret

#### Web Configuration
- Copy `valuations-app/web/src/authConfig.template.js` to `valuations-app/web/src/authConfig.js`
- Fill in your Azure AD credentials or other authentication details

#### Environment Variables
- Create `.env` files in each component directory based on provided templates
- The backend `.env` file should include database credentials and JWT secrets
- The web `.env` file might include API endpoints and feature flags
- Mobile app configurations may include API endpoints and authentication details

**Important:** Never commit the real configuration files or `.env` files to the repository. These files are included in `.gitignore` to prevent accidental exposure of secrets.

### Running the Application

#### Backend
```
cd valuations-app/backend
npm run dev
```

#### Web Interface
```
cd valuations-app/web
npm run dev
```

#### Mobile App
```
cd valuations-app/mobile
npm run start
```

## Features

- Multiple valuation types (building, contents, both)
- Appointment scheduling and management
- Mobile data collection for surveyors
- Comprehensive reporting
- Client management

## License

[Specify license information] 