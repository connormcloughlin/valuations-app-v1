import transportClient from '../core/transport/transportClient';
import offlineStorage from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';

/**
 * Survey related API methods using unified transport
 */
const surveysApi = {
  /**
   * Get surveys from the server with offline support
   * @returns {Promise<Object>} Response with surveys array
   */
  getSurveys: async () => {
    // Check if we're online first
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching surveys: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await offlineStorage.getDataForKey('surveys');
      console.log(`Retrieved cached surveys: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached surveys:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached surveys (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        // No cached data available while offline
        console.error('Offline and no cached surveys available');
        return {
          success: false,
          message: 'You are offline and no cached survey data is available.',
          status: 0
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`Fetching surveys from server`);
      const response = await transportClient.get('surveys.list', '/surveys');
      
      if (response) {
        console.log(`Got ${Array.isArray(response) ? response.length : 'unknown count'} surveys from server`);
        
        // Cache the surveys for offline use
        try {
          await offlineStorage.storeDataForKey('surveys', response);
          console.log('Surveys cached successfully');
        } catch (storageError) {
          console.error('Error caching surveys:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Error fetching surveys from server:', error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached surveys (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache, return the error
      return { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get survey by ID with offline support
   * @param {string} surveyId - ID of the survey to fetch
   * @returns {Promise<Object>} Response with survey data
   */
  getSurveyById: async (surveyId: string) => {
    // Check if we're online first
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching survey: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await offlineStorage.getDataForKey(`survey_${surveyId}`);
      console.log(`Retrieved cached survey ${surveyId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached survey:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using cached survey ${surveyId} (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        // No cached data available while offline
        console.error('Offline and no cached survey available');
        return {
          success: false,
          message: 'You are offline and no cached survey data is available.',
          status: 0
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`Fetching survey ${surveyId} from server`);
      const response = await transportClient.get('surveys.list', `/surveys/${surveyId}`);
      
      if (response) {
        console.log(`Got survey ${surveyId} from server`);
        
        // Cache the survey for offline use
        try {
          await offlineStorage.storeDataForKey(`survey_${surveyId}`, response);
          console.log('Survey cached successfully');
        } catch (storageError) {
          console.error('Error caching survey:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error(`Error fetching survey ${surveyId} from server:`, error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`Using cached survey ${surveyId} (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache, return the error
      return { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Submit survey responses
   * @param {string} surveyId - ID of the survey
   * @param {Object} responses - Survey responses
   * @returns {Promise<Object>} Response with submission result
   */
  submitSurvey: async (surveyId: string, responses: any) => {
    try {
      console.log(`Submitting survey ${surveyId} responses`);
      const response = await transportClient.post('surveys.submit', `/surveys/${surveyId}/submit`, responses);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error(`Error submitting survey ${surveyId}:`, error);
      return { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get survey statistics
   * @returns {Promise<Object>} Response with survey stats
   */
  getSurveyStats: async () => {
    try {
      console.log('Fetching survey statistics');
      const response = await transportClient.get('surveys.list', '/surveys/stats');
      
      return {
        success: true,
        data: response,
        status: 200
      };
    } catch (error: any) {
      console.error('Error fetching survey stats:', error);
      return { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  }
};

export default surveysApi;
