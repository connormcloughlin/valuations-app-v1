# API Specifications for Valuations Management System

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Order Management APIs](#order-management-apis)
4. [Appointment Management APIs](#appointment-management-apis)
5. [Client Management APIs](#client-management-apis)
6. [Quality Assurance APIs](#quality-assurance-apis)
7. [Pricing APIs](#pricing-apis)
8. [Report Management APIs](#report-management-apis)
9. [Survey Management APIs](#survey-management-apis)
10. [Media Management APIs](#media-management-apis)
11. [User Management APIs](#user-management-apis)
12. [Notification APIs](#notification-apis)
13. [Analytics APIs](#analytics-apis)
14. [Error Handling](#error-handling)
15. [Rate Limiting](#rate-limiting)

---

## Overview

**Base URL**: `https://api.valuations.com/v1`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`  
**API Version**: 1.0

### Response Format
All API responses follow this standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-string"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-string"
}
```

---

## Authentication

### POST /auth/login
**Description**: Authenticate user with Azure AD  
**Public**: Yes

**Request Body**:
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": 1,
      "email": "user@company.com",
      "role": "office_manager",
      "permissions": ["orders:read", "orders:write"]
    }
  }
}
```

### POST /auth/refresh
**Description**: Refresh access token  
**Public**: Yes

**Request Body**:
```json
{
  "refreshToken": "refresh-token-here"
}
```

### POST /auth/logout
**Description**: Logout user and invalidate tokens  
**Authorization**: Required

---

## Order Management APIs

### GET /orders
**Description**: Get orders with filtering and pagination  
**Authorization**: Required  
**Permissions**: `orders:read`

**Query Parameters**:
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `status` (string): Filter by status
- `clientId` (integer): Filter by client ID
- `surveyorId` (integer): Filter by surveyor ID
- `startDate` (string, ISO 8601): Filter by start date
- `endDate` (string, ISO 8601): Filter by end date
- `priority` (string): Filter by priority (urgent, standard, extended)
- `orderType` (string): Filter by order type (building, contents, both)
- `search` (string): Search in order number, client name, address

**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "ORD-2024-001",
        "clientId": 1,
        "clientName": "John Smith",
        "address": "123 Main St, City, Country",
        "policyNumber": "POL-123456",
        "orderType": "building",
        "priority": "standard",
        "status": "pending",
        "dueDate": "2024-03-15T00:00:00Z",
        "createdDate": "2024-03-01T10:00:00Z",
        "updatedDate": "2024-03-01T10:00:00Z",
        "assignedSurveyor": {
          "id": 1,
          "name": "Jane Surveyor"
        },
        "estimatedValue": 250000.00,
        "notes": "Standard residential valuation"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### GET /orders/{id}
**Description**: Get order details by ID  
**Authorization**: Required  
**Permissions**: `orders:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-2024-001",
    "client": {
      "id": 1,
      "name": "John Smith",
      "email": "john@email.com",
      "phone": "+1234567890",
      "address": "123 Main St, City, Country"
    },
    "property": {
      "address": "123 Main St, City, Country",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "type": "residential",
      "bedrooms": 3,
      "bathrooms": 2,
      "squareFootage": 1500
    },
    "orderDetails": {
      "policyNumber": "POL-123456",
      "orderType": "building",
      "priority": "standard",
      "status": "pending",
      "dueDate": "2024-03-15T00:00:00Z",
      "estimatedValue": 250000.00,
      "notes": "Standard residential valuation"
    },
    "appointments": [
      {
        "id": 1,
        "date": "2024-03-10T10:00:00Z",
        "status": "scheduled",
        "surveyor": {
          "id": 1,
          "name": "Jane Surveyor"
        }
      }
    ],
    "documents": [
      {
        "id": 1,
        "name": "Insurance Policy",
        "url": "https://storage.com/doc1.pdf",
        "uploadDate": "2024-03-01T10:00:00Z"
      }
    ]
  }
}
```

### POST /orders
**Description**: Create a new order  
**Authorization**: Required  
**Permissions**: `orders:write`

**Request Body**:
```json
{
  "clientId": 1,
  "policyNumber": "POL-123456",
  "orderType": "building",
  "priority": "standard",
  "dueDate": "2024-03-15T00:00:00Z",
  "estimatedValue": 250000.00
}
```

### PUT /orders/{id}
**Description**: Update order  
**Authorization**: Required  
**Permissions**: `orders:write`

### DELETE /orders/{id}
**Description**: Delete order (soft delete)  
**Authorization**: Required  
**Permissions**: `orders:delete`

### POST /orders/{id}/assign
**Description**: Assign surveyor to order  
**Authorization**: Required  
**Permissions**: `orders:assign`

**Request Body**:
```json
{
  "surveyorId": 1,
  "appointmentDate": "2024-03-10T10:00:00Z",
  "notes": "Standard appointment"
}
```

### POST /orders/bulk-update
**Description**: Bulk update orders  
**Authorization**: Required  
**Permissions**: `orders:write`

**Request Body**:
```json
{
  "orderIds": [1, 2, 3],
  "updates": {
    "status": "in_progress",
    "priority": "urgent"
  }
}
```

---

## Appointment Management APIs

### GET /appointments
**Description**: Get appointments with filtering  
**Authorization**: Required  
**Permissions**: `appointments:read`

**Query Parameters**:
- `page`, `limit`: Pagination
- `surveyorId`: Filter by surveyor
- `status`: Filter by status
- `date`: Filter by date
- `dateRange`: Filter by date range

**Response**:
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 1,
        "orderId": 1,
        "orderNumber": "ORD-2024-001",
        "client": {
          "name": "John Smith",
          "address": "123 Main St, City, Country"
        },
        "surveyor": {
          "id": 1,
          "name": "Jane Surveyor",
          "phone": "+1234567890"
        },
        "date": "2024-03-10T10:00:00Z",
        "status": "scheduled",
        "duration": 120,
        "notes": "Standard appointment",
        "location": {
          "address": "123 Main St, City, Country",
          "coordinates": {
            "latitude": 40.7128,
            "longitude": -74.0060
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### GET /appointments/calendar
**Description**: Get calendar view of appointments  
**Authorization**: Required  
**Permissions**: `appointments:read`

**Query Parameters**:
- `start`: Start date (ISO 8601)
- `end`: End date (ISO 8601)
- `surveyorId`: Filter by surveyor

**Response**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Valuation - John Smith",
        "start": "2024-03-10T10:00:00Z",
        "end": "2024-03-10T12:00:00Z",
        "color": "#4CAF50",
        "orderId": 1,
        "surveyorId": 1,
        "status": "scheduled"
      }
    ]
  }
}
```

### POST /appointments
**Description**: Create new appointment  
**Authorization**: Required  
**Permissions**: `appointments:write`

**Request Body**:
```json
{
  "orderId": 1,
  "surveyorId": 1,
  "date": "2024-03-10T10:00:00Z",
  "duration": 120,
  "notes": "Standard appointment",
  "notifyClient": true,
  "notifySurveyor": true
}
```

### PUT /appointments/{id}
**Description**: Update appointment  
**Authorization**: Required  
**Permissions**: `appointments:write`

### DELETE /appointments/{id}
**Description**: Cancel appointment  
**Authorization**: Required  
**Permissions**: `appointments:delete`

### POST /appointments/{id}/reschedule
**Description**: Reschedule appointment  
**Authorization**: Required  
**Permissions**: `appointments:write`

**Request Body**:
```json
{
  "newDate": "2024-03-11T10:00:00Z",
  "reason": "Client requested change",
  "notifyClient": true,
  "notifySurveyor": true
}
```

### GET /appointments/availability
**Description**: Get surveyor availability  
**Authorization**: Required  
**Permissions**: `appointments:read`

**Query Parameters**:
- `surveyorId`: Surveyor ID
- `date`: Date to check
- `duration`: Appointment duration in minutes

---

## Client Management APIs

### GET /clients
**Description**: Get clients with search and filtering  
**Authorization**: Required  
**Permissions**: `clients:read`

**Query Parameters**:
- `page`, `limit`: Pagination
- `search`: Search by name, email, or phone
- `status`: Filter by status

**Response**:
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": 1,
        "name": "John Smith",
        "email": "john@email.com",
        "phone": "+1234567890",
        "address": "123 Main St, City, Country",
        "status": "active",
        "totalOrders": 5,
        "totalValue": 1250000.00,
        "lastOrderDate": "2024-03-01T10:00:00Z",
        "createdDate": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 200,
      "pages": 10
    }
  }
}
```

### GET /clients/{id}
**Description**: Get client details  
**Authorization**: Required  
**Permissions**: `clients:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john@email.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country",
    "status": "active",
    "preferences": {
      "communicationMethod": "email",
      "language": "en",
      "timezone": "America/New_York"
    },
    "properties": [
      {
        "id": 1,
        "address": "123 Main St, City, Country",
        "type": "residential",
        "estimatedValue": 250000.00
      }
    ],
    "orders": [
      {
        "id": 1,
        "orderNumber": "ORD-2024-001",
        "status": "pending",
        "createdDate": "2024-03-01T10:00:00Z"
      }
    ],
    "communicationHistory": [
      {
        "id": 1,
        "type": "email",
        "subject": "Appointment Confirmation",
        "date": "2024-03-01T10:00:00Z",
        "status": "sent"
      }
    ]
  }
}
```

### POST /clients
**Description**: Create new client  
**Authorization**: Required  
**Permissions**: `clients:write`

**Request Body**:
```json
{
  "name": "John Smith",
  "email": "john@email.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country",
  "preferences": {
    "communicationMethod": "email",
    "language": "en",
    "timezone": "America/New_York"
  }
}
```

### PUT /clients/{id}
**Description**: Update client  
**Authorization**: Required  
**Permissions**: `clients:write`

### DELETE /clients/{id}
**Description**: Delete client (soft delete)  
**Authorization**: Required  
**Permissions**: `clients:delete`

---

## Quality Assurance APIs

### GET /qa/surveys
**Description**: Get surveys pending review  
**Authorization**: Required  
**Permissions**: `qa:read`

**Query Parameters**:
- `page`, `limit`: Pagination
- `status`: Filter by review status
- `surveyorId`: Filter by surveyor
- `priority`: Filter by priority

**Response**:
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": 1,
        "orderId": 1,
        "surveyorName": "Jane Surveyor",
        "completedDate": "2024-03-10T15:00:00Z",
        "reviewStatus": "pending",
        "itemsCount": 45,
        "photosCount": 120
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "pages": 2
    }
  }
}
```

### GET /qa/surveys/{id}
**Description**: Get survey details for review  
**Authorization**: Required  
**Permissions**: `qa:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 1,
    "orderNumber": "ORD-2024-001",
    "client": {
      "name": "John Smith",
      "address": "123 Main St, City, Country"
    },
    "surveyor": {
      "id": 1,
      "name": "Jane Surveyor",
      "email": "jane@company.com"
    },
    "surveyDetails": {
      "completedDate": "2024-03-10T15:00:00Z",
      "duration": 180,
      "itemsCount": 45,
      "photosCount": 120,
      "roomsCount": 8,
      "estimatedValue": 250000.00
    },
    "items": [
      {
        "id": 1,
        "category": "Electronics",
        "name": "Samsung TV",
        "description": "65 inch 4K Smart TV",
        "room": "Living Room",
        "quantity": 1,
        "estimatedValue": 1200.00,
        "condition": "Excellent",
        "photos": [
          {
            "id": 1,
            "url": "https://storage.com/photo1.jpg",
            "thumbnail": "https://storage.com/thumb1.jpg"
          }
        ],
        "notes": "Model: UN65TU7000"
      }
    ],
    "photos": [
      {
        "id": 1,
        "url": "https://storage.com/photo1.jpg",
        "thumbnail": "https://storage.com/thumb1.jpg",
        "room": "Living Room",
        "itemId": 1,
        "timestamp": "2024-03-10T14:30:00Z",
        "metadata": {
          "fileSize": 2048000,
          "dimensions": "1920x1080",
          "gpsCoordinates": "40.7128,-74.0060"
        }
      }
    ],
    "review": {
      "status": "pending",
      "assignedReviewer": null,
      "startedDate": null,
      "completedDate": null,
      "qualityScore": null,
      "comments": []
    }
  }
}
```

### POST /qa/surveys/{id}/assign
**Description**: Assign survey for review  
**Authorization**: Required  
**Permissions**: `qa:assign`

**Request Body**:
```json
{
  "reviewerId": 1,
  "priority": "standard",
  "dueDate": "2024-03-12T17:00:00Z",
  "notes": "Standard review required"
}
```

### POST /qa/surveys/{id}/review
**Description**: Submit survey review  
**Authorization**: Required  
**Permissions**: `qa:review`

**Request Body**:
```json
{
  "status": "approved",
  "qualityScore": 85,
  "comments": [
    {
      "type": "item",
      "itemId": 1,
      "message": "Price verification needed"
    }
  ]
}
```

### GET /qa/metrics
**Description**: Get quality assurance metrics  
**Authorization**: Required  
**Permissions**: `qa:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSurveys": 150,
      "pendingReviews": 25,
      "averageQualityScore": 87.5,
      "averageReviewTime": 45
    },
    "surveyorPerformance": [
      {
        "surveyorId": 1,
        "surveyorName": "Jane Surveyor",
        "totalSurveys": 30,
        "averageQualityScore": 90.2,
        "approvalRate": 95.5
      }
    ],
    "qualityTrends": [
      {
        "date": "2024-03-01",
        "averageScore": 88.5,
        "surveysReviewed": 10
      }
    ]
  }
}
```

---

## Pricing APIs

### GET /pricing/electronics
**Description**: Get electronics pricing data  
**Authorization**: Required  
**Permissions**: `pricing:read`

**Query Parameters**:
- `category`: Electronics category
- `brand`: Brand name
- `model`: Model name or number
- `condition`: Item condition

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "category": "Television",
        "brand": "Samsung",
        "model": "UN65TU7000",
        "description": "65 inch 4K Smart TV",
        "currentPrice": 1200.00,
        "originalPrice": 1500.00,
        "depreciation": 20,
        "condition": "Excellent",
        "marketTrend": "stable",
        "lastUpdated": "2024-03-01T10:00:00Z"
      }
    ]
  }
}
```

### GET /pricing/electronics/{id}
**Description**: Get detailed electronics pricing  
**Authorization**: Required  
**Permissions**: `pricing:read`

### POST /pricing/electronics/evaluate
**Description**: Evaluate electronics item pricing  
**Authorization**: Required  
**Permissions**: `pricing:evaluate`

**Request Body**:
```json
{
  "brand": "Samsung",
  "model": "UN65TU7000",
  "condition": "Good",
  "purchaseDate": "2022-01-01"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "estimatedValue": 1000.00,
    "confidence": 85,
    "originalPrice": 1500.00,
    "depreciation": 33.33
  }
}
```

### GET /pricing/artwork
**Description**: Get artwork pricing data  
**Authorization**: Required  
**Permissions**: `pricing:read`

### POST /pricing/artwork/evaluate
**Description**: Evaluate artwork pricing  
**Authorization**: Required  
**Permissions**: `pricing:evaluate`

**Request Body**:
```json
{
  "artist": "Pablo Picasso",
  "title": "Unknown Work",
  "medium": "Oil on Canvas",
  "dimensions": "24x36 inches",
  "year": 1960,
  "condition": "Excellent",
  "provenance": "Private Collection",
  "photos": [
    "https://storage.com/artwork1.jpg"
  ]
}
```

### GET /pricing/market-trends
**Description**: Get market trends data  
**Authorization**: Required  
**Permissions**: `pricing:read`

**Query Parameters**:
- `category`: Item category
- `period`: Time period (1m, 3m, 6m, 1y)

---

## Report Management APIs

### GET /reports
**Description**: Get generated reports  
**Authorization**: Required  
**Permissions**: `reports:read`

**Query Parameters**:
- `page`, `limit`: Pagination
- `orderId`: Filter by order
- `status`: Filter by status
- `type`: Filter by report type

**Response**:
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": 1,
        "orderId": 1,
        "orderNumber": "ORD-2024-001",
        "client": {
          "name": "John Smith"
        },
        "type": "valuation",
        "status": "completed",
        "generatedDate": "2024-03-11T10:00:00Z",
        "deliveredDate": "2024-03-11T15:00:00Z",
        "fileUrl": "https://storage.com/report1.pdf",
        "totalValue": 250000.00,
        "pageCount": 25
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### GET /reports/{id}
**Description**: Get report details  
**Authorization**: Required  
**Permissions**: `reports:read`

### POST /reports/generate
**Description**: Generate a new report  
**Authorization**: Required  
**Permissions**: `reports:generate`

**Request Body**:
```json
{
  "orderId": 1,
  "type": "valuation",
  "template": "standard_valuation",
  "deliveryMethod": "email"
}
```

### POST /reports/{id}/deliver
**Description**: Deliver report to client  
**Authorization**: Required  
**Permissions**: `reports:deliver`

**Request Body**:
```json
{
  "method": "email",
  "recipients": ["client@email.com"],
  "subject": "Your Valuation Report",
  "message": "Please find attached your valuation report."
}
```

### GET /reports/templates
**Description**: Get available report templates  
**Authorization**: Required  
**Permissions**: `reports:read`

---

## Survey Management APIs

### GET /surveys
**Description**: Get survey data  
**Authorization**: Required  
**Permissions**: `surveys:read`

### GET /surveys/{id}
**Description**: Get survey details  
**Authorization**: Required  
**Permissions**: `surveys:read`

### POST /surveys/{id}/sync
**Description**: Sync survey data from mobile  
**Authorization**: Required  
**Permissions**: `surveys:sync`

### GET /surveys/{id}/items
**Description**: Get survey items  
**Authorization**: Required  
**Permissions**: `surveys:read`

### POST /surveys/{id}/items
**Description**: Add survey item  
**Authorization**: Required  
**Permissions**: `surveys:write`

### PUT /surveys/{id}/items/{itemId}
**Description**: Update survey item  
**Authorization**: Required  
**Permissions**: `surveys:write`

### DELETE /surveys/{id}/items/{itemId}
**Description**: Delete survey item  
**Authorization**: Required  
**Permissions**: `surveys:write`

---

## Media Management APIs

### POST /media/upload
**Description**: Upload media files  
**Authorization**: Required  
**Permissions**: `media:upload`

**Request**: Multipart form data
- `file`: File to upload
- `orderId`: Associated order ID
- `type`: File type (photo, document, video)
- `description`: File description

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "photo1.jpg",
    "url": "https://storage.com/photo1.jpg",
    "thumbnail": "https://storage.com/thumb1.jpg",
    "size": 2048000,
    "type": "image/jpeg",
    "uploadDate": "2024-03-01T10:00:00Z"
  }
}
```

