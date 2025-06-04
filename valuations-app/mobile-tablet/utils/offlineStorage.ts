import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing different types of data
const STORAGE_KEYS = {
  RISK_TEMPLATES: 'risk_templates',
  TEMPLATE_SECTIONS: 'template_sections_',
  TEMPLATE_CATEGORIES: 'template_categories_',
  TEMPLATE_ITEMS: 'template_items_',
  LAST_SYNC: 'last_sync_timestamp',
  APPOINTMENTS: 'appointments',
};

// Store API data in AsyncStorage
export const storeApiData = async (key: string, data: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify({
      data,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Stored data for key: ${key}`);
  } catch (e) {
    console.error('Error storing offline data:', e);
  }
};

// Retrieve API data from AsyncStorage
export const getApiData = async (key: string): Promise<any | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue != null) {
      console.log(`Retrieved data for key: ${key}`);
      return JSON.parse(jsonValue);
    }
    return null;
  } catch (e) {
    console.error('Error retrieving offline data:', e);
    return null;
  }
};

// Store risk templates data
export const storeRiskTemplates = async (data: any): Promise<void> => {
  await storeApiData(STORAGE_KEYS.RISK_TEMPLATES, data);
};

// Get risk templates data
export const getRiskTemplates = async (): Promise<any | null> => {
  return await getApiData(STORAGE_KEYS.RISK_TEMPLATES);
};

// Store template sections data
export const storeTemplateSections = async (templateId: string, data: any): Promise<void> => {
  await storeApiData(`${STORAGE_KEYS.TEMPLATE_SECTIONS}${templateId}`, data);
};

// Get template sections data
export const getTemplateSections = async (templateId: string): Promise<any | null> => {
  return await getApiData(`${STORAGE_KEYS.TEMPLATE_SECTIONS}${templateId}`);
};

// Store template categories data
export const storeTemplateCategories = async (templateId: string, sectionId: string, data: any): Promise<void> => {
  await storeApiData(`${STORAGE_KEYS.TEMPLATE_CATEGORIES}${templateId}_${sectionId}`, data);
};

// Get template categories data
export const getTemplateCategories = async (templateId: string, sectionId: string): Promise<any | null> => {
  return await getApiData(`${STORAGE_KEYS.TEMPLATE_CATEGORIES}${templateId}_${sectionId}`);
};

// Store template items data
export const storeTemplateItems = async (categoryId: string, data: any): Promise<void> => {
  await storeApiData(`${STORAGE_KEYS.TEMPLATE_ITEMS}${categoryId}`, data);
};

// Get template items data
export const getTemplateItems = async (categoryId: string): Promise<any | null> => {
  return await getApiData(`${STORAGE_KEYS.TEMPLATE_ITEMS}${categoryId}`);
};

// Store data for any key
export const storeDataForKey = async (key: string, data: any): Promise<void> => {
  await storeApiData(key, data);
};

// Get data for any key
export const getDataForKey = async (key: string): Promise<any | null> => {
  return await getApiData(key);
};

// Store appointments data
export const storeAppointments = async (data: any): Promise<void> => {
  await storeApiData(STORAGE_KEYS.APPOINTMENTS, data);
};

// Get appointments data
export const getAppointments = async (): Promise<any | null> => {
  return await getApiData(STORAGE_KEYS.APPOINTMENTS);
};

// Clear all offline data (useful for debugging or resetting cache)
export const clearAllOfflineData = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const apiKeys = keys.filter(key => 
      key.startsWith(STORAGE_KEYS.RISK_TEMPLATES) || 
      key.startsWith(STORAGE_KEYS.TEMPLATE_SECTIONS) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_CATEGORIES) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_ITEMS) ||
      key.startsWith(STORAGE_KEYS.APPOINTMENTS)
    );
    
    if (apiKeys.length > 0) {
      await AsyncStorage.multiRemove(apiKeys);
      console.log(`Cleared ${apiKeys.length} offline data items`);
    }
  } catch (e) {
    console.error('Error clearing offline data:', e);
  }
};

// Check if data is stale (older than the provided maxAge in milliseconds)
export const isDataStale = (timestamp: number, maxAge: number = 24 * 60 * 60 * 1000): boolean => {
  const now = Date.now();
  return now - timestamp > maxAge;
};

// Store last sync timestamp
export const updateLastSyncTimestamp = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (e) {
    console.error('Error storing last sync timestamp:', e);
  }
};

// Get last sync timestamp
export const getLastSyncTimestamp = async (): Promise<number | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (e) {
    console.error('Error retrieving last sync timestamp:', e);
    return null;
  }
};

// Store assessment sections data
export const storeAssessmentSections = async (assessmentId: string, data: any): Promise<void> => {
  await storeApiData(`assessment_sections_${assessmentId}`, data);
};

// Get assessment sections data
export const getAssessmentSections = async (assessmentId: string): Promise<any | null> => {
  return await getApiData(`assessment_sections_${assessmentId}`);
};

// Store assessment categories data
export const storeAssessmentCategories = async (sectionId: string, data: any): Promise<void> => {
  await storeApiData(`assessment_categories_${sectionId}`, data);
};

// Get assessment categories data
export const getAssessmentCategories = async (sectionId: string): Promise<any | null> => {
  return await getApiData(`assessment_categories_${sectionId}`);
};

// Store assessment items data
export const storeAssessmentItems = async (categoryId: string, data: any): Promise<void> => {
  await storeApiData(`assessment_items_${categoryId}`, data);
};

// Get assessment items data
export const getAssessmentItems = async (categoryId: string): Promise<any | null> => {
  return await getApiData(`assessment_items_${categoryId}`);
};

export default {
  storeRiskTemplates,
  getRiskTemplates,
  storeTemplateSections,
  getTemplateSections,
  storeTemplateCategories,
  getTemplateCategories,
  storeTemplateItems,
  getTemplateItems,
  storeAppointments,
  getAppointments,
  storeDataForKey,
  getDataForKey,
  clearAllOfflineData,
  isDataStale,
  updateLastSyncTimestamp,
  getLastSyncTimestamp,
  storeAssessmentSections,
  getAssessmentSections,
  storeAssessmentCategories,
  getAssessmentCategories,
  storeAssessmentItems,
  getAssessmentItems,
}; 