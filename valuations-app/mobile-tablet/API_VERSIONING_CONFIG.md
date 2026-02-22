# API Versioning Configuration Guide

## Overview

This document provides comprehensive configuration requirements for implementing API versioning in the Valuations Mobile Tablet Application. It covers both mobile app and backend API configurations needed for S22 - Implement API Versioning.

## Mobile App Configuration

### 1. Base URL Configuration

#### Current Configuration
```typescript
// constants/apiConfig.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 
                           Constants.expoConfig?.extra?.apiBaseUrl || 
                           '';
```

#### Required Changes
- **Base URL needs to be updated** to remove the `/api` suffix
- Current: `https://api.example.com/api` 
- Updated: `https://api.example.com` (remove `/api` suffix)
- Versioned endpoints will be appended to the updated base URL
- Example: `https://api.example.com` + `/api/v1/appointments` = `https://api.example.com/api/v1/appointments`

### 2. Transport Policies Configuration

#### Current Transport Policies
```typescript
// core/transport/policies.ts
export const policies = new Map<string, TransportPolicy>([
  ['appointments.list', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 5 * 60 * 1000,
    interpretEmptyPolicyKey: 'appointments_empty'
  }],
  // ... other policies
]);
```

#### Required Updates
All endpoint paths in API modules need to be updated to include `/api/v1/` prefix:

```typescript
// Before (current)
const response = await transportClient.get('appointments.list', '/appointments');

// After (versioned)
const response = await transportClient.get('appointments.list', '/api/v1/appointments');
```

### 3. API Module Updates

#### Authentication Module (`api/auth.js`)
```javascript
// Current endpoints
const response = await transportClient.get('auth.verify', '/auth/verify');
const response = await transportClient.post('auth.token-exchange', '/auth/token-exchange', requestData);
const response = await transportClient.post('auth.refresh-token', '/auth/refresh-token', requestData);

// Updated endpoints
const response = await transportClient.get('auth.verify', '/api/v1/auth/verify');
const response = await transportClient.post('auth.token-exchange', '/api/v1/auth/token-exchange', requestData);
const response = await transportClient.post('auth.refresh-token', '/api/v1/auth/refresh-token', requestData);
```

#### Appointments Module (`api/appointments.ts`)
```typescript
// Current endpoints
const response = await transportClient.get('appointments.list', '/appointments');
const response = await transportClient.get('appointments.list-view', '/mobile/appointment/list-view', params);
const response = await transportClient.get('appointments.with-orders', '/appointments/with-orders', { page, pageSize });
const response = await transportClient.get('appointments.list', '/appointments/stats');

// Updated endpoints
const response = await transportClient.get('appointments.list', '/api/v1/appointments');
const response = await transportClient.get('appointments.list-view', '/api/v1/mobile/appointment/list-view', params);
const response = await transportClient.get('appointments.with-orders', '/api/v1/appointments/with-orders', { page, pageSize });
const response = await transportClient.get('appointments.list', '/api/v1/appointments/stats');
```

#### Risk Templates Module (`api/riskTemplates.ts`)
```typescript
// Current endpoints
const response = await transportClient.get('risk-templates.list', '/risk-templates');
const response = await transportClient.get('risk-templates.sections', `/risk-assessment-sections/assessment/${templateId}`);
const response = await transportClient.get('risk-templates.categories', `/risk-assessment-categories/section/${sectionId}`);
const response = await transportClient.get('risk-templates.items', `/risk-assessment-items/category/${categoryId}`);

// Updated endpoints
const response = await transportClient.get('risk-templates.list', '/api/v1/risk-templates');
const response = await transportClient.get('risk-templates.sections', `/api/v1/risk-assessment-sections/assessment/${templateId}`);
const response = await transportClient.get('risk-templates.categories', `/api/v1/risk-assessment-categories/section/${sectionId}`);
const response = await transportClient.get('risk-templates.items', `/api/v1/risk-assessment-items/category/${categoryId}`);
```

#### Surveys Module (`api/surveys.ts`)
```typescript
// Current endpoints
const response = await transportClient.get('surveys.list', '/surveys');
const response = await transportClient.get('surveys.list', `/surveys/${surveyId}`);
const response = await transportClient.post('surveys.submit', `/surveys/${surveyId}/submit`, responses);
const response = await transportClient.get('surveys.list', '/surveys/stats');

// Updated endpoints
const response = await transportClient.get('surveys.list', '/api/v1/surveys');
const response = await transportClient.get('surveys.list', `/api/v1/surveys/${surveyId}`);
const response = await transportClient.post('surveys.submit', `/api/v1/surveys/${surveyId}/submit`, responses);
const response = await transportClient.get('surveys.list', '/api/v1/surveys/stats');
```

### 4. Services Configuration

