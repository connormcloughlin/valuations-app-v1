import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

// Create axios instance with config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Add request interceptor to include bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Debug: Log token info for troubleshooting
        console.log(`🔐 API Request to ${config.url || config.baseURL + config.url}:`);
        console.log(`🔐 Authorization Header: Bearer ${token}`);
        console.log(`🔐 Token length: ${token.length} characters`);
        console.log(`🔐 Full token for Swagger testing: ${token}`);
      } else {
        console.log('⚠️ No auth token found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for standardizing responses
apiClient.interceptors.response.use(
  (response) => {
    // For successful responses, wrap in standard format
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
  (error) => {
    // For error responses, format error information
    const errorResponse = {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
    };
    
    // Still reject the promise, but with formatted error
    return Promise.reject(errorResponse);
  }
);

export default apiClient; 