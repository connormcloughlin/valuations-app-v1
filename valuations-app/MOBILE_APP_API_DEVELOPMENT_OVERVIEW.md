# Valuations Mobile App - API Development Overview

## Executive Summary

This document provides a comprehensive analysis of the current Valuations Mobile Tablet App (React Native/Expo) to guide API development for surveyor email filtering functionality. The app is a sophisticated property valuation system with offline capabilities, Azure AD authentication, and comprehensive appointment management.

## 1. Current Mobile App Screens/Features

### 1.1 Main Navigation Structure
**Tab-based navigation** with 4 primary sections:

| **Tab** | **Screen** | **Purpose** | **Key Features** |
|---------|------------|-------------|------------------|
| **Dashboard** | `/(tabs)/index.tsx` | Main dashboard with stats and quick access | Stats cards, today's appointments, surveys in progress |
| **Valuations** | `/(tabs)/valuations.tsx` | Property valuation management | Valuation forms and data entry |
| **Survey** | `/(tabs)/survey` | Survey execution and management | Risk assessment, item management, photo capture |
| **Profile** | `/(tabs)/profile.tsx` | User profile and settings | User management, preferences |

### 1.2 Appointment Management Screens
**Dedicated appointment section** with 5 screens:

| **Screen** | **File** | **Purpose** | **Current API Usage** |
|------------|----------|-------------|----------------------|
| **Scheduled** | `appointments/scheduled.tsx` | View booked appointments | `GET /appointments/list-view` (primary), `GET /appointments` (fallback) |
| **In Progress** | `appointments/in-progress.tsx` | View active surveys | `GET /appointments/list-view` (primary), `GET /appointments` (fallback) |
| **Completed** | `appointments/completed.tsx` | View completed surveys | `GET /appointments/list-view` (primary), `GET /appointments` (fallback) |
| **Finalize** | `appointments/finalise.tsx` | View surveys ready for finalization | `GET /appointments/list-view` (primary), `GET /appointments` (fallback) |
| **Details** | `appointments/[id].tsx` | Individual appointment details | `GET /appointments/{id}/with-order` (primary), `GET /appointments/{id}` (fallback) |

### 1.3 Survey Management Screens
**Comprehensive survey workflow**:

| **Screen** | **File** | **Purpose** | **Key Features** |
|------------|----------|-------------|------------------|
| **Survey Execution** | `survey/[id].tsx` | Active survey interface | Risk assessment, item management, photo capture |
| **Survey Items** | `survey/items.tsx` | Item management within survey | Dynamic forms, photo gallery, handwriting capture |
| **Survey Summary** | `survey/summary/[id].tsx` | Completed survey review | Valuation summary, final submission |

### 1.4 Dashboard Components
**Rich dashboard with multiple components**:

| **Component** | **File** | **Purpose** | **Data Source** |
|---------------|----------|-------------|-----------------|
| **Stats Cards** | `components/dashboard/StatsCards.tsx` | Appointment statistics | `GET /mobile/appointment/dashboard/status-counts` |
| **Today's Appointments** | `components/dashboard/TodaysAppointments.tsx` | Today's scheduled appointments | `GET /appointments/list-view` |
| **Surveys in Progress** | `components/dashboard/SurveysInProgress.tsx` | Active surveys | `GET /appointments/list-view` |
| **Dashboard Header** | `components/dashboard/DashboardHeader.tsx` | User info and navigation | User context |

## 2. Existing API Endpoints Used

### 2.1 Primary API Endpoints

| **Endpoint** | **Purpose** | **Usage** | **Parameters** | **Response** |
|--------------|-------------|-----------|----------------|---------------|
| `GET /appointments/list-view` | **Primary appointment listing** | All 4 appointment pages | `status`, `page`, `pageSize`, `surveyor` | Paginated appointment list |
| `GET /mobile/appointment/dashboard/status-counts` | **Dashboard statistics** | StatsCards component | None | Statistics by status |
| `GET /appointments/{id}/with-order` | **Appointment details** | Individual appointment view | `id` | Complete appointment with order data |
| `GET /appointments/with-orders` | **Alternative listing** | Paginated appointments | `page`, `pageSize` | Paginated appointments with orders |

### 2.2 Fallback API Endpoints

| **Endpoint** | **Purpose** | **Usage** | **Fallback For** |
|--------------|-------------|-----------|------------------|
| `GET /appointments` | **Basic appointment listing** | All appointment pages | `GET /appointments/list-view` |
| `GET /appointments/stats` | **Basic statistics** | Dashboard stats | `GET /mobile/appointment/dashboard/status-counts` |
| `GET /appointments/{id}` | **Basic appointment details** | Individual appointments | `GET /appointments/{id}/with-order` |

### 2.3 Risk Assessment API Endpoints

