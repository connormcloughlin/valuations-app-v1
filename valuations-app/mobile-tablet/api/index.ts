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
    const response = await axiosInstance.get(`/risk-assessment-sections/assessment/${riskAssessmentId}`);
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
}; 