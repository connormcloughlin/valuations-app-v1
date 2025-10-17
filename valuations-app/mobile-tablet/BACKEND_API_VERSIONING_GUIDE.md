# Backend API Versioning Implementation Guide

## Overview

This document provides comprehensive guidance for backend API developers to implement API versioning for the Valuations Mobile Tablet Application. The mobile app currently uses unversioned endpoints and needs to be updated to use versioned endpoints with `/api/v1/` prefix.

## Current Status

- **Mobile App**: Uses unversioned endpoints (e.g., `/appointments`, `/auth/verify`)
- **Target**: All endpoints should be versioned with `/api/v1/` prefix
- **Implementation**: S22 - Implement API Versioning (/api/v1/ endpoints)

## Required Backend Changes

### 1. Authentication Endpoints

#### Current Endpoints → Versioned Endpoints
```
GET  /auth/verify                    → GET  /api/v1/auth/verify
POST /auth/token-exchange           → POST /api/v1/auth/token-exchange
POST /auth/refresh-token            → POST /api/v1/auth/refresh-token
```

#### Implementation Requirements
- **Backward Compatibility**: Maintain existing unversioned endpoints for transition period
- **Response Format**: No changes to response structure
- **Authentication**: Same JWT Bearer token authentication
- **Headers**: Same `X-User-Context` header support

### 2. Appointment Management Endpoints

#### Current Endpoints → Versioned Endpoints
```
GET  /appointments                           → GET  /api/v1/appointments
GET  /appointments/{id}/with-order           → GET  /api/v1/appointments/{id}/with-order
GET  /appointments/{id}                      → GET  /api/v1/appointments/{id}
GET  /appointments/with-orders               → GET  /api/v1/appointments/with-orders
GET  /appointments/stats                     → GET  /api/v1/appointments/stats
PUT  /appointments/{id}                      → PUT  /api/v1/appointments/{id}
GET  /mobile/appointment/list-view           → GET  /api/v1/mobile/appointment/list-view
GET  /mobile/appointment/dashboard/status-counts → GET /api/v1/mobile/appointment/dashboard/status-counts
```

#### Implementation Requirements
- **Pagination**: Maintain existing pagination parameters (`page`, `pageSize`)
- **Filtering**: Support existing filter parameters (`inviteStatus`, `surveyor`, `startDateFrom`, `startDateTo`)
- **Response Format**: No changes to appointment object structure
- **Performance**: Maintain existing performance optimizations

### 3. Risk Assessment Endpoints

#### Current Endpoints → Versioned Endpoints
```
GET  /risk-templates                                    → GET  /api/v1/risk-templates
GET  /risk-assessment-master/by-order/{orderId}        → GET  /api/v1/risk-assessment-master/by-order/{orderId}
GET  /mobile/risk-assessment/{orderId}/complete-hierarchy → GET  /api/v1/mobile/risk-assessment/{orderId}/complete-hierarchy
GET  /risk-assessment-sections/assessment/{templateId}  → GET  /api/v1/risk-assessment-sections/assessment/{templateId}
GET  /risk-assessment-categories/section/{sectionId}    → GET  /api/v1/risk-assessment-categories/section/{sectionId}
GET  /risk-assessment-items/category/{categoryId}       → GET  /api/v1/risk-assessment-items/category/{categoryId}
```

#### Implementation Requirements
- **Hierarchy Data**: Maintain complete hierarchy structure
- **Caching**: Support existing caching mechanisms
- **Fallback Handling**: Maintain graceful 404 handling for missing data

### 4. Dynamic UI Configuration Endpoints

