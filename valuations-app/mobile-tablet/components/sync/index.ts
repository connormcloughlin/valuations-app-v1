export { BatchSyncManager } from './BatchSyncManager';
export type { 
  SyncConfig, 
  SyncItem, 
  SyncResult, 
  SyncStrategy, 
  BatchSyncManagerProps 
} from './BatchSyncManager';

// Hook for using the sync manager
export { useBatchSync } from './useBatchSync';

// Utility functions
export { createSyncItems, groupSyncItemsByType } from './syncUtils'; 