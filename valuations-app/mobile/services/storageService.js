import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for managing local storage operations
 */
const storageService = {
  /**
   * Keys used for storing different types of data
   */
  STORAGE_KEYS: {
    SURVEYS: '@Valuations:surveys',
    USER_INFO: '@Valuations:userInfo',
    APP_SETTINGS: '@Valuations:settings',
    PENDING_SYNC: '@Valuations:pendingSync',
  },

  /**
   * Store a survey in local storage
   * @param {Object} survey - Survey data to store
   * @param {boolean} needsSync - Whether this survey needs to be synced to server
   * @returns {Promise<void>}
   */
  saveSurvey: async (survey, needsSync = true) => {
    try {
      // Get existing surveys
      const existingSurveys = await storageService.getSurveys();
      
      // Prepare survey with sync metadata
      const surveyToSave = {
        ...survey,
        lastModified: new Date().toISOString(),
        needsSync: needsSync,
      };
      
      // Find index of existing survey if it exists
      const existingIndex = existingSurveys.findIndex(s => s.id === survey.id);
      
      // Update or add the survey
      if (existingIndex >= 0) {
        existingSurveys[existingIndex] = surveyToSave;
      } else {
        existingSurveys.push(surveyToSave);
      }
      
      // Save updated surveys list
      await AsyncStorage.setItem(
        storageService.STORAGE_KEYS.SURVEYS,
        JSON.stringify(existingSurveys)
      );
      
      // Update pending sync list if needed
      if (needsSync) {
        await storageService.addToPendingSync(survey.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving survey to storage:', error);
      return false;
    }
  },

  /**
   * Retrieve all surveys from local storage
   * @returns {Promise<Array>} Array of survey objects
   */
  getSurveys: async () => {
    try {
      const surveysJson = await AsyncStorage.getItem(storageService.STORAGE_KEYS.SURVEYS);
      return surveysJson ? JSON.parse(surveysJson) : [];
    } catch (error) {
      console.error('Error retrieving surveys from storage:', error);
      return [];
    }
  },

  /**
   * Get a specific survey by ID
   * @param {string} surveyId - ID of the survey to retrieve
   * @returns {Promise<Object|null>} Survey object or null if not found
   */
  getSurvey: async (surveyId) => {
    try {
      const surveys = await storageService.getSurveys();
      return surveys.find(survey => survey.id === surveyId) || null;
    } catch (error) {
      console.error(`Error retrieving survey ${surveyId} from storage:`, error);
      return null;
    }
  },

  /**
   * Delete a survey from local storage
   * @param {string} surveyId - ID of the survey to delete
   * @returns {Promise<boolean>} Success indicator
   */
  deleteSurvey: async (surveyId) => {
    try {
      // Get all surveys
      const surveys = await storageService.getSurveys();
      
      // Filter out the survey to delete
      const updatedSurveys = surveys.filter(survey => survey.id !== surveyId);
      
      // Save the filtered list
      await AsyncStorage.setItem(
        storageService.STORAGE_KEYS.SURVEYS,
        JSON.stringify(updatedSurveys)
      );
      
      // Remove from pending sync if present
      await storageService.removeFromPendingSync(surveyId);
      
      return true;
    } catch (error) {
      console.error(`Error deleting survey ${surveyId} from storage:`, error);
      return false;
    }
  },

  /**
   * Mark a survey as synced (no longer needing sync)
   * @param {string} surveyId - ID of the survey to mark
   * @param {string} syncTimestamp - Timestamp of successful sync
   * @returns {Promise<boolean>} Success indicator
   */
  markSurveyAsSynced: async (surveyId, syncTimestamp) => {
    try {
      // Get the survey
      const survey = await storageService.getSurvey(surveyId);
      
      if (!survey) {
        return false;
      }
      
      // Update sync status
      survey.needsSync = false;
      survey.lastSyncedAt = syncTimestamp || new Date().toISOString();
      
      // Save the updated survey
      await storageService.saveSurvey(survey, false);
      
      // Remove from pending sync
      await storageService.removeFromPendingSync(surveyId);
      
      return true;
    } catch (error) {
      console.error(`Error marking survey ${surveyId} as synced:`, error);
      return false;
    }
  },

  /**
   * Get IDs of surveys pending synchronization
   * @returns {Promise<Array>} Array of survey IDs
   */
  getPendingSyncSurveys: async () => {
    try {
      const pendingSyncJson = await AsyncStorage.getItem(storageService.STORAGE_KEYS.PENDING_SYNC);
      return pendingSyncJson ? JSON.parse(pendingSyncJson) : [];
    } catch (error) {
      console.error('Error retrieving pending sync surveys:', error);
      return [];
    }
  },

  /**
   * Add a survey ID to the pending sync list
   * @param {string} surveyId - ID of the survey to add
   * @returns {Promise<boolean>} Success indicator
   */
  addToPendingSync: async (surveyId) => {
    try {
      // Get current pending sync list
      const pendingSyncIds = await storageService.getPendingSyncSurveys();
      
      // Only add if not already in the list
      if (!pendingSyncIds.includes(surveyId)) {
        pendingSyncIds.push(surveyId);
        
        // Save updated list
        await AsyncStorage.setItem(
          storageService.STORAGE_KEYS.PENDING_SYNC,
          JSON.stringify(pendingSyncIds)
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding survey ${surveyId} to pending sync:`, error);
      return false;
    }
  },

  /**
   * Remove a survey ID from the pending sync list
   * @param {string} surveyId - ID of the survey to remove
   * @returns {Promise<boolean>} Success indicator
   */
  removeFromPendingSync: async (surveyId) => {
    try {
      // Get current pending sync list
      const pendingSyncIds = await storageService.getPendingSyncSurveys();
      
      // Filter out the survey ID
      const updatedPendingSyncIds = pendingSyncIds.filter(id => id !== surveyId);
      
      // Save updated list
      await AsyncStorage.setItem(
        storageService.STORAGE_KEYS.PENDING_SYNC,
        JSON.stringify(updatedPendingSyncIds)
      );
      
      return true;
    } catch (error) {
      console.error(`Error removing survey ${surveyId} from pending sync:`, error);
      return false;
    }
  },

  /**
   * Save user info to local storage
   * @param {Object} userInfo - User information to save
   * @returns {Promise<boolean>} Success indicator
   */
  saveUserInfo: async (userInfo) => {
    try {
      await AsyncStorage.setItem(
        storageService.STORAGE_KEYS.USER_INFO,
        JSON.stringify(userInfo)
      );
      return true;
    } catch (error) {
      console.error('Error saving user info:', error);
      return false;
    }
  },

  /**
   * Get user info from local storage
   * @returns {Promise<Object|null>} User info object or null
   */
  getUserInfo: async () => {
    try {
      const userInfoJson = await AsyncStorage.getItem(storageService.STORAGE_KEYS.USER_INFO);
      return userInfoJson ? JSON.parse(userInfoJson) : null;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      return null;
    }
  },

  /**
   * Clear all app data from storage
   * @returns {Promise<boolean>} Success indicator
   */
  clearAllData: async () => {
    try {
      const keys = Object.values(storageService.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
};

export default storageService; 