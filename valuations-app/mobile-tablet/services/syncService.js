import api from '../api';
import storageService from './storageService';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Service for handling synchronization between local storage and server
 */
const syncService = {
  /**
   * Check if device is currently connected to the internet
   * @returns {Promise<boolean>} Connection status
   */
  isConnected: async () => {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected && netInfo.isInternetReachable;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  },

  /**
   * Initialize user session with stored credentials
   * @returns {Promise<boolean>} Success indicator
   */
  initializeSession: async () => {
    try {
      // Try to get user info from storage
      const userInfo = await storageService.getUserInfo();
      
      // If we have user info with a token, set it in the API client
      if (userInfo && userInfo.token) {
        api.setAuthToken(userInfo.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing session:', error);
      return false;
    }
  },

  /**
   * Log in user and store credentials
   * @param {string} username - User's username or email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Result with success status and user info
   */
  login: async (username, password) => {
    try {
      // Check internet connection
      if (!(await syncService.isConnected())) {
        return { 
          success: false, 
          error: 'No internet connection',
          offline: true
        };
      }
      
      // Attempt login via API
      const response = await api.login(username, password);
      
      if (response.success && response.data) {
        // Store user info including token
        const userInfo = {
          ...response.data,
          lastLogin: new Date().toISOString()
        };
        
        await storageService.saveUserInfo(userInfo);
        
        // Set token for future API calls
        api.setAuthToken(userInfo.token);
        
        return { 
          success: true, 
          data: userInfo 
        };
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  },

  /**
   * Sync a single survey to the server
   * @param {string} surveyId - ID of survey to sync
   * @returns {Promise<Object>} Result with success status
   */
  syncSurvey: async (surveyId) => {
    try {
      // Check internet connection
      if (!(await syncService.isConnected())) {
        return { 
          success: false, 
          error: 'No internet connection',
          offline: true
        };
      }
      
      // Get survey from local storage
      const survey = await storageService.getSurvey(surveyId);
      
      if (!survey) {
        return { 
          success: false, 
          error: `Survey ${surveyId} not found in local storage` 
        };
      }
      
      // Upload any files that need to be uploaded
      const fileResults = await syncService.syncSurveyFiles(survey);
      
      // If any files failed to upload, return error
      if (fileResults.some(result => !result.success)) {
        return { 
          success: false, 
          error: 'Failed to upload one or more files',
          details: fileResults.filter(r => !r.success)
        };
      }
      
      // Update survey with uploaded file URLs
      const updatedSurvey = {
        ...survey,
        items: survey.items.map(item => {
          if (item.photoLocalUri && item.photoServerId) {
            // Replace local URI with server ID for sync
            const { photoLocalUri, ...itemWithoutLocalUri } = item;
            return itemWithoutLocalUri;
          }
          return item;
        })
      };
      
      // Submit survey to server
      const response = await api.submitSurvey(updatedSurvey);
      
      if (response.success) {
        // Mark survey as synced in local storage
        await storageService.markSurveyAsSynced(surveyId, new Date().toISOString());
        return { 
          success: true, 
          data: response.data 
        };
      }
      
      return response;
    } catch (error) {
      console.error(`Error syncing survey ${surveyId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Sync failed' 
      };
    }
  },

  /**
   * Sync files associated with a survey
   * @param {Object} survey - Survey object with items
   * @returns {Promise<Array>} Array of file upload results
   */
  syncSurveyFiles: async (survey) => {
    // Get all items with local photo URIs that need uploading
    const itemsWithPhotos = (survey.items || []).filter(
      item => item.photoLocalUri && !item.photoServerId
    );
    
    // No files to upload
    if (itemsWithPhotos.length === 0) {
      return [];
    }
    
    // Upload each file
    const uploadPromises = itemsWithPhotos.map(async (item) => {
      try {
        // Prepare file info
        const filename = item.photoLocalUri.split('/').pop();
        const extension = filename.split('.').pop();
        const mimeType = extension === 'jpg' || extension === 'jpeg' 
          ? 'image/jpeg' 
          : extension === 'png' ? 'image/png' : 'application/octet-stream';
        
        // Upload file
        const response = await api.uploadFile(
          survey.id,
          item.photoLocalUri,
          {
            name: filename,
            type: mimeType,
            itemId: item.id
          }
        );
        
        if (response.success && response.data) {
          // Update item with server file ID
          item.photoServerId = response.data.fileId;
          
          // Update the item in the survey
          const updatedItems = survey.items.map(i => 
            i.id === item.id ? { ...i, photoServerId: response.data.fileId } : i
          );
          
          // Update survey in local storage
          await storageService.saveSurvey({
            ...survey,
            items: updatedItems
          }, true);
          
          return {
            success: true,
            itemId: item.id,
            fileId: response.data.fileId
          };
        }
        
        return {
          success: false,
          itemId: item.id,
          error: response.error || 'File upload failed'
        };
      } catch (error) {
        console.error(`Error uploading file for item ${item.id}:`, error);
        return {
          success: false,
          itemId: item.id,
          error: error.message || 'File upload failed'
        };
      }
    });
    
    // Wait for all uploads to complete
    return Promise.all(uploadPromises);
  },

  /**
   * Sync all pending surveys to the server
   * @returns {Promise<Object>} Result with success status and details
   */
  syncAllPending: async () => {
    try {
      // Check internet connection
      if (!(await syncService.isConnected())) {
        return { 
          success: false, 
          error: 'No internet connection',
          offline: true
        };
      }
      
      // Get all surveys that need syncing
      const pendingSurveyIds = await storageService.getPendingSyncSurveys();
      
      if (pendingSurveyIds.length === 0) {
        return { 
          success: true, 
          message: 'No surveys pending synchronization' 
        };
      }
      
      // Sync each survey
      const syncResults = [];
      for (const surveyId of pendingSurveyIds) {
        const result = await syncService.syncSurvey(surveyId);
        syncResults.push({
          surveyId,
          ...result
        });
      }
      
      // Check if all syncs were successful
      const allSuccessful = syncResults.every(result => result.success);
      
      return {
        success: allSuccessful,
        totalSynced: syncResults.filter(r => r.success).length,
        totalFailed: syncResults.filter(r => !r.success).length,
        results: syncResults
      };
    } catch (error) {
      console.error('Error syncing all pending surveys:', error);
      return { 
        success: false, 
        error: error.message || 'Sync failed' 
      };
    }
  },

  /**
   * Download and store surveys from server
   * @returns {Promise<Object>} Result with success status and downloaded surveys
   */
  downloadSurveys: async () => {
    try {
      // Check internet connection
      if (!(await syncService.isConnected())) {
        return { 
          success: false, 
          error: 'No internet connection',
          offline: true
        };
      }
      
      // Get surveys from server
      const response = await api.getSurveys();
      
      if (response.success && response.data) {
        // Store each survey locally
        for (const survey of response.data) {
          await storageService.saveSurvey({
            ...survey,
            needsSync: false,
            downloadedAt: new Date().toISOString()
          }, false);
        }
        
        return { 
          success: true, 
          data: response.data,
          count: response.data.length
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error downloading surveys:', error);
      return { 
        success: false, 
        error: error.message || 'Download failed' 
      };
    }
  },

  /**
   * Perform a full two-way sync
   * First sends pending changes, then downloads updates
   * @returns {Promise<Object>} Result with success status
   */
  performFullSync: async () => {
    try {
      // Check internet connection
      if (!(await syncService.isConnected())) {
        return { 
          success: false, 
          error: 'No internet connection',
          offline: true
        };
      }
      
      // First, sync pending changes to server
      const uploadResult = await syncService.syncAllPending();
      
      // Then, download updates from server
      const downloadResult = await syncService.downloadSurveys();
      
      return {
        success: uploadResult.success && downloadResult.success,
        uploadResult,
        downloadResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error performing full sync:', error);
      return { 
        success: false, 
        error: error.message || 'Full sync failed' 
      };
    }
  }
};

export default syncService; 