### GET /media/{id}
**Description**: Get media file details  
**Authorization**: Required  
**Permissions**: `media:read`

### DELETE /media/{id}
**Description**: Delete media file  
**Authorization**: Required  
**Permissions**: `media:delete`

### POST /media/batch-upload
**Description**: Upload multiple media files  
**Authorization**: Required  
**Permissions**: `media:upload`

### GET /media/order/{orderId}
**Description**: Get all media for an order  
**Authorization**: Required  
**Permissions**: `media:read`

---

## User Management APIs

### GET /users
**Description**: Get users  
**Authorization**: Required  
**Permissions**: `users:read`

### GET /users/{id}
**Description**: Get user details  
**Authorization**: Required  
**Permissions**: `users:read`

### POST /users
**Description**: Create new user  
**Authorization**: Required  
**Permissions**: `users:write`

### PUT /users/{id}
**Description**: Update user  
**Authorization**: Required  
**Permissions**: `users:write`

### DELETE /users/{id}
**Description**: Delete user  
**Authorization**: Required  
**Permissions**: `users:delete`

### GET /users/surveyors
**Description**: Get list of surveyors  
**Authorization**: Required  
**Permissions**: `users:read`

### GET /users/roles
**Description**: Get available roles and permissions  
**Authorization**: Required  
**Permissions**: `users:read`

