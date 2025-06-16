import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API configuration from environment variables
console.log('🔍 === ENVIRONMENT VARIABLE DEBUG ===');
console.log('🔍 process.env.API_BASE_URL:', process.env.API_BASE_URL);
console.log('🔍 process.env.API_TIMEOUT:', process.env.API_TIMEOUT);
console.log('🔍 Constants.expoConfig?.extra?.apiBaseUrl:', Constants.expoConfig?.extra?.apiBaseUrl);
console.log('🔍 Constants.expoConfig?.extra?.apiTimeout:', Constants.expoConfig?.extra?.apiTimeout);
console.log('🔍 Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
console.log('🔍 === END ENVIRONMENT DEBUG ===');

const API_CONFIG = {
  BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || process.env.API_BASE_URL || 'https://localhost:5001/api',
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

// Token cache to avoid AsyncStorage calls on every request
let cachedToken = null;
let tokenLastFetched = 0;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get token with caching
async function getCachedToken() {
  const now = Date.now();
  
  // If we have a cached token and it's not expired, use it
  if (cachedToken && (now - tokenLastFetched) < TOKEN_CACHE_DURATION) {
    return cachedToken;
  }
  
  // Fetch fresh token from AsyncStorage
  try {
    const token = await AsyncStorage.getItem('authToken');
    cachedToken = token;
    tokenLastFetched = now;
    
    if (token) {
      console.log(`🔐 Token refreshed from AsyncStorage (${token.length} chars)`);
    } else {
      console.log('⚠️ No auth token found in AsyncStorage');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error fetching token from AsyncStorage:', error);
    return null;
  }
}

// Function to clear token cache (call when user logs out)
export function clearTokenCache() {
  cachedToken = null;
  tokenLastFetched = 0;
  console.log('🔐 Token cache cleared');
}

// Function to update token cache (call when user logs in)
export function updateTokenCache(token) {
  cachedToken = token;
  tokenLastFetched = Date.now();
  console.log('🔐 Token cache updated');
}

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
      // Only log detailed info for non-GET requests or in development
      const shouldLogDetails = config.method !== 'get' || __DEV__;
      
      if (shouldLogDetails) {
        // Construct the full absolute URL
        let fullUrl = '';
        if (config.url?.startsWith('http')) {
          fullUrl = config.url;
        } else {
          const baseUrl = config.baseURL || '';
          const endpoint = config.url || '';
          fullUrl = baseUrl.endsWith('/') && endpoint.startsWith('/') 
            ? baseUrl + endpoint.substring(1)
            : baseUrl.endsWith('/') || endpoint.startsWith('/') || !endpoint
            ? baseUrl + endpoint
            : baseUrl + '/' + endpoint;
        }
        
        console.log('🚀 === API REQUEST ===');
        console.log(`🚀 ${config.method?.toUpperCase() || 'GET'}: ${fullUrl}`);
        console.log('🚀 === END REQUEST ===');
      }
      
      // Get the auth token efficiently (with caching)
      const token = await getCachedToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
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
    // Only log details for non-GET requests or errors in production
    const shouldLogDetails = response.config.method !== 'get' || __DEV__;
    
    if (shouldLogDetails) {
      console.log('✅ === API RESPONSE SUCCESS ===');
      console.log(`✅ ${response.status}: ${response.config.url}`);
      console.log(`✅ Data:`, response.data);
      console.log('✅ === END RESPONSE ===');
    }
    
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
    
    // Only log full details in development or for critical errors
    if (__DEV__ || (error.response?.status && error.response.status >= 500)) {
      console.log(`❌ Response data:`, error.response?.data);
      console.log(`❌ Network error:`, error.code);
    }
    console.log('❌ === END ERROR ===');
    
    // For error responses, format error information
    const errorResponse = {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
    };
    
    return Promise.reject(errorResponse);
  }
);

export default apiClient; 