| **Endpoint** | **Purpose** | **Usage** | **Response** |
|--------------|-------------|-----------|---------------|
| `GET /risk-templates` | **Risk assessment templates** | Survey setup | Available templates |
| `GET /risk-assessment-master/by-order/{orderId}` | **Assessment master** | Survey initialization | Assessment configuration |
| `GET /mobile/risk-assessment/{orderId}/complete-hierarchy` | **Complete hierarchy** | Survey data loading | Sections, categories, items |
| `GET /risk-assessment-master/sections/{riskAssessmentId}` | **Assessment sections** | Survey navigation | Section definitions |
| `GET /risk-assessment-categories/section/{sectionId}` | **Assessment categories** | Survey navigation | Category definitions |
| `GET /risk-assessment-items/category/{categoryId}` | **Assessment items** | Survey data entry | Item definitions |

### 2.4 Sync and Media API Endpoints

| **Endpoint** | **Purpose** | **Usage** | **Response** |
|--------------|-------------|-----------|---------------|
| `POST /sync/changes` | **Sync local changes** | Data synchronization | Sync results |
| `GET /sync/changes` | **Get sync changes** | Data synchronization | Pending changes |
| `POST /sync/media/upload` | **Upload media** | Photo/document upload | Upload confirmation |
| `GET /sync/media/entity/{entityName}/{entityID}` | **Get media for entity** | Media retrieval | Media files |

## 3. Current Data Flow

### 3.1 Authentication Flow
**Azure AD + API Key Authentication**:

```typescript
// Authentication Context (AuthContext.tsx)
interface User {
  id: string;
  name: string;
  email: string;        // ✅ Available for surveyor filtering
  token: string;
  azureToken?: string;
}

// API Request Headers (api/index.ts)
axiosInstance.interceptors.request.use(async (config) => {
  const userContext = await AsyncStorage.getItem('userContext');
  if (userContext) {
    config.headers[USER_CONTEXT_HEADER_NAME] = userContext; // ✅ User context sent
  }
  return config;
});
```

### 3.2 Appointment Data Flow
**Current implementation with fallback logic**:

```typescript
// Primary Flow (All appointment pages)
try {
  const response = await api.getAppointmentsByListView({
    status: 'Booked',           // Status filter
    page: pageNum,             // Pagination
    pageSize: pageSize,        // Page size
    surveyor: null             // ❌ No surveyor filtering
  });
} catch (err) {
  // Fallback Flow
  const fallbackResponse = await api.getAppointmentsByStatus('scheduled');
}
```

### 3.3 Dashboard Statistics Flow
**Optimized mobile endpoint with fallback**:

```typescript
// Primary Flow (StatsCards.tsx)
const response = await enhancedApiClient.get('/mobile/appointment/dashboard/status-counts');

// Fallback Flow (if primary fails)
const fallbackResponse = await apiClient.get('/appointments/stats');
```

### 3.4 User Context Handling
**Comprehensive user context system**:

```typescript
// User Context Storage (AuthContext.tsx)
const userContext = {
  id: user.id,
  name: user.name,
  email: user.email        // ✅ Surveyor email available
};
await AsyncStorage.setItem('userContext', JSON.stringify(userContext));

// API Headers (api/index.ts)
config.headers[USER_CONTEXT_HEADER_NAME] = userContext; // ✅ Sent with every request
```

## 4. Specific Gaps to Fill

### 4.1 Missing Surveyor Filtering
**Current State**: No surveyor-specific filtering
**Required**: Automatic surveyor email filtering

| **Component** | **Current Behavior** | **Required Behavior** |
|---------------|---------------------|----------------------|
| **Dashboard Stats** | Shows all appointments | Show only surveyor's appointments |
| **Appointment Lists** | Shows all appointments | Show only surveyor's appointments |
| **Appointment Details** | Shows any appointment | Show only surveyor's appointments |

### 4.2 Fallback Logic Complexity
**Current Problem**: Complex fallback logic with multiple API calls
**Required**: Simplified single-endpoint approach

```typescript
// Current (Complex)
try {
  const response = await api.getAppointmentsByListView({...});
} catch (err) {
  const fallbackResponse = await api.getAppointmentsByStatus('scheduled');
  // ... complex fallback logic
}

// Required (Simplified)
const response = await api.getAppointmentsByListView({
  status: 'Booked',
  page: pageNum,
  pageSize: pageSize
  // surveyor filtering handled automatically by backend
});
```

### 4.3 Role-Based Access
**Current State**: No role differentiation
**Required**: Admin vs Surveyor access levels

| **User Type** | **Current Access** | **Required Access** |
|---------------|-------------------|-------------------|
| **Admin** | All appointments | All appointments (unchanged) |
| **Surveyor** | All appointments | Only their own appointments |

### 4.4 Performance Optimization
**Current State**: Multiple API calls with fallback logic
**Required**: Single optimized endpoint

