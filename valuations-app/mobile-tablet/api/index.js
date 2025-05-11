import axios from 'axios';
import { Platform } from 'react-native';
import offlineStorage from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';

// API configuration
const API_CONFIG = {
  // Use the specific IP address for the API server
  BASE_URL: 'http://192.168.0.102:5000/api',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

console.log(`API configured with base URL: ${API_CONFIG.BASE_URL}`);

// Create axios instance with config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Simple test to check API connectivity on startup
(async () => {
  try {
    console.log(`Testing connection to ${API_CONFIG.BASE_URL}...`);
    const response = await fetch(`${API_CONFIG.BASE_URL}/risk-templates`, { 
      method: 'GET', 
      headers: API_CONFIG.HEADERS 
    });
    console.log(`API connection test result: ${response.status}`);
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ API server is reachable');
    } else {
      console.warn(`⚠️ API returned status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
  }
})();

// Add response interceptor for standardizing responses
apiClient.interceptors.response.use(
  (response) => {
    // For successful responses, wrap in standard format
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
  (error) => {
    // For error responses, format error information
    const errorResponse = {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
    };
    
    // Still reject the promise, but with formatted error
    return Promise.reject(errorResponse);
  }
);

/**
 * API client for interacting with the server
 */
const api = {
  /**
   * Set authentication token for subsequent requests
   * @param {string} token - JWT token
   */
  setAuthToken: (token) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Login user and get authentication token
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Response with token
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Set auth token automatically if included in response
      if (response.data?.token) {
        api.setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get list of surveys for authenticated user
   * @returns {Promise<Object>} Response with surveys array
   */
  getSurveys: async () => {
    try {
      return await apiClient.get('/surveys');
    } catch (error) {
      console.error('Get surveys error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get details of a specific survey
   * @param {string} surveyId - ID of the survey to fetch
   * @returns {Promise<Object>} Response with survey data
   */
  getSurveyDetails: async (surveyId) => {
    try {
      return await apiClient.get(`/surveys/${surveyId}`);
    } catch (error) {
      console.error(`Get survey ${surveyId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Submit a survey to the server
   * @param {Object} survey - Survey data to submit
   * @returns {Promise<Object>} Response with server confirmation
   */
  submitSurvey: async (survey) => {
    try {
      // If survey has an ID and a lastSyncedAt, it's an update
      if (survey.id && survey.lastSyncedAt) {
        return await apiClient.put(`/surveys/${survey.id}`, survey);
      } else {
        return await apiClient.post('/surveys', survey);
      }
    } catch (error) {
      console.error('Submit survey error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Delete a survey from the server
   * @param {string} surveyId - ID of the survey to delete
   * @returns {Promise<Object>} Response with deletion confirmation
   */
  deleteSurvey: async (surveyId) => {
    try {
      return await apiClient.delete(`/surveys/${surveyId}`);
    } catch (error) {
      console.error(`Delete survey ${surveyId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Upload file (photo) to the server
   * @param {string} surveyId - ID of the survey the file belongs to
   * @param {Object} fileData - File data to upload
   * @returns {Promise<Object>} Response with file URL
   */
  uploadFile: async (surveyId, fileData) => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('surveyId', surveyId);
      
      // Use different headers for file upload
      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response;
    } catch (error) {
      console.error('File upload error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get risk templates from the server with offline support
   * @returns {Promise<Object>} Response with risk templates array
   */
  getRiskTemplates: async () => {
    // Check if we're online first
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching templates: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await offlineStorage.getRiskTemplates();
      console.log(`Retrieved cached templates: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached templates:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached templates (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        // No cached data available while offline
        console.error('Offline and no cached templates available');
        return {
          success: false,
          message: 'You are offline and no cached data is available.',
          status: 0
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`Fetching risk templates from ${API_CONFIG.BASE_URL}/risk-templates`);
      const response = await apiClient.get('/risk-templates');
      
      if (response.success && response.data) {
        console.log(`Got ${response.data.length || 0} templates from server`);
        
        // Cache the templates for offline use
        try {
          await offlineStorage.storeRiskTemplates(response.data);
          console.log('Templates cached successfully');
        } catch (storageError) {
          console.error('Error caching templates:', storageError);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching templates from server:', error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached templates (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache, return the error
      return error.success === false ? error : { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get sections for a specific risk template with offline support
   * @param {string} templateId - ID of the risk template
   * @returns {Promise<Object>} Response with template sections
   */
  getRiskTemplateSections: async (templateId) => {
    // Check if we're online first
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching sections: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await offlineStorage.getTemplateSections(templateId);
      console.log(`Retrieved cached sections for template ${templateId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached sections:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached sections (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        // No cached data available while offline
        console.error('Offline and no cached sections available');
        return {
          success: false,
          message: 'You are offline and no cached sections data is available.',
          status: 0
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`Fetching sections for template: ${templateId}`);
      
      // Fix: Try multiple endpoint formats to handle different API structures
      let response;
      let endpoints = [
        `/risk-template-sections/template/${templateId}`,
        `/risk-templates/${templateId}/sections`,
        `/risk-template/${templateId}/sections`
      ];
      
      // Log the endpoints we're trying
      console.log(`Attempting to fetch sections with the following endpoints: ${JSON.stringify(endpoints)}`);
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await apiClient.get(endpoint);
          if (response.success) {
            console.log(`Successful response from endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed with: ${endpointError.message || 'Unknown error'}`);
          // Continue to the next endpoint
        }
      }
      
      // If no endpoint worked, throw an error
      if (!response) {
        throw new Error('All section endpoints failed');
      }
      
      if (response.success && response.data) {
        console.log(`Got ${response.data.length || 0} sections from server`);
        
        // Cache the sections for offline use
        try {
          await offlineStorage.storeTemplateSections(templateId, response.data);
          console.log('Sections cached successfully');
        } catch (storageError) {
          console.error('Error caching sections:', storageError);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching sections from server:`, error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached sections (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache, return the error
      return error.success === false ? error : { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get categories for a specific risk template section with offline support
   * @param {string} templateId - ID of the risk template
   * @param {string} sectionId - ID of the section
   * @returns {Promise<Object>} Response with template categories
   */
  getRiskTemplateCategories: async (templateId, sectionId) => {
    // Check if we're online first
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching categories: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await offlineStorage.getTemplateCategories(templateId, sectionId);
      console.log(`Retrieved cached categories for section ${sectionId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached categories:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached categories (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        // No cached data available while offline
        console.error('Offline and no cached categories available');
        return {
          success: false,
          message: 'You are offline and no cached categories data is available.',
          status: 0
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`Fetching categories for section: ${sectionId}`);
      
      // Fix: Try multiple endpoint formats to handle different API structures
      let response;
      let endpoints = [
        `/risk-template-categories/section/${sectionId}`,
        `/risk-templates/${templateId}/sections/${sectionId}/categories`,
        `/risk-template-sections/${sectionId}/categories`,
        `/risk-template/${templateId}/section/${sectionId}/categories`
      ];
      
      // Log the endpoints we're trying
      console.log(`Attempting to fetch categories with the following endpoints: ${JSON.stringify(endpoints)}`);
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await apiClient.get(endpoint);
          if (response.success) {
            console.log(`Successful response from endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed with: ${endpointError.message || 'Unknown error'}`);
          // Continue to the next endpoint
        }
      }
      
      // If no endpoint worked, throw an error
      if (!response) {
        throw new Error('All category endpoints failed');
      }
      
      if (response.success && response.data) {
        console.log(`Got ${response.data.length || 0} categories from server`);
        
        // Cache the categories for offline use
        try {
          await offlineStorage.storeTemplateCategories(templateId, sectionId, response.data);
          console.log('Categories cached successfully');
        } catch (storageError) {
          console.error('Error caching categories:', storageError);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching categories from server:`, error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached categories (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache, return the error
      return error.success === false ? error : { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get items for a specific risk template category with offline support
   * @param {string} categoryId - ID of the category
   * @returns {Promise<Object>} Response with category items
   */
  getRiskTemplateItems: async (categoryId) => {
    // Check if we're online first
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching items: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await offlineStorage.getTemplateItems(categoryId);
      console.log(`Retrieved cached items for category ${categoryId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached items:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached items (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        // No cached data available while offline
        console.error('Offline and no cached items available');
        return {
          success: false,
          message: 'You are offline and no cached items data is available.',
          status: 0
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`Fetching items for category: ${categoryId}`);
      
      // Fix: Try multiple endpoint formats to handle different API structures
      let response;
      let endpoints = [
        `/risk-template-items/category/${categoryId}`,
        `/risk-template-categories/${categoryId}/items`,
        `/categories/${categoryId}/items`,
        `/risk-items/category/${categoryId}`
      ];
      
      // Log the endpoints we're trying
      console.log(`Attempting to fetch items with the following endpoints: ${JSON.stringify(endpoints)}`);
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await apiClient.get(endpoint);
          if (response.success) {
            console.log(`Successful response from endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed with: ${endpointError.message || 'Unknown error'}`);
          // Continue to the next endpoint
        }
      }
      
      // If no endpoint worked, throw an error
      if (!response) {
        throw new Error('All item endpoints failed');
      }
      
      if (response.success && response.data) {
        console.log(`Got ${response.data.length || 0} items from server`);
        
        // Cache the items for offline use
        try {
          await offlineStorage.storeTemplateItems(categoryId, response.data);
          console.log('Items cached successfully');
        } catch (storageError) {
          console.error('Error caching items:', storageError);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching items from server:`, error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached items (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache, return the error
      return error.success === false ? error : { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
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
  }
};

export default api; 