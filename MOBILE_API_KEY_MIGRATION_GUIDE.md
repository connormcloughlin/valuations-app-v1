# Mobile App API Key Migration Guide

## Overview

This guide provides step-by-step instructions to migrate the Valuations Mobile Tablet Application from JWT token authentication to API key authentication for external API calls, while maintaining Azure AD authentication for app login.

## Migration Strategy

### Current State
- **App Login**: Azure AD authentication
- **API Calls**: JWT Bearer token authentication
- **Token Management**: Token exchange and refresh mechanisms

### Target State
- **App Login**: Azure AD authentication (unchanged)
- **API Calls**: API key authentication with user context
- **Token Management**: Simplified API key with user context headers

## API Endpoints Migration Mapping

### Authentication Endpoints (To Be Deprecated)
- `GET /auth/verify` - Token verification endpoint
- `POST /auth/token-exchange` - Azure AD token exchange endpoint

### Appointment Management Endpoints (9 endpoints)
- `GET /appointments` - Get all appointments
- `GET /appointments/{id}/with-order` - Get appointment by ID
- `GET /appointments` (with filtering) - Get appointments by status
- `GET /appointments/with-orders` - Get appointments with orders
- `GET /appointments/list-view` - Get appointments by list view
- `PUT /appointments/{id}` - Update appointment
- `GET /appointments/stats` - Get appointment statistics
- `GET /mobile/appointment/dashboard/status-counts` - Get mobile dashboard stats
- `GET /appointments/order/{orderNumber}` - Get appointment by order

### Risk Assessment Endpoints (6 endpoints)
- `GET /risk-templates` - Get risk templates
- `GET /risk-assessment-master/by-order/{orderId}` - Get risk assessment master by order
- `GET /mobile/risk-assessment/{orderId}/complete-hierarchy` - Get complete risk assessment hierarchy
- `GET /risk-assessment-master/sections/{riskAssessmentId}` - Get risk assessment sections
- `GET /risk-assessment-categories/section/{sectionId}` - Get risk assessment categories
- `GET /risk-assessment-items/category/{categoryId}` - Get risk assessment items

### Dynamic UI Configuration Endpoints (5 endpoints)
- `GET /mobile/config/category/{categoryId}/complete` - Complete category configuration
- `GET /mobile/config/order/{orderId}/categories/complete` - Order-level field configuration
- `GET /risk-assessment-categories/{categoryId}` - Category details (fallback)
- `GET /mobile/config/field/{fieldId}/options` - Individual field options
- `GET /mobile/config/template/{templateId}/categories` - Template configuration

### Media Management Endpoints (4 endpoints)
- `POST /sync/media/upload` - Upload media (sync API)
- `GET /sync/media/entity/{entityName}/{entityId}` - Get media for entity
- `DELETE /media/{mediaId}` - Delete media
- `POST /sync/media/upload` (multiple calls) - Batch upload media

### Synchronization Endpoints (5 endpoints)
- `POST /sync/changes` - Sync changes
- `GET /sync/changes` - Get sync changes
- `POST /sync/batch` - Push sync batch
- `GET /sync/sessions` - Get sync sessions
- `GET /sync/debug` - Get sync health

### Survey Management Endpoints (5 endpoints)
- `GET /surveys` - Get surveys
- `GET /surveys/{surveyId}` - Get survey details
- `POST /surveys` or `PUT /surveys/{id}` - Submit survey
- `DELETE /surveys/{surveyId}` - Delete survey
- `POST /uploads` - Upload survey file

### Risk Template Endpoints (3 endpoints)
- `GET /risk-assessment-sections/assessment/{templateId}` - Get risk template sections
- `GET /risk-template-categories/section/{sectionId}` - Get risk template categories
- `GET /risk-template-items/category/{categoryId}` - Get risk template items

**Total: 37 API endpoints requiring migration to API key authentication**

## Phase 1: Environment Configuration

### Step 1.1: Update App Configuration

**Prompt for AI Agent:**
```
Update the mobile app configuration to support API key authentication:
1. Modify `valuations-app/mobile-tablet/app.config.js` to:
   - Add API key configuration settings
   - Support environment-specific API keys
   - Add API key header configuration
   - Maintain backward compatibility with JWT mode
2. Update `valuations-app/mobile-tablet/constants/apiConfig.ts` to include API key settings
3. Add environment variables for API key mode detection
```

**Expected Output:**
- Updated app.config.js with API key settings
- Updated apiConfig.ts with API key constants
- Environment variable configuration
- Backward compatibility settings

### Step 1.2: Environment Variables Setup

**Prompt for AI Agent:**
```
Configure environment variables for API key authentication:
1. Add API key environment variables to development environment
2. Configure production API key settings
3. Add API key header name configuration
4. Set up API key mode detection variables
5. Update build scripts to handle API key configuration
```

