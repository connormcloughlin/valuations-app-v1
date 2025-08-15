# Backend Sync API Response Specification

## Overview

This document specifies the required response format for the backend sync API to properly handle ID mapping between mobile app and backend database, preventing duplicate records and ensuring data consistency.

## Problem Statement

The current backend sync API only returns counts of updated items without providing the actual updated records or backend-assigned IDs. This causes:

- **Duplicate records** in the backend database
- **Lost ID mapping** between mobile app and backend
- **Infinite sync loops** as mobile app can't track which items are synced

## Solution

The backend API must return the complete updated records with proper ID mapping to enable the mobile app to update its local SQLite database with the correct backend IDs.

---

## API Response Specification

### Current Response (Incomplete) ❌

```json
{
  "success": true,
  "sessionId": 439,
  "syncTimestamp": "2025-07-30T22:12:15.154Z",
  "results": {
    "riskAssessmentItems": {
      "created": 0,
      "updated": 7,
      "failed": 0,
      "errors": []
    }
  }
}
```

### Required Response (Complete) ✅

```json
{
  "success": true,
  "sessionId": 439,
  "syncTimestamp": "2025-07-30T22:12:15.154Z",
  "results": {
    "riskAssessmentItems": {
      "created": 3,
      "updated": 4,
      "failed": 0,
      "errors": [],
      "updatedItems": [
        {
          "riskassessmentitemid": 15840688,
          "_localId": 1703095234567,
          "riskassessmentcategoryid": 1457761,
          "itemprompt": "Belts",
          "itemtype": 0,
          "rank": 0,
          "commaseparatedlist": "",
          "selectedanswer": "",
          "qty": 1,
          "price": 0,
          "description": "Weeer",
          "model": "",
          "location": "",
          "assessmentregisterid": 0,
          "assessmentregistertypeid": 0,
          "datecreated": "2025-07-30T22:10:00.000Z",
          "createdbyid": "",
          "dateupdated": "2025-07-30T22:12:15.154Z",
          "updatedbyid": "",
          "issynced": 1,
          "syncversion": 1,
          "deviceid": "",
          "syncstatus": "synced",
          "synctimestamp": "2025-07-30T22:12:15.154Z",
          "hasphoto": 0,
          "latitude": 0,
          "longitude": 0,
          "notes": "",
          "pending_sync": 0
        }
      ]
    },
    "appointments": {
      "created": 0,
      "updated": 0,
      "failed": 0,
      "errors": [],
      "updatedItems": []
    },
    "riskAssessmentMasters": {
      "created": 0,
      "updated": 0,
      "failed": 0,
      "errors": [],
      "updatedItems": []
    }
  }
}
```

---

## Key Requirements

### 1. `updatedItems` Array 📋

- **MUST** include **ALL** items that were processed (both created and updated)
- Each item should contain the **complete database record** as it exists on the backend
- Array should be empty only if no items were processed

### 2. `_localId` Field 🔑

- **CRITICAL**: Include the original `_localId` that was sent from the mobile app
- This allows the mobile app to map `local ID → backend ID`
- **For new items**: `_localId` will be different from `riskassessmentitemid`
- **For existing items**: `_localId` will be the same as `riskassessmentitemid`

### 3. Backend ID Assignment 🆔

- **New items**: Backend assigns a new `riskassessmentitemid` and returns it
- **Existing items**: Keep the same `riskassessmentitemid`
- IDs must be unique and persistent

### 4. Timestamps ⏰

- Update `dateupdated` and `synctimestamp` to the server's sync timestamp
- This ensures consistent timing across all synced items
- Use ISO 8601 format: `"2025-07-30T22:12:15.154Z"`

### 5. Sync Status Fields 🔄

- Set `issynced: 1` for all successfully synced items
- Set `pending_sync: 0` for all successfully synced items
- Update `syncversion` incrementally

---

## Backend Processing Logic

### SQL Processing Flow

```sql
-- For each item in the sync request:

-- IF riskassessmentitemid IS NULL (new item):
INSERT INTO risk_assessment_items (
  riskassessmentcategoryid, itemprompt, itemtype, rank,
  commaseparatedlist, selectedanswer, qty, price, description,
  model, location, assessmentregisterid, assessmentregistertypeid,
  datecreated, createdbyid, dateupdated, updatedbyid,
  issynced, syncversion, deviceid, syncstatus,
  synctimestamp, hasphoto, latitude, longitude, notes, pending_sync
) VALUES (...)
RETURNING riskassessmentitemid; -- Get the new backend ID

-- IF riskassessmentitemid IS NOT NULL (existing item):
UPDATE risk_assessment_items 
SET 
  itemprompt = ?, qty = ?, price = ?, description = ?,
  model = ?, location = ?, dateupdated = ?, notes = ?,
  issynced = 1, pending_sync = 0, synctimestamp = ?
WHERE riskassessmentitemid = ?;

-- THEN add to updatedItems array:
{
  "riskassessmentitemid": <backend_id>,
  "_localId": <original_local_id_from_request>,
  ...all_other_fields
}
```

