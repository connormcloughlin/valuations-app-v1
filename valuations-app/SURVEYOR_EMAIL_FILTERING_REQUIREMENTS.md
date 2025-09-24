# Surveyor Email Filtering Requirements

## Overview

This document outlines the changes required to implement surveyor email-based filtering for the dashboard and appointment pages in the Valuations Mobile Tablet App. This will allow surveyors to only see records and statistics related to their own appointments.

## Current State Analysis

### Authentication System
- **Frontend**: Azure AD authentication for login
- **API**: API key authentication with user context headers
- **User Context**: User email is stored in `AsyncStorage` as part of `userContext`
- **Location**: `valuations-app/mobile-tablet/context/AuthContext.tsx`

### Dashboard Implementation
- **Main Dashboard**: `valuations-app/mobile-tablet/app/(tabs)/index.tsx`
- **Stats Component**: `valuations-app/mobile-tablet/components/dashboard/StatsCards.tsx`
- **API Endpoint**: `GET /mobile/appointment/dashboard/status-counts`
- **Fallback API**: `GET /appointments/stats`

### Appointment Pages
1. **Scheduled Appointments**: `valuations-app/mobile-tablet/app/(tabs)/appointments/scheduled.tsx`
2. **In Progress Appointments**: `valuations-app/mobile-tablet/app/(tabs)/appointments/in-progress.tsx`
3. **Completed Appointments**: `valuations-app/mobile-tablet/app/(tabs)/appointments/completed.tsx`
4. **Finalize Appointments**: `valuations-app/mobile-tablet/app/(tabs)/appointments/finalise.tsx`

### Current API Endpoints Used
- `GET /appointments/list-view` - With parameters: status, page, pageSize, surveyor
- `GET /appointments/with-orders` - With pagination
- `GET /appointments` - With status filtering
- `GET /mobile/appointment/dashboard/status-counts` - Dashboard statistics

### Database Schema
- **Appointments Table**: Contains `SurveyorId` (INT) referencing `Surveyors(SurveyorId)`
- **Surveyors Table**: Contains `Email` field for surveyor identification
- **Current API**: Uses `surveyorEmail` field in appointment data

## Required Changes

### 1. API Documentation Updates

#### 1.1 Update `GET /appointments/list-view` Documentation
**Current Parameters** (from API docs):
- `inviteStatus` - Filter by invitation status
- `orderId` - Filter by order ID  
- `clientsName` - Filter by client name (partial match)
- `location` - Filter by location (partial match)
- `surveyor` - Filter by surveyor name (partial match)
- `client` - Filter by client (partial match)
- `title` - Filter by title (partial match)
- `email` - Filter by email (partial match)
- `phoneNo` - Filter by phone number (partial match)
- `cell` - Filter by cell number (partial match)
- `region` - Filter by region (partial match)
- `city` - Filter by city (partial match)
- `orderStatus` - Filter by order status
- `startDateFrom` - Filter appointments with start date after this date
- `startDateTo` - Filter appointments with start date before this date
- `page` - Page number for pagination (default: 1)
- `pageSize` - Number of items per page (default: 20)

**Required Documentation Updates**:
- **Update `surveyor` parameter description**: "Filter by surveyor email (exact match) - automatically applied based on user context"
- **Add `surveyorEmail` parameter**: "Filter by surveyor email (exact match) - alternative to surveyor parameter"
- **Add role-based access note**: "Admin users see all appointments, surveyors see only their own"
- **Add automatic filtering note**: "Surveyor filtering is automatically applied based on user context headers"

#### 1.2 Update `GET /mobile/appointment/dashboard/status-counts` Documentation
**Required Documentation Updates**:
- **Add role-based access note**: "Admin users see all statistics, surveyors see only their own"
- **Add automatic filtering note**: "Statistics are automatically filtered by surveyor email from user context"

### 2. Backend API Modifications

#### 2.1 Dashboard Statistics Endpoint
**Primary Endpoint**: `GET /mobile/appointment/dashboard/status-counts`
**Fallback Endpoint**: `GET /appointments/stats`

**Required Changes**:
- Add surveyor email filtering to SQL queries
- Filter all counts by `surveyorEmail = {logged_in_user_email}`
- Ensure backward compatibility when no surveyor filter is provided

