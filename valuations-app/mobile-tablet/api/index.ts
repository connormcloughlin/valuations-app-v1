// Thin API facade - re-exports from domain modules; all HTTP via transportClient
import authApi from './auth';
import surveysApi from './surveys';
import riskTemplatesApi from './riskTemplates';
import appointmentsApi from './appointments';
import offlineApi from './offline';
import { clearAllCachedData } from './cache';
import * as hierarchyApi from './hierarchy';
import * as syncApi from './sync';
import * as mediaApi from './media';

export default {
  setAuthToken: authApi.setAuthToken,
  login: async (_credentials: any) =>
    Promise.resolve({ success: false, message: 'Use AuthContext for authentication' }),

  getSurveys: surveysApi.getSurveys,
  getSurveyDetails: surveysApi.getSurveyById,
  submitSurvey: surveysApi.submitSurvey,
  deleteSurvey: surveysApi.deleteSurvey,
  uploadFile: surveysApi.uploadFile,

  getRiskTemplates: riskTemplatesApi.getRiskTemplates,
  getRiskTemplateSections: riskTemplatesApi.getRiskTemplateSections,
  getRiskTemplateCategories: riskTemplatesApi.getRiskTemplateCategories,
  getRiskTemplateItems: riskTemplatesApi.getRiskTemplateItems,
  getRiskAssessmentSections: riskTemplatesApi.getRiskAssessmentSections,
  getRiskAssessmentCategories: riskTemplatesApi.getRiskAssessmentCategories,
  getRiskAssessmentItems: riskTemplatesApi.getRiskAssessmentItems,

  clearAllCachedData,
  emergencyCleanup: offlineApi.emergencyCleanup,

  getAppointments: appointmentsApi.getAppointments,
  getAppointmentById: appointmentsApi.getAppointmentById,
  getAppointmentsByStatus: appointmentsApi.getAppointmentsByStatus,
  getAppointmentsWithOrders: appointmentsApi.getAppointmentsWithOrders,
  getAppointmentsWithOrdersByStatus: appointmentsApi.getAppointmentsWithOrdersByStatus,
  getAppointmentsByListView: appointmentsApi.getAppointmentsByListView,
  updateAppointment: appointmentsApi.updateAppointment,
  updateRiskAssessmentMasterStatus: appointmentsApi.updateRiskAssessmentMasterStatus,
  
  getRiskAssessmentMasterByOrder: hierarchyApi.getRiskAssessmentMasterByOrder,
  getRiskAssessmentCompleteHierarchy: hierarchyApi.getRiskAssessmentCompleteHierarchy,
  getOrderCategoryFieldConfigurations: hierarchyApi.getOrderCategoryFieldConfigurations,

  syncChanges: syncApi.syncChanges,
  getSyncChanges: syncApi.getSyncChanges,
  pushSyncBatch: syncApi.pushSyncBatch,
  getSyncSessions: syncApi.getSyncSessions,
  getSyncHealth: syncApi.getSyncHealth,

  uploadMedia: mediaApi.uploadMedia,
  getMediaForEntity: mediaApi.getMediaForEntity,
  deleteMedia: mediaApi.deleteMedia,
  fetchImage: mediaApi.fetchImage,
  uploadMediaBatch: mediaApi.uploadMediaBatch,
};
