// Main API client - combines all API modules into a single export

import authApi from './auth';
import surveysApi from './surveys';
import riskTemplatesApi from './riskTemplates';
import appointmentsApi from './appointments';
import offlineApi from './offline';
import apiClient from './client';
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
      console.log('Syncing changes to server:', {
        riskAssessmentItems: syncData.riskAssessmentItems?.length || 0,
        riskAssessmentMasters: syncData.riskAssessmentMasters?.length || 0,
        appointments: syncData.appointments?.length || 0,
        deviceId: syncData.deviceId,
        userId: syncData.userId
      });

      const response = await apiClient.post('/sync/batch', syncData);
      
      console.log('Sync response:', {
        status: response.status,
        success: true
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Sync error:', error.message);
      
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to sync changes to server'
      };
    }
  },
  
  // Media API endpoints - Sync API integration
  uploadMedia: async (mediaData) => {
    try {
      console.log('Uploading media:', mediaData.fileName);
      
      const formData = convertToFormData(mediaData);
      
      const response = await apiClient.post('/sync/media/upload', formData, {
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
      
      const response = await apiClient.get(`/sync/media/entity/${entityName}/${entityID}`);
      
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
      
      const response = await apiClient.delete(`/media/${mediaID}`);
      
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
          
          const response = await apiClient.post('/sync/media/upload', formData, {
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
  
  // In React Native, we can append base64 data directly to FormData
  // Create a file object that React Native FormData can handle
  formData.append('file', {
    uri: `data:${mediaData.fileType};base64,${mediaData.base64Data}`,
    type: mediaData.fileType,
    name: mediaData.fileName
  });
  
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
  
  return formData;
};

export default api; 