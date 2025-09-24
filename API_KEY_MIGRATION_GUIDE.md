# API Key Migration Guide: JWT to API Key Authentication

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

## Phase 1: Backend API Key Implementation

### Step 1.1: Create API Key Middleware

**Prompt for AI Agent:**
```
Create a new API key middleware file at `api/src/middleware/apiKeyAuth.ts` that:
1. Validates API keys from request headers
2. Accepts user context from mobile app headers
3. Creates proper AuthenticatedUser objects for API key requests
4. Integrates with existing securedDataAccess system
5. Supports flexible authentication (API key or JWT fallback)
6. Includes proper error handling and logging
```

**Expected Output:**
- Complete API key middleware implementation
- User context extraction from headers
- Integration with existing authentication system
- Error handling and logging

### Step 1.2: Update Mobile Endpoints

**Prompt for AI Agent:**
```
Update all mobile endpoints in the backend to:
1. Use the new API key middleware
2. Accept user context from mobile app headers
3. Properly filter data based on user context
4. Maintain backward compatibility with JWT authentication
5. Update the following files:
   - `api/src/routes/mobile/appointments.ts`
   - `api/src/routes/mobile/riskAssessment.ts`
   - `api/src/routes/mobile/config.ts`
   - `api/src/routes/mobile/sync.ts`
```

**Expected Output:**
- Updated mobile route files
- User context integration
- Proper data filtering
- Backward compatibility

### Step 1.3: Create Mobile-Specific Data Access Layer

**Prompt for AI Agent:**
```
Create mobile-specific data access functions that:
1. Use the securedDataAccess system with API key user context
2. Implement proper data filtering based on user roles and entity mappings
3. Create optimized queries for mobile performance
4. Handle offline scenarios gracefully
5. Update the following files:
   - `api/src/data/mobile/appointmentMobile.ts`
   - `api/src/data/mobile/riskAssessmentMobile.ts`
   - `api/src/data/mobile/configMobile.ts`
```

**Expected Output:**
- Mobile-optimized data access functions
- User context integration
- Performance optimizations
- Offline support

### Step 1.4: Environment Configuration

**Prompt for AI Agent:**
```
Update the backend environment configuration to:
1. Add API key configuration variables
2. Support multiple API keys for different environments
3. Configure Azure Key Vault integration for API key storage
4. Add API key validation and rotation mechanisms
5. Update the following files:
   - `api/src/config/environment.ts`
   - `api/src/utils/keyVault.ts` (if not exists)
   - `api/src/middleware/apiKeyAuth.ts` (update with environment config)
```

**Expected Output:**
- Environment configuration updates
- Key Vault integration
- API key management system
- Configuration validation

## Phase 2: Mobile App API Client Updates

### Step 2.1: Update API Client Configuration

**Prompt for AI Agent:**
```
Update the mobile app API client to support API key authentication:
1. Modify `valuations-app/mobile-tablet/api/client.js` to:
   - Support API key authentication mode
   - Send user context headers with API key requests
   - Maintain backward compatibility with JWT mode
   - Add environment-based configuration
2. Update `valuations-app/mobile-tablet/constants/apiConfig.ts` to include API key settings
3. Add API key environment variables to `valuations-app/mobile-tablet/app.config.js`
```

**Expected Output:**
- Updated API client with API key support
- User context header management
- Environment configuration
- Backward compatibility

### Step 2.2: Create User Context Service

**Prompt for AI Agent:**
```
Create a user context management service for the mobile app:
1. Create `valuations-app/mobile-tablet/services/userContextService.ts`
2. Implement user context storage and retrieval
3. Integrate with Azure AD user information
4. Provide methods for setting, getting, and updating user context
5. Include proper error handling and logging
```

**Expected Output:**
- Complete user context service
- Azure AD integration
- Storage management
- Error handling

### Step 2.3: Update Authentication Service