| **Metric** | **Current** | **Required** |
|------------|-------------|-------------|
| **API Calls per Page** | 2 (primary + fallback) | 1 (primary only) |
| **Data Filtering** | Client-side | Server-side |
| **Performance** | Variable | Consistent |

## 5. Technical Architecture

### 5.1 Technology Stack
**Modern React Native/Expo application**:

| **Component** | **Technology** | **Purpose** |
|---------------|----------------|-------------|
| **Framework** | React Native + Expo | Cross-platform mobile development |
| **Navigation** | Expo Router | File-based routing |
| **State Management** | React Context | Global state management |
| **Database** | SQLite (Expo) | Local data storage |
| **HTTP Client** | Axios | API communication |
| **Authentication** | Azure AD + API Keys | User authentication |

### 5.2 Authentication System
**Hybrid authentication approach**:

```typescript
// Authentication Modes
export const isApiKeyMode = () => true;  // Always use API key mode
export const isJwtMode = () => false;   // Never use JWT mode

// API Configuration
export const API_KEY = Constants.expoConfig?.extra?.apiKey;
export const API_KEY_HEADER_NAME = 'X-API-Key';
export const USER_CONTEXT_HEADER_NAME = 'X-User-Context';
```

### 5.3 Database Schema
**Local SQLite database for offline support**:

```sql
-- Key Tables
CREATE TABLE Appointments (
  appointmentID INTEGER PRIMARY KEY,
  orderID INTEGER,
  surveyorEmail TEXT,        -- ✅ Available for filtering
  inviteStatus TEXT,
  meetingStatus TEXT,
  -- ... other fields
);

CREATE TABLE Surveyors (
  SurveyorId INTEGER PRIMARY KEY,
  Email TEXT UNIQUE,         -- ✅ Available for filtering
  Name TEXT,
  -- ... other fields
);
```

### 5.4 API Client Architecture
**Sophisticated API client with caching**:

```typescript
// Enhanced API Client (enhancedClient.js)
export const enhancedApiClient = {
  get: async (endpoint, config) => {
    // Token caching
    // User context injection
    // Performance monitoring
    // Offline fallback
  }
};

// Standard API Client (client.js)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});
```

## 6. Files to Analyze

### 6.1 Critical Mobile App Files

| **File** | **Purpose** | **Key Insights** |
|----------|-------------|------------------|
| `app/(tabs)/index.tsx` | Main dashboard | Uses StatsCards, TodaysAppointments, SurveysInProgress |
| `app/(tabs)/appointments/*.tsx` | Appointment management | All use `getAppointmentsByListView` with fallback |
| `components/dashboard/StatsCards.tsx` | Dashboard statistics | Uses `/mobile/appointment/dashboard/status-counts` |
| `context/AuthContext.tsx` | Authentication | User email available in context |
| `api/index.ts` | API client | User context headers already implemented |
| `api/appointments.js` | Appointment API | Complex fallback logic needs simplification |

### 6.2 API Integration Points

| **File** | **API Usage** | **Modification Required** |
|----------|---------------|---------------------------|
| `api/appointments.js` | `getAppointmentsByListView()` | Remove fallback logic |
| `api/appointments.js` | `getMobileDashboardStats()` | Add surveyor filtering |
| `components/dashboard/StatsCards.tsx` | Dashboard stats API | No changes needed |
| `app/(tabs)/appointments/*.tsx` | Appointment list APIs | Remove fallback logic |

## 7. Implementation Recommendations

### 7.1 Backend API Changes
**Minimal changes required**:

1. **Add surveyor email filtering** to existing endpoints
2. **Implement role-based access** (admin vs surveyor)
3. **Add `surveyorEmail` parameter** for backward compatibility
4. **Extract user email** from user context headers

### 7.2 Frontend Simplification
**Significant code cleanup**:

1. **Remove all fallback logic** from appointment pages
2. **Remove `surveyor: null` parameters** (backend handles filtering)
3. **Simplify error handling** (let API failures bubble up)
4. **Clean up try-catch blocks** (remove complex fallback logic)

### 7.3 Performance Benefits
**Immediate improvements**:

- ✅ **50% reduction** in API calls (remove fallback logic)
- ✅ **Consistent performance** (single endpoint)
- ✅ **Server-side filtering** (better performance)
- ✅ **Simplified maintenance** (single endpoint to maintain)

## 8. Conclusion

The Valuations Mobile App is a sophisticated, well-architected application with comprehensive offline capabilities and robust API integration. The implementation of surveyor email filtering requires:

1. **Backend**: Add surveyor filtering to existing endpoints
2. **Frontend**: Remove complex fallback logic and simplify code
3. **Performance**: Significant improvement through single-endpoint approach
4. **Maintenance**: Easier codebase with simplified logic

The existing infrastructure (user context, API headers, authentication) is already in place, making this implementation straightforward and low-risk.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Prepared for**: API Development Team  
**Project**: Valuations Mobile Tablet App - Surveyor Email Filtering



