import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration constants
const MAX_STORAGE_SIZE = 500 * 1024 * 1024; // 500MB limit (increased from 50MB)
const DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour cleanup interval
const STORAGE_KEY_PREFIX = 'valuations_';

interface CachedItem {
  data: any;
  timestamp: number;
  ttl: number;
  size: number;
}

interface StorageStats {
  totalSize: number;
  itemCount: number;
  oldestItem: number;
  newestItem: number;
}

class AsyncStorageManager {
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private isCleanupRunning = false;

  constructor() {
    this.startPeriodicCleanup();
  }

  /**
   * Store data with TTL and size tracking
   */
  async setItem(key: string, data: any, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const fullKey = STORAGE_KEY_PREFIX + key;
      const timestamp = Date.now();
      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;
      
      const cachedItem: CachedItem = {
        data,
        timestamp,
        ttl,
        size
      };
      
      // Check storage size before adding
      const currentStats = await this.getStorageStats();
      if (currentStats.totalSize + size > MAX_STORAGE_SIZE) {
        console.log('🧹 Storage limit exceeded, running cleanup...');
        await this.cleanup();
        
        // Check again after cleanup
        const newStats = await this.getStorageStats();
        if (newStats.totalSize + size > MAX_STORAGE_SIZE) {
          console.warn('⚠️ Storage still full after cleanup, removing oldest items...');
          await this.forceCleanup(size);
        }
      }
      
      await AsyncStorage.setItem(fullKey, JSON.stringify(cachedItem));
      console.log(`📦 Stored ${key}: ${(size / 1024).toFixed(1)}KB, TTL: ${(ttl / 1000 / 60).toFixed(0)}min`);
      
    } catch (error) {
      console.error('❌ Error storing item:', key, error);
      throw error;
    }
  }

  /**
   * Get data with TTL check
   */
  async getItem(key: string): Promise<any | null> {
    try {
      const fullKey = STORAGE_KEY_PREFIX + key;
      const storedData = await AsyncStorage.getItem(fullKey);
      
      if (!storedData) {
        return null;
      }
      
      const cachedItem: CachedItem = JSON.parse(storedData);
      const now = Date.now();
      
      // Check if item has expired
      if (now - cachedItem.timestamp > cachedItem.ttl) {
        console.log(`⏰ Cache expired for ${key}, removing...`);
        await AsyncStorage.removeItem(fullKey);
        return null;
      }
      
      console.log(`✅ Cache hit for ${key}: ${(cachedItem.size / 1024).toFixed(1)}KB`);
      return cachedItem.data;
      
    } catch (error) {
      console.error('❌ Error getting item:', key, error);
      return null;
    }
  }

  /**
   * Remove specific item
   */
  async removeItem(key: string): Promise<void> {
    try {
      const fullKey = STORAGE_KEY_PREFIX + key;
      await AsyncStorage.removeItem(fullKey);
      console.log(`🗑️ Removed ${key} from cache`);
    } catch (error) {
      console.error('❌ Error removing item:', key, error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      
      let totalSize = 0;
      let oldestItem = Date.now();
      let newestItem = 0;
      
      for (const key of ourKeys) {
        try {
          const storedData = await AsyncStorage.getItem(key);
          if (storedData) {
            const cachedItem: CachedItem = JSON.parse(storedData);
            totalSize += cachedItem.size;
            
            if (cachedItem.timestamp < oldestItem) {
              oldestItem = cachedItem.timestamp;
            }
            if (cachedItem.timestamp > newestItem) {
              newestItem = cachedItem.timestamp;
            }
          }
        } catch (error) {
          // Skip corrupted items
          console.warn('⚠️ Corrupted cache item:', key);
        }
      }
      
      return {
        totalSize,
        itemCount: ourKeys.length,
        oldestItem,
        newestItem
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return { totalSize: 0, itemCount: 0, oldestItem: 0, newestItem: 0 };
    }
  }

  /**
   * Clean up expired items
   */
  async cleanup(): Promise<void> {
    if (this.isCleanupRunning) {
      console.log('🧹 Cleanup already running, skipping...');
      return;
    }
    
    this.isCleanupRunning = true;
    
    try {
      console.log('🧹 Starting AsyncStorage cleanup...');
      const start = performance.now();
      
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      
      let removedCount = 0;
      let reclaimedSize = 0;
      const now = Date.now();
      
      for (const key of ourKeys) {
        try {
          const storedData = await AsyncStorage.getItem(key);
          if (storedData) {
            const cachedItem: CachedItem = JSON.parse(storedData);
            
            // Remove expired items
            if (now - cachedItem.timestamp > cachedItem.ttl) {
              await AsyncStorage.removeItem(key);
              removedCount++;
              reclaimedSize += cachedItem.size;
            }
          }
        } catch (error) {
          // Remove corrupted items
          await AsyncStorage.removeItem(key);
          removedCount++;
          console.warn('🗑️ Removed corrupted item:', key);
        }
      }
      
      const duration = performance.now() - start;
      console.log(`✅ Cleanup completed in ${duration.toFixed(2)}ms`);
      console.log(`   Removed ${removedCount} expired items`);
      console.log(`   Reclaimed ${(reclaimedSize / 1024 / 1024).toFixed(2)}MB`);
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Force cleanup to make space (removes oldest items)
   */
  async forceCleanup(spaceNeeded: number): Promise<void> {
    try {
      console.log(`🚨 Force cleanup to make ${(spaceNeeded / 1024).toFixed(1)}KB space...`);
      
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      
      // Get all items with timestamps
      const items: Array<{ key: string; timestamp: number; size: number }> = [];
      
      for (const key of ourKeys) {
        try {
          const storedData = await AsyncStorage.getItem(key);
          if (storedData) {
            const cachedItem: CachedItem = JSON.parse(storedData);
            items.push({
              key,
              timestamp: cachedItem.timestamp,
              size: cachedItem.size
            });
          }
        } catch (error) {
          // Skip corrupted items
        }
      }
      
      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);
      
      let reclaimedSpace = 0;
      let removedCount = 0;
      
      for (const item of items) {
        if (reclaimedSpace >= spaceNeeded) {
          break;
        }
        
        await AsyncStorage.removeItem(item.key);
        reclaimedSpace += item.size;
        removedCount++;
      }
      
      console.log(`✅ Force cleanup complete: removed ${removedCount} items, reclaimed ${(reclaimedSpace / 1024).toFixed(1)}KB`);
      
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);
    
    console.log('🔄 Started periodic AsyncStorage cleanup (every 1 hour)');
  }

  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('⏹️ Stopped periodic AsyncStorage cleanup');
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    try {
      console.log('🧹 Clearing all cached data...');
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      
      await AsyncStorage.multiRemove(ourKeys);
      console.log(`✅ Cleared ${ourKeys.length} cached items`);
      
    } catch (error) {
      console.error('❌ Error clearing all data:', error);
    }
  }

  /**
   * Get human-readable storage info
   */
  async getStorageInfo(): Promise<string> {
    const stats = await this.getStorageStats();
    const sizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);
    const oldestAge = stats.oldestItem ? Math.floor((Date.now() - stats.oldestItem) / 1000 / 60) : 0;
    
    return `📊 AsyncStorage: ${sizeMB}MB used, ${stats.itemCount} items, oldest: ${oldestAge}min ago`;
  }
}

// Export singleton instance
export const asyncStorageManager = new AsyncStorageManager();
export default asyncStorageManager; 