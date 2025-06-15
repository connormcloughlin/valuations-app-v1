import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API configuration from environment variables
const API_CONFIG = {
  BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: parseInt(Constants.expoConfig?.extra?.apiTimeout || process.env.API_TIMEOUT || '30000'),
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Log API configuration on startup
console.log('🌐 API Configuration:');
console.log(`🌐 Base URL: ${API_CONFIG.BASE_URL}`);
console.log(`🌐 Timeout: ${API_CONFIG.TIMEOUT}ms`);
console.log(`🌐 Headers:`, API_CONFIG.HEADERS);

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
      // Construct the full absolute URL
      let fullUrl = '';
      if (config.url?.startsWith('http')) {
        // Absolute URL
        fullUrl = config.url;
      } else {
        // Relative URL - combine with baseURL
        const baseUrl = config.baseURL || '';
        const endpoint = config.url || '';
        // Ensure proper URL joining
        fullUrl = baseUrl.endsWith('/') && endpoint.startsWith('/') 
          ? baseUrl + endpoint.substring(1)
          : baseUrl.endsWith('/') || endpoint.startsWith('/') || !endpoint
          ? baseUrl + endpoint
          : baseUrl + '/' + endpoint;
      }
      
      console.log('🚀 === API REQUEST DETAILS ===');
      console.log(`🚀 Method: ${config.method?.toUpperCase() || 'GET'}`);
      console.log(`🚀 Base URL: ${config.baseURL}`);
      console.log(`🚀 Endpoint: ${config.url || '/'}`);
      console.log(`🚀 COMPLETE FULL URL: ${fullUrl}`);
      console.log(`🚀 Server: ${new URL(fullUrl).origin}`);
      console.log(`🚀 Path: ${new URL(fullUrl).pathname}`);
      console.log(`🚀 Timeout: ${config.timeout}ms`);
      console.log(`🚀 Headers:`, config.headers);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`🔐 Authorization: Bearer token added (${token.length} characters)`);
        console.log(`🔐 Full token for testing: ${token}`);
      } else {
        console.log('⚠️ No auth token found in AsyncStorage');
      }
      
      console.log('🚀 === END REQUEST DETAILS ===');
    } catch (error) {
      console.error('❌ Error preparing request:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for standardizing responses
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ === API RESPONSE SUCCESS ===');
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ URL: ${response.config.url}`);
    console.log(`✅ Data:`, response.data);
    console.log('✅ === END RESPONSE ===');
    
    // For successful responses, wrap in standard format
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
  (error) => {
    console.log('❌ === API RESPONSE ERROR ===');
    console.log(`❌ Status: ${error.response?.status || 'No status'}`);
    console.log(`❌ URL: ${error.config?.url || 'No URL'}`);
    console.log(`❌ Message: ${error.message}`);
    console.log(`❌ Response data:`, error.response?.data);
    console.log(`❌ Network error:`, error.code);
    console.log('❌ === END ERROR ===');
    
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