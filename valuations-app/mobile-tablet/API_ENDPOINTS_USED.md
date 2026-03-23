# External API Endpoints Documentation

## Overview

This document provides a comprehensive list of all external API endpoints used by the Valuations Mobile Tablet Application. The application uses a RESTful API architecture with JWT-based authentication.

## Base Configuration

### API Base URL
- **Production**: `https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api`
- **Development**: Configurable via environment variables
- **Local**: `https://localhost:5001/api` (fallback)

### Authentication
- **Method**: JWT Bearer Token Authentication (API Key mode deprecated)
- **Header**: `Authorization: Bearer {token}`
- **User Context**: `X-User-Context: {hashed_user_context}`
- **Token Storage**: AsyncStorage with secure session management
- **Token Refresh**: Automatic token refresh with rate limiting

## API Client Architecture

### Primary API Clients
1. **Transport Client** (`core/transport/transportClient.ts`) - Unified transport with policies
2. **Session Service** (`core/auth/sessionService.ts`) - Secure token and user context management
3. **Configuration Service** (`services/configurationService.ts`) - Specialized for dynamic UI configuration

### Request Interceptors
- Automatic JWT token injection via sessionService
- User context hashing (SHA-256) for privacy
- Request logging (development mode)
- Timeout configuration per endpoint policy
- Retry logic for network errors

## Authentication Endpoints

### 1. Token Verification
- **Endpoint**: `GET /auth/verify`
- **Purpose**: Validate current authentication token
- **Response**: Token validity status
- **Error Handling**: Automatic token refresh on failure

### 2. Token Exchange (Azure AD)
- **Endpoint**: `POST /auth/token-exchange`
- **Purpose**: Exchange Azure AD token for API token
- **Parameters**:
  - `azureToken` (string): Azure AD access token
  - `userInfo` (object): Additional user information
- **Response**: API token and user details

### 3. Token Refresh
- **Endpoint**: `POST /auth/refresh-token`
- **Purpose**: Refresh expired JWT token
- **Parameters**:
  - `refreshToken` (string): Current refresh token
- **Response**: New access token and refresh token

## Appointment Management Endpoints

### 1. Get All Appointments
- **Endpoint**: `GET /appointments`
- **Purpose**: Fetch all appointments for authenticated user
- **Features**: Offline caching, data normalization, deduplication
- **Response**: Array of appointment objects

### 2. Get Appointment by ID
- **Endpoint**: `GET /appointments/{id}/with-order`
- **Fallback**: `GET /appointments/{id}`
- **Purpose**: Fetch detailed appointment information
- **Parameters**: `id` (string): Appointment ID
- **Features**: Order details integration, field normalization
- **Response**: Complete appointment with order data

### 3. Get Appointments by Status
- **Endpoint**: `GET /appointments` (with filtering)
- **Purpose**: Filter appointments by status (scheduled, in-progress, completed)
- **Parameters**: `status` (string): Appointment status
- **Response**: Filtered appointment array

### 4. Get Appointments with Orders
- **Endpoint**: `GET /appointments/with-orders`
- **Purpose**: Fetch appointments with associated order details
- **Parameters**:
  - `page` (number): Page number (1-based)
  - `pageSize` (number): Items per page
- **Response**: Paginated appointments with order data

### 5. Get Appointments by List View
- **Endpoint**: `GET /mobile/appointment/list-view`
- **Purpose**: Optimized appointment listing with filtering
- **Parameters**:
  - `page` (number): Page number
  - `pageSize` (number): Items per page
  - `inviteStatus` (string): Status filter
  - `surveyor` (string): Surveyor ID filter
  - `startDateFrom` (string): Start date filter
  - `startDateTo` (string): End date filter
- **Features**: Enhanced filtering, optimized performance
- **Response**: Paginated appointment list

### 6. Update Appointment
- **Endpoint**: `PUT /appointments/{id}`
- **Purpose**: Update appointment details
- **Parameters**:
  - `id` (string): Appointment ID
  - `updates` (object): Fields to update
- **Response**: Updated appointment data

### 7. Get Appointment Statistics
- **Endpoint**: `GET /appointments/stats`
- **Purpose**: Fetch appointment statistics by status
- **Response**: Statistics object with counts by status

### 8. Get Mobile Dashboard Stats
- **Endpoint**: `GET /mobile/appointment/dashboard/status-counts`
- **Purpose**: Optimized dashboard statistics for mobile
- **Features**: Performance optimized, mobile-specific
- **Response**: Dashboard statistics object