#### Configuration Service (`services/configurationService.ts`)
```typescript
// Current endpoints
const categoryResponse = await transportClient.get('config.category-details', `/risk-assessment-categories/${categoryId}`);
const configResponse = await transportClient.get('config.category-complete', endpoint);
const response = await transportClient.get('config.field-options', `/mobile/config/field/${fieldId}/options`);
const response = await transportClient.get('config.template-categories', `/mobile/config/template/${templateId}/categories`);

// Updated endpoints
const categoryResponse = await transportClient.get('config.category-details', `/api/v1/risk-assessment-categories/${categoryId}`);
const configResponse = await transportClient.get('config.category-complete', endpoint);
const response = await transportClient.get('config.field-options', `/api/v1/mobile/config/field/${fieldId}/options`);
const response = await transportClient.get('config.template-categories', `/api/v1/mobile/config/template/${templateId}/categories`);
```

#### Prefetch Service (`services/prefetchService.ts`)
```typescript
// Current endpoints
const hierarchyResponse = await transportClient.get('risk-assessment.hierarchy', `/mobile/risk-assessment/${orderNumber}/complete-hierarchy`);
const response = await transportClient.get('config.field-config', `/risk-assessment-category-type-fields/category/${categoryId}?pageSize=30`);
const response = await transportClient.get('config.categories-all', '/mobile/config/categories/all/complete', {}, {

// Updated endpoints
const hierarchyResponse = await transportClient.get('risk-assessment.hierarchy', `/api/v1/mobile/risk-assessment/${orderNumber}/complete-hierarchy`);
const response = await transportClient.get('config.field-config', `/api/v1/risk-assessment-category-type-fields/category/${categoryId}?pageSize=30`);
const response = await transportClient.get('config.categories-all', '/api/v1/mobile/config/categories/all/complete', {}, {
```

### 5. Dashboard Configuration

#### Stats Cards Component (`components/dashboard/StatsCards.tsx`)
```typescript
// Current endpoint
const endpoint = '/mobile/appointment/dashboard/status-counts';

// Updated endpoint
const endpoint = '/api/v1/mobile/appointment/dashboard/status-counts';
```

## Backend API Configuration

### 1. API Gateway Configuration

#### Route Configuration
```yaml
# API Gateway routing configuration
routes:
  # Authentication endpoints
  - path: /api/v1/auth/*
    handler: auth-service
    methods: [GET, POST, PUT, DELETE]
    
  # Appointment endpoints
  - path: /api/v1/appointments/*
    handler: appointment-service
    methods: [GET, POST, PUT, DELETE]
    
  # Mobile configuration endpoints
  - path: /api/v1/mobile/*
    handler: mobile-config-service
    methods: [GET, POST, PUT, DELETE]
    
  # Risk assessment endpoints
  - path: /api/v1/risk-*
    handler: risk-assessment-service
    methods: [GET, POST, PUT, DELETE]
    
  # Sync endpoints
  - path: /api/v1/sync/*
    handler: sync-service
    methods: [GET, POST, PUT, DELETE]
    
  # Survey endpoints
  - path: /api/v1/surveys/*
    handler: survey-service
    methods: [GET, POST, PUT, DELETE]
    
  # Media endpoints
  - path: /api/v1/media/*
    handler: media-service
    methods: [GET, POST, PUT, DELETE]
```

### 2. CORS Configuration

#### CORS Settings
```yaml
cors:
  enabled: true
  allowed_origins:
    - "https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io"
    - "https://localhost:3000"  # Development
    - "https://localhost:8081"  # Expo development
  allowed_headers:
    - "Authorization"
    - "X-User-Context"
    - "Content-Type"
    - "Accept"
    - "X-Requested-With"
  allowed_methods:
    - "GET"
    - "POST"
    - "PUT"
    - "DELETE"
    - "OPTIONS"
  max_age: 86400  # 24 hours
```

### 3. Rate Limiting Configuration

#### Rate Limiting Rules
```yaml
rate_limiting:
  enabled: true
  rules:
    # Authentication endpoints - stricter limits
    - path: /api/v1/auth/*
      limit: 100 requests/hour
      burst: 10 requests/minute
      
    # Appointment endpoints - standard limits
    - path: /api/v1/appointments/*
      limit: 1000 requests/hour
      burst: 50 requests/minute
      
    # Media upload endpoints - lower limits
    - path: /api/v1/sync/media/upload
      limit: 50 requests/hour
      burst: 5 requests/minute
      
    # Default limits
    - path: /api/v1/*
      limit: 500 requests/hour
      burst: 25 requests/minute
```

### 4. Authentication Configuration

#### JWT Configuration
```yaml
jwt:
  issuer: "valuations-api"
  audience: "valuations-mobile-app"
  algorithm: "RS256"
  access_token_expiry: "15m"
  refresh_token_expiry: "7d"
  
# User context header configuration
user_context:
  header_name: "X-User-Context"
  hash_algorithm: "SHA-256"
  required: true
```

### 5. Database Configuration

#### Connection Pooling
```yaml
database:
  connection_pool:
    min_connections: 5
    max_connections: 50
    connection_timeout: 30000
    idle_timeout: 600000
    
  # Query optimization for versioned endpoints
  query_optimization:
    enable_query_cache: true
    cache_ttl: 300  # 5 minutes
    max_cache_size: 1000
```

## Environment Configuration

### 1. Development Environment

