import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';
import appointmentsApi from './appointments';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include user context and JWT token (JWT-only mode)
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Get JWT token and auth headers from sessionService
      const sessionService = (await import('../core/auth/sessionService')).default;
      const authHeaders = await sessionService.getAuthHeaders();
      
      // Add Authorization header with JWT token (required for authentication)
      if (authHeaders && authHeaders.Authorization) {
        config.headers['Authorization'] = authHeaders.Authorization;
        if (__DEV__) {
          console.log('🔐 JWT token added to Authorization header');
        }
      } else {
        console.warn('⚠️ No JWT token available for API request - authentication may fail');
      }
      
      // Merge any additional headers from sessionService (like X-User-Context)
      if (authHeaders) {
        Object.assign(config.headers, authHeaders);
      }
      
      // Get user context from constants (JWT-only mode) for additional headers
      const { USER_CONTEXT_HEADER_NAME } = await import('../constants/apiConfig');
      const userContext = await AsyncStorage.getItem('userContext');
      
      if (userContext) {
        // Ensure user context includes email for surveyor filtering
        try {
          const parsedContext = JSON.parse(userContext);
          if (parsedContext.email) {
            // Send the JSON context header
            config.headers[USER_CONTEXT_HEADER_NAME] = userContext;
            
            // Send individual user context headers for backend compatibility
            config.headers['x-user-id'] = parsedContext.id || parsedContext.azureId;
            config.headers['x-user-email'] = parsedContext.email;
            config.headers['x-user-name'] = parsedContext.name;
            config.headers['x-user-type'] = parsedContext.role || parsedContext.userType || 'Surveyor'; // Use role from context or default
            config.headers['x-user-roles'] = parsedContext.roles || parsedContext.userRoles || 'Surveyor'; // Use roles from context or default
            config.headers['x-user-groups'] = ''; // Empty for now
            config.headers['x-user-entity-mappings'] = ''; // Empty for now
            
            // Send mobile-specific headers
            config.headers['x-mobile-user-id'] = parsedContext.id || parsedContext.azureId;
            config.headers['x-mobile-user-email'] = parsedContext.email;
            config.headers['x-mobile-user-name'] = parsedContext.name;
            config.headers['x-mobile-user-type'] = parsedContext.role || parsedContext.userType || 'Surveyor'; // Use role from context or default
            config.headers['x-mobile-user-roles'] = parsedContext.roles || parsedContext.userRoles || 'Surveyor'; // Use roles from context or default
            config.headers['x-mobile-user-groups'] = ''; // Empty for now
            config.headers['x-mobile-entity-mappings'] = ''; // Empty for now
            
            // Determine user role for logging
            const email = parsedContext.email.toLowerCase();
            let userRole = 'Surveyor'; // Default role
            
            if (email.includes('admin') || email.includes('administrator')) {
              userRole = 'Admin';
              config.headers['x-user-type'] = 'Admin';
              config.headers['x-user-roles'] = 'Admin';
              config.headers['x-mobile-user-type'] = 'Admin';
              config.headers['x-mobile-user-roles'] = 'Admin';
            } else if (email.includes('manager') || email.includes('supervisor')) {
              userRole = 'Manager';
              config.headers['x-user-type'] = 'Manager';
              config.headers['x-user-roles'] = 'Manager';
              config.headers['x-mobile-user-type'] = 'Manager';
              config.headers['x-mobile-user-roles'] = 'Manager';
            } else if (email.includes('office') || email.includes('backoffice')) {
              userRole = 'Office Staff';
              config.headers['x-user-type'] = 'Office Staff';
              config.headers['x-user-roles'] = 'Office Staff';
              config.headers['x-mobile-user-type'] = 'Office Staff';
              config.headers['x-mobile-user-roles'] = 'Office Staff';
            }
            
            console.log('🔐 User context sent with API request:', { 
              email: parsedContext.email,
              id: parsedContext.id,
              name: parsedContext.name,
              role: userRole,
              endpoint: config.url,
              headersSent: {
                'x-user-email': config.headers['x-user-email'],
                'x-user-name': config.headers['x-user-name'],
                'x-user-type': config.headers['x-user-type'],
                'x-user-roles': config.headers['x-user-roles'],
                'x-mobile-user-email': config.headers['x-mobile-user-email'],
                'x-mobile-user-name': config.headers['x-mobile-user-name'],
                'x-mobile-user-type': config.headers['x-mobile-user-type'],
                'x-mobile-user-roles': config.headers['x-mobile-user-roles']
              }
            });
          } else {
            console.warn('⚠️ User context missing email field:', parsedContext);
            // Still send the context but log the issue
            config.headers[USER_CONTEXT_HEADER_NAME] = userContext;
          }
        } catch (parseError) {
          console.error('❌ Error parsing user context:', parseError);
          // Still send the raw context in case backend can handle it
          config.headers[USER_CONTEXT_HEADER_NAME] = userContext;
        }
      } else {
        console.warn('⚠️ No user context available for API request - this may affect surveyor filtering');
        // Don't send empty context header
      }
    } catch (error) {
      console.error('Error setting API key headers for API request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Storage keys
const STORAGE_KEYS = {
  RISK_TEMPLATES: 'risk_templates',
  TEMPLATE_SECTIONS: 'template_sections_',
  TEMPLATE_CATEGORIES: 'template_categories_',
  TEMPLATE_ITEMS: 'template_items_',
  ASSESSMENT_SECTIONS: 'assessment_sections_',
  ASSESSMENT_CATEGORIES: 'assessment_categories_',
  ASSESSMENT_ITEMS: 'assessment_items_'
};

// API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  fromCache?: boolean;
}

// Helper function to store data in AsyncStorage with TTL support
const storeData = async (key: string, data: any, ttl?: number): Promise<void> => {
  try {
    const jsonValue = JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000, // Default 24 hours if no TTL provided
    });
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Stored data for key: ${key} (TTL: ${ttl ? (ttl / 1000 / 60 / 60).toFixed(1) + 'h' : '24h'})`);
  } catch (e) {
    console.error('Error storing data:', e);
  }
};

// Helper function to retrieve data from AsyncStorage
const getData = async (key: string): Promise<any | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error retrieving data:', e);
    return null;
  }
};

// Helper to handle API errors (legacy - now uses centralized error handling)
const handleApiError = (error: any): ApiResponse => {
  console.warn('⚠️ Using legacy error handler - consider migrating to transport client with centralized error handling');
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    return {
      success: false,
      status: error.response.status,
      message: `Server error: ${error.response.status}`,
    };
  } else if (error.request) {
    // Request was made but no response was received
    return {
      success: false,
      message: 'No response from server. Check your connection.',
    };
  } else {
    // Something happened in setting up the request
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
    };
  }
};

// Function to get risk templates with simplified offline support
const getRiskTemplates = async (): Promise<ApiResponse> => {
  try {
    // Try to get data from API
    const response = await axiosInstance.get('/risk-templates');
    
    if (response.data) {
      // Cache the response for offline use
      await storeData(STORAGE_KEYS.RISK_TEMPLATES, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    }
    
    throw new Error('Empty response from API');
  } catch (error) {
    // Try to get from cache if API call fails
    try {
      console.log('API error, checking cache for risk templates');
      const cachedData = await getData(STORAGE_KEYS.RISK_TEMPLATES);
      
      if (cachedData) {
        console.log('Using cached risk templates data');
        return {
          success: true,
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    return handleApiError(error);
  }
};

// Function to get risk assessment sections with simplified offline support
const getRiskAssessmentSections = async (riskAssessmentId: string): Promise<ApiResponse> => {
  try {
    // Try to get data from API
    console.log('Risk Assessment Sections Response Connor:', riskAssessmentId);
    //const response = await axiosInstance.get(`/risk-assessment-sections/assessment/${riskAssessmentId}`);
    const response = await axiosInstance.get(`/risk-assessment-master/sections/${riskAssessmentId}`);
    console.log('Risk Assessment Sections Response Connor:', response.data);

    if (response.data) {
      // Cache the response for offline use
      await storeData(`${STORAGE_KEYS.ASSESSMENT_SECTIONS}${riskAssessmentId}`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    }
    
    throw new Error('Empty response from API');
  } catch (error) {
    // Try to get from cache if API call fails
    try {
      console.log(`API error, checking cache for assessment sections (assessment ID: ${riskAssessmentId})`);
      const cachedData = await getData(`${STORAGE_KEYS.ASSESSMENT_SECTIONS}${riskAssessmentId}`);
      
      if (cachedData) {
        console.log('Using cached assessment sections data');
        return {
          success: true,
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    return handleApiError(error);
  }
};

// Function to get risk assessment categories with simplified offline support
const getRiskAssessmentCategories = async (sectionId: string): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.get(`/risk-assessment-categories/section/${sectionId}`);
    console.log('Categories API response for section', sectionId, ':', response.data);
    if (response.data) {
      await storeData(`${STORAGE_KEYS.ASSESSMENT_CATEGORIES}${sectionId}`, response.data);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    }
    throw new Error('Empty response from API');
  } catch (error) {
    try {
      console.log(`API error, checking cache for assessment categories (section ID: ${sectionId})`);
      const cachedData = await getData(`${STORAGE_KEYS.ASSESSMENT_CATEGORIES}${sectionId}`);
      console.log('Categories cache response for section', sectionId, ':', cachedData);
      if (cachedData) {
        console.log('Using cached assessment categories data');
        return {
          success: true,
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    return handleApiError(error);
  }
};

// Function to get risk assessment items with simplified offline support
const getRiskAssessmentItems = async (categoryId: string): Promise<ApiResponse> => {
  try {
    console.log(`🌐 Fetching items for category: ${categoryId}`);
    const response = await axiosInstance.get(`/risk-assessment-items/category/${categoryId}`);
    
    // Log essential response info
    if (__DEV__) {
      console.log(`📦 API Response - Status: ${response.status}, Items: ${Array.isArray(response.data) ? response.data.length : 'nested data'}`);
    }
    
    if (response.data) {
      await storeData(`${STORAGE_KEYS.ASSESSMENT_ITEMS}${categoryId}`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    }
    throw new Error('Empty response from API');
  } catch (error) {
    console.error(`❌ API Error for category ${categoryId}:`, error);
    try {
      console.log(`📦 Checking cache for category ${categoryId}`);
      const cachedData = await getData(`${STORAGE_KEYS.ASSESSMENT_ITEMS}${categoryId}`);
      if (cachedData) {
        console.log('📦 Using cached data');
        return {
          success: true,
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      } else {
        console.log('📦 No cached data found');
      }
    } catch (cacheError) {
      console.error('📦 Cache error:', cacheError);
    }
    return handleApiError(error);
  }
};

// Function to sync local changes back to the server
const syncChanges = async (syncData: {
  riskAssessmentItems?: any[];
  riskAssessmentMasters?: any[];
  appointments?: any[];
  syncTimestamp?: string;
}): Promise<ApiResponse> => {
  try {
    console.log('Syncing changes to server:', {
      riskAssessmentItems: syncData.riskAssessmentItems?.length || 0,
      riskAssessmentMasters: syncData.riskAssessmentMasters?.length || 0,
      appointments: syncData.appointments?.length || 0,
      syncTimestamp: syncData.syncTimestamp
    });

    const response = await axiosInstance.post('/sync/changes', syncData);
    
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    console.error('Error syncing changes to server:', error);
    return handleApiError(error);
  }
};

// Function to get risk template categories with simplified offline support
const getRiskTemplateCategories = async (templateId: string, sectionId: string): Promise<ApiResponse> => {
  try {
    // Try to get data from API
    const response = await axiosInstance.get(`/risk-assessment-categories/section/${sectionId}`);
    
    if (response.data) {
      // Cache the response for offline use
      await storeData(`${STORAGE_KEYS.TEMPLATE_CATEGORIES}${templateId}_${sectionId}`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    }
    
    throw new Error('Empty response from API');
  } catch (error) {
    // Try to get from cache if API call fails
    try {
      console.log(`API error, checking cache for template categories (template ID: ${templateId}, section ID: ${sectionId})`);
      const cachedData = await getData(`${STORAGE_KEYS.TEMPLATE_CATEGORIES}${templateId}_${sectionId}`);
      
      if (cachedData) {
        console.log('Using cached template categories data');
        return {
          success: true,
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    return handleApiError(error);
  }
};

// Function to get risk template items with simplified offline support
const getRiskTemplateItems = async (categoryId: string): Promise<ApiResponse> => {
  try {
    // Try to get data from API
    const response = await axiosInstance.get(`/risk-assessment-items/category/${categoryId}`);
    
    if (response.data) {
      // Cache the response for offline use
      await storeData(`${STORAGE_KEYS.TEMPLATE_ITEMS}${categoryId}`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    }
    
    throw new Error('Empty response from API');
  } catch (error) {
    // Try to get from cache if API call fails
    try {
      console.log(`API error, checking cache for template items (category ID: ${categoryId})`);
      const cachedData = await getData(`${STORAGE_KEYS.TEMPLATE_ITEMS}${categoryId}`);
      
      if (cachedData) {
        console.log('Using cached template items data');
        return {
          success: true,
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    return handleApiError(error);
  }
};

// Helper to clear all cached data
const clearAllCachedData = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const apiKeys = keys.filter(key => 
      key.startsWith(STORAGE_KEYS.RISK_TEMPLATES) || 
      key.startsWith(STORAGE_KEYS.TEMPLATE_SECTIONS) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_CATEGORIES) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_ITEMS) ||
      key.startsWith(STORAGE_KEYS.ASSESSMENT_SECTIONS) ||
      key.startsWith(STORAGE_KEYS.ASSESSMENT_CATEGORIES) ||
      key.startsWith(STORAGE_KEYS.ASSESSMENT_ITEMS)
    );
    
    if (apiKeys.length > 0) {
      await AsyncStorage.multiRemove(apiKeys);
      console.log(`Cleared ${apiKeys.length} cached data items`);
    }
  } catch (e) {
    console.error('Error clearing cached data:', e);
  }
};

export default {
  getRiskTemplates,
  getRiskAssessmentSections,
  getRiskAssessmentCategories,
  getRiskAssessmentItems,
  getRiskTemplateCategories,
  getRiskTemplateItems,
  clearAllCachedData,
  syncChanges,
  // Appointments methods
  getAppointments: appointmentsApi.getAppointments,
  getAppointmentById: appointmentsApi.getAppointmentById,
  getAppointmentsByStatus: appointmentsApi.getAppointmentsByStatus,
  getAppointmentsWithOrders: appointmentsApi.getAppointmentsWithOrders,
  getAppointmentsWithOrdersByStatus: appointmentsApi.getAppointmentsWithOrdersByStatus,
  getAppointmentsByListView: appointmentsApi.getAppointmentsByListView,
  updateAppointment: appointmentsApi.updateAppointment,
  updateRiskAssessmentMasterStatus: appointmentsApi.updateRiskAssessmentMasterStatus,
  
  // Function to get risk assessment master by order ID
  getRiskAssessmentMasterByOrder: async (orderId: string): Promise<ApiResponse> => {
    try {
      console.log('Fetching risk assessment master for order:', orderId);
      const response = await axiosInstance.get(`/risk-assessment-master/by-order/${orderId}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data,
          status: response.status,
        };
      }
      
      throw new Error('Empty response from API');
    } catch (error) {
      console.error('Error fetching risk assessment master by order:', error);
      return handleApiError(error);
    }
  },

  // Function to get complete risk assessment hierarchy (composite API) with offline support
  getRiskAssessmentCompleteHierarchy: async (orderId: string): Promise<ApiResponse> => {
    const cacheKey = `risk_assessment_hierarchy_${orderId}`;
    
    // Check network connectivity first
    let isOnline = true;
    try {
      const NetInfo = await import('@react-native-community/netinfo');
      const netInfo = await NetInfo.default.fetch();
      isOnline = netInfo.isConnected === true && netInfo.isInternetReachable === true;
      console.log(`🌐 Network status for hierarchy fetch: ${isOnline ? 'Online' : 'Offline'}`);
    } catch (netError) {
      console.warn('⚠️ Could not check network status, assuming online:', netError);
    }
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await getData(cacheKey);
      console.log(`📦 Retrieved cached hierarchy data: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached hierarchy data:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`📱 Using cached hierarchy data (offline) for order ${orderId}`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data (offline)'
        };
      } else {
        // No cached data available while offline
        console.error(`❌ Offline and no cached hierarchy data available for order ${orderId}`);
        return {
          success: false,
          message: 'You are offline and no cached hierarchy data is available.',
          status: 0,
          data: null
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log(`🚀 Fetching complete risk assessment hierarchy for order: ${orderId}`);
      const response = await axiosInstance.get(`/mobile/risk-assessment/${orderId}/complete-hierarchy`);
      
      console.log('📦 Composite API response structure:', {
        success: response.data?.success,
        hasAssessmentMasters: !!response.data?.data?.assessmentMasters,
        mastersCount: response.data?.data?.assessmentMasters?.length || 0
      });
      
      if (response.data?.success) {
        // Cache the fresh data for offline use with 4 hour TTL
        try {
          await storeData(cacheKey, response.data, 4 * 60 * 60 * 1000);
          console.log(`💾 Cached fresh hierarchy data for order ${orderId} (TTL: 4 hours)`);
        } catch (storageError) {
          console.error('Error caching hierarchy data:', storageError);
        }
        
        return response.data;
      }
      
      throw new Error('Invalid response format from composite API');
    } catch (error) {
      console.error('❌ Error fetching complete hierarchy from server:', error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`📱 Using cached hierarchy data (server error) for order ${orderId}`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache available, return the error
      return handleApiError(error);
    }
  },
  
  // Function to get all category field configurations for an order with offline support
  getOrderCategoryFieldConfigurations: async (orderId: string): Promise<ApiResponse> => {
    const cacheKey = `order_field_configurations_${orderId}`;
    
    // Check network connectivity first
    let isOnline = true;
    try {
      const NetInfo = await import('@react-native-community/netinfo');
      const netInfo = await NetInfo.default.fetch();
      isOnline = netInfo.isConnected === true && netInfo.isInternetReachable === true;
      console.log(`🌐 Network status for field config fetch: ${isOnline ? 'Online' : 'Offline'}`);
    } catch (netError) {
      console.warn('⚠️ Could not check network status, assuming online:', netError);
    }
    
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await getData(cacheKey);
      console.log(`📦 Retrieved cached field config data: ${cachedData ? 'Yes' : 'No'}`);
    } catch (cacheError) {
      console.error('Error reading cached field config data:', cacheError);
    }
    
    // If we're offline, use cached data
    if (!isOnline) {
      if (cachedData && cachedData.data) {
        console.log(`📱 Using cached field config data (offline) for order ${orderId}`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data (offline)'
        };
      } else {
        // No cached data available while offline
        console.error(`❌ Offline and no cached field config data available for order ${orderId}`);
        return {
          success: false,
          message: 'You are offline and no cached field configuration data is available.',
          status: 0,
          data: null
        };
      }
    }
    
    // We're online, try to fetch from server
    try {
      console.log('🚀 Fetching category field configurations for order:', orderId);
      const response = await axiosInstance.get(`/mobile/config/order/${orderId}/categories/complete`);
      
      console.log('📦 Field config response structure:', {
        success: response.data?.success,
        totalCategories: response.data?.data?.summary?.totalCategories || 0,
        totalFields: response.data?.data?.summary?.totalFields || 0
      });
      
      if (response.data?.success) {
        // Cache the fresh data for offline use with 4 hour TTL
        try {
          await storeData(cacheKey, response.data, 4 * 60 * 60 * 1000);
          console.log(`💾 Cached fresh field config data for order ${orderId} (TTL: 4 hours)`);
        } catch (storageError) {
          console.error('Error caching field config data:', storageError);
        }
        
        return response.data;
      }
      
      throw new Error('Invalid response format from field config API');
    } catch (error) {
      console.error('❌ Error fetching order field configurations from server:', error);
      
      // If server request fails but we have cached data, use it
      if (cachedData && cachedData.data) {
        console.log(`📱 Using cached field config data (server error) for order ${orderId}`);
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
      
      // No cache available, return the error
      return handleApiError(error);
    }
  },
  
  // Updated Media API endpoints - Sync API integration
  uploadMedia: async (mediaData: {
    fileName: string;
    fileType: string;
    entityName: string;
    entityID: number;
    base64Data: string;
    metadata?: string;
    deviceId?: string;
    userId?: string;
  }): Promise<ApiResponse> => {
    try {
      console.log('Uploading media to sync API:', {
        fileName: mediaData.fileName,
        entityName: mediaData.entityName,
        entityID: mediaData.entityID,
        fileSize: mediaData.base64Data.length
      });
      
      // Convert base64 to FormData for sync API
      const formData = new FormData();
      
      // In React Native, we can append base64 data directly to FormData
      // Create a file object that React Native FormData can handle
      formData.append('file', {
        uri: `data:${mediaData.fileType};base64,${mediaData.base64Data}`,
        type: mediaData.fileType,
        name: mediaData.fileName
      } as any);
      
      formData.append('entityName', mediaData.entityName);
      formData.append('entityId', mediaData.entityID.toString());
      
      // Map common MIME types to backend expected types
      let backendFileType = 'photo'; // default
      if (mediaData.fileType.includes('image')) {
        backendFileType = 'photo';
      } else if (mediaData.fileType.includes('pdf') || mediaData.fileType.includes('document')) {
        backendFileType = 'document';
      } else if (mediaData.fileName.toLowerCase().includes('signature')) {
        backendFileType = 'signature';
      }
      
      formData.append('fileType', backendFileType);
      formData.append('deviceId', mediaData.deviceId || 'mobile-device');
      formData.append('userId', mediaData.userId || 'mobile-user');
      
      if (mediaData.metadata) {
        formData.append('metadata', mediaData.metadata);
      }
      
      const response = await axiosInstance.post('/sync/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error uploading media to sync API:', error);
      return handleApiError(error);
    }
  },
  
  getMediaForEntity: async (entityName: string, entityID: number): Promise<ApiResponse> => {
    try {
      console.log('Fetching media from sync API for:', { entityName, entityID });
      
      const response = await axiosInstance.get(`/sync/media/entity/${entityName}/${entityID}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching media from sync API:', error);
      return handleApiError(error);
    }
  },

  // Delete media file from backend
  deleteMedia: async (mediaID: number): Promise<ApiResponse> => {
    try {
      console.log('Deleting media from backend:', mediaID);
      
      // Note: Using regular media endpoint for delete as sync API may not have this
      const response = await axiosInstance.delete(`/media/${mediaID}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error deleting media from backend:', error);
      return handleApiError(error);
    }
  },

  // Fetch image through API proxy (to handle private Azure Storage)
  fetchImage: async (mediaID: number): Promise<ApiResponse> => {
    try {
      console.log('Fetching image through API proxy for media ID:', mediaID);
      
      // Expect backend to return JSON: { imageUrl: "data:<mime>;base64,<...>" } or base64 string
      const response = await axiosInstance.get(`/media/${mediaID}/image`, { timeout: 30000 });

      let imageUrl: string;
      const payload = response?.data as any;
      if (payload && typeof payload === 'object' && payload.imageUrl) {
        imageUrl = payload.imageUrl.startsWith('data:')
          ? payload.imageUrl
          : `data:image/jpeg;base64,${payload.imageUrl}`;
      } else if (typeof payload === 'string') {
        imageUrl = payload.startsWith('data:')
          ? payload
          : `data:image/jpeg;base64,${payload}`;
      } else {
        console.error('Unexpected image payload format:', typeof payload);
        return {
          success: false,
          message: 'Unexpected image payload format',
          status: response?.status || 500
        };
      }
      
      return {
        success: true,
        data: {
          imageUrl,
          mediaID: mediaID
        },
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching image through API proxy:', error);
      return handleApiError(error);
    }
  },

  // Batch upload media files (used by sync service)
  uploadMediaBatch: async (mediaFiles: Array<{
    mediaID?: number;
    fileName: string;
    fileType: string;
    entityName: string;
    entityID: number;
    base64Data: string;
    metadata?: string;
    uploadedAt: string;
    uploadedBy?: string;
  }>): Promise<ApiResponse> => {
    try {
      console.log('Batch uploading media to sync API:', mediaFiles.length, 'files');
      
      // Convert each media file to FormData and upload individually
      // since sync API expects individual uploads
      const results = [];
      
      for (const mediaFile of mediaFiles) {
        // Create FormData for each file manually (inline implementation)
        try {
          console.log('Uploading media to sync API:', {
            fileName: mediaFile.fileName,
            entityName: mediaFile.entityName,
            entityID: mediaFile.entityID,
            fileSize: mediaFile.base64Data.length
          });
          
          // Convert base64 to FormData for sync API
          const formData = new FormData();
          
          // In React Native, we can append base64 data directly to FormData
          // Create a file object that React Native FormData can handle
          formData.append('file', {
            uri: `data:${mediaFile.fileType};base64,${mediaFile.base64Data}`,
            type: mediaFile.fileType,
            name: mediaFile.fileName
          } as any);
          
          formData.append('entityName', mediaFile.entityName);
          formData.append('entityId', mediaFile.entityID.toString());
          
          // Map common MIME types to backend expected types
          let backendFileType = 'photo'; // default
          if (mediaFile.fileType.includes('image')) {
            backendFileType = 'photo';
          } else if (mediaFile.fileType.includes('pdf') || mediaFile.fileType.includes('document')) {
            backendFileType = 'document';
          } else if (mediaFile.fileName.toLowerCase().includes('signature')) {
            backendFileType = 'signature';
          }
          
          formData.append('fileType', backendFileType);
          formData.append('deviceId', 'mobile-device');
          formData.append('userId', mediaFile.uploadedBy || 'mobile-user');
          
          if (mediaFile.metadata) {
            formData.append('metadata', mediaFile.metadata);
          }
          
          const response = await axiosInstance.post('/sync/media/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          results.push({
            success: true,
            data: response.data,
            status: response.status,
            originalMediaID: mediaFile.mediaID
          });
        } catch (error: any) {
          console.error('Error uploading individual media file:', error);
          results.push({
            success: false,
            message: error.response?.data?.message || error.message,
            status: error.response?.status,
            originalMediaID: mediaFile.mediaID
          });
        }
      }
      
      return {
        success: true,
        data: { uploaded: results.filter(r => r.success).length, results },
        status: 200
      };
    } catch (error) {
      console.error('Error batch uploading media to sync API:', error);
      return handleApiError(error);
    }
  },

  // New sync-specific endpoints based on test expectations
  getSyncChanges: async (params: {
    deviceId: string;
    userId: string;
    lastSyncTimestamp: string;
    entities: string[];
  }): Promise<ApiResponse> => {
    try {
      console.log('Fetching sync changes:', params);
      
      const response = await axiosInstance.get('/sync/changes', { params });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching sync changes:', error);
      return handleApiError(error);
    }
  },

  pushSyncBatch: async (syncData: {
    deviceId: string;
    userId: string;
    appointments?: any[];
    riskAssessmentMasters?: any[];
    riskAssessmentItems?: any[];
    deletedEntities?: any[];
  }): Promise<ApiResponse> => {
    try {
      console.log('Pushing sync batch:', {
        deviceId: syncData.deviceId,
        appointments: syncData.appointments?.length || 0,
        riskAssessmentMasters: syncData.riskAssessmentMasters?.length || 0,
        riskAssessmentItems: syncData.riskAssessmentItems?.length || 0,
        deletedEntities: syncData.deletedEntities?.length || 0
      });
      
      const response = await axiosInstance.post('/sync/batch', syncData);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error pushing sync batch:', error);
      return handleApiError(error);
    }
  },

  getSyncSessions: async (deviceId: string): Promise<ApiResponse> => {
    try {
      console.log('Fetching sync sessions for device:', deviceId);
      
      const response = await axiosInstance.get('/sync/sessions', {
        params: { deviceId }
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching sync sessions:', error);
      return handleApiError(error);
    }
  },

  getSyncHealth: async (): Promise<ApiResponse> => {
    try {
      console.log('Checking sync API health');
      
      const response = await axiosInstance.get('/sync/debug');
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error checking sync health:', error);
      return handleApiError(error);
    }
  }
}; 