## Risk Assessment Endpoints

### 1. Get Risk Templates
- **Endpoint**: `GET /risk-templates`
- **Purpose**: Fetch available risk assessment templates
- **Features**: Offline caching, template metadata
- **Response**: Array of risk template objects

### 2. Get Risk Assessment Master by Order
- **Endpoint**: `GET /risk-assessment-master/by-order/{orderId}`
- **Purpose**: Get risk assessment master record for an order
- **Parameters**: `orderId` (string): Order ID
- **Response**: Risk assessment master data

### 3. Get Complete Risk Assessment Hierarchy
- **Endpoint**: `GET /mobile/risk-assessment/{orderId}/complete-hierarchy`
- **Purpose**: Composite endpoint for complete risk assessment data
- **Parameters**: `orderId` (string): Order ID
- **Features**: Single API call for all hierarchy data
- **Response**: Complete hierarchy with sections, categories, and items

### 4. Get Risk Assessment Sections
- **Endpoint**: `GET /risk-assessment-sections/assessment/{templateId}`
- **Purpose**: Get sections for a specific risk assessment template
- **Parameters**: `templateId` (string): Template ID
- **Features**: Offline caching
- **Response**: Array of section objects

### 5. Get Risk Assessment Categories
- **Endpoint**: `GET /risk-assessment-categories/section/{sectionId}`
- **Purpose**: Get categories for a specific section
- **Parameters**: `sectionId` (string): Section ID
- **Features**: Offline caching
- **Response**: Array of category objects

### 6. Get Risk Assessment Items
- **Endpoint**: `GET /risk-assessment-items/category/{categoryId}`
- **Purpose**: Get items for a specific category
- **Parameters**: `categoryId` (string): Category ID
- **Features**: Offline caching, graceful 404 handling
- **Response**: Array of item objects

### 7. Clone Risk Assessment Section (structure-only)
- **Endpoint**: `POST /mobile/risk-assessment/{riskAssessmentId}/sections/clone`
- **Purpose**: Duplicate a section’s structure (categories + item shells) within the same assessment; no copied answers or media
- **Parameters**: `riskAssessmentId` (number): Risk assessment master ID (path)
- **Body**: `sourceRiskAssessmentSectionId` (number), optional `targetSectionName`, optional `clientMutationId` (UUID) for idempotent retries
- **Mobile**: `cloneRiskAssessmentSection` in `api/hierarchy.ts`; **offline-first copy** materializes locally in `offline_materialized_section_clones` + provisional `risk_assessment_items`, then the same clone POST runs on sync to remap IDs (see `services/offlineSectionMaterialization.ts`). Legacy rows may still exist in `pending_section_clones`.
- **Spec**: `BACKEND_SECTION_CLONE_API_SPEC.md`, `BACKEND_OFFLINE_SECTION_CLONE_SYNC.md`, `SECTION_CLONE_QA.md`

## Dynamic UI Configuration Endpoints

### 1. Complete Category Configuration
- **Endpoint**: `GET /mobile/config/category/{categoryId}/complete`
- **Purpose**: Single composite endpoint for category configuration
- **Parameters**: `categoryId` (number): Risk Template Category ID
- **Features**: Fields, dropdown options, grouping strategy, location templates
- **Response**: Complete configuration object

### 2. Order-Level Field Configuration
- **Endpoint**: `GET /mobile/config/order/{orderId}/categories/complete`
- **Purpose**: Pre-load configurations for all categories in an order
- **Parameters**: `orderId` (string): Order ID
- **Features**: Bulk configuration loading, performance optimization
- **Response**: Array of category configurations

### 3. Category Details (Fallback)
- **Endpoint**: `GET /risk-assessment-categories/{categoryId}`
- **Purpose**: Fallback endpoint for category details
- **Parameters**: `categoryId` (number): Category ID
- **Response**: Category details with RiskTemplateCategoryID

### 4. Individual Field Options
- **Endpoint**: `GET /mobile/config/field/{fieldId}/options`
- **Purpose**: Fetch dropdown options for specific field
- **Parameters**: `fieldId` (number): Field ID
- **Response**: Array of dropdown options

### 5. Template Configuration
- **Endpoint**: `GET /mobile/config/template/{templateId}/categories`
- **Purpose**: Get all categories for a template
- **Parameters**: `templateId` (number): Template ID
- **Response**: Template categories configuration

