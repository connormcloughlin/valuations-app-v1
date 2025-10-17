// Main API client - combines all API modules into a single export

import authApi from './auth';
import surveysApi from './surveys';
import riskTemplatesApi from './riskTemplates';
import appointmentsApi from './appointments';
import offlineApi from './offline';
import transportClient from '../core/transport/transportClient';
import { Platform } from 'react-native';

/**
 * Combined API client for interacting with the server
 */
const api = {
  // Authentication methods
  setAuthToken: authApi.setAuthToken,
  login: authApi.login,
  
  // Survey methods
  getSurveys: surveysApi.getSurveys,
  getSurveyDetails: surveysApi.getSurveyDetails,
  submitSurvey: surveysApi.submitSurvey,
  deleteSurvey: surveysApi.deleteSurvey,
  uploadFile: surveysApi.uploadFile,
  
  // Risk template methods
  getRiskTemplates: riskTemplatesApi.getRiskTemplates,
  getRiskTemplateSections: riskTemplatesApi.getRiskTemplateSections,
  getRiskTemplateCategories: riskTemplatesApi.getRiskTemplateCategories,
  getRiskTemplateItems: riskTemplatesApi.getRiskTemplateItems,
  
  // Risk assessment methods
  getRiskAssessmentSections: riskTemplatesApi.getRiskAssessmentSections,
  getRiskAssessmentCategories: riskTemplatesApi.getRiskAssessmentCategories,
  getRiskAssessmentItems: riskTemplatesApi.getRiskAssessmentItems,
  
  // Appointments methods
  getAppointments: appointmentsApi.getAppointments,
  getAppointmentById: appointmentsApi.getAppointmentById,
  getAppointmentsByStatus: appointmentsApi.getAppointmentsByStatus,
  getAppointmentsWithOrders: appointmentsApi.getAppointmentsWithOrders,
  getAppointmentsWithOrdersByStatus: appointmentsApi.getAppointmentsWithOrdersByStatus,
  getAppointmentsByListView: appointmentsApi.getAppointmentsByListView,
  updateAppointment: appointmentsApi.updateAppointment,
  
  // Offline storage methods
  clearAllCachedData: offlineApi.clearAllCachedData,
  
  // Sync method for uploading local changes to server
  syncChanges: async (syncData) => {
    try {
      if (__DEV__) {
        console.log('=== SYNC REQUEST ===');
        console.log('Sync data summary:', {
          riskAssessmentItems: syncData.riskAssessmentItems?.length || 0,
          riskAssessmentMasters: syncData.riskAssessmentMasters?.length || 0,
          appointments: syncData.appointments?.length || 0,
          deletedEntities: syncData.deletedEntities?.length || 0,
          deviceId: syncData.deviceId,
          userId: syncData.userId
        });
      }

      const response = await transportClient.post('sync.batch', '/sync/batch', syncData);
      
      if (__DEV__) {
        console.log('=== SYNC RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      }
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('=== SYNC ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Failed to sync changes to server'
      };
    }
  },
  
  // Media API endpoints - Sync API integration
  uploadMedia: async (mediaData) => {
    try {
      console.log('Uploading media:', mediaData.fileName);
      
      const formData = convertToFormData(mediaData);
      
      const response = await transportClient.post('sync.media.upload', '/sync/media/upload', formData, {
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
      console.error('Error uploading media:', error.message);
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to upload media'
      };
    }
  },
  
  getMediaForEntity: async (entityName, entityID) => {
    try {
      console.log('Fetching media from sync API for:', { entityName, entityID });
      
      const response = await transportClient.get('sync.media.entity', `/sync/media/entity/${entityName}/${entityID}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching media from sync API:', error);
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to fetch media'
      };
    }
  },

  deleteMedia: async (mediaID) => {
    try {
      console.log('Deleting media from backend:', mediaID);
      
      const response = await transportClient.delete('media.delete', `/media/${mediaID}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error deleting media from backend:', error);
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to delete media'
      };
    }
  },

  // Function to get risk assessment master by order ID
  getRiskAssessmentMasterByOrder: async (orderId) => {
    try {
      console.log('Fetching risk assessment master for order:', orderId);
      const response = await transportClient.get('risk-assessment.master', `/risk-assessment-master/by-order/${orderId}`);
      
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
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Failed to fetch risk assessment master'
      };
    }
  },

  // Function to get complete risk assessment hierarchy (composite API)
  getRiskAssessmentCompleteHierarchy: async (orderId) => {
    try {
      console.log('🚀 Fetching complete risk assessment hierarchy for order:', orderId);
      const response = await transportClient.get('risk-assessment.hierarchy', `/mobile/risk-assessment/${orderId}/complete-hierarchy`);
      
      console.log('📦 Composite API response structure:', {
        success: response?.success,
        hasAssessmentMasters: !!response?.data?.assessmentMasters,
        mastersCount: response?.data?.assessmentMasters?.length || 0
      });
      
      if (response?.success) {
        // Cache for offline use
        await offlineApi.storeData(`risk_assessment_hierarchy_${orderId}`, response);
        return response;
      }
      
      throw new Error('Invalid response format from composite API');
    } catch (error) {
      console.error('❌ Error fetching complete hierarchy:', error);
      
      // Try cache if API fails
      try {
        const cachedData = await offlineApi.getData(`risk_assessment_hierarchy_${orderId}`);
        if (cachedData) {
          console.log('📦 Using cached hierarchy data');
          return { ...cachedData, fromCache: true };
        }
      } catch (cacheError) {
        console.error('❌ Cache retrieval error:', cacheError);
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Failed to fetch complete hierarchy'
      };
    }
  },

  // Function to get all category field configurations for an order
  getOrderCategoryFieldConfigurations: async (orderId) => {
    try {
      console.log('🚀 Fetching category field configurations for order:', orderId);
      const response = await transportClient.get('config.order.categories', `/mobile/config/order/${orderId}/categories/complete`);
      
      console.log('📦 Field config response structure:', {
        success: response?.success,
        totalCategories: response?.data?.summary?.totalCategories || 0,
        totalFields: response?.data?.summary?.totalFields || 0
      });
      
      if (response?.success) {
        // Cache for offline use
        await offlineApi.storeData(`order_field_configurations_${orderId}`, response);
        return response;
      }
      
      throw new Error('Invalid response format from field config API');
    } catch (error) {
      console.error('❌ Error fetching order field configurations:', error);
      
      // Try cache if API fails
      try {
        const cachedData = await offlineApi.getData(`order_field_configurations_${orderId}`);
        if (cachedData) {
          console.log('📦 Using cached field configuration data');
          return { ...cachedData, fromCache: true };
        }
      } catch (cacheError) {
        console.error('❌ Cache retrieval error:', cacheError);
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Failed to fetch field configurations'
      };
    }
  },

  uploadMediaBatch: async (mediaFiles) => {
    try {
      console.log('Batch uploading media to sync API:', mediaFiles.length, 'files');
      
      const results = [];
      
      for (const mediaFile of mediaFiles) {
        try {
          console.log('Uploading media to sync API:', {
            fileName: mediaFile.fileName,
            entityName: mediaFile.entityName,
            entityID: mediaFile.entityID,
            fileSize: mediaFile.base64Data.length
          });
          
          const formData = convertToFormData(mediaFile);
          
          // Remove Content-Type header to let FormData set it automatically with boundary
          const response = await transportClient.post('sync.media.upload', '/sync/media/upload', formData);
          
          results.push({
            success: true,
            data: response.data,
            status: response.status,
            originalMediaID: mediaFile.mediaID
          });
        } catch (error) {
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
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to batch upload media'
      };
    }
  }
};

// Log platform and API version info
console.log(`API Client initialized on ${Platform.OS} (${Platform.Version})`);

// Helper to convert base64 to FormData for sync API
const convertToFormData = (mediaData) => {
  const formData = new FormData();
  
  // Map common MIME types to backend expected types
  let backendFileType = 'photo'; // default
  if (mediaData.fileType.includes('image')) {
    backendFileType = 'photo';
  } else if (mediaData.fileType.includes('pdf') || mediaData.fileType.includes('document')) {
    backendFileType = 'document';
  } else if (mediaData.fileName.toLowerCase().includes('signature')) {
    backendFileType = 'signature';
  }
  
  // Send the data as JSON fields that the backend expects
  formData.append('entityName', mediaData.entityName);
  formData.append('entityId', mediaData.entityID.toString());
  formData.append('fileType', backendFileType);
  formData.append('fileName', mediaData.fileName);
  formData.append('hasBase64Data', 'true');
  formData.append('base64Length', mediaData.base64Data.length.toString());
  formData.append('base64Data', mediaData.base64Data); // Send raw base64 data, not data URI
  
  formData.append('deviceId', mediaData.deviceId || 'mobile-tablet-device');
  formData.append('userId', mediaData.userId || 'current-user-id');
  
  if (mediaData.metadata) {
    formData.append('metadata', mediaData.metadata);
  }
  
  console.log('FormData created for media upload:', {
    fileName: mediaData.fileName,
    fileType: mediaData.fileType,
    entityName: mediaData.entityName,
    entityId: mediaData.entityID,
    backendFileType: backendFileType,
    hasBase64Data: true,
    base64Length: mediaData.base64Data.length,
    formDataKeys: Object.keys(formData._parts || {})
  });
  
  // Debug: Log the actual FormData structure
  if (formData._parts) {
    console.log('FormData parts:', formData._parts.map(part => ({
      fieldName: part[0],
      value: part[0] === 'base64Data' ? `[Base64: ${part[1].length} chars]` : part[1]
    })));
  }
  
  return formData;
};

export default api; 