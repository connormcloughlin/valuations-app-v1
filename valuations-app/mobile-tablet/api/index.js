import axios from 'axios';
import { Platform } from 'react-native';

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
   * Get risk templates from the server
   * @returns {Promise<Object>} Response with risk templates array
   */
  getRiskTemplates: async () => {
    try {
      console.log(`Fetching risk templates from ${API_CONFIG.BASE_URL}/risk-templates`);
      const response = await apiClient.get('/risk-templates');
      console.log(`Got ${response.data?.length || 0} risk templates`);
      return response;
    } catch (error) {
      console.error('Get risk templates error:', error);
      console.error('Error message:', error.message);
      console.error('API URL was:', `${API_CONFIG.BASE_URL}/risk-templates`);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get sections for a specific risk template
   * @param {string} templateId - ID of the risk template
   * @returns {Promise<Object>} Response with template sections
   */
  getRiskTemplateSections: async (templateId) => {
    try {
      console.log(`Fetching sections for template: ${templateId}`);
      // Using the correct endpoint path for sections
      const response = await apiClient.get(`/risk-template-sections/template/${templateId}`);
      if (response.data && response.data.length > 0) {
        console.log('Example section object:', JSON.stringify(response.data[0]));
      }
      return response;
    } catch (error) {
      console.error(`Get template sections error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get categories for a specific risk template section
   * @param {string} templateId - ID of the risk template
   * @param {string} sectionId - ID of the section
   * @returns {Promise<Object>} Response with template categories
   */
  getRiskTemplateCategories: async (templateId, sectionId) => {
    try {
      console.log(`Fetching categories for section: ${sectionId}`);
      console.log(`Section ID property type: ${typeof sectionId}`);
      // Using the correct endpoint path for categories
      return await apiClient.get(`/risk-template-categories/section/${sectionId}`);
    } catch (error) {
      console.error(`Get template categories error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get items for a specific risk template category
   * @param {string} categoryId - ID of the category
   * @returns {Promise<Object>} Response with category items
   */
  getRiskTemplateItems: async (categoryId) => {
    try {
      console.log(`Fetching items for category: ${categoryId}`);
      // Using the correct endpoint path for items
      return await apiClient.get(`/risk-template-items/category/${categoryId}`);
    } catch (error) {
      console.error(`Get category items error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  }
};

export default api; 