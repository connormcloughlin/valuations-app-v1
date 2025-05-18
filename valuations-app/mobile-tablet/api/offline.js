import offlineStorage from '../utils/offlineStorage';

/**
 * Offline storage related API methods
 */
const offlineApi = {
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
  }
};

export default offlineApi; 