**Expected Output:**
- Environment variable configuration
- Build script updates
- Development and production settings
- Configuration validation

## Phase 2: API Client Updates

### Step 2.1: Update API Client Configuration

**Prompt for AI Agent:**
```
Update the mobile app API client to support API key authentication:
1. Modify `valuations-app/mobile-tablet/api/client.js` to:
   - Support API key authentication mode
   - Send user context headers with API key requests
   - Maintain backward compatibility with JWT mode
   - Add environment-based configuration
   - Handle API key validation and error responses
2. Update request interceptors to handle API key headers
3. Add API key specific error handling
```

**Expected Output:**
- Updated API client with API key support
- User context header management
- Request interceptor updates
- Error handling for API key mode

### Step 2.2: Update Enhanced Client

**Prompt for AI Agent:**
```
Update the enhanced API client to support API key authentication:
1. Modify `valuations-app/mobile-tablet/api/enhancedClient.js` to:
   - Support API key authentication mode
   - Handle user context in enhanced requests
   - Maintain caching and deduplication with API key mode
   - Add API key specific request preparation
2. Update request preparation logic for API key headers
3. Maintain existing performance optimizations
```

**Expected Output:**
- Updated enhanced client with API key support
- User context integration
- Performance optimization maintenance
- Request preparation updates

### Step 2.3: Update Authentication Helper

**Prompt for AI Agent:**
```
Update the authentication helper to support API key mode:
1. Modify `valuations-app/mobile-tablet/api/auth.js` to:
   - Support API key authentication verification
   - Handle user context management
   - Provide mode detection methods
   - Maintain backward compatibility with JWT
   - Add API key specific error handling
2. Update authentication verification logic
3. Add mode switching capabilities
```

**Expected Output:**
- Updated authentication helper
- API key verification support
- User context management
- Mode detection and switching

## Phase 3: User Context Management

### Step 3.1: Create User Context Service

**Prompt for AI Agent:**
```
Create a user context management service for the mobile app:
1. Create `valuations-app/mobile-tablet/services/userContextService.ts`
2. Implement user context storage and retrieval using AsyncStorage
3. Integrate with Azure AD user information
4. Provide methods for setting, getting, and updating user context
5. Include proper error handling and logging
6. Add user context validation and sanitization
```

**Expected Output:**
- Complete user context service
- Azure AD integration
- Storage management with AsyncStorage
- Error handling and validation

### Step 3.2: Update Azure AD Service

**Prompt for AI Agent:**
```
Update the Azure AD authentication service to support API key mode:
1. Modify `valuations-app/mobile-tablet/services/azureAdService.ts` to:
   - Support API key authentication mode
   - Extract user context from Azure AD login
   - Store user context for API key requests
   - Maintain existing Azure AD login functionality
   - Add mode detection and switching logic
2. Update authentication flow to handle both modes
3. Add user context extraction from Azure AD tokens
```

**Expected Output:**
- Updated Azure AD service
- User context extraction from Azure AD
- Mode switching logic
- Authentication flow updates

## Phase 4: Service Updates

### Step 4.1: Update Configuration Service

**Prompt for AI Agent:**
```
Update the configuration service to support API key authentication:
1. Modify `valuations-app/mobile-tablet/services/configurationService.ts` to:
   - Support API key authentication mode
   - Handle user context in configuration requests
   - Maintain offline caching functionality
   - Add API key specific error handling
2. Update request preparation for API key headers
3. Maintain existing caching and offline support
```

**Expected Output:**
- Updated configuration service
- API key support
- User context integration
- Offline support maintenance

### Step 4.2: Update All API Services

**Prompt for AI Agent:**
```
Update all API services to support API key authentication:
1. Update `valuations-app/mobile-tablet/api/appointments.js` to:
   - Support API key authentication mode
   - Handle user context in appointment requests
   - Maintain offline caching functionality
   - Update all 9 appointment endpoints (GET /appointments, GET /appointments/{id}/with-order, etc.)
2. Update `valuations-app/mobile-tablet/api/riskTemplates.js` to:
   - Support API key authentication mode
   - Handle user context in risk template requests
   - Update all risk assessment endpoints (GET /risk-templates, GET /risk-assessment-master/by-order/{orderId}, etc.)
3. Update `valuations-app/mobile-tablet/api/surveys.js` to:
   - Support API key authentication mode
   - Handle user context in survey requests
   - Update all survey endpoints (GET /surveys, GET /surveys/{surveyId}, etc.)
4. Update `valuations-app/mobile-tablet/api/offline.js` to:
   - Handle API key mode in sync operations
   - Update sync endpoints (POST /sync/changes, GET /sync/changes, etc.)
   - Update media upload endpoints (POST /sync/media/upload, etc.)
5. Update `valuations-app/mobile-tablet/services/configurationService.ts` to:
   - Support API key authentication mode
   - Handle user context in configuration requests
   - Update dynamic UI configuration endpoints (GET /mobile/config/category/{categoryId}/complete, etc.)
```

