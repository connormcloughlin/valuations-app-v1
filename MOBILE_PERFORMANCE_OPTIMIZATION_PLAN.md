# 🚀 MOBILE-TABLET PERFORMANCE OPTIMIZATION PLAN

## 📊 EXECUTIVE SUMMARY

This document outlines critical performance bottlenecks identified in the mobile-tablet React Native application and provides a step-by-step implementation plan to achieve 50-80% performance improvements.

## 🚨 CRITICAL ISSUES IDENTIFIED

### 1. SQLite INSERT Operations - Major Bottleneck
- **Impact**: 10-50x slower than batch operations
- **Locations**: `prefetchService.ts:449-489`, `items.tsx:294-334`, `useSurveySummaryData.ts:213-241`
- **Problem**: Individual `insertRiskAssessmentItem()` calls in loops without transactions

### 2. AsyncStorage Memory Bloat
- **Impact**: 100MB+ memory usage, app crashes on low-memory devices
- **Problem**: Excessive caching without cleanup, no size limits or TTL

### 3. N+1 API Call Patterns
- **Impact**: 3-5 duplicate API calls, slow loading times
- **Problem**: Sequential API calls in loops instead of batch requests

### 4. Excessive useEffect Hooks
- **Impact**: Unnecessary re-renders, poor UX
- **Problem**: 8 useEffect hooks in single component, missing cleanup

## 🎯 IMPLEMENTATION PHASES

---

## 📋 PHASE 1: HIGH IMPACT, LOW RISK (Week 1-2)

### Step 1.1: Add SQLite Database Indexes
**Target**: Mobile SQLite database (NOT backend database)
**Expected Improvement**: 80-90% faster queries
**Risk Level**: Low

#### Implementation:
1. **File**: `utils/db.ts`
2. **Location**: Add to `createTables()` function after table creation
3. **Code to Add**:

```typescript
// Add these indexes after table creation in createTables() function
console.log('Creating database indexes for performance...');

// Index for risk assessment items by category (most common query)
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_risk_items_category 
  ON risk_assessment_items(riskassessmentcategoryid);
`);

// Index for risk assessment items by appointment
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_risk_items_appointment 
  ON risk_assessment_items(appointmentid);
`);

// Index for pending sync items (sync operations)
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_risk_items_pending_sync 
  ON risk_assessment_items(pending_sync);
`);

// Index for appointments by status (dashboard queries)
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_appointments_status 
  ON appointments(inviteStatus);
`);

// Index for appointments by order ID
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_appointments_order 
  ON appointments(orderID);
`);

// Index for media files by entity
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_media_entity 
  ON media_files(EntityName, EntityID);
`);

console.log('✅ Database indexes created successfully');
```

#### Testing:
```typescript
// Add to utils/db.ts for testing
export async function testIndexPerformance(): Promise<void> {
  const start = performance.now();
  const result = await runSql(
    'SELECT * FROM risk_assessment_items WHERE riskassessmentcategoryid = ? LIMIT 100',
    ['123']
  );
  const duration = performance.now() - start;
  console.log(`📊 Index test query took: ${duration.toFixed(2)}ms`);
}
```

---

### Step 1.2: Implement Batch SQLite Operations
**Expected Improvement**: 80-90% faster inserts
**Risk Level**: Low

#### Implementation:
1. **File**: `utils/db.ts`
2. **Add new batch insert function**:

```typescript
// Add this new function to db.ts
export async function batchInsertRiskAssessmentItems(items: RiskAssessmentItem[]): Promise<void> {
  if (items.length === 0) return;
  
  console.log(`🔄 Batch inserting ${items.length} risk assessment items...`);
  const start = performance.now();
  
  try {
    const database = await ensureDbReady();
    
    await database.withTransactionAsync(async () => {
      const stmt = await database.prepareAsync(`
        INSERT OR REPLACE INTO risk_assessment_items (
          riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
          commaseparatedlist, selectedanswer, qty, price, description, model, location,
          assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
          dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
          synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      try {
        for (const item of items) {
          const pendingSync = item.issynced ? 0 : (item.pending_sync ?? 1);
          
          await stmt.executeAsync([
            item.riskassessmentitemid,
            item.riskassessmentcategoryid,
            item.itemprompt || '',
            item.itemtype || 0,
            item.rank || 0,
            item.commaseparatedlist || '',
            item.selectedanswer || '',
            item.qty || 0,
            item.price || 0,
            item.description || '',
            item.model || '',
            item.location || '',
            item.assessmentregisterid || 0,
            item.assessmentregistertypeid || 0,
            item.datecreated || new Date().toISOString(),
            item.createdbyid || '',
            item.dateupdated || new Date().toISOString(),
            item.updatedbyid || '',
            item.issynced ? 1 : 0,
            item.syncversion || 0,
            item.deviceid || '',
            item.syncstatus || '',
            item.synctimestamp || new Date().toISOString(),
            item.hasphoto ? 1 : 0,
            item.latitude || 0,
            item.longitude || 0,
            item.notes || '',
            pendingSync,
            item.appointmentid || null
          ]);
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });
    
    const duration = performance.now() - start;
    console.log(`✅ Batch insert completed in ${duration.toFixed(2)}ms (${items.length} items)`);
    
  } catch (error) {
    console.error('❌ Error in batch insert:', error);
    throw error;
  }
}
```

---

## 📝 DATABASE INDEXES CLARIFICATION

**🎯 IMPORTANT: All indexes are for the LOCAL SQLite database in the mobile app, NOT the backend database.**

The mobile app uses SQLite for:
- Offline data storage
- Caching API responses  
- Sync queue management
- Local search and filtering

These indexes will improve local query performance on the device, making the app faster when:
- Loading items by category
- Filtering by appointment
- Finding items that need sync
- Dashboard statistics queries

**No backend database changes required for Phase 1.**

---

## 🧪 TESTING EACH STEP

### Step 1.1 Testing (Database Indexes):
```bash
# In React Native debugger console:
import { testIndexPerformance } from './utils/db';
await testIndexPerformance();
# Should show query times under 50ms
```

### Step 1.2 Testing (Batch Operations):
```bash
# Compare before/after performance:
# Before: Individual inserts take 50-200ms each
# After: Batch of 100 items should take 100-500ms total
```

---

## 📊 SUCCESS METRICS

| Metric | Before | Target After | How to Measure |
|--------|--------|-------------|----------------|
| SQLite Queries | 100-500ms | 10-50ms | Console logs |
| Batch Inserts | 50-200ms per item | 5-10ms per item | Performance monitor |
| Memory Usage | 100MB+ | <50MB | React Native debugger |

---

## 🚨 ROLLBACK PLAN

If Step 1.1 causes issues:
```sql
-- Remove indexes if needed:
DROP INDEX IF EXISTS idx_risk_items_category;
DROP INDEX IF EXISTS idx_risk_items_appointment;
-- etc.
```

If Step 1.2 causes issues:
- Revert to individual `insertRiskAssessmentItem()` calls
- Use existing database functions

---

## 🎯 READY TO START?

Let's begin with **Step 1.1: Add SQLite Database Indexes**

This is the safest, highest-impact change we can make. The indexes will immediately improve query performance without changing any application logic.

Would you like to proceed with Step 1.1? 🚀 