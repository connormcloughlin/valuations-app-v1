import axios from 'axios';
import { Platform } from 'react-native';

// API configuration
const API_CONFIG = {
  // Updated URLs for the new backend server
  BASE_URL: Platform.OS === 'ios' 
    ? 'http://localhost:5000/api' 
    : 'http://10.0.2.2:5000/api', // Use 10.0.2.2 for Android emulator to access host's localhost
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Create axios instance with config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

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
   * Get risk templates associated with an order
   * @param {string} orderId - ID of the order
   * @returns {Promise<Object>} Response with risk templates data
   */
  getRiskTemplatesForOrder: async (orderId) => {
    try {
      return await apiClient.get(`/orders/${orderId}/risk-templates`);
    } catch (error) {
      console.error(`Get risk templates for order ${orderId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get sections for a specific risk template
   * @param {string} templateId - Risk template ID
   * @returns {Promise<Object>} Response with template sections
   */
  getTemplateSections: async (templateId) => {
    try {
      return await apiClient.get(`/risk-templates/${templateId}/sections`);
    } catch (error) {
      console.error(`Get sections for template ${templateId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get categories for a specific template section
   * @param {string} templateId - Risk template ID
   * @param {string} sectionId - Section ID
   * @returns {Promise<Object>} Response with categories data
   */
  getTemplateCategories: async (templateId, sectionId) => {
    try {
      return await apiClient.get(`/risk-templates/${templateId}/sections/${sectionId}/categories`);
    } catch (error) {
      console.error(`Get categories for template ${templateId}, section ${sectionId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get items for a specific category
   * @param {string} templateId - Risk template ID
   * @param {string} sectionId - Section ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Response with items data
   */
  getTemplateItems: async (templateId, sectionId, categoryId) => {
    try {
      return await apiClient.get(`/risk-templates/${templateId}/sections/${sectionId}/categories/${categoryId}/items`);
    } catch (error) {
      console.error(`Get items for template ${templateId}, section ${sectionId}, category ${categoryId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Submit survey items to the server
   * @param {Object} surveyData - Survey data with items
   * @returns {Promise<Object>} Response with confirmation
   */
  submitSurveyItems: async (surveyData) => {
    try {
      return await apiClient.post('/surveys/items', surveyData);
    } catch (error) {
      console.error('Submit survey items error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  }
};

export default api; 