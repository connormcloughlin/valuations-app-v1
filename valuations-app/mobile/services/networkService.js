import NetInfo from 'react-native-netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storageService from './storageService';
import * as api from '../api'; // Assuming you have an API module

// Constants
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Network service for handling connectivity and data synchronization
 */
const networkService = {
  // Track if we're currently syncing to prevent multiple simultaneous syncs
  isSyncing: false,
  
  // Store the reference to interval timer
  syncIntervalId: null,
  
  /**
   * Check if the device has internet connectivity
   * @returns {Promise<boolean>} Whether the device is connected
   */
  isConnected: async () => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.error('Error checking network connectivity:', error);
      return false;
    }
  },
  
  /**
   * Initialize background sync process
   */
  initBackgroundSync: () => {
    // Clear any existing intervals
    if (networkService.syncIntervalId) {
      clearInterval(networkService.syncIntervalId);
    }
    
    // Set up periodic sync
    networkService.syncIntervalId = setInterval(async () => {
      const isConnected = await networkService.isConnected();
      if (isConnected) {
        networkService.syncPendingSurveys();
      } else {
        console.log('No internet connection. Skipping sync attempt.');
      }
    }, SYNC_INTERVAL);
    
    console.log('Background sync initialized. Will attempt to sync every 5 minutes when connected.');
    
    // Also try to sync immediately if connected
    networkService.isConnected().then(connected => {
      if (connected) {
        networkService.syncPendingSurveys();
      }
    });
    
    return true;
  },
  
  /**
   * Stop background sync process
   */
  stopBackgroundSync: () => {
    if (networkService.syncIntervalId) {
      clearInterval(networkService.syncIntervalId);
      networkService.syncIntervalId = null;
      console.log('Background sync stopped.');
    }
    return true;
  },
  
  /**
   * Sync all pending surveys to the server
   * @returns {Promise<Object>} Results of the sync operation
   */
  syncPendingSurveys: async () => {
    // Prevent multiple simultaneous syncs
    if (networkService.isSyncing) {
      console.log('Sync already in progress. Skipping.');
      return { success: false, message: 'Sync already in progress' };
    }
    
    try {
      networkService.isSyncing = true;
      
      // Update last sync attempt timestamp
      await storageService.updateLastSyncAttempt();
      
      // Check connectivity
      const isConnected = await networkService.isConnected();
      if (!isConnected) {
        console.log('No internet connection. Cannot sync surveys.');
        networkService.isSyncing = false;
        return { success: false, message: 'No internet connection' };
      }
      
      // Get pending surveys
      const pendingSurveyIds = await storageService.getPendingSyncList();
      if (pendingSurveyIds.length === 0) {
        console.log('No pending surveys to sync.');
        networkService.isSyncing = false;
        return { success: true, message: 'No pending surveys', syncedCount: 0 };
      }
      
      console.log(`Attempting to sync ${pendingSurveyIds.length} surveys...`);
      
      // Track results for reporting
      const results = {
        success: true,
        message: 'Sync completed',
        syncedCount: 0,
        failedCount: 0,
        errors: []
      };
      
      // Process each survey
      for (const surveyId of pendingSurveyIds) {
        try {
          // Get the survey data from local storage
          const surveyData = await storageService.loadSurveyData(surveyId);
          
          if (!surveyData) {
            console.warn(`Survey ID ${surveyId} is in pending list but no data found`);
            await storageService.removeFromPendingSync(surveyId);
            results.errors.push({ surveyId, error: 'No data found' });
            results.failedCount++;
            continue;
          }
          
          // Submit to server
          const response = await api.submitSurvey(surveyId, surveyData);
          
          if (response && response.success) {
            // Success! Remove from local storage
            await storageService.deleteSurveyData(surveyId);
            console.log(`Survey ID ${surveyId} successfully synced and removed from local storage`);
            results.syncedCount++;
          } else {
            // Failed to sync
            const errorMsg = response?.message || 'Unknown error';
            console.error(`Failed to sync survey ID ${surveyId}: ${errorMsg}`);
            results.errors.push({ surveyId, error: errorMsg });
            results.failedCount++;
          }
        } catch (error) {
          console.error(`Error syncing survey ID ${surveyId}:`, error);
          results.errors.push({ surveyId, error: error.message });
          results.failedCount++;
        }
      }
      
      // Update overall success status
      if (results.failedCount > 0 && results.syncedCount === 0) {
        results.success = false;
        results.message = 'All sync attempts failed';
      } else if (results.failedCount > 0) {
        results.message = `Synced ${results.syncedCount}/${pendingSurveyIds.length} surveys with some errors`;
      } else {
        results.message = `Successfully synced all ${results.syncedCount} surveys`;
      }
      
      return results;
    } catch (error) {
      console.error('Unexpected error during sync process:', error);
      return { 
        success: false, 
        message: `Sync failed: ${error.message}`,
        syncedCount: 0,
        failedCount: 0,
        errors: [{ error: error.message }] 
      };
    } finally {
      networkService.isSyncing = false;
    }
  },
  
  /**
   * Force an immediate sync attempt
   */
  forceSyncNow: async () => {
    const isConnected = await networkService.isConnected();
    if (!isConnected) {
      return { success: false, message: 'No internet connection' };
    }
    
    return await networkService.syncPendingSurveys();
  }
};

export default networkService; 