### Processing Steps

1. **Receive sync request** with items array
2. **For each item**:
   - If `riskassessmentitemid` is `null` → **CREATE** new record
   - If `riskassessmentitemid` exists → **UPDATE** existing record
3. **Collect all processed items** with their backend IDs
4. **Return complete response** with `updatedItems` array

---

## Mobile App Flow

### Current Flow (Broken) ❌

```
1. Mobile sends: [item with localId: 1703095234567]
2. Backend creates: [item with backendId: 15840688]
3. Backend returns: {"updated": 1} (no item details)
4. Mobile marks: [localId: 1703095234567] as synced
5. Next sync: Mobile still has [localId: 1703095234567]
6. Backend creates: [DUPLICATE item with backendId: 15840689]
```

### Fixed Flow (Correct) ✅

```
1. Mobile sends: [item with localId: 1703095234567, _localId: 1703095234567]
2. Backend creates: [item with backendId: 15840688]
3. Backend returns: {
     "updatedItems": [{
       "riskassessmentitemid": 15840688,
       "_localId": 1703095234567,
       ...
     }]
   }
4. Mobile updates: [localId: 1703095234567] → [backendId: 15840688]
5. Next sync: Mobile has [backendId: 15840688]
6. Backend updates: [existing item with backendId: 15840688] (no duplicate)
```

---

## Error Handling

### Failed Items

If some items fail to process, include them in the `errors` array:

```json
{
  "results": {
    "riskAssessmentItems": {
      "created": 2,
      "updated": 3,
      "failed": 1,
      "errors": [
        {
          "_localId": 1703095234568,
          "error": "Validation failed: itemprompt is required",
          "code": "VALIDATION_ERROR"
        }
      ],
      "updatedItems": [
        // Only successfully processed items
      ]
    }
  }
}
```

### Partial Success

- Include only **successfully processed items** in `updatedItems`
- Report **failed items** in `errors` array
- Mobile app can retry failed items in next sync

---

## Benefits

### 1. Eliminates Duplicates 🚫

- Mobile app learns the real backend IDs
- Subsequent syncs update existing records instead of creating new ones

### 2. Proper ID Mapping 🗺️

- `_localId` field enables mapping from local to backend IDs
- Mobile app can update its SQLite database correctly

### 3. Complete Data Sync 🔄

- Mobile SQLite gets updated with exact backend data
- Ensures data consistency between mobile and backend

### 4. Consistent Timestamps ⏰

- All synced items have the same server timestamps
- Enables proper conflict resolution and audit trails

### 5. Error Recovery 🛠️

- Failed items are clearly identified
- Mobile app can retry or handle errors appropriately

---

## Implementation Checklist

### Backend Changes Required ✅

- [ ] Modify sync endpoint to return `updatedItems` array
- [ ] Include `_localId` field in response items
- [ ] Return complete database records for all processed items
- [ ] Handle new item ID assignment properly
- [ ] Update timestamps consistently
- [ ] Implement error reporting in `errors` array

### Mobile App Changes Required ✅

- [ ] Process `updatedItems` array from response
- [ ] Map local IDs to backend IDs using `_localId`
- [ ] Update SQLite database with backend data
- [ ] Handle new item ID changes properly
- [ ] Process failed items from `errors` array

---

## Testing Scenarios

### Test Case 1: New Item Creation

**Input**: Item with `riskassessmentitemid: null`
**Expected**: New backend ID assigned, returned in `updatedItems`

### Test Case 2: Existing Item Update

**Input**: Item with existing `riskassessmentitemid`
**Expected**: Same ID in response, updated data

### Test Case 3: Mixed Batch

**Input**: Mix of new and existing items
**Expected**: All items in `updatedItems` with correct IDs

### Test Case 4: Validation Error

**Input**: Item with missing required field
**Expected**: Item in `errors` array, not in `updatedItems`

---

## Contact

For questions or clarifications about this specification, contact the development team.

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Status**: Pending Implementation 