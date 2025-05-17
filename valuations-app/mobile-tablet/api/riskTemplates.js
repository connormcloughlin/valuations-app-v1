import apiClient from './client';
import offlineStorage from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';

/**
 * Risk template related API methods
 */
const riskTemplatesApi = {
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
      console.log(`Fetching risk templates from ${apiClient.defaults.baseURL}/risk-templates`);
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
  }
};

export default riskTemplatesApi; 