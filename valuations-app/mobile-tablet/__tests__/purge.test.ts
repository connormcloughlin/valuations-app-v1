import { purgeSensitiveData, quickPurge, fullSecurePurge } from '../core/security/purge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAllCachedTables } from '../utils/db';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../utils/db');
jest.mock('../core/logging', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockClearAllCachedTables = clearAllCachedTables as jest.MockedFunction<typeof clearAllCachedTables>;

describe('Secure Data Purge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('purgeSensitiveData', () => {
    it('should clear sensitive AsyncStorage data', async () => {
      // Mock AsyncStorage keys
      mockAsyncStorage.getAllKeys.mockResolvedValue([
        'secureSession',
        'userContext',
        'authToken',
        'azureToken',
        'userData',
        'cache_data',
        'other_data'
      ]);

      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
      mockClearAllCachedTables.mockResolvedValue(undefined);

      const result = await purgeSensitiveData({
        secureOverwrite: false,
        clearDatabase: true,
        clearCache: true,
        clearUserData: true
      });

      expect(result.success).toBe(true);
      expect(result.clearedItems.asyncStorage).toContain('secureSession');
      expect(result.clearedItems.asyncStorage).toContain('userContext');
      expect(result.clearedItems.asyncStorage).toContain('authToken');
      expect(result.clearedItems.databaseTables).toHaveLength(5);
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
      expect(mockClearAllCachedTables).toHaveBeenCalled();
    });

    it('should perform secure overwrite when enabled', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['secureSession', 'authToken']);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
      mockClearAllCachedTables.mockResolvedValue(undefined);

      const result = await purgeSensitiveData({
        secureOverwrite: true,
        clearDatabase: true,
        clearCache: true,
        clearUserData: true
      });

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('secureSession', 'DUMMY_DATA_OVERWRITE');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'DUMMY_DATA_OVERWRITE');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('secureSession');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should handle errors gracefully', async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('AsyncStorage error'));
      mockClearAllCachedTables.mockRejectedValue(new Error('Database error'));

      const result = await purgeSensitiveData();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Failed to clear AsyncStorage');
      expect(result.errors[1]).toContain('Failed to clear database');
    });

    it('should skip database clearing when disabled', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['secureSession']);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

      const result = await purgeSensitiveData({
        clearDatabase: false,
        clearCache: true,
        clearUserData: true
      });

      expect(result.success).toBe(true);
      expect(mockClearAllCachedTables).not.toHaveBeenCalled();
      expect(result.clearedItems.databaseTables).toHaveLength(0);
    });

    it('should clear cache data', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue([
        'api_cache_data',
        'mobile_dashboard_cache',
        'appointmentsByListView_cache',
        'risk_assessment_hierarchy_cache',
        'assessment_data_cache',
        'template_data_cache'
      ]);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
      mockClearAllCachedTables.mockResolvedValue(undefined);

      const result = await purgeSensitiveData({
        clearDatabase: true,
        clearCache: true,
        clearUserData: true
      });

      expect(result.success).toBe(true);
      expect(result.clearedItems.cacheKeys).toHaveLength(6);
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('quickPurge', () => {
    it('should perform quick purge without database clearing', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['secureSession', 'authToken']);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

      const result = await quickPurge();

      expect(result.success).toBe(true);
      expect(mockClearAllCachedTables).not.toHaveBeenCalled();
      expect(result.clearedItems.databaseTables).toHaveLength(0);
    });
  });

  describe('fullSecurePurge', () => {
    it('should perform full secure purge with overwrite', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['secureSession', 'authToken']);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
      mockClearAllCachedTables.mockResolvedValue(undefined);

      const result = await fullSecurePurge();

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      expect(mockClearAllCachedTables).toHaveBeenCalled();
    });
  });

  describe('cache data filtering', () => {
    it('should identify and clear cache-related keys', async () => {
      const cacheKeys = [
        'api_cache_data',
        'mobile_dashboard_cache',
        'appointmentsByListView_cache',
        'todays_appointments_cache',
        'surveys_in_progress_cache',
        'risk_assessment_hierarchy_cache',
        'assessment_data_cache',
        'template_data_cache',
        'field_config_cache',
        'risk_templates_cache',
        'assessment_sections_cache',
        'assessment_categories_cache',
        'assessment_items_cache',
        'template_categories_cache',
        'template_items_cache'
      ];

      mockAsyncStorage.getAllKeys.mockResolvedValue(cacheKeys);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
      mockClearAllCachedTables.mockResolvedValue(undefined);

      const result = await purgeSensitiveData();

      expect(result.success).toBe(true);
      expect(result.clearedItems.cacheKeys).toHaveLength(cacheKeys.length);
    });
  });

  describe('sensitive data filtering', () => {
    it('should identify and clear sensitive data keys', async () => {
      const sensitiveKeys = [
        'secureSession',
        'userContext',
        'authToken',
        'azureToken',
        'userData',
        'sessionData',
        'refreshToken',
        'accessToken',
        'idToken',
        'auth_data',
        'token_data',
        'session_data',
        'user_data',
        'azure_data'
      ];

      mockAsyncStorage.getAllKeys.mockResolvedValue(sensitiveKeys);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
      mockClearAllCachedTables.mockResolvedValue(undefined);

      const result = await purgeSensitiveData();

      expect(result.success).toBe(true);
      expect(result.clearedItems.asyncStorage).toHaveLength(sensitiveKeys.length);
    });
  });
});