**SQL Query Modification Example (Performance Optimized)**:
```sql
-- Current query (example)
SELECT 
    COUNT(CASE WHEN Status = 'Booked' THEN 1 END) as scheduled,
    COUNT(CASE WHEN Status = 'In Progress' THEN 1 END) as inProgress,
    COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completed,
    COUNT(CASE WHEN Status = 'Finalise' THEN 1 END) as finalise
FROM Appointments;

-- Updated query with surveyor filtering (OPTIMIZED FOR SPEED)
SELECT 
    COUNT(CASE WHEN a.Status = 'Booked' THEN 1 END) as scheduled,
    COUNT(CASE WHEN a.Status = 'In Progress' THEN 1 END) as inProgress,
    COUNT(CASE WHEN a.Status = 'Completed' THEN 1 END) as completed,
    COUNT(CASE WHEN a.Status = 'Finalise' THEN 1 END) as finalise
FROM Appointments a WITH (INDEX(IX_Appointments_SurveyorId_Status))
INNER JOIN Surveyors s WITH (INDEX(IX_Surveyors_Email)) ON a.SurveyorId = s.SurveyorId
WHERE s.Email = @surveyorEmail;

-- Alternative: Use EXISTS for even better performance on large datasets
SELECT 
    COUNT(CASE WHEN Status = 'Booked' THEN 1 END) as scheduled,
    COUNT(CASE WHEN Status = 'In Progress' THEN 1 END) as inProgress,
    COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completed,
    COUNT(CASE WHEN Status = 'Finalise' THEN 1 END) as finalise
FROM Appointments a
WHERE EXISTS (
    SELECT 1 FROM Surveyors s 
    WHERE s.SurveyorId = a.SurveyorId 
    AND s.Email = @surveyorEmail
);
```

#### 2.2 Appointment List Endpoints
**Primary Endpoint**: `GET /appointments/list-view`
- ✅ **Already has filtering capabilities** with query parameters
- ✅ **Has `surveyor` parameter** for surveyor filtering
- ✅ **Has `email` parameter** that could be used for surveyor email filtering

**Endpoints to Modify**:
- `GET /appointments/list-view` - **Primary endpoint** (already has filtering)
- `GET /appointments/with-orders` - Alternative endpoint
- `GET /appointments/{id}/with-order` - Individual appointment details

**Required Changes**:
- **Remove fallback to `GET /appointments`** - Always use `GET /appointments/list-view`
- **Modify `surveyor` parameter** to work with email instead of ID
- **Add automatic surveyor email filtering** based on user context
- **Update frontend** to remove fallback logic

**Implementation Approach**:
```sql
-- Add to all appointment queries (with role-based access)
WHERE (
    -- Admin users see all appointments
    (@userRole = 'admin') 
    OR 
    -- Surveyors see only their appointments
    EXISTS (
        SELECT 1 FROM Surveyors s 
        WHERE s.SurveyorId = a.SurveyorId 
        AND s.Email = @userEmail
    )
)
```

**Multi-Surveyor Order Handling**:
```sql
-- For order-level queries, include order info but filter appointments
SELECT 
    o.*, -- Order details visible to all assigned surveyors
    a.*  -- Only appointments assigned to current surveyor
FROM Orders o
LEFT JOIN Appointments a ON o.OrderId = a.OrderId
    AND EXISTS (
        SELECT 1 FROM Surveyors s 
        WHERE s.SurveyorId = a.SurveyorId 
        AND s.Email = @userEmail
    )
WHERE o.OrderId = @orderId
```

#### 2.3 User Context Integration
**Current Implementation**: API key with user context headers
**Header Name**: Based on `USER_CONTEXT_HEADER_NAME` constant
**User Context Format**: JSON containing user email

**Required Changes**:
- Extract user email from user context header in all relevant endpoints
- Apply surveyor email filtering automatically for all appointment-related queries
- Ensure proper error handling when user context is missing

### 3. Frontend Modifications

#### 3.1 Remove Fallback Logic
**Files to Modify**:
- `valuations-app/mobile-tablet/app/(tabs)/appointments/scheduled.tsx`
- `valuations-app/mobile-tablet/app/(tabs)/appointments/in-progress.tsx`
- `valuations-app/mobile-tablet/app/(tabs)/appointments/completed.tsx`
- `valuations-app/mobile-tablet/app/(tabs)/appointments/finalise.tsx`

**Required Changes**:
- **Remove fallback to `GET /appointments`** - Always use `GET /appointments/list-view`
- **Remove `getAppointmentsByStatus()` calls** - No more fallback logic
- **Simplify error handling** - Let API failures bubble up instead of falling back
- **Remove `surveyor: null` parameter** - Backend will handle surveyor filtering automatically

#### 3.2 API Client Changes
**File**: `valuations-app/mobile-tablet/api/index.ts`

**Required Changes**:
- No changes needed - user context is already sent via headers
- User email is already available from `AuthContext`

#### 3.3 Dashboard Components
**File**: `valuations-app/mobile-tablet/components/dashboard/StatsCards.tsx`

**Current Implementation**:
```typescript
const response = await enhancedApiClient.get(endpoint);
```