---

## Notification APIs

### GET /notifications
**Description**: Get user notifications  
**Authorization**: Required

### POST /notifications/mark-read
**Description**: Mark notifications as read  
**Authorization**: Required

### POST /notifications/send
**Description**: Send notification  
**Authorization**: Required  
**Permissions**: `notifications:send`

**Request Body**:
```json
{
  "type": "email",
  "recipients": ["user@email.com"],
  "template": "appointment_reminder",
  "data": {
    "appointmentDate": "2024-03-10T10:00:00Z",
    "clientName": "John Smith",
    "address": "123 Main St"
  }
}
```

---

## Analytics APIs

### GET /analytics/dashboard
**Description**: Get dashboard analytics  
**Authorization**: Required  
**Permissions**: `analytics:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 150,
      "pendingOrders": 25,
      "completedOrders": 120,
      "averageCompletionTime": 5.2,
      "totalValue": 15000000.00
    },
    "trends": {
      "orderVolume": [
        {
          "date": "2024-03-01",
          "count": 15,
          "value": 1250000.00
        }
      ],
      "qualityMetrics": [
        {
          "date": "2024-03-01",
          "averageScore": 88.5,
          "surveyCount": 10
        }
      ]
    }
  }
}
```

### GET /analytics/performance
**Description**: Get performance metrics  
**Authorization**: Required  
**Permissions**: `analytics:read`

