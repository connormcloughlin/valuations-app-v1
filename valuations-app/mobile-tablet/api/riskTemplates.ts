import transportClient from '../core/transport/transportClient';
import offlineStorage from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';

/**
 * Risk template related API methods using unified transport
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
      console.log(`Fetching risk templates from server`);
      const response = await transportClient.get('risk-templates.list', '/risk-templates');
      
      if (response) {
        console.log(`Got ${Array.isArray(response) ? response.length : 'unknown count'} templates from server`);
        
        // Cache the templates for offline use
        try {
          await offlineStorage.storeRiskTemplates(response);
          console.log('Templates cached successfully');
        } catch (storageError) {
          console.error('Error caching templates:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
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
      return { 
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
  getRiskTemplateSections: async (templateId: string) => {
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
      
      // Try the endpoint with transport client
      const response = await transportClient.get('risk-templates.sections', `/risk-assessment-sections/assessment/${templateId}`);
      
      if (response) {
        console.log(`Got ${Array.isArray(response) ? response.length : 'unknown count'} sections from server`);
        
        // Cache the sections for offline use
        try {
          await offlineStorage.storeTemplateSections(templateId, response);
          console.log('Sections cached successfully');
        } catch (storageError) {
          console.error('Error caching sections:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
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
      return { 
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
  getRiskTemplateCategories: async (templateId: string, sectionId: string) => {
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
      
      const response = await transportClient.get('risk-templates.categories', `/risk-assessment-categories/section/${sectionId}`);
      
      if (response) {
        console.log(`Got ${Array.isArray(response) ? response.length : 'unknown count'} categories from server`);
        
        // Cache the categories for offline use
        try {
          await offlineStorage.storeTemplateCategories(templateId, sectionId, response);
          console.log('Categories cached successfully');
        } catch (storageError) {
          console.error('Error caching categories:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
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
      return { 
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
  getRiskTemplateItems: async (categoryId: string) => {
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
      
      const response = await transportClient.get('risk-templates.items', `/risk-assessment-items/category/${categoryId}`);
      
      if (response) {
        console.log(`Got ${Array.isArray(response) ? response.length : 'unknown count'} items from server`);
        
        // Cache the items for offline use
        try {
          await offlineStorage.storeTemplateItems(categoryId, response);
          console.log('Items cached successfully');
        } catch (storageError) {
          console.error('Error caching items:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
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
      return { 
        success: false, 
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get sections for a specific risk assessment with offline support
   * @param {string} riskAssessmentId - ID of the risk assessment
   * @returns {Promise<Object>} Response with assessment sections
   */
  getRiskAssessmentSections: async (riskAssessmentId: string) => {
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching assessment sections: ${isOnline ? 'Online' : 'Offline'}`);

    let cachedData = null;
    try {
      cachedData = await offlineStorage.getAssessmentSections(riskAssessmentId);
      console.log(`Retrieved cached sections for assessment ${riskAssessmentId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached assessment sections:', cacheError);
    }

    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached assessment sections (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        console.error('Offline and no cached assessment sections available');
        return {
          success: false,
          message: 'You are offline and no cached assessment sections data is available.',
          status: 0
        };
      }
    }

    try {
      console.log(`Fetching sections for assessment: ${riskAssessmentId}`);
      const response = await transportClient.get('risk-assessments.sections', `/risk-assessment-sections/assessment/${riskAssessmentId}`);
      
      if (response) {
        console.log(`✅ Got ${Array.isArray(response) ? response.length : 'N/A'} assessment sections`);
        
        try {
          await offlineStorage.storeAssessmentSections(riskAssessmentId, response);
          console.log('Assessment sections cached successfully');
        } catch (storageError) {
          console.error('Error caching assessment sections:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error(`Error fetching assessment sections from server:`, error);
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached assessment sections (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      return {
        success: false,
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get categories for a specific risk assessment section with offline support
   * @param {string} riskAssessmentSectionId - ID of the risk assessment section
   * @returns {Promise<Object>} Response with assessment categories
   */
  getRiskAssessmentCategories: async (riskAssessmentSectionId: string) => {
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching assessment categories: ${isOnline ? 'Online' : 'Offline'}`);

    let cachedData = null;
    try {
      cachedData = await offlineStorage.getAssessmentCategories(riskAssessmentSectionId);
      console.log(`Retrieved cached categories for assessment ${riskAssessmentSectionId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached assessment categories:', cacheError);
    }

    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached assessment categories (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        console.error('Offline and no cached assessment categories available');
        return {
          success: false,
          message: 'You are offline and no cached assessment categories data is available.',
          status: 0
        };
      }
    }

    try {
      console.log(`Fetching categories for assessment: ${riskAssessmentSectionId}`);
      const response = await transportClient.get('risk-assessments.categories', `/risk-assessment-categories/section/${riskAssessmentSectionId}`);
      
      if (response) {
        console.log(`✅ Got ${Array.isArray(response) ? response.length : 'N/A'} assessment categories`);
        
        try {
          await offlineStorage.storeAssessmentCategories(riskAssessmentSectionId, response);
          console.log('Assessment categories cached successfully');
        } catch (storageError) {
          console.error('Error caching assessment categories:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error(`Error fetching assessment categories from server:`, error);
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached assessment categories (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      return {
        success: false,
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  },

  /**
   * Get items for a specific risk assessment category with offline support
   * @param {string} riskAssessmentCategoryId - ID of the risk assessment category
   * @returns {Promise<Object>} Response with assessment items
   */
  getRiskAssessmentItems: async (riskAssessmentCategoryId: string) => {
    const isOnline = connectionUtils.isConnected();
    console.log(`Connection status before fetching assessment items: ${isOnline ? 'Online' : 'Offline'}`);
    console.log(`riskAssessmentCategoryId: ${riskAssessmentCategoryId}`);

    let cachedData = null;
    try {
      cachedData = await offlineStorage.getAssessmentItems(riskAssessmentCategoryId);
      console.log(`Retrieved cached items for assessment ${riskAssessmentCategoryId}: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached assessment items:', cacheError);
    }

    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached assessment items (offline)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200
        };
      } else {
        console.error('Offline and no cached assessment items available');
        return {
          success: false,
          message: 'You are offline and no cached assessment items data is available.',
          status: 0
        };
      }
    }

    try {
      console.log(`Fetching items for assessment: ${riskAssessmentCategoryId}`);
      const response = await transportClient.get('risk-assessments.items', `/risk-assessment-items/category/${riskAssessmentCategoryId}`);
      
      if (response) {
        console.log(`✅ Got ${Array.isArray(response) ? response.length : 'N/A'} assessment items`);
        
        try {
          await offlineStorage.storeAssessmentItems(riskAssessmentCategoryId, response);
          console.log('Assessment items cached successfully');
        } catch (storageError) {
          console.error('Error caching assessment items:', storageError);
        }
      }
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      // Handle 404s gracefully for "no items found" scenarios
      if (error.status === 404) {
        const errorMessage = error.message || '';
        const isNoContentScenario = errorMessage.toLowerCase().includes('no items found') || 
                                    errorMessage.toLowerCase().includes('no data found') ||
                                    errorMessage.toLowerCase().includes('not found for this category');
        
        if (isNoContentScenario) {
          console.log(`📦 No items found for category ${riskAssessmentCategoryId} - this is normal`);
          return {
            success: true,
            data: [],
            status: 204,
            message: errorMessage
          };
        }
      }
      
      console.error(`Error fetching assessment items from server:`, error);
      if (cachedData && cachedData.data) {
        console.log(`Using ${cachedData.data.length} cached assessment items (server error)`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      return {
        success: false,
        message: error.message || 'Network error',
        status: error.status || 0
      };
    }
  }
};

export default riskTemplatesApi;