**Required Changes**:
- No frontend changes needed - filtering happens automatically on backend
- Backend will use user context header to filter results

#### 3.4 Appointment List Components
**Files**:
- `scheduled.tsx`
- `in-progress.tsx` 
- `completed.tsx`
- `finalise.tsx`

**Current Implementation**:
```typescript
const response = await api.getAppointmentsByListView({
    status: 'Booked',
    page: pageNum,
    pageSize: pageSize,
    surveyor: null // Currently null
});
```

**Required Changes**:
- **Remove fallback logic entirely** - No more `getAppointmentsByStatus()` calls
- **Remove `surveyor: null` parameter** - Backend will handle surveyor filtering automatically
- **Simplify error handling** - Let API failures bubble up instead of falling back
- **Remove try-catch fallback blocks** - Clean up code by removing fallback logic

### 4. Database Schema Considerations

#### 4.1 Current Schema
- `Appointments.SurveyorId` → `Surveyors.SurveyorId`
- `Surveyors.Email` contains the surveyor email

#### 4.2 Required Indexes (Performance Critical)
```sql
-- Critical indexes for FAST performance
CREATE INDEX IX_Surveyors_Email ON Surveyors(Email);
CREATE INDEX IX_Appointments_SurveyorId_Status ON Appointments(SurveyorId, Status);
CREATE INDEX IX_Appointments_SurveyorId_Status_Date ON Appointments(SurveyorId, Status, AppointmentDate);
CREATE INDEX IX_Appointments_Status_Date_SurveyorId ON Appointments(Status, AppointmentDate, SurveyorId);

-- Composite index for dashboard stats queries
CREATE INDEX IX_Appointments_Status_SurveyorId_Count ON Appointments(Status, SurveyorId) 
INCLUDE (AppointmentId, AppointmentDate);
```

#### 4.3 Data Consistency
**Verify**:
- All appointments have valid `SurveyorId`
- All surveyors have valid email addresses
- `surveyorEmail` field in API responses matches `Surveyors.Email`

### 5. Simplified Implementation Approach

#### 5.1 Remove Fallback Complexity
**Current Problem**: Complex fallback logic with multiple API calls
**Solution**: Use only `GET /appointments/list-view` with proper error handling

**Benefits**:
- ✅ **Simplified code** - Remove complex fallback logic
- ✅ **Better performance** - Single API call instead of multiple
- ✅ **Consistent filtering** - All filtering happens at API level
- ✅ **Easier maintenance** - Single endpoint to maintain

#### 5.2 Frontend Code Changes Required

**Before (Complex Fallback)**:
```typescript
try {
  const response = await api.getAppointmentsByListView({
    status: 'Booked',
    page: pageNum,
    pageSize: pageSize,
    surveyor: null
  });
} catch (err) {
  // Fall back to regular getAppointmentsByStatus
  const fallbackResponse = await api.getAppointmentsByStatus('scheduled');
  // ... complex fallback logic
}
```

**After (Simplified)**:
```typescript
const response = await api.getAppointmentsByListView({
  status: 'Booked',
  page: pageNum,
  pageSize: pageSize
  // surveyor filtering handled automatically by backend
});
```

#### 5.3 Backend Implementation Strategy

**Option 1: Modify `surveyor` parameter**
- Change `surveyor` parameter to accept email instead of name
- Add automatic surveyor filtering based on user context

**Option 2: Add `surveyorEmail` parameter**
- Keep existing `surveyor` parameter for backward compatibility
- Add new `surveyorEmail` parameter for email-based filtering
- Apply automatic filtering based on user context

**Recommended**: **Option 2** - Add `surveyorEmail` parameter for better backward compatibility

### 6. Testing Requirements

#### 6.1 Backend API Testing
- Test dashboard stats with different surveyor emails
- Test appointment list filtering with various surveyors
- Test pagination with filtered results
- Test fallback endpoints with surveyor filtering
- Test error handling when user context is missing

#### 6.2 Frontend Testing
- Test dashboard stats display with filtered data
- Test appointment lists show only surveyor's appointments
- Test search functionality within filtered results
- Test pagination with filtered datasets

#### 6.3 Integration Testing
- Test complete user flow from login to viewing filtered data
- Test multiple surveyors with different email addresses
- Test edge cases (surveyor with no appointments, invalid emails)

### 7. Implementation Steps

#### Phase 1: Backend API Updates
1. **Modify dashboard statistics endpoints**
   - Update SQL queries to include surveyor email filtering
   - Test with sample data

2. **Update appointment list endpoints**
   - Add surveyor email filtering to all appointment queries
   - Ensure pagination works correctly with filtered data

3. **Enhance user context processing**
   - Extract user email from headers in all relevant endpoints
   - Add proper error handling and logging