### GET /analytics/financial
**Description**: Get financial analytics  
**Authorization**: Required  
**Permissions**: `analytics:financial`

### GET /analytics/custom
**Description**: Get custom analytics  
**Authorization**: Required  
**Permissions**: `analytics:read`

**Query Parameters**:
- `metrics`: Comma-separated metrics
- `groupBy`: Group by field
- `startDate`: Start date
- `endDate`: End date

---

## Error Handling

### Standard Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

### Rate Limits

| Endpoint Category | Limit |
|------------------|-------|
| Authentication | 10 requests/minute |
| Read Operations | 1000 requests/hour |
| Write Operations | 500 requests/hour |
| Upload Operations | 100 requests/hour |
| Report Generation | 50 requests/hour |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

### Available Webhooks

| Event | Description |
|-------|-------------|
| `order.created` | Order created |
| `order.updated` | Order updated |
| `order.completed` | Order completed |
| `appointment.scheduled` | Appointment scheduled |
| `appointment.completed` | Appointment completed |
| `survey.completed` | Survey completed |
| `report.generated` | Report generated |

### Webhook Payload

```json
{
  "id": "webhook-event-id",
  "event": "order.created",
  "timestamp": "2024-03-01T10:00:00Z",
  "data": {
    "orderId": 1,
    "orderNumber": "ORD-2024-001",
    "status": "pending"
  }
}
```

---

## API Versioning

### Version Strategy
- URL versioning: `/v1/`, `/v2/`
- Backward compatibility maintained for at least 12 months
- Deprecation notices provided 6 months in advance

### Version History
- **v1.0**: Initial release
- **v1.1**: Added bulk operations
- **v1.2**: Enhanced analytics endpoints

---

This API specification provides comprehensive coverage of all endpoints required for the web frontend functionality, including order management, quality assurance, pricing tools, and reporting capabilities. 