**Prompt for AI Agent:**
```
Update the Azure AD authentication service to support API key mode:
1. Modify `valuations-app/mobile-tablet/services/azureAdService.ts` to:
   - Support API key authentication mode
   - Extract user context from Azure AD login
   - Store user context for API key requests
   - Maintain existing Azure AD login functionality
2. Add mode detection and switching logic
3. Update authentication flow to handle both modes
```

**Expected Output:**
- Updated Azure AD service
- User context extraction
- Mode switching logic
- Authentication flow updates

### Step 2.4: Update Authentication Helper

**Prompt for AI Agent:**
```
Update the authentication helper to support API key mode:
1. Modify `valuations-app/mobile-tablet/api/auth.js` to:
   - Support API key authentication verification
   - Handle user context management
   - Provide mode detection methods
   - Maintain backward compatibility
2. Update authentication verification logic
3. Add API key specific error handling
```

**Expected Output:**
- Updated authentication helper
- API key verification
- User context management
- Error handling

## Phase 3: Environment Configuration

### Step 3.1: Backend Environment Variables

**Prompt for AI Agent:**
```
Configure backend environment variables for API key authentication:
1. Add API key configuration to Azure Container App environment variables
2. Configure Azure Key Vault for API key storage
3. Set up different API keys for different environments (dev, test, prod)
4. Add API key validation and rotation settings
5. Update deployment scripts and documentation
```

**Expected Output:**
- Environment variable configuration
- Key Vault setup
- Multi-environment support
- Deployment documentation

### Step 3.2: Mobile App Environment Variables

**Prompt for AI Agent:**
```
Configure mobile app environment variables for API key authentication:
1. Update `valuations-app/mobile-tablet/app.config.js` with API key settings
2. Add environment-specific API key configuration
3. Configure API key header names and formats
4. Add development and production configurations
5. Update build scripts and deployment documentation
```

**Expected Output:**
- Mobile app environment configuration
- Multi-environment support
- Build configuration
- Deployment documentation

## Phase 4: Testing and Validation

### Step 4.1: API Key Authentication Testing

**Prompt for AI Agent:**
```
Create comprehensive testing for API key authentication:
1. Test API key validation and user context extraction
2. Verify data filtering based on user context
3. Test backward compatibility with JWT authentication
4. Validate error handling and security measures
5. Create test scripts and documentation
```

**Expected Output:**
- Test scripts and documentation
- Validation procedures
- Security testing
- Error handling verification

### Step 4.2: Mobile App Integration Testing

**Prompt for AI Agent:**
```
Test mobile app integration with API key authentication:
1. Test user context extraction from Azure AD
2. Verify API key header transmission
3. Test data access with user context
4. Validate offline functionality
5. Test authentication mode switching
```

**Expected Output:**
- Integration test procedures
- User context validation
- Offline testing
- Mode switching validation

## Phase 5: Migration and Deployment

### Step 5.1: Gradual Migration Strategy

**Prompt for AI Agent:**
```
Implement a gradual migration strategy:
1. Deploy backend changes with both authentication modes
2. Test API key authentication in development environment
3. Gradually migrate mobile app users to API key mode
4. Monitor performance and error rates
5. Create rollback procedures
```

**Expected Output:**
- Migration timeline
- Testing procedures
- Monitoring strategy
- Rollback procedures

### Step 5.2: Production Deployment

**Prompt for AI Agent:**
```
Deploy API key authentication to production:
1. Deploy backend changes with API key support
2. Configure production API keys in Azure Key Vault
3. Deploy mobile app updates with API key support
4. Monitor production performance and errors
5. Validate user context and data filtering
```

**Expected Output:**
- Production deployment procedures
- Monitoring setup
- Validation procedures
- Error handling

## Phase 6: Cleanup and Deprecation

### Step 6.1: Deprecate JWT Endpoints