### 6. Field Configuration (type-fields — optional fallback only on mobile)
- **Endpoint**: `GET /risk-assessment-category-type-fields/category/{categoryId}`
- **Purpose**: Legacy field-configuration shape; **not** the primary source for survey Dynamic UI on mobile.
- **Mobile behaviour**: Order-level **`GET /mobile/config/order/{orderId}/categories/complete`** hydrates SQLite + `dynamic_ui_config_*` via `prefetchService.applyOrderFieldConfigurationCaches`. Appointment prefetch calls this once in parallel with complete-hierarchy. Type-fields is used only when SQLite has no config for the risk assessment **or** template category id **and** the device is online (see `prefetchService.ensureFieldConfigurationForCategory`).
- **Parameters**: `categoryId` (number): Risk assessment category ID
- **Response**: Field configuration data (stored in legacy `field_config_*` AsyncStorage keys if fetched)

### 7. All Categories Configuration
- **Endpoint**: `GET /mobile/config/categories/all/complete`
- **Purpose**: Get all category configurations at once
- **Features**: Bulk configuration loading
- **Response**: Array of all category configurations

## Media Management Endpoints

### 1. Upload Media (Sync API)
- **Endpoint**: `POST /sync/media/upload`
- **Purpose**: Upload media files to sync API
- **Method**: Multipart form data
- **Parameters**:
  - `file` (file): Media file
  - `entityName` (string): Entity type
  - `entityId` (number): Entity ID
  - `fileType` (string): File type (photo, document, signature)
  - `deviceId` (string): Device identifier
  - `userId` (string): User identifier
  - `metadata` (string): Additional metadata
- **Response**: Upload confirmation with file details

### 2. Get Media for Entity
- **Endpoint**: `GET /sync/media/entity/{entityName}/{entityId}`
- **Purpose**: Fetch media files for a specific entity
- **Parameters**:
  - `entityName` (string): Entity type
  - `entityId` (number): Entity ID
- **Response**: Array of media files

### 3. Delete Media
- **Endpoint**: `DELETE /media/{mediaId}`
- **Purpose**: Delete media file from backend
- **Parameters**: `mediaId` (number): Media file ID
- **Response**: Deletion confirmation

## Synchronization Endpoints

### 1. Sync Changes
- **Endpoint**: `POST /sync/batch`
- **Purpose**: Synchronize local changes with server
- **Parameters**: Sync data object with:
  - `riskAssessmentItems` (array): Modified items
  - `riskAssessmentMasters` (array): Modified masters
  - `appointments` (array): Modified appointments
  - `deletedEntities` (array): Deleted entities
  - `syncTimestamp` (string): Sync timestamp
- **Response**: Sync confirmation with conflicts

### 2. Get Sync Changes
- **Endpoint**: `GET /sync/changes`
- **Purpose**: Fetch changes from server since last sync
- **Parameters**:
  - `deviceId` (string): Device identifier
  - `userId` (string): User identifier
  - `lastSyncTimestamp` (string): Last sync timestamp
  - `entities` (array): Entity types to sync
- **Response**: Changes since last sync

### 3. Push Sync Batch
- **Endpoint**: `POST /sync/batch`
- **Purpose**: Push batch of changes to server
- **Parameters**: Batch sync data object
- **Response**: Batch processing results

### 4. Get Sync Sessions
- **Endpoint**: `GET /sync/sessions`
- **Purpose**: Get sync session history
- **Parameters**: `deviceId` (string): Device identifier
- **Response**: Sync session history

### 5. Get Sync Health
- **Endpoint**: `GET /sync/debug`
- **Purpose**: Check sync API health status
- **Response**: Sync system status

## Survey Management Endpoints

### 1. Get Surveys
- **Endpoint**: `GET /surveys`
- **Purpose**: Fetch surveys for authenticated user
- **Response**: Array of survey objects

### 2. Get Survey Details
- **Endpoint**: `GET /surveys/{surveyId}`
- **Purpose**: Get detailed survey information
- **Parameters**: `surveyId` (string): Survey ID
- **Response**: Complete survey data

### 3. Submit Survey
- **Endpoint**: `POST /surveys/{surveyId}/submit`
- **Purpose**: Submit survey responses
- **Parameters**: Survey responses object
- **Response**: Submission confirmation

### 4. Get Survey Statistics
- **Endpoint**: `GET /surveys/stats`
- **Purpose**: Get survey statistics
- **Response**: Survey statistics object

## Risk Template Endpoints

### 1. Get Risk Template Sections
- **Endpoint**: `GET /risk-assessment-sections/assessment/{templateId}`
- **Purpose**: Get sections for risk template
- **Parameters**: `templateId` (string): Template ID
- **Features**: Offline caching, multiple endpoint fallbacks
- **Response**: Array of section objects

