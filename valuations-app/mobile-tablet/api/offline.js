import offlineStorage from '../utils/offlineStorage';

/**
 * Offline storage related API methods
 */
const offlineApi = {
  /**
   * Store data for offline use
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @returns {Promise<void>}
   */
  storeData: async (key, data) => {
    try {
      await offlineStorage.storeDataForKey(key, data);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  },

  /**
   * Get stored data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored data or null
   */
  getData: async (key) => {
    try {
      return await offlineStorage.getDataForKey(key);
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  },

  /**
   * Clear all cached API data
   * @returns {Promise<Object>} Response indicating success/failure
   */
  clearAllCachedData: async () => {
    try {
      await offlineStorage.clearAllOfflineData();
      return {
        success: true,
        message: 'All cached data cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing cached data:', error);
      return {
        success: false,
        message: error.message || 'Failed to clear cached data'
      };
    }
  },

  /**
   * Emergency cleanup for database full issues
   * @returns {Promise<Object>} Response indicating success/failure
   */
  emergencyCleanup: async () => {
    try {
      await offlineStorage.emergencyCleanup();
      return {
        success: true,
        message: 'Emergency cleanup completed - all storage cleared'
      };
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform emergency cleanup'
      };
    }
  }
};

export default offlineApi; 