#### Current Endpoints → Versioned Endpoints
```
GET  /mobile/config/category/{categoryId}/complete           → GET  /api/v1/mobile/config/category/{categoryId}/complete
GET  /mobile/config/order/{orderId}/categories/complete     → GET  /api/v1/mobile/config/order/{orderId}/categories/complete
GET  /risk-assessment-categories/{categoryId}                → GET  /api/v1/risk-assessment-categories/{categoryId}
GET  /mobile/config/field/{fieldId}/options                 → GET  /api/v1/mobile/config/field/{fieldId}/options
GET  /mobile/config/template/{templateId}/categories        → GET  /api/v1/mobile/config/template/{templateId}/categories
GET  /risk-assessment-category-type-fields/category/{categoryId} → GET /api/v1/risk-assessment-category-type-fields/category/{categoryId}
GET  /mobile/config/categories/all/complete                 → GET  /api/v1/mobile/config/categories/all/complete
```

#### Implementation Requirements
- **Configuration Data**: Maintain existing configuration structure
- **Field Options**: Support dropdown options and field configurations
- **Template Categories**: Maintain template-category relationships

### 5. Media Management Endpoints

#### Current Endpoints → Versioned Endpoints
```
POST /sync/media/upload                    → POST /api/v1/sync/media/upload
GET  /sync/media/entity/{entityName}/{entityId} → GET /api/v1/sync/media/entity/{entityName}/{entityId}
DELETE /media/{mediaId}                     → DELETE /api/v1/media/{mediaId}
```

#### Implementation Requirements
- **File Upload**: Support multipart form data uploads
- **Entity Association**: Maintain entity-media relationships
- **File Types**: Support photo, document, signature file types

### 6. Synchronization Endpoints

#### Current Endpoints → Versioned Endpoints
```
POST /sync/changes                         → POST /api/v1/sync/changes
GET  /sync/changes                         → GET  /api/v1/sync/changes
POST /sync/batch                           → POST /api/v1/sync/batch
GET  /sync/sessions                        → GET  /api/v1/sync/sessions
GET  /sync/debug                           → GET  /api/v1/sync/debug
```

#### Implementation Requirements
- **Sync Data**: Maintain existing sync data structure
- **Conflict Resolution**: Support existing conflict resolution mechanisms
- **Batch Processing**: Maintain batch sync capabilities

### 7. Survey Management Endpoints

#### Current Endpoints → Versioned Endpoints
```
GET  /surveys                              → GET  /api/v1/surveys
GET  /surveys/{surveyId}                   → GET  /api/v1/surveys/{surveyId}
POST /surveys/{surveyId}/submit           → POST /api/v1/surveys/{surveyId}/submit
GET  /surveys/stats                        → GET  /api/v1/surveys/stats
```

#### Implementation Requirements
- **Survey Data**: Maintain existing survey structure
- **Submission**: Support survey response submission
- **Statistics**: Maintain survey statistics functionality

## Implementation Strategy

### Phase 1: Backend API Versioning (Backend Team)

1. **Create Versioned Endpoints**
   - Implement all endpoints with `/api/v1/` prefix
   - Maintain existing functionality and response formats
   - Add proper API versioning headers

2. **Backward Compatibility**
   - Keep existing unversioned endpoints active
   - Add deprecation warnings to unversioned endpoints
   - Plan sunset timeline for unversioned endpoints

3. **Testing**
   - Test all versioned endpoints
   - Verify response format consistency
   - Performance testing for versioned endpoints

### Phase 2: Mobile App Updates (Mobile Team)

1. **Update Transport Policies**
   - Update `core/transport/policies.ts` with versioned endpoint paths
   - Maintain existing timeout and retry configurations

2. **Update API Modules**
   - Update all API modules to use versioned endpoints
   - Update `api/auth.js`, `api/appointments.ts`, `api/riskTemplates.ts`, `api/surveys.ts`
   - Update `services/configurationService.ts`, `services/prefetchService.ts`

3. **Update Transport Client**
   - Ensure transport client supports versioned endpoints
   - Update endpoint ID mappings

### Phase 3: Testing and Validation

1. **Integration Testing**
   - Test all versioned endpoints with mobile app
   - Verify authentication flow with versioned endpoints
   - Test offline/online functionality

2. **Performance Testing**
   - Compare performance between versioned and unversioned endpoints
   - Verify caching mechanisms work with versioned endpoints