#### Mobile App (.env.development)
```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io
EXPO_PUBLIC_API_VERSION=v1
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=debug

# Azure AD Configuration
EXPO_PUBLIC_AZURE_CLIENT_ID=your-azure-client-id
EXPO_PUBLIC_AZURE_TENANT_ID=your-azure-tenant-id
EXPO_PUBLIC_AZURE_REDIRECT_URI=your-redirect-uri
```

#### Backend API (appsettings.Development.json)
```json
{
  "ApiVersioning": {
    "DefaultVersion": "v1",
    "SupportedVersions": ["v1"],
    "EnableVersioning": true
  },
  "Cors": {
    "AllowedOrigins": [
      "https://localhost:3000",
      "https://localhost:8081"
    ]
  },
  "RateLimiting": {
    "Enabled": true,
    "DefaultLimit": 1000
  }
}
```

### 2. Production Environment

#### Mobile App (.env.production)
```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io
EXPO_PUBLIC_API_VERSION=v1
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_LOG_LEVEL=info

# Azure AD Configuration
EXPO_PUBLIC_AZURE_CLIENT_ID=your-production-azure-client-id
EXPO_PUBLIC_AZURE_TENANT_ID=your-production-azure-tenant-id
EXPO_PUBLIC_AZURE_REDIRECT_URI=your-production-redirect-uri
```

#### Backend API (appsettings.Production.json)
```json
{
  "ApiVersioning": {
    "DefaultVersion": "v1",
    "SupportedVersions": ["v1"],
    "EnableVersioning": true
  },
  "Cors": {
    "AllowedOrigins": [
      "https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io"
    ]
  },
  "RateLimiting": {
    "Enabled": true,
    "DefaultLimit": 500
  }
}
```

## Monitoring Configuration

### 1. API Monitoring

#### Metrics Configuration
```yaml
monitoring:
  metrics:
    enabled: true
    endpoints:
      - path: /api/v1/*
        metrics: [request_count, response_time, error_rate]
        
  # Health checks
  health_checks:
    - name: "api-versioning"
      path: "/api/v1/health"
      interval: 30s
      
  # Alerting
  alerts:
    - name: "high_error_rate"
      condition: "error_rate > 5%"
      duration: "5m"
      
    - name: "slow_response"
      condition: "response_time > 2s"
      duration: "2m"
```

### 2. Logging Configuration

#### Structured Logging
```yaml
logging:
  level: "info"
  format: "json"
  fields:
    - "timestamp"
    - "level"
    - "message"
    - "endpoint"
    - "version"
    - "user_id"
    - "request_id"
    
  # Sensitive data redaction
  redaction:
    - "password"
    - "token"
    - "authorization"
    - "x-user-context"
```

## Testing Configuration

### 1. Unit Testing

#### Test Configuration
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'api/**/*.ts',
    'services/**/*.ts',
    'core/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 2. Integration Testing

#### API Testing Configuration
```yaml
# api-tests.yml
test_suites:
  - name: "versioned_endpoints"
    base_url: "https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api"
    endpoints:
      - path: "/api/v1/auth/verify"
        method: "GET"
        expected_status: 200
        
      - path: "/api/v1/appointments"
        method: "GET"
        expected_status: 200
        
      - path: "/api/v1/mobile/config/categories/all/complete"
        method: "GET"
        expected_status: 200
```

## Deployment Configuration

### 1. CI/CD Pipeline

#### Build Configuration
```yaml
# .github/workflows/api-versioning.yml
name: API Versioning Deployment

on:
  push:
    branches: [main]
    paths: ['api/**', 'mobile-app/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run API tests
        run: |
          npm test
          npm run test:integration
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy versioned endpoints
        run: |
          kubectl apply -f k8s/api-versioning.yaml
          kubectl rollout status deployment/api-service
```

### 2. Kubernetes Configuration

#### API Versioning Deployment
```yaml
# k8s/api-versioning.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-versioning
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-versioning
  template:
    metadata:
      labels:
        app: api-versioning
    spec:
      containers:
      - name: api-service
        image: valuations-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: API_VERSIONING_ENABLED
          value: "true"
        - name: API_DEFAULT_VERSION
          value: "v1"
```

## Validation Checklist

### Mobile App Validation
- [ ] All API endpoints updated to use `/api/v1/` prefix
- [ ] Transport policies updated with versioned endpoints
- [ ] Authentication flow works with versioned endpoints
- [ ] Offline functionality works with versioned endpoints
- [ ] Error handling works with versioned endpoints

### Backend API Validation
- [ ] All versioned endpoints implemented
- [ ] Backward compatibility maintained
- [ ] CORS configuration updated
- [ ] Rate limiting configured
- [ ] Monitoring and logging configured
- [ ] Health checks implemented

### Integration Validation
- [ ] Mobile app connects to versioned endpoints
- [ ] Authentication works end-to-end
- [ ] Data integrity maintained
- [ ] Performance meets requirements
- [ ] Error handling works correctly

## Conclusion

This configuration guide provides all the necessary settings and configurations for implementing API versioning in the Valuations Mobile Tablet Application. Follow the configurations in order, test thoroughly, and monitor the deployment to ensure successful implementation of S22 - API Versioning.
