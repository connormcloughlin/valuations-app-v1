import axios from 'axios';

// Define API_BASE_URL locally - do NOT import it from api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('====== RISK TEMPLATE API MODULE LOADED ======');
console.log('API_BASE_URL:', API_BASE_URL);

// Helper for better error logging
const logErrorDetails = (error, context) => {
  console.error(`====== API ERROR: ${context} ======`);
  console.error('Error message:', error.message);
  console.error('Error name:', error.name);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Status:', error.response.status);
    console.error('Response headers:', error.response.headers);
    console.error('Response data:', error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received from server');
    console.error('Request details:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error setting up request:', error.message);
  }
  
  console.error('Error config:', error.config);
  console.error('Stack trace:', error.stack);
  
  return error;
};

// Immediately test the API connection
(async () => {
  try {
    console.log('====== TESTING API CONNECTION ======');
    const response = await axios.get(`${API_BASE_URL}/risk-templates`);
    console.log('====== API CONNECTION TEST RESULT ======');
    console.log('Connection successful:', response.status);
    console.log('Data received:', typeof response.data);
    console.log('API data preview:', JSON.stringify(response.data).substring(0, 100) + '...');
  } catch (error) {
    logErrorDetails(error, 'API CONNECTION TEST');
  }
})();

// For caching responses
let cachedTemplates = null;
let cachedSections = {};
let cachedCategories = {};
let cachedItems = {};

// API client specifically for Risk Templates
const riskTemplateApi = {
  /**
   * Get all risk templates
   * @returns {Promise<Array>} List of risk templates
   */
  getAll: async () => {
    console.log('====== RISK TEMPLATE API - GET ALL CALLED ======');
    
    // Return cached templates if available
    if (cachedTemplates) {
      console.log('====== RETURNING CACHED TEMPLATES ======');
      console.log('Cached template count:', cachedTemplates.length);
      return cachedTemplates;
    }
    
    try {
      console.log('====== MAKING API REQUEST ======');
      console.log('Fetching risk templates from:', `${API_BASE_URL}/risk-templates`);
      
      // Make the API request
      const response = await axios.get(`${API_BASE_URL}/risk-templates`);
      
      console.log('====== API RESPONSE RECEIVED ======');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data type:', typeof response.data);
      console.log('Is data array?', Array.isArray(response.data));
      console.log('Response data preview:', JSON.stringify(response.data).substring(0, 200) + '...');
      
      // Properly extract data from the response
      let templates = [];
      
      if (response.data) {
        console.log('API response.data type:', typeof response.data);
        
        if (Array.isArray(response.data)) {
          // If the response.data is already an array
          templates = response.data;
          console.log('Data is an array of length:', templates.length);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If the response has a nested data property (common API structure)
          templates = response.data.data;
          console.log('Data is nested under data property, length:', templates.length);
        } else if (typeof response.data === 'object') {
          // If response.data is an object, extract its values if they look like templates
          const values = Object.values(response.data);
          if (values.length > 0 && typeof values[0] === 'object') {
            templates = values;
            console.log('Data extracted from object values, length:', templates.length);
          }
        }
      }
      
      console.log('====== EXTRACTED TEMPLATES ======');
      console.log('Template count:', templates.length);
      if (templates.length > 0) {
        console.log('First template:', templates[0]);
        console.log('First template properties:', Object.keys(templates[0]).join(', '));
      }
      
      // Cache the templates
      if (templates && templates.length > 0) {
        cachedTemplates = templates;
        console.log('Templates cached for future use');
      }
      
      return templates;
    } catch (error) {
      // Use the helper function for detailed error logging
      logErrorDetails(error, 'GET ALL TEMPLATES');
      throw error;
    }
  },

  /**
   * Get a specific risk template by ID
   * @param {string|number} id - Risk template ID
   * @returns {Promise<Object>} Risk template data
   */
  getById: async (id) => {
    // Check if the template is in the cache
    if (cachedTemplates) {
      const cachedTemplate = cachedTemplates.find(t => t.id === id);
      if (cachedTemplate) {
        console.log(`Using cached template for ID: ${id}`);
        return cachedTemplate;
      }
    }
    
    try {
      console.log(`Fetching risk template with ID: ${id}`);
      const response = await axios.get(`${API_BASE_URL}/risk-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching risk template ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get sections for a specific risk template
   * @param {string|number} templateId - Risk template ID
   * @returns {Promise<Array>} List of template sections
   */
  getSections: async (templateId) => {
    // Check if the sections are in the cache
    if (cachedSections[templateId]) {
      console.log(`Using cached sections for template ID: ${templateId}`);
      return cachedSections[templateId];
    }
    
    try {
      console.log(`Fetching sections for template ID: ${templateId}`);
      const response = await axios.get(`${API_BASE_URL}/risk-templates/${templateId}/sections`);
      
      // Cache the sections
      if (response.data && Array.isArray(response.data)) {
        cachedSections[templateId] = response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching sections for template ${templateId}:`, error);
      throw error;
    }
  },

  /**
   * Get categories for a specific template section
   * @param {string|number} templateId - Risk template ID
   * @param {string|number} sectionId - Section ID
   * @returns {Promise<Array>} List of categories
   */
  getCategories: async (templateId, sectionId) => {
    // Create a cache key for this combination
    const cacheKey = `${templateId}-${sectionId}`;
    
    // Check if the categories are in the cache
    if (cachedCategories[cacheKey]) {
      console.log(`Using cached categories for template ID: ${templateId}, section ID: ${sectionId}`);
      return cachedCategories[cacheKey];
    }
    
    try {
      console.log(`Fetching categories for template ID: ${templateId}, section ID: ${sectionId}`);
      const response = await axios.get(`${API_BASE_URL}/risk-templates/${templateId}/sections/${sectionId}/categories`);
      
      // Cache the categories
      if (response.data && Array.isArray(response.data)) {
        cachedCategories[cacheKey] = response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching categories for template ${templateId}, section ${sectionId}:`, error);
      throw error;
    }
  },

  /**
   * Get items for a specific category
   * @param {string|number} templateId - Risk template ID
   * @param {string|number} sectionId - Section ID
   * @param {string|number} categoryId - Category ID
   * @returns {Promise<Array>} List of items
   */
  getItems: async (templateId, sectionId, categoryId) => {
    // Create a cache key for this combination
    const cacheKey = `${templateId}-${sectionId}-${categoryId}`;
    
    // Check if the items are in the cache
    if (cachedItems[cacheKey]) {
      console.log(`Using cached items for template ID: ${templateId}, section ID: ${sectionId}, category ID: ${categoryId}`);
      return cachedItems[cacheKey];
    }
    
    try {
      console.log(`Fetching items for template ID: ${templateId}, section ID: ${sectionId}, category ID: ${categoryId}`);
      const response = await axios.get(
        `${API_BASE_URL}/risk-templates/${templateId}/sections/${sectionId}/categories/${categoryId}/items`
      );
      
      // Cache the items
      if (response.data && Array.isArray(response.data)) {
        cachedItems[cacheKey] = response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching items for template ${templateId}, section ${sectionId}, category ${categoryId}:`,
        error
      );
      throw error;
    }
  }
};

console.log('====== RISK TEMPLATE API OBJECT CREATED ======');
console.log('Available methods:', Object.keys(riskTemplateApi).join(', '));

export default riskTemplateApi; 