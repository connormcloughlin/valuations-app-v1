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
   * Get all appointments for the authenticated user
   * @returns {Promise<Object>} Response with appointments array
   */
  getAppointments: async () => {
    try {
      // Check if we're online first
      const isOnline = connectionUtils.isConnected();
      console.log(`Connection status before fetching appointments: ${isOnline ? 'Online' : 'Offline'}`);
      
      // If offline, get from storage
      if (!isOnline) {
        const cachedData = await offlineStorage.getDataForKey('appointments');
        if (cachedData) {
          console.log(`Using ${cachedData.length} cached appointments (offline)`);
          return {
            success: true,
            data: cachedData,
            fromCache: true
          };
        } else {
          return {
            success: false,
            message: 'You are offline and no cached appointment data is available.'
          };
        }
      }
      
      // Online - fetch from server
      console.log('Fetching appointments from server');
      const response = await apiClient.get('/appointments');
      
      // Ensure data is an array and handle nested data structure
      let appointmentsData = [];
      
      if (response.data && typeof response.data === 'object') {
        // Handle the case where data is inside a 'data' property (common API pattern)
        if (Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
          console.log('Found appointments in response.data.data array');
        } else if (Array.isArray(response.data)) {
          appointmentsData = response.data;
          console.log('Found appointments in response.data array');
        } else {
          console.log('Response data is not an array:', response.data);
          // Extract potential appointments from object keys
          appointmentsData = Object.values(response.data).filter(item => 
            item && typeof item === 'object' && (item.id || item.appointmentId)
          );
        }
      }
      
      // Process and deduplicate appointments
      const processedAppointments = [];
      const seenIds = new Set();
      
      appointmentsData.forEach((appointment, index) => {
        // Force string IDs for consistent comparison
        let id = appointment.id?.toString() || appointment.appointmentId?.toString() || String(index + 1);
        
        // If id is null, undefined, empty string, or already seen, assign a new unique id
        if (!id || seenIds.has(id)) {
          id = `appointment-${index + 1}`;
        }
        
        seenIds.add(id);
        
        // Create an appointment with the unique ID
        processedAppointments.push({
          ...appointment,
          id: id,
          // Ensure consistent data structure
          appointmentId: id,
          // If there are undefined required fields, provide defaults
          address: appointment.address || 'No address provided',
          client: appointment.client || appointment.clientName || 'Unknown client',
          date: appointment.date || appointment.appointmentDate || new Date().toISOString().split('T')[0],
        });
      });
      
      console.log(`Processed ${processedAppointments.length} appointments with unique IDs`);
      
      // Cache the result for offline use
      if (response.success) {
        await offlineStorage.storeDataForKey('appointments', processedAppointments);
        console.log(`Cached ${processedAppointments.length} appointments`);
      }
      
      return {
        ...response,
        data: processedAppointments
      };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return error.success === false ? error : { success: false, message: error.message, data: [] };
    }
  },
  
  /**
   * Get appointment details by ID
   * @param {string} appointmentId - ID of the appointment to fetch
   * @returns {Promise<Object>} Response with appointment data
   */
  getAppointmentById: async (appointmentId) => {
    try {
      // Check if we're online
      const isOnline = connectionUtils.isConnected();
      
      // Convert ID to string for consistent comparison
      const idString = appointmentId.toString();
      
      // If requested ID is '0', convert to '1' for API compatibility
      const adjustedId = idString === '0' ? '1' : idString;
      
      // If offline, try to get from storage
      if (!isOnline) {
        const cachedData = await offlineStorage.getDataForKey('appointments');
        if (cachedData && Array.isArray(cachedData)) {
          // Look for the appointment with the adjusted ID
          const appointment = cachedData.find(a => 
            a.id?.toString() === adjustedId || 
            a.appointmentId?.toString() === adjustedId
          );
          
          if (appointment) {
            return {
              success: true,
              data: appointment,
              fromCache: true
            };
          }
        }
        return {
          success: false,
          message: 'You are offline and the requested appointment is not cached.'
        };
      }
      
      // Online - fetch from server
      console.log(`Fetching appointment with ID: ${adjustedId}`);
      try {
        const response = await apiClient.get(`/appointments/${adjustedId}`);
        
        // Handle potential nested data structure
        let appointmentData = response.data;
        if (response.data && response.data.data && typeof response.data.data === 'object') {
          appointmentData = response.data.data;
        }
        
        // Ensure consistent ID format
        if (appointmentData && typeof appointmentData === 'object') {
          if (appointmentData.id !== undefined && appointmentData.id.toString() === '0') {
            appointmentData.id = '1';
          }
          if (appointmentData.appointmentId !== undefined && appointmentData.appointmentId.toString() === '0') {
            appointmentData.appointmentId = '1';
          }
        }
        
        return {
          ...response,
          data: appointmentData
        };
      } catch (endpointError) {
        console.error(`Error with specific endpoint: ${endpointError.message}`);
        
        // Fallback: try to get the appointment from the full list
        console.log('Trying to get appointment from full list');
        const allAppointmentsResponse = await api.getAppointments();
        
        if (allAppointmentsResponse.success && Array.isArray(allAppointmentsResponse.data)) {
          const appointment = allAppointmentsResponse.data.find(a => 
            a.id?.toString() === adjustedId || 
            a.appointmentId?.toString() === adjustedId
          );
          
          if (appointment) {
            return {
              success: true,
              data: appointment,
              message: 'Retrieved from appointments list'
            };
          }
        }
        
        // No appointment found
        return {
          success: false,
          message: `Appointment with ID ${adjustedId} not found.`
        };
      }
    } catch (error) {
      console.error(`Error fetching appointment ${appointmentId}:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },
  
  /**
   * Get appointments by status (scheduled, in-progress, completed)
   * @param {string} status - Status of appointments to fetch
   * @returns {Promise<Object>} Response with filtered appointments
   */
  getAppointmentsByStatus: async (status) => {
    try {
      // First get all appointments
      const response = await api.getAppointments();
      
      if (!response.success) {
        return { ...response, data: [] };
      }
      
      // Ensure we have an array to work with
      const appointmentsArray = Array.isArray(response.data) ? response.data : [];
      
      if (appointmentsArray.length === 0) {
        console.log(`No appointments found to filter by ${status} status`);
        return {
          success: true,
          data: [],
          message: 'No appointments available'
        };
      }
      
      console.log(`Filtering ${appointmentsArray.length} appointments by status: ${status}`);
      
      // Helper function to determine appointment status
      const getAppointmentStatus = (appointment) => {
        // If status is explicitly defined, use it
        if (appointment.status) {
          return appointment.status.toLowerCase();
        }
        
        // Otherwise infer from other properties
        if (appointment.submitted) {
          return 'completed';
        }
        
        if (appointment.lastEdited || appointment.lastModified) {
          return 'in-progress';
        }
        
        // Default to scheduled
        return 'scheduled';
      };
      
      // Filter by status with enhanced logic
      const filteredData = appointmentsArray.filter(appointment => {
        if (!appointment) return false;
        
        const appointmentStatus = getAppointmentStatus(appointment);
        
        switch(status) {
          case 'scheduled':
            return appointmentStatus === 'scheduled' || appointmentStatus === 'pending';
          
          case 'in-progress':
            return appointmentStatus === 'in-progress' || appointmentStatus === 'in_progress';
          
          case 'completed':
            return appointmentStatus === 'completed';
            
          default:
            return true;
        }
      });
      
      // Ensure no duplicate IDs in the filtered data
      const deduplicatedData = [];
      const seenIds = new Set();
      
      filteredData.forEach((appointment, index) => {
        const id = appointment.id?.toString() || `${status}-appointment-${index + 1}`;
        
        if (!seenIds.has(id)) {
          seenIds.add(id);
          deduplicatedData.push(appointment);
        } else {
          // Create a copy with a unique ID for duplicate entries
          deduplicatedData.push({
            ...appointment,
            id: `${id}-duplicate-${index}`,
            appointmentId: `${appointment.appointmentId || id}-duplicate-${index}`
          });
        }
      });
      
      console.log(`Filtered to ${deduplicatedData.length} ${status} appointments (after deduplication)`);
      
      return {
        ...response,
        data: deduplicatedData
      };
    } catch (error) {
      console.error(`Error fetching ${status} appointments:`, error);
      return error.success === false ? error : { 
        success: false, 
        message: error.message || `Failed to get ${status} appointments`,
        data: []
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