**Expected Output:**
- Updated appointment API service with all 9 endpoints
- Updated risk templates API service with all risk assessment endpoints
- Updated surveys API service with all survey endpoints
- Updated offline API service with sync and media endpoints
- Updated configuration service with dynamic UI endpoints
- Consistent API key support across all services

## Phase 5: Context Integration

### Step 5.1: Update Authentication Context

**Prompt for AI Agent:**
```
Update the authentication context to support API key mode:
1. Modify `valuations-app/mobile-tablet/context/AuthContext.tsx` to:
   - Support API key authentication mode
   - Handle user context management
   - Provide mode detection and switching
   - Maintain existing Azure AD authentication flow
2. Add user context state management
3. Update authentication state handling
```

**Expected Output:**
- Updated authentication context
- User context state management
- Mode detection and switching
- Authentication state updates

### Step 5.2: Update App Components

**Prompt for AI Agent:**
```
Update app components to handle API key authentication:
1. Update `valuations-app/mobile-tablet/app/_layout.tsx` to:
   - Handle API key authentication mode
   - Manage user context initialization
   - Support mode switching
2. Update login components to extract user context
3. Update navigation to handle authentication mode
```

**Expected Output:**
- Updated app layout
- User context initialization
- Login component updates
- Navigation updates

## Phase 6: Testing and Validation

### Step 6.1: API Key Authentication Testing

**Prompt for AI Agent:**
```
Create comprehensive testing for API key authentication in mobile app:
1. Test API key header transmission
2. Verify user context extraction from Azure AD
3. Test user context storage and retrieval
4. Validate API key mode switching
5. Test backward compatibility with JWT mode
6. Create test scripts and documentation
```

**Expected Output:**
- Test scripts for API key authentication
- User context validation procedures
- Mode switching validation
- Backward compatibility testing
- Test documentation

### Step 6.2: Integration Testing

**Prompt for AI Agent:**
```
Test mobile app integration with API key authentication:
1. Test user context extraction from Azure AD login
2. Verify API key header transmission in all 37 API endpoints
3. Test data access with user context
4. Validate offline functionality with API key mode
5. Test authentication mode switching
6. Test error handling and recovery
7. Test all error recovery strategies:
   - API failure with cached data fallback
   - Cache miss with default configuration
   - Complete failure handling
   - Network error retry logic
   - Auth error handling (should not occur with API key)
8. Test offline support features:
   - AsyncStorage caching with 24-hour expiry
   - Offline mode functionality
   - Sync queue operations
   - Conflict resolution
```

**Expected Output:**
- Integration test procedures for all 37 endpoints
- User context validation
- Offline testing procedures
- Error handling validation for all error types
- Mode switching validation
- Offline support validation

## Phase 7: Migration and Deployment

### Step 7.1: Gradual Migration Strategy

**Prompt for AI Agent:**
```
Implement a gradual migration strategy for mobile app:
1. Deploy mobile app with both authentication modes
2. Test API key authentication in development environment
3. Gradually migrate users to API key mode
4. Monitor performance and error rates
5. Create rollback procedures for mobile app
```

**Expected Output:**
- Mobile app migration timeline
- Testing procedures
- Monitoring strategy
- Rollback procedures

### Step 7.2: Production Deployment

**Prompt for AI Agent:**
```
Deploy API key authentication to production mobile app:
1. Deploy mobile app updates with API key support
2. Configure production API key settings
3. Monitor production performance and errors
4. Validate user context and data access
5. Monitor authentication mode usage
```

**Expected Output:**
- Production deployment procedures
- Monitoring setup
- Validation procedures
- Error handling

## Phase 8: Cleanup and Optimization

### Step 8.1: Deprecate JWT Authentication Endpoints

**Prompt for AI Agent:**
```
Deprecate JWT authentication endpoints and related code from mobile app:
1. Remove JWT token management code from all API clients
2. Clean up JWT authentication helpers in `valuations-app/mobile-tablet/api/auth.js`
3. Remove JWT-specific error handling for authentication endpoints:
   - `GET /auth/verify` - Token verification endpoint
   - `POST /auth/token-exchange` - Azure AD token exchange endpoint
4. Update authentication flow to use only API key mode
5. Clean up unused JWT utilities and constants
6. Remove JWT token refresh mechanisms
7. Update error handling to remove JWT-specific error codes (VERIFICATION_ERROR, AUTHENTICATION_ERROR)
```

**Expected Output:**
- JWT authentication endpoint deprecation
- JWT code removal procedures
- Authentication flow cleanup
- Error handling updates
- Code optimization

