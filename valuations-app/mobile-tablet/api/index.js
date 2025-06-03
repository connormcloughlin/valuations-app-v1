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
  
  // Offline storage methods
  clearAllCachedData: offlineApi.clearAllCachedData,
  
  // Sync method for uploading local changes to server
  syncChanges: async (syncData) => {
    try {
      console.log('=== API CLIENT: STARTING SYNC REQUEST ===');
      console.log('API: Syncing changes to server:', {
        riskAssessmentItems: syncData.riskAssessmentItems?.length || 0,
        riskAssessmentMasters: syncData.riskAssessmentMasters?.length || 0,
        appointments: syncData.appointments?.length || 0,
        deviceId: syncData.deviceId,
        userId: syncData.userId
      });

      console.log('=== EXACT PAYLOAD BEING SENT TO /sync/batch ===');
      console.log('Payload size (chars):', JSON.stringify(syncData).length);
      console.log('Payload structure:');
      console.log('- deviceId:', syncData.deviceId);
      console.log('- userId:', syncData.userId);
      console.log('- appointments count:', syncData.appointments?.length || 0);
      console.log('- riskAssessmentMasters count:', syncData.riskAssessmentMasters?.length || 0);
      console.log('- riskAssessmentItems count:', syncData.riskAssessmentItems?.length || 0);
      console.log('- deletedEntities count:', syncData.deletedEntities?.length || 0);
      
      console.log('=== FULL SYNC PAYLOAD (JSON) ===');
      console.log(JSON.stringify(syncData, null, 2));

      if (syncData.riskAssessmentItems && syncData.riskAssessmentItems.length > 0) {
        console.log('=== RISK ASSESSMENT ITEMS DETAILS ===');
        syncData.riskAssessmentItems.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, {
            id: item.riskassessmentitemid,
            categoryId: item.riskassessmentcategoryid,
            description: item.itemprompt,
            qty: item.qty,
            price: item.price,
            model: item.model,
            hasChanges: item.pending_sync || (item.dateupdated !== item.datecreated)
          });
        });
      }

      console.log('=== MAKING POST REQUEST TO /sync/batch ===');
      const response = await apiClient.post('/sync/batch', syncData);
      
      console.log('=== API CLIENT: RESPONSE RECEIVED ===');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data:', response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('=== API CLIENT: SYNC ERROR ===');
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data,
        stack: error.stack
      });
      
      // Return formatted error response
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to sync changes to server'
      };
    }
  }
};

// Log platform and API version info
console.log(`API Client initialized on ${Platform.OS} (${Platform.Version})`);

export default api; 