import AsyncStorage from '@react-native-async-storage/async-storage';
// Dynamic import to prevent bundling at startup
const getDbUtils = () => import('../../utils/db');
import { logger } from '../logging';

/**
 * Secure data purge module for logout
 * Ensures all sensitive data is properly cleared from storage
 */

export interface PurgeOptions {
  secureOverwrite?: boolean;
  clearDatabase?: boolean;
  clearCache?: boolean;
  clearUserData?: boolean;
}

export interface PurgeResult {
  success: boolean;
  clearedItems: {
    asyncStorage: string[];
    databaseTables: string[];
    cacheKeys: string[];
  };
  errors: string[];
}

/**
 * Purge all sensitive data from the application
 * This is called during logout to ensure no residual data remains
 */
export async function purgeSensitiveData(options: PurgeOptions = {}): Promise<PurgeResult> {
  const {
    secureOverwrite = false,
    clearDatabase = true,
    clearCache = true,
    clearUserData = true
  } = options;

  const result: PurgeResult = {
    success: true,
    clearedItems: {
      asyncStorage: [],
      databaseTables: [],
      cacheKeys: []
    },
    errors: []
  };

  try {
    logger.info('Starting secure data purge', { 
      operation: 'purge_sensitive_data',
      options: { secureOverwrite, clearDatabase, clearCache, clearUserData }
    });

    // 1. Clear AsyncStorage sensitive data
    if (clearUserData) {
      await purgeAsyncStorageData(secureOverwrite, result);
    }

    // 2. Clear database tables
    if (clearDatabase) {
      await purgeDatabaseData(result);
    }

    // 3. Clear cache data
    if (clearCache) {
      await purgeCacheData(result);
    }

    logger.info('Secure data purge completed successfully', {
      operation: 'purge_complete',
      clearedItems: result.clearedItems,
      errorCount: result.errors.length
    });

  } catch (error) {
    result.success = false;
    result.errors.push(`Purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    logger.error('Secure data purge failed', {
      operation: 'purge_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      clearedItems: result.clearedItems
    }, undefined, error instanceof Error ? error : undefined);
  }

  return result;
}

/**
 * Purge sensitive data from AsyncStorage
 */
async function purgeAsyncStorageData(secureOverwrite: boolean, result: PurgeResult): Promise<void> {
  try {
    logger.debug('Purging AsyncStorage sensitive data', { operation: 'purge_async_storage' });

    // Get all keys to identify what needs to be cleared
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Define sensitive data keys that must be cleared
    const sensitiveKeys = [
      'secureSession',
      'userContext', 
      'authToken',
      'azureToken',
      'userData',
      'authToken',
      'userContext',
      'sessionData',
      'refreshToken',
      'accessToken',
      'idToken'
    ];

    // Filter keys that contain sensitive data
    const keysToRemove = allKeys.filter(key => 
      sensitiveKeys.includes(key) ||
      key.includes('auth') ||
      key.includes('token') ||
      key.includes('session') ||
      key.includes('user') ||
      key.includes('azure')
    );

    if (keysToRemove.length > 0) {
      if (secureOverwrite) {
        // Secure overwrite: write dummy data then delete
        logger.debug('Performing secure overwrite of sensitive data', { 
          operation: 'secure_overwrite',
          keyCount: keysToRemove.length 
        });
        
        for (const key of keysToRemove) {
          try {
            // Write dummy data to overwrite sensitive content
            await AsyncStorage.setItem(key, 'DUMMY_DATA_OVERWRITE');
            await AsyncStorage.removeItem(key);
          } catch (error) {
            logger.warn('Failed to secure overwrite key', { 
              operation: 'secure_overwrite_failed',
              key,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } else {
        // Standard removal
        await AsyncStorage.multiRemove(keysToRemove);
      }

      result.clearedItems.asyncStorage = keysToRemove;
      logger.info('AsyncStorage sensitive data cleared', {
        operation: 'async_storage_cleared',
        clearedKeys: keysToRemove.length,
        secureOverwrite
      });
    } else {
      logger.debug('No sensitive AsyncStorage keys found to clear');
    }

  } catch (error) {
    const errorMsg = `Failed to clear AsyncStorage: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    logger.error('AsyncStorage purge failed', {
      operation: 'async_storage_purge_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Purge sensitive data from database tables
 */
async function purgeDatabaseData(result: PurgeResult): Promise<void> {
  try {
    logger.debug('Purging database sensitive data', { operation: 'purge_database' });

    // Clear all cached tables that may contain user data
    const { clearAllCachedTables } = await getDbUtils();
    await clearAllCachedTables();
    
    result.clearedItems.databaseTables = [
      'appointments',
      'risk_assessment_master', 
      'risk_assessment_items',
      'media_files',
      'category_configurations'
    ];

    logger.info('Database sensitive data cleared', {
      operation: 'database_cleared',
      clearedTables: result.clearedItems.databaseTables.length
    });

  } catch (error) {
    const errorMsg = `Failed to clear database: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    logger.error('Database purge failed', {
      operation: 'database_purge_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Purge cache data
 */
async function purgeCacheData(result: PurgeResult): Promise<void> {
  try {
    logger.debug('Purging cache data', { operation: 'purge_cache' });

    // Get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter cache-related keys
    const cacheKeys = allKeys.filter(key => 
      key.includes('cache') ||
      key.includes('api_cache') ||
      key.includes('mobile_dashboard') ||
      key.includes('appointmentsByListView') ||
      key.includes('todays_appointments') ||
      key.includes('surveys_in_progress') ||
      key.includes('risk_assessment_hierarchy') ||
      key.includes('assessment_') ||
      key.includes('template_') ||
      key.includes('field_config_') ||
      key.includes('risk_templates') ||
      key.includes('assessment_sections') ||
      key.includes('assessment_categories') ||
      key.includes('assessment_items') ||
      key.includes('template_categories') ||
      key.includes('template_items')
    );

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      result.clearedItems.cacheKeys = cacheKeys;
      
      logger.info('Cache data cleared', {
        operation: 'cache_cleared',
        clearedKeys: cacheKeys.length
      });
    } else {
      logger.debug('No cache keys found to clear');
    }

  } catch (error) {
    const errorMsg = `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    logger.error('Cache purge failed', {
      operation: 'cache_purge_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Quick purge for development/testing
 * Only clears the most critical sensitive data
 */
export async function quickPurge(): Promise<PurgeResult> {
  return purgeSensitiveData({
    secureOverwrite: false,
    clearDatabase: false, // Keep database for development
    clearCache: true,
    clearUserData: true
  });
}

/**
 * Full secure purge for production logout
 * Clears everything with secure overwrite
 */
export async function fullSecurePurge(): Promise<PurgeResult> {
  return purgeSensitiveData({
    secureOverwrite: true,
    clearDatabase: true,
    clearCache: true,
    clearUserData: true
  });
}