### Step 8.2: Remove JWT Code

**Prompt for AI Agent:**
```
Remove remaining JWT-specific code from mobile app after successful migration:
1. Remove JWT token management code from all services
2. Clean up JWT authentication helpers
3. Remove JWT-specific error handling
4. Update authentication flow to use only API key mode
5. Clean up unused JWT utilities and constants
6. Remove JWT token storage and caching mechanisms
```

**Expected Output:**
- JWT code removal procedures
- Authentication flow cleanup
- Error handling updates
- Code optimization

### Step 8.2: Performance Optimization

**Prompt for AI Agent:**
```
Optimize performance after API key migration:
1. Remove JWT token refresh mechanisms
2. Optimize API key validation performance
3. Implement user context caching strategies
4. Monitor and optimize user context processing
5. Update performance monitoring and logging
6. Optimize request optimization features:
   - Request deduplication for API key mode
   - Response caching strategies
   - Batch operations optimization
   - Lazy loading improvements
7. Optimize network optimization features:
   - Connection pooling for API key requests
   - Request compression optimization
   - Timeout configuration updates
   - Retry logic optimization
8. Update security features:
   - Remove JWT token caching
   - Optimize API key security validation
   - Update rate limiting for API key mode
   - Enhance input validation
```

**Expected Output:**
- Performance optimizations for all 37 endpoints
- Caching strategies for API key mode
- Monitoring updates for API key performance
- Logging improvements
- Security feature updates
- Network optimization updates

## Phase 9: Documentation Updates

### Step 9.1: Update Mobile App Documentation

**Prompt for AI Agent:**
```
Update mobile app documentation to reflect API key authentication:
1. Update `valuations-app/mobile-tablet/README.md` with API key configuration
2. Update `valuations-app/mobile-tablet/DEVELOPMENT_SETUP.md` with API key setup
3. Update `valuations-app/mobile-tablet/PROJECT_DOCUMENTATION.md` with API key details
4. Create API key configuration guide
5. Update authentication flow documentation
```

**Expected Output:**
- Updated README with API key configuration
- Updated development setup guide
- Updated project documentation
- API key configuration guide
- Authentication flow documentation

### Step 9.2: Update API Documentation

**Prompt for AI Agent:**
```
Update API documentation to reflect mobile app API key usage:
1. Update `API_ENDPOINTS_USED.md` to reflect API key authentication
2. Update `DYNAMIC_DISPLAY_SPEC.md` with API key context
3. Create mobile app API key usage guide
4. Update authentication examples
5. Document user context requirements
```

**Expected Output:**
- Updated API endpoints documentation
- Updated dynamic display specification
- Mobile app API key usage guide
- Authentication examples
- User context documentation

## Success Criteria

### Migration Success Metrics

**Prompt for AI Agent:**
```
Define success criteria for mobile app API key migration:
1. All mobile app users successfully migrated to API key authentication
2. Zero JWT authentication errors in mobile app
3. Improved API response times in mobile app
4. Proper user context filtering working correctly
5. Security validation passed
6. Documentation updated and accurate
7. Offline functionality maintained
```

**Expected Output:**
- Success metrics for mobile app
- Validation procedures
- Performance benchmarks
- Security criteria
- Offline functionality validation

## Rollback Procedures

### Step 9.3: Mobile App Rollback Plan

**Prompt for AI Agent:**
```
Create rollback procedures for mobile app API key migration:
1. Document rollback procedures for mobile app changes
2. Create mobile app rollback build procedures
3. Document user context migration rollback
4. Create communication plan for rollback scenarios
5. Test rollback procedures in staging environment
```

**Expected Output:**
- Mobile app rollback procedures
- Build rollback procedures
- User context rollback procedures
- Communication plans
- Testing procedures

## Conclusion

This mobile app migration guide provides a comprehensive approach to switching from JWT authentication to API key authentication while maintaining Azure AD for app login. The step-by-step approach ensures minimal disruption and proper validation at each stage.

**Key Benefits:**
- Simplified authentication for API calls
- Improved performance by removing JWT token management
- Better security with API key rotation
- Maintained Azure AD integration for app login
- Proper user context and data filtering

**Timeline Estimate:**
- Phase 1 (Environment): 1 day
- Phase 2 (API Client): 2 days
- Phase 3 (User Context): 1 day
- Phase 4 (Services): 1 day
- Phase 5 (Context): 1 day
- Phase 6 (Testing): 2 days
- Phase 7 (Migration): 1 day
- Phase 8 (Cleanup): 1 day
- Phase 9 (Documentation): 1 day

**Total Estimated Time: 11 days**

Follow this guide step-by-step, executing each prompt with an AI agent to ensure proper implementation and validation of the API key authentication system in the mobile app.
