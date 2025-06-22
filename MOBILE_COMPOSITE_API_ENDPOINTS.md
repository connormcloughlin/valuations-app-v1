# Mobile Composite API Endpoints Specification

## Overview

This document specifies the new composite API endpoints designed to eliminate N+1 query patterns in the mobile-tablet application. These endpoints are optimized for mobile consumption with reduced payload sizes, proper caching headers, and SQLite-friendly data structures.

---

## 1. Risk Assessment Complete Hierarchy API

### Endpoint
```
GET /api/mobile/risk-assessment-master/{orderId}/complete-hierarchy
```

### Purpose
Replaces 8-15 sequential API calls to fetch complete risk assessment hierarchy with all nested sections, categories, and items in a single request.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | Yes | Order ID or Order Number |

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeInactive` | boolean | false | Include inactive items in response |
| `includeAnswers` | boolean | true | Include existing user answers |
| `format` | string | "mobile" | Response format (mobile/web) |

### Request Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Device-Type: mobile
X-App-Version: {version}
```

### Response Structure
```json
{
  "success": true,
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "orderNumber": "ORD-2024-001",
    "orderInfo": {
      "orderId": "5297",
      "orderType": "Contents",
      "policyNumber": "POL-001",
      "sumInsured": "50000.00",
      "clientName": "John Smith",
      "propertyAddress": "123 Main Street, City, State"
    },
    "assessmentMasters": [
      {
        "riskAssessmentId": "RA-001",
        "assessmentTypeName": "Contents Assessment",
        "templateName": "Standard Home Template",
        "templateId": "TEMP-001",
        "status": "In Progress",
        "completionPercentage": 65,
        "lastModified": "2024-01-20T09:15:00Z",
        "sections": [
          {
            "riskAssessmentSectionId": "SEC-001",
            "sectionName": "Living Room",
            "sectionOrder": 1,
            "isCompleted": false,
            "categories": [
              {
                "riskAssessmentCategoryId": "CAT-001",
                "categoryName": "Furniture",
                "categoryOrder": 1,
                "itemCount": 15,
                "completedItemCount": 8,
                "totalValue": 12500.00,
                "items": [
                  {
                    "riskAssessmentItemId": 123,
                    "itemPrompt": "Leather Sofa - Brand and Condition",
                    "itemType": 1,
                    "rank": 1,
                    "commaSeperatedList": "Brown,Black,Cream",
                    "selectedAnswer": "",
                    "qty": 0,
                    "price": 0,
                    "description": "",
                    "model": "",
                    "location": "",
                    "assessmentRegisterId": 0,
                    "assessmentRegisterTypeId": 0,
                    "isActive": true,
                    "isRequired": false,
                    "hasPhoto": false,
                    "createdDate": "2024-01-20T08:00:00Z",
                    "modifiedDate": "2024-01-20T09:15:00Z"
                  }
                ]
              }
            ],
            "sectionItemCount": 50,
            "sectionCompletedCount": 32,
            "sectionTotalValue": 25000.00
          }
        ],
        "totalItems": 150,
        "completedItems": 98,
        "totalSections": 8,
        "totalCategories": 25,
        "assessmentTotalValue": 75000.00
      }
    ],
    "summary": {
      "totalAssessments": 2,
      "totalItems": 300,
      "completedItems": 195,
      "overallCompletionPercentage": 65,
      "overallTotalValue": 150000.00,
      "estimatedCompletionTime": "2024-01-20T16:00:00Z"
    },
    "metadata": {
      "cacheable": true,
      "cacheKey": "risk_assessment_hierarchy_ORD-2024-001",
      "expiresIn": 3600,
      "dataVersion": "v1.2",
      "generatedAt": "2024-01-20T10:30:00Z"
    }
  }
}
```

### Error Responses
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found or access denied",
    "details": "Order ORD-2024-001 does not exist or user lacks permission"
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Caching Strategy
- **Cache Key**: `risk_assessment_hierarchy_{orderId}_{userId}`
- **TTL**: 1 hour for active assessments, 24 hours for completed
- **Invalidation**: On any item update, section completion, or assessment submission

---

## 2. Survey Summary Composite API

### Endpoint
```
GET /api/mobile/survey/{orderId}/summary-complete
```