#### Phase 2: Testing & Validation
1. **Backend testing**
   - Unit tests for filtered queries
   - Integration tests with user context headers

2. **Frontend testing**
   - Test dashboard with filtered stats
   - Test all appointment list pages

#### Phase 3: Deployment & Monitoring
1. **Deploy backend changes**
2. **Monitor API performance with filtering**
3. **Verify data accuracy and user experience**

### 8. Migration Considerations

#### 8.1 Backward Compatibility
- Ensure APIs work when no user context is provided
- Maintain existing functionality for admin users who need to see all data

#### 8.2 Performance Impact
- Surveyor email filtering adds JOIN operations
- Recommended indexes should minimize performance impact
- Monitor query execution times after deployment

#### 8.3 Data Privacy
- Ensures surveyors only see their own appointment data
- Maintains data segregation at the API level
- Complies with privacy requirements for multi-surveyor systems

## Clarifications Received

1. **Admin Users**: ✅ **All appointments** - Admin users should see all appointments across all surveyors
2. **Surveyor Assignment**: ✅ **Yes, they can be reassigned** - This will be handled by the external API
3. **Multi-Surveyor Orders**: ✅ **Yes, they can** - An order could consist of 2 properties (e.g., one in Gauteng and one in Western Cape) with different surveyors
4. **Performance Requirements**: ✅ **FAST!** - High performance requirements for filtered queries

## Additional Considerations for Multi-Surveyor Orders

### Multi-Surveyor Order Handling
Since orders can have multiple properties with different surveyors, we need to consider:

1. **Order-Level Access**: Should a surveyor see the entire order or only their specific appointments within that order?
2. **Cross-Surveyor Visibility**: When viewing an order, should surveyors see other surveyors' appointments within the same order?
3. **Order Status**: How should order completion status be calculated when multiple surveyors are involved?

### Recommended Approach for Multi-Surveyor Orders
- **Surveyor sees only their appointments** within multi-surveyor orders
- **Order-level information** (client details, policy info) should be visible to all assigned surveyors
- **Order completion status** should be calculated based on all surveyors' progress
- **Dashboard statistics** should only count appointments assigned to the logged-in surveyor

## Remaining Questions for Clarification

1. **Fallback Behavior**: What should happen if an appointment doesn't have a valid `surveyorEmail` or `SurveyorId`?

2. **Audit Requirements**: Do we need to log when surveyors access filtered data for audit purposes?

3. **Multi-Surveyor Order View**: When a surveyor views an order that has multiple surveyors, should they see:
   - Only their appointments within that order?
   - The entire order with all appointments (but only be able to edit their own)?
   - A summary view showing their progress vs. overall order progress?

## Summary of Key Changes Required

### ✅ **API Documentation Updates**
- Update `GET /appointments/list-view` documentation to reflect surveyor email filtering
- Add role-based access notes for admin vs surveyor users
- Document automatic filtering based on user context

### ✅ **Backend API Modifications**
- **Primary Endpoints**: `GET /appointments/list-view` and `GET /mobile/appointment/dashboard/status-counts`
- **Add surveyor email filtering** to SQL queries with role-based access
- **Add `surveyorEmail` parameter** for better backward compatibility
- **Extract user email** from user context headers

### ✅ **Frontend Simplification**
- **Remove all fallback logic** - No more `getAppointmentsByStatus()` calls
- **Remove `surveyor: null` parameters** - Backend handles filtering automatically
- **Simplify error handling** - Let API failures bubble up instead of falling back
- **Clean up code** - Remove complex try-catch fallback blocks

### ✅ **Database Performance**
- **Add critical indexes** for FAST query performance
- **Optimize SQL queries** with proper index hints
- **Monitor performance** after deployment

### ✅ **Benefits of This Approach**
- ✅ **Simplified code** - Remove complex fallback logic
- ✅ **Better performance** - Single API call instead of multiple
- ✅ **Consistent filtering** - All filtering happens at API level
- ✅ **Easier maintenance** - Single endpoint to maintain
- ✅ **Data privacy** - Surveyors only see their own data
- ✅ **Admin access** - Admins see all appointments

## Conclusion

The implementation of surveyor email filtering requires primarily backend changes to add automatic filtering based on user context. The frontend requires **significant simplification** by removing fallback logic and using only the `GET /appointments/list-view` endpoint. The main work involves:

1. **Backend**: Modifying SQL queries to include surveyor email filtering with role-based access
2. **Frontend**: Removing complex fallback logic and simplifying error handling
3. **Database**: Adding performance-optimized indexes for FAST queries
4. **Documentation**: Updating API docs to reflect new filtering capabilities

This approach **simplifies the codebase** while providing the required data segregation at the API level, making it easier to maintain and more performant.