### 2. Get Risk Template Categories
- **Endpoint**: `GET /risk-assessment-categories/section/{sectionId}`
- **Purpose**: Get categories for template section
- **Parameters**: `sectionId` (string): Section ID
- **Features**: Offline caching
- **Response**: Array of category objects

### 3. Get Risk Template Items
- **Endpoint**: `GET /risk-assessment-items/category/{categoryId}`
- **Purpose**: Get items for template category
- **Parameters**: `categoryId` (string): Category ID
- **Features**: Offline caching
- **Response**: Array of item objects

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Common Error Codes
- `CATEGORY_NOT_FOUND`: Category configuration not found
- `VERIFICATION_ERROR`: Token verification failed
- `NETWORK_ERROR`: Network connectivity issues
- `AUTHENTICATION_ERROR`: Authentication token invalid
- `VALIDATION_ERROR`: Request validation failed

### Error Recovery Strategies
1. **API Failure**: Return cached data if available
2. **Cache Miss**: Return default configuration
3. **Complete Failure**: Return null and log error
4. **Network Error**: Retry with exponential backoff
5. **Auth Error**: Redirect to login

## Offline Support

### Caching Strategy
- **Primary Cache**: AsyncStorage with configurable expiry
- **Cache Keys**: Structured by entity type and ID
- **Cache Invalidation**: Manual and automatic expiry
- **Offline Detection**: Network connectivity monitoring

### Offline Features
- **Data Persistence**: All API responses cached locally
- **Offline Mode**: App functions without network
- **Sync Queue**: Changes queued for later sync
- **Conflict Resolution**: Server-side conflict handling

## Performance Optimizations

### Request Optimization
- **Request Deduplication**: Prevents duplicate API calls
- **Response Caching**: Reduces redundant requests
- **Batch Operations**: Combines multiple requests
- **Lazy Loading**: Progressive data loading

### Network Optimization
- **Connection Pooling**: Reuses HTTP connections
- **Request Compression**: Reduces payload size
- **Timeout Configuration**: Optimized per endpoint
- **Retry Logic**: Automatic retry for failed requests

## Security Features

### Authentication
- **JWT Bearer Token**: JWT-based authentication only
- **Token Refresh**: Automatic token renewal
- **Token Caching**: Reduces authentication overhead
- **Secure Storage**: AsyncStorage for token persistence
- **User Context Hashing**: SHA-256 hashing for privacy

### Data Protection
- **HTTPS Only**: All API calls use HTTPS
- **Input Validation**: Server-side validation
- **Error Sanitization**: Prevents information leakage
- **Rate Limiting**: Prevents API abuse

## Monitoring and Logging

### Request Logging
- **Development Mode**: Detailed request/response logging
- **Production Mode**: Essential logging only
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing tracking

### Debug Endpoints
- **Health Check**: `GET /sync/debug`
- **Token Verification**: `GET /auth/verify`
- **Connection Status**: Network connectivity monitoring

## Future Enhancements

### Planned API Features
1. **Real-time Updates**: WebSocket integration
2. **Advanced Filtering**: Complex query support
3. **Bulk Operations**: Batch processing endpoints
4. **Analytics API**: Usage analytics and reporting
5. **Notification API**: Push notification support

### Performance Improvements
1. **GraphQL Integration**: Efficient data fetching
2. **API Versioning**: Backward compatibility
3. **CDN Integration**: Static asset optimization
4. **Database Optimization**: Query performance improvements

## Conclusion

The Valuations Mobile Tablet Application uses a comprehensive set of RESTful APIs designed for offline-first operation with robust error handling and performance optimization. The API architecture supports both online and offline modes, with intelligent caching and synchronization mechanisms.

## API Versioning Status

**Current Status**: All endpoints are currently unversioned (no `/api/v1/` prefix)
**Target Status**: All endpoints should be versioned with `/api/v1/` prefix for proper API lifecycle management

### Endpoints Requiring Versioning
- Authentication: `/auth/*` → `/api/v1/auth/*`
- Appointments: `/appointments/*` → `/api/v1/appointments/*`
- Risk Assessments: `/risk-*` → `/api/v1/risk-*`
- Mobile Config: `/mobile/*` → `/api/v1/mobile/*`
- Sync: `/sync/*` → `/api/v1/sync/*`
- Surveys: `/surveys/*` → `/api/v1/surveys/*`
- Media: `/media/*` → `/api/v1/media/*`



