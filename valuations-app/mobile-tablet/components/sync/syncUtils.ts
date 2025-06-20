import { SyncItem } from './BatchSyncManager';

/**
 * Create sync items from raw data
 */
export const createSyncItems = (
  data: any[],
  type: 'data' | 'media',
  idField: string = 'id',
  sizeField?: string
): SyncItem[] => {
  return data.map(item => ({
    id: String(item[idField]),
    type,
    data: item,
    ...(sizeField && item[sizeField] ? { size: item[sizeField] } : {})
  }));
};

/**
 * Group sync items by type
 */
export const groupSyncItemsByType = (items: SyncItem[]): {
  data: SyncItem[];
  media: SyncItem[];
} => {
  return items.reduce(
    (groups, item) => {
      groups[item.type].push(item);
      return groups;
    },
    { data: [] as SyncItem[], media: [] as SyncItem[] }
  );
};

/**
 * Calculate total size of sync items (useful for media files)
 */
export const calculateTotalSize = (items: SyncItem[]): number => {
  return items.reduce((total, item) => total + (item.size || 0), 0);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Estimate sync duration based on item count and type
 */
export const estimateSyncDuration = (items: SyncItem[]): string => {
  const { data, media } = groupSyncItemsByType(items);
  
  // Rough estimates: data items ~0.5s each, media items ~5s each
  const dataTime = Math.ceil(data.length / 5) * 0.5; // Batches of 5
  const mediaTime = media.length * 5; // One at a time
  
  const totalSeconds = dataTime + mediaTime;
  
  if (totalSeconds < 60) {
    return `~${Math.ceil(totalSeconds)} seconds`;
  } else {
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

/**
 * Create sync items from SQLite records
 */
export const createSyncItemsFromSQLite = async (
  tableName: string,
  type: 'data' | 'media' = 'data'
): Promise<SyncItem[]> => {
  try {
    // This would typically import your SQLite utilities
    // const { getAllRecords } = await import('../../utils/db');
    // const records = await getAllRecords(tableName);
    
    // For now, return empty array - implement based on your SQLite structure
    console.log(`Creating sync items from SQLite table: ${tableName}`);
    return [];
    
  } catch (error) {
    console.error(`Error creating sync items from SQLite table ${tableName}:`, error);
    return [];
  }
}; 