### Purpose
Generates complete survey summary with calculated totals, completion percentages, and submission readiness status.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | Yes | Order ID or Order Number |

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeDetails` | boolean | true | Include section/category breakdowns |
| `includeValidation` | boolean | true | Include submission validation results |

### Response Structure
```json
{
  "success": true,
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "surveyId": "SURV-001",
    "orderNumber": "ORD-2024-001",
    "surveyStatus": "In Progress",
    "appointmentData": {
      "appointmentId": "APP-001",
      "appointmentDate": "2024-01-20",
      "appointmentTime": "10:00:00",
      "client": "John Smith",
      "address": "123 Main Street, City, State",
      "policyNo": "POL-001",
      "sumInsured": "50000.00",
      "broker": "ABC Insurance",
      "surveyor": {
        "name": "Jane Surveyor",
        "email": "jane@company.com"
      }
    },
    "assessmentSummaries": [
      {
        "riskAssessmentId": "RA-001",
        "assessmentTypeName": "Contents Assessment",
        "templateName": "Standard Home Template",
        "startedAt": "2024-01-20T08:00:00Z",
        "lastActivity": "2024-01-20T09:45:00Z",
        "sections": [
          {
            "sectionId": "SEC-001",
            "sectionName": "Living Room",
            "sectionOrder": 1,
            "categories": [
              {
                "categoryId": "CAT-001",
                "categoryName": "Furniture",
                "categoryOrder": 1,
                "itemCount": 15,
                "completedItems": 12,
                "totalValue": 12500.00,
                "averageItemValue": 833.33,
                "completionPercentage": 80,
                "hasRequiredIncomplete": false
              }
            ],
            "sectionItemCount": 50,
            "sectionCompletedCount": 42,
            "sectionTotalValue": 25000.00,
            "sectionCompletionPercentage": 84,
            "estimatedTimeRemaining": "00:45:00"
          }
        ],
        "assessmentItemCount": 150,
        "assessmentCompletedCount": 130,
        "assessmentTotalValue": 75000.00,
        "assessmentCompletionPercentage": 87,
        "qualityScore": 92,
        "photoCount": 45,
        "noteCount": 12
      }
    ],
    "overallSummary": {
      "totalItems": 300,
      "completedItems": 261,
      "totalValue": 150000.00,
      "completionPercentage": 87,
      "qualityScore": 89,
      "totalPhotoCount": 89,
      "totalNoteCount": 23,
      "estimatedTimeRemaining": "01:30:00",
      "lastActivity": "2024-01-20T14:30:00Z"
    },
    "submissionStatus": {
      "canSubmit": false,
      "readyForReview": true,
      "requiredCompletionPercentage": 90,
      "currentCompletionPercentage": 87,
      "missingRequiredFields": [
        {
          "sectionName": "Kitchen",
          "categoryName": "Appliances",
          "itemPrompt": "Refrigerator - Brand Required",
          "itemId": 234
        }
      ],
      "warnings": [
        {
          "type": "LOW_VALUE_ITEMS",
          "message": "5 items have no value assigned",
          "severity": "warning"
        }
      ],
      "validationErrors": []
    },
    "metadata": {
      "reportGenerated": "2024-01-20T10:30:00Z",
      "dataVersion": "v1.1",
      "cacheable": true,
      "cacheKey": "survey_summary_ORD-2024-001"
    }
  }
}
```

---

## 3. Appointment Complete Data API

### Endpoint
```
GET /api/mobile/appointments/{appointmentId}/complete
```

### Purpose
Single endpoint for complete appointment data with consistent structure, eliminating multiple endpoint fallbacks.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appointmentId` | string | Yes | Appointment ID |

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeAssessments` | boolean | true | Include risk assessment status |
| `includeNotes` | boolean | true | Include appointment notes |

### Response Structure
```json
{
  "success": true,
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "appointment": {
      "appointmentId": "5297",
      "date": "2024-01-20",
      "time": "10:00:00",
      "duration": 120,
      "status": "Scheduled",
      "inviteStatus": "Booked",
      "appointmentType": "Contents Survey",
      "priority": "Normal",
      "createdAt": "2024-01-15T09:00:00Z",
      "lastModified": "2024-01-18T14:30:00Z"
    },
    "client": {
      "clientId": "CLI-001",
      "clientName": "John Smith",
      "phone": "+1234567890",
      "email": "john@email.com",
      "alternateContact": {
        "name": "Jane Smith",
        "phone": "+1234567891",
        "relationship": "Spouse"
      }
    },
    "order": {
      "orderId": "5297",
      "orderNumber": "ORD-2024-001",
      "policyNumber": "POL-001",
      "orderType": "Contents",
      "sumInsured": "50000.00",
      "currency": "USD",
      "claimNumber": "CLM-001",
      "lossDate": "2024-01-10",
      "lossType": "Fire Damage"
    },
    "property": {
      "propertyId": "PROP-001",
      "address": {
        "street": "123 Main Street",
        "city": "Anytown", 
        "state": "State",
        "zipCode": "12345",
        "country": "USA",
        "fullAddress": "123 Main Street, Anytown, State 12345"
      },
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "propertyType": "Residential",
      "yearBuilt": 1995,
      "squareFootage": 2500
    },
    "surveyor": {
      "surveyorId": "SURV-001",
      "name": "Jane Surveyor",
      "email": "jane@company.com",
      "phone": "+1987654321",
      "specializations": ["Contents", "Art", "Jewelry"],
      "region": "North",
      "rating": 4.8,
      "completedSurveys": 156
    },
    "broker": {
      "brokerName": "ABC Insurance",
      "contactName": "Mike Broker",
      "email": "mike@abcinsurance.com",
      "phone": "+1555123456"
    },
    "insurer": {
      "insurerName": "XYZ Insurance",
      "policyType": "Homeowners",
      "coverage": {
        "contents": "50000.00",
        "building": "200000.00",
        "additionalLiving": "20000.00"
      }
    },
    "assessments": [
      {
        "riskAssessmentId": "RA-001",
        "assessmentTypeName": "Contents Assessment",
        "templateName": "Standard Home Template",
        "status": "Not Started",
        "progress": 0,
        "estimatedDuration": "02:00:00",
        "assignedSurveyor": "Jane Surveyor"
      }
    ],
    "notes": [
      {
        "noteId": "NOTE-001",
        "type": "Appointment",
        "content": "Initial property assessment - client will be present",
        "createdBy": "Admin User",
        "createdAt": "2024-01-18T14:30:00Z",
        "isPrivate": false
      }
    ],
    "documents": [
      {
        "documentId": "DOC-001",
        "documentType": "Policy",
        "fileName": "policy_POL-001.pdf",
        "uploadedAt": "2024-01-15T10:00:00Z",
        "fileSize": 256000
      }
    ],
    "metadata": {
      "region": "North",
      "timezone": "America/New_York",
      "weatherForecast": {
        "date": "2024-01-20",
        "condition": "Sunny",
        "temperature": "72°F",
        "precipitation": "0%"
      },
      "drivingDirections": {
        "distance": "15.2 miles",
        "estimatedTime": "22 minutes",
        "trafficCondition": "Light"
      }
    }
  }
}
```

---

## 4. Template Batch Population API

### Endpoint
```
POST /api/mobile/risk-assessment/populate-template
```

### Purpose
Batch endpoint for populating SQLite with complete template data, optimized for mobile storage.

### Request Body
```json
{
  "assessmentId": "RA-001",
  "deviceId": "mobile-device-001",
  "deviceInfo": {
    "platform": "iOS",
    "version": "17.2",
    "appVersion": "2.1.0"
  },
  "options": {
    "includeInactive": false,
    "sqliteOptimized": true,
    "includeMetadata": true,
    "batchSize": 100
  }
}
```

### Response Structure
```json
{
  "success": true,
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "populationId": "POP-001",
    "assessmentId": "RA-001",
    "templateInfo": {
      "templateId": "TEMP-001",
      "templateName": "Standard Home Template",
      "version": "2.1",
      "lastUpdated": "2024-01-15T00:00:00Z"
    },
    "batchData": {
      "sections": [
        {
          "riskAssessmentSectionId": 1,
          "sectionName": "Living Room",
          "sectionOrder": 1,
          "riskAssessmentId": "RA-001",
          "isActive": true,
          "createdDate": "2024-01-20T10:30:00Z"
        }
      ],
      "categories": [
        {
          "riskAssessmentCategoryId": 1,
          "categoryName": "Furniture",
          "categoryOrder": 1,
          "riskAssessmentSectionId": 1,
          "isActive": true,
          "createdDate": "2024-01-20T10:30:00Z"
        }
      ],
      "items": [
        {
          "riskAssessmentItemId": 123,
          "riskAssessmentCategoryId": 1,
          "itemPrompt": "Leather Sofa - Brand and Condition",
          "itemType": 1,
          "rank": 1,
          "commaSeperatedList": "Brown,Black,Cream",
          "selectedAnswer": "",
          "qty": 0,
          "price": 0.00,
          "description": "",
          "model": "",
          "location": "",
          "assessmentRegisterId": 0,
          "assessmentRegisterTypeId": 0,
          "isActive": true,
          "isRequired": false,
          "createdBy": "system",
          "createdDate": "2024-01-20T10:30:00Z",
          "modifiedDate": "2024-01-20T10:30:00Z"
        }
      ]
    },
    "statistics": {
      "totalSections": 8,
      "totalCategories": 25,
      "totalItems": 150,
      "activeSections": 8,
      "activeCategories": 25,
      "activeItems": 147,
      "estimatedSqliteSize": "2.5MB",
      "compressionRatio": "65%"
    },
    "sqliteOperations": {
      "recommendedBatchSize": 50,
      "useTransaction": true,
      "indexesRequired": [
        "idx_sections_assessment_id",
        "idx_categories_section_id", 
        "idx_items_category_id"
      ],
      "optimizedQueries": {
        "sectionsInsert": "INSERT OR REPLACE INTO risk_assessment_sections (riskAssessmentSectionId, sectionName, sectionOrder, riskAssessmentId, isActive, createdDate) VALUES (?, ?, ?, ?, ?, ?)",
        "categoriesInsert": "INSERT OR REPLACE INTO risk_assessment_categories (riskAssessmentCategoryId, categoryName, categoryOrder, riskAssessmentSectionId, isActive, createdDate) VALUES (?, ?, ?, ?, ?, ?)",
        "itemsInsert": "INSERT OR REPLACE INTO risk_assessment_items (riskAssessmentItemId, riskAssessmentCategoryId, itemPrompt, itemType, rank, commaSeperatedList, selectedAnswer, qty, price, description, model, location, assessmentRegisterId, assessmentRegisterTypeId, isActive, isRequired, createdBy, createdDate, modifiedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      }
    },
    "metadata": {
      "populationVersion": "1.0",
      "dataIntegrity": "verified",
      "cacheable": false,
      "processingTime": "00:00:02.150"
    }
  }
}
```

---

## Common Response Headers

All endpoints should include these headers for mobile optimization:

```
Content-Type: application/json
Cache-Control: public, max-age=3600 (or appropriate caching strategy)
ETag: "version-hash"
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642684800
X-Data-Version: v1.2
X-Response-Time: 245ms
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional technical details",
    "field": "fieldName" // for validation errors
  },
  "timestamp": "2024-01-20T10:30:00Z",
  "requestId": "req-123456789"
}
```

### Common Error Codes
- `ORDER_NOT_FOUND` - Order doesn't exist or access denied
- `ASSESSMENT_NOT_FOUND` - Risk assessment not found
- `APPOINTMENT_NOT_FOUND` - Appointment not found
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication failed
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Temporary service unavailability

## Performance Requirements

### Response Time Targets
- Risk Assessment Hierarchy: < 500ms
- Survey Summary: < 300ms
- Appointment Complete: < 200ms
- Template Population: < 1000ms

### Payload Size Limits
- Maximum response size: 10MB
- Recommended response size: < 2MB
- Use pagination for large datasets

### Caching Strategy
- ETags for cache validation
- Appropriate cache headers
- Cache invalidation on data updates
- Mobile-friendly cache TTL values

---

*Document Version: 1.0*  
*Last Updated: 2024-01-20*  
*Target Implementation: Mobile-Tablet App Optimization*

---

## Mobile App Integration Guide

### Expected Usage During Code Modification

This section documents how these composite endpoints will be integrated into the mobile-tablet app during the modification process.

### 1. Risk Assessment Flow Integration

**Current Implementation in `app/(tabs)/new-survey.tsx`:**
```typescript
// OLD: Multiple sequential API calls
const populateTemplateItems = async (assessmentId: string) => {
  const sectionsResponse = await api.getRiskAssessmentSections(assessmentId);
  for (const section of sectionsResponse.data) {
    const categoriesResponse = await api.getRiskAssessmentCategories(section.riskassessmentsectionid);
    for (const category of categoriesResponse.data) {
      const itemsResponse = await api.getRiskAssessmentItems(category.riskassessmentcategoryid);
    }
  }
};
```

**Expected Implementation with Composite API:**
```typescript
// NEW: Single composite API call
const populateTemplateItems = async (orderId: string) => {
  try {
    const response = await api.getRiskAssessmentCompleteHierarchy(orderId);
    if (response.success) {
      await batchInsertHierarchyData(response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to populate template items:', error);
    throw error;
  }
};

const batchInsertHierarchyData = async (hierarchyData: any) => {
  const db = await SQLite.openDatabaseAsync('risk_assessments.db');
  await db.withTransactionAsync(async () => {
    for (const master of hierarchyData.assessmentMasters) {
      for (const section of master.sections) {
        // Batch insert sections, categories, and items
        await insertSectionWithCategories(section);
      }
    }
  });
};
```

### 2. Survey Summary Hook Integration

**Current Implementation in `app/survey/summary/hooks/useSurveySummaryData.ts`:**
```typescript
// OLD: Complex nested API calls
for (const master of filteredMastersData) {
  const sectionsResponse = await api.getRiskAssessmentSections(riskAssessmentId);
  for (const section of sections) {
    const categoriesResponse = await api.getRiskAssessmentCategories(section.id);
    for (const category of categoriesResponse.data) {
      const apiResponse = await api.getRiskAssessmentItems(categoryId);
    }
  }
}
```

**Expected Implementation with Composite API:**
```typescript
// NEW: Single composite call with built-in summary calculations
const useSurveySummaryData = (orderId: string) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getSurveyCompleteData(orderId);
      if (response.success) {
        setSummaryData(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summaryData, loading, error, refetch: fetchSummary };
};
```

### 3. API Client Updates

**Expected additions to `api/index.ts`:**
```typescript
export default {
  // ... existing methods

  // NEW COMPOSITE ENDPOINTS
  getRiskAssessmentCompleteHierarchy: async (orderId: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get(
        `/mobile/risk-assessment-master/${orderId}/complete-hierarchy`
      );
      
      if (response.data?.success) {
        // Cache for offline use
        await AsyncStorage.setItem(
          `risk_assessment_hierarchy_${orderId}`, 
          JSON.stringify(response.data)
        );
        
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      // Try cache if API fails
      const cachedData = await AsyncStorage.getItem(`risk_assessment_hierarchy_${orderId}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return { ...parsed, fromCache: true };
      }
      
      throw error;
    }
  },

  getSurveyCompleteData: async (orderId: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get(
        `/mobile/survey/${orderId}/summary-complete`
      );
      
      if (response.data?.success) {
        await AsyncStorage.setItem(
          `survey_summary_${orderId}`, 
          JSON.stringify(response.data)
        );
        
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      const cachedData = await AsyncStorage.getItem(`survey_summary_${orderId}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return { ...parsed, fromCache: true };
      }
      
      throw error;
    }
  },

  getAppointmentComplete: async (appointmentId: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get(
        `/mobile/appointments/${appointmentId}/complete`
      );
      
      if (response.data?.success) {
        await AsyncStorage.setItem(
          `appointment_complete_${appointmentId}`, 
          JSON.stringify(response.data)
        );
        
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      const cachedData = await AsyncStorage.getItem(`appointment_complete_${appointmentId}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return { ...parsed, fromCache: true };
      }
      
      throw error;
    }
  },

  populateRiskAssessmentTemplate: async (assessmentId: string, deviceId: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post(
        '/mobile/risk-assessment/populate-template',
        {
          assessmentId,
          deviceId,
          options: {
            includeInactive: false,
            sqliteOptimized: true,
            includeMetadata: true
          }
        }
      );
      
      if (response.data?.success) {
        return response.data;
      }
      
      throw new Error('Template population failed');
    } catch (error) {
      throw error;
    }
  }
};
```

### 4. SQLite Schema Updates

**Expected SQLite table optimizations for composite data:**
```sql
-- Indexes for efficient composite data insertion
CREATE INDEX IF NOT EXISTS idx_sections_assessment_id 
ON risk_assessment_sections(riskAssessmentId);

CREATE INDEX IF NOT EXISTS idx_categories_section_id 
ON risk_assessment_categories(riskAssessmentSectionId);

CREATE INDEX IF NOT EXISTS idx_items_category_id 
ON risk_assessment_items(riskAssessmentCategoryId);

-- Composite data cache table
CREATE TABLE IF NOT EXISTS composite_data_cache (
  cache_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  data_version TEXT
);
```

### 5. Loading State Simplification

**Before (Multiple Loading States):**
```typescript
const [sectionsLoading, setSectionsLoading] = useState(false);
const [categoriesLoading, setCategoriesLoading] = useState(false);
const [itemsLoading, setItemsLoading] = useState(false);
```

**After (Single Loading State):**
```typescript
const [hierarchyLoading, setHierarchyLoading] = useState(false);
```

### 6. Error Handling Simplification

**Before (Multiple Error Points):**
```typescript
try {
  const sections = await api.getRiskAssessmentSections(id);
  try {
    const categories = await api.getRiskAssessmentCategories(sectionId);
    try {
      const items = await api.getRiskAssessmentItems(categoryId);
    } catch (itemsError) { /* handle */ }
  } catch (categoriesError) { /* handle */ }
} catch (sectionsError) { /* handle */ }
```

**After (Single Error Point):**
```typescript
try {
  const hierarchy = await api.getRiskAssessmentCompleteHierarchy(orderId);
  // Process complete hierarchy
} catch (error) {
  // Handle single error point
  showErrorMessage('Failed to load assessment data');
}
```

### 7. Expected Performance Improvements

**Measurement Points During Implementation:**
```typescript
// Add performance tracking
const trackApiPerformance = async (apiCall: () => Promise<any>, operationName: string) => {
  const startTime = performance.now();
  try {
    const result = await apiCall();
    const endTime = performance.now();
    console.log(`${operationName} completed in ${endTime - startTime}ms`);
    
    // Track to analytics
    Analytics.track('api_performance', {
      operation: operationName,
      duration: endTime - startTime,
      success: true
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`${operationName} failed after ${endTime - startTime}ms:`, error);
    
    Analytics.track('api_performance', {
      operation: operationName,
      duration: endTime - startTime,
      success: false,
      error: error.message
    });
    
    throw error;
  }
};

// Usage
const loadRiskAssessment = () => {
  return trackApiPerformance(
    () => api.getRiskAssessmentCompleteHierarchy(orderId),
    'risk_assessment_hierarchy_load'
  );
};
```

### 8. Migration Testing Strategy

**Feature Flag Implementation:**
```typescript
import { FeatureFlags } from '@/utils/featureFlags';

const useCompositeAPIs = FeatureFlags.isEnabled('composite_apis_v1');

const loadAssessmentData = async (orderId: string) => {
  if (useCompositeAPIs) {
    // New composite API
    return await api.getRiskAssessmentCompleteHierarchy(orderId);
  } else {
    // Legacy sequential calls
    return await loadAssessmentDataLegacy(orderId);
  }
};
```

### 9. Offline Synchronization Updates

**Expected sync strategy with composite APIs:**
```typescript
const syncCompositeData = async () => {
  const pendingSyncs = await getPendingSyncItems();
  
  for (const syncItem of pendingSyncs) {
    try {
      if (syncItem.type === 'risk_assessment_hierarchy') {
        // Sync entire hierarchy in one call
        const result = await api.syncRiskAssessmentHierarchy(syncItem.data);
        if (result.success) {
          await markSyncComplete(syncItem.id);
        }
      }
    } catch (error) {
      await markSyncFailed(syncItem.id, error.message);
    }
  }
};
```

---

## Implementation Checklist

### Backend API Development
- [ ] Implement Risk Assessment Complete Hierarchy endpoint
- [ ] Implement Survey Summary Composite endpoint  
- [ ] Implement Appointment Complete Data endpoint
- [ ] Implement Template Batch Population endpoint
- [ ] Add proper caching headers and strategies
- [ ] Implement rate limiting and authentication
- [ ] Add comprehensive error handling
- [ ] Create API documentation and testing

### Mobile App Integration
- [ ] Update `api/index.ts` with new composite methods
- [ ] Modify `new-survey.tsx` to use hierarchy endpoint
- [ ] Update `useSurveySummaryData.ts` hook
- [ ] Simplify appointment data fetching
- [ ] Implement SQLite batch operations
- [ ] Add offline caching for composite responses
- [ ] Update error handling throughout app
- [ ] Implement feature flags for gradual rollout
- [ ] Add performance tracking and analytics

### Testing & Validation
- [ ] Unit tests for new API methods
- [ ] Integration tests with SQLite operations
- [ ] Performance tests on various network conditions
- [ ] Offline functionality testing
- [ ] Battery usage testing
- [ ] Data usage measurement
- [ ] User acceptance testing with field surveyors

### Deployment & Monitoring
- [ ] Staged rollout with feature flags
- [ ] Performance monitoring setup
- [ ] Error tracking and alerting
- [ ] User feedback collection
- [ ] Rollback plan testing
- [ ] Documentation updates

---

*Integration Guide Version: 1.0*  
*Mobile-First Implementation Strategy* 