3. **User Acceptance Testing**
   - Test complete user workflows
   - Verify data integrity across all operations

## Configuration Requirements

### Backend Configuration

1. **API Gateway/Router Configuration**
   ```yaml
   # Example routing configuration
   routes:
     - path: /api/v1/auth/*
       handler: auth-service
     - path: /api/v1/appointments/*
       handler: appointment-service
     - path: /api/v1/mobile/*
       handler: mobile-config-service
   ```

2. **CORS Configuration**
   ```yaml
   cors:
     allowed_origins:
       - "https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io"
     allowed_headers:
       - "Authorization"
       - "X-User-Context"
       - "Content-Type"
   ```

3. **Rate Limiting**
   ```yaml
   rate_limiting:
     default: 1000 requests/hour
     auth_endpoints: 100 requests/hour
     upload_endpoints: 50 requests/hour
   ```

### Mobile App Configuration

1. **Base URL Configuration**
   ```typescript
   // constants/apiConfig.ts
   export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 
                              Constants.expoConfig?.extra?.apiBaseUrl || 
                              'https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api';
   ```

2. **Transport Policies Update**
   ```typescript
   // core/transport/policies.ts
   // Update all endpoint paths to include /api/v1/ prefix
   ['appointments.list', {
     timeoutMs: 15000,
     retry: { attempts: 2, strategy: 'exponential' },
     cacheTTL: 5 * 60 * 1000,
     interpretEmptyPolicyKey: 'appointments_empty'
   }],
   ```

## Migration Timeline

### Week 1: Backend Implementation
- [ ] Implement all versioned endpoints
- [ ] Add backward compatibility
- [ ] Internal testing of versioned endpoints

### Week 2: Mobile App Updates
- [ ] Update transport policies
- [ ] Update API modules
- [ ] Update transport client

### Week 3: Integration Testing
- [ ] Test versioned endpoints with mobile app
- [ ] Performance testing
- [ ] User acceptance testing

### Week 4: Deployment and Monitoring
- [ ] Deploy versioned endpoints
- [ ] Monitor API usage
- [ ] Plan sunset of unversioned endpoints

## Monitoring and Metrics

### Key Metrics to Track
1. **API Usage**: Track usage of versioned vs unversioned endpoints
2. **Performance**: Monitor response times for versioned endpoints
3. **Error Rates**: Track error rates for versioned endpoints
4. **Mobile App Compatibility**: Monitor mobile app functionality

### Monitoring Tools
- API Gateway metrics
- Application performance monitoring
- Error tracking and logging
- Mobile app analytics

## Rollback Plan

### If Issues Arise
1. **Immediate Rollback**: Revert mobile app to unversioned endpoints
2. **Backend Rollback**: Disable versioned endpoints if critical issues
3. **Communication**: Notify all stakeholders of rollback

### Rollback Triggers
- High error rates (>5%) on versioned endpoints
- Performance degradation (>20% slower response times)
- Mobile app functionality issues
- Data integrity concerns

## Success Criteria

### Technical Success
- [ ] All versioned endpoints return correct responses
- [ ] Mobile app functions normally with versioned endpoints
- [ ] Performance is maintained or improved
- [ ] No data integrity issues

### Business Success
- [ ] No user impact during migration
- [ ] Improved API lifecycle management
- [ ] Better backward compatibility planning
- [ ] Enhanced monitoring and observability

## Support and Communication

### Stakeholders
- Backend API Development Team
- Mobile App Development Team
- QA/Testing Team
- DevOps/Infrastructure Team
- Product Management

### Communication Plan
- Weekly progress updates
- Issue escalation procedures
- Rollback communication plan
- Post-migration review

## Conclusion

This implementation guide provides a comprehensive roadmap for implementing API versioning for the Valuations Mobile Tablet Application. The phased approach ensures minimal disruption while providing long-term benefits for API lifecycle management and backward compatibility.

The key to success is maintaining backward compatibility during the transition period and thorough testing of all versioned endpoints before full deployment.



