import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include bearer token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token for API request:', error);
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

// Helper function to store data in AsyncStorage
const storeData = async (key: string, data: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify({
      data,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(key, jsonValue);
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

// Helper to handle API errors
const handleApiError = (error: any): ApiResponse => {
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
    const response = await axiosInstance.get(`/risk-assessment-items/category/${categoryId}`);
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
    try {
      console.log(`API error, checking cache for assessment items (category ID: ${categoryId})`);
      const cachedData = await getData(`${STORAGE_KEYS.ASSESSMENT_ITEMS}${categoryId}`);
      if (cachedData) {
        console.log('Using cached assessment items data');
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