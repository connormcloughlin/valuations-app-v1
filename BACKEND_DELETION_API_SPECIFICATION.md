# Backend Deletion API Specification

## Overview
This document specifies how the backend should handle deleted entities in the sync API response.

## Current Issue
When items are deleted in the mobile app, they need to be properly deleted from the backend SQL Server database, not just updated with cleared values.

## Required Backend Response Format

### Sync Request Payload (from mobile)
```json
{
  "deviceId": "mobile-tablet-device",
  "userId": "current-user-id",
  "riskAssessmentItems": [
    {
      "riskassessmentitemid": 15840710,
      "riskassessmentcategoryid": 1457761,
      "qty": 0,
      "price": 0,
      "description": "",
      "model": "",
      "location": "",
      "notes": "",
      "pending_sync": 1
    }
  ],
  "deletedEntities": [
    {
      "riskassessmentitemid": 15840710,
      "riskassessmentcategoryid": 1457761,
      "entityType": "riskAssessmentItem"
    }
  ]
}
```

### Required Response Format
```json
{
  "success": true,
  "results": {
    "riskAssessmentItems": {
      "created": 0,
      "updated": 0,
      "deleted": 1,
      "failed": 0,
      "errors": []
    },
    "deletedEntities": [
      {
        "riskassessmentitemid": 15840710,
        "riskassessmentcategoryid": 1457761,
        "entityType": "riskAssessmentItem",
        "deletedAt": "2025-07-31T20:57:15.6833333Z"
      }
    ]
  }
}
```

## Backend Processing Logic

### 1. Detect Deleted Items
- Items with `qty: 0`, `price: 0`, `description: ""`, `model: ""`, `location: ""`, `notes: ""` should be treated as **deleted**
- These items should be **actually deleted** from the SQL Server database
- NOT updated with cleared values

### 2. Process Deletions
```sql
-- For each item in deletedEntities array
DELETE FROM RiskAssessmentItems 
WHERE RiskAssessmentItemID = @riskassessmentitemid
```

### 3. Return Confirmation
- Include the deleted items in the `deletedEntities` array in the response
- Include `deletedAt` timestamp
- Set `deleted: 1` in the summary

## Mobile App Flow

### 1. Delete Operation
```
User deletes item → Mark as deleted in SQLite → Set pending_sync = 1
```

### 2. Sync Operation
```
Mobile sends deletedEntities array → Backend deletes from SQL Server → Returns confirmation
```

### 3. Post-Sync Cleanup
```
Mobile receives deletedEntities confirmation → Actually delete from SQLite → Update UI
```

## Benefits

1. **Proper Deletion**: Items are actually deleted from backend, not just cleared
2. **Sync Tracking**: Deletions are tracked and confirmed
3. **Data Integrity**: No orphaned or cleared records in backend
4. **Audit Trail**: Deletion timestamps are recorded

## Implementation Notes

- The mobile app now sends both `riskAssessmentItems` (with cleared values) AND `deletedEntities` (for actual deletion)
- Backend should prioritize the `deletedEntities` array over the cleared values in `riskAssessmentItems`
- If an item appears in both arrays, the deletion should take precedence
- The `deletedEntities` array should be processed BEFORE the `riskAssessmentItems` array to avoid conflicts 