**Prompt for AI Agent:**
```
Deprecate JWT authentication endpoints after successful migration:
1. Mark JWT endpoints as deprecated in API documentation
2. Remove JWT-specific code from mobile app
3. Clean up JWT token management code
4. Update API documentation to reflect API key authentication
5. Remove unused JWT middleware and utilities
```

**Expected Output:**
- Deprecation procedures
- Code cleanup
- Documentation updates
- Removal procedures

### Step 6.2: Performance Optimization

**Prompt for AI Agent:**
```
Optimize performance after API key migration:
1. Remove JWT token refresh mechanisms
2. Optimize API key validation performance
3. Implement API key caching strategies
4. Monitor and optimize user context processing
5. Update performance monitoring and logging
```

**Expected Output:**
- Performance optimizations
- Caching strategies
- Monitoring updates
- Logging improvements

## Security Considerations

### Step 6.3: Security Validation

**Prompt for AI Agent:**
```
Validate security measures after API key migration:
1. Verify API key security and rotation procedures
2. Validate user context security and validation
3. Test data access controls and filtering
4. Verify audit logging and monitoring
5. Conduct security review and penetration testing
```

**Expected Output:**
- Security validation procedures
- Access control verification
- Audit logging validation
- Security testing results

## Documentation Updates

### Step 6.4: Update Documentation

**Prompt for AI Agent:**
```
Update all documentation to reflect API key authentication:
1. Update `API_ENDPOINTS_USED.md` to reflect API key authentication
2. Update `DYNAMIC_DISPLAY_SPEC.md` with API key context
3. Update mobile app documentation
4. Update API documentation and swagger specs
5. Create API key management documentation
```

**Expected Output:**
- Updated documentation
- API specifications
- Management procedures
- User guides

## Monitoring and Maintenance

### Step 6.5: Monitoring Setup

**Prompt for AI Agent:**
```
Set up monitoring for API key authentication:
1. Configure API key usage monitoring
2. Set up user context validation monitoring
3. Monitor data access patterns and filtering
4. Set up alerting for security events
5. Create dashboards for API key metrics
```

**Expected Output:**
- Monitoring configuration
- Alerting setup
- Dashboard creation
- Metrics tracking

## Rollback Procedures

### Step 6.6: Rollback Plan

**Prompt for AI Agent:**
```
Create rollback procedures for API key migration:
1. Document rollback procedures for backend changes
2. Create mobile app rollback procedures
3. Document data migration rollback procedures
4. Create communication plan for rollback scenarios
5. Test rollback procedures in staging environment
```

**Expected Output:**
- Rollback procedures
- Communication plans
- Testing procedures
- Emergency contacts

## Success Criteria

### Migration Success Metrics

**Prompt for AI Agent:**
```
Define success criteria for API key migration:
1. All mobile app users successfully migrated to API key authentication
2. Zero JWT authentication errors in production
3. Improved API response times
4. Proper user context filtering working correctly
5. Security validation passed
6. Documentation updated and accurate
```

**Expected Output:**
- Success metrics
- Validation procedures
- Performance benchmarks
- Security criteria

## Conclusion

This migration guide provides a comprehensive approach to switching from JWT authentication to API key authentication while maintaining Azure AD for app login. The step-by-step approach ensures minimal disruption and proper validation at each stage.

**Key Benefits:**
- Simplified authentication for API calls
- Improved performance by removing JWT token management
- Better security with API key rotation
- Maintained Azure AD integration for app login
- Proper user context and data filtering

**Timeline Estimate:**
- Phase 1 (Backend): 2-3 days
- Phase 2 (Mobile App): 2-3 days
- Phase 3 (Environment): 1 day
- Phase 4 (Testing): 2-3 days
- Phase 5 (Migration): 1-2 days
- Phase 6 (Cleanup): 1-2 days

**Total Estimated Time: 9-14 days**

Follow this guide step-by-step, executing each prompt with an AI agent to ensure proper implementation and validation of the API key authentication system.

