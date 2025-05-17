// Main API client - combines all API modules into a single export

import authApi from './auth';
import surveysApi from './surveys';
import riskTemplatesApi from './riskTemplates';
import appointmentsApi from './appointments';
import offlineApi from './offline';
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
  
  // Appointments methods
  getAppointments: appointmentsApi.getAppointments,
  getAppointmentById: appointmentsApi.getAppointmentById,
  getAppointmentsByStatus: appointmentsApi.getAppointmentsByStatus,
  
  // Offline storage methods
  clearAllCachedData: offlineApi.clearAllCachedData
};

// Log platform and API version info
console.log(`API Client initialized on ${Platform.OS} (${Platform.Version})`);

export default api; 