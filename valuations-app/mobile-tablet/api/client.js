import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';

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

// Add rate limiting for token refresh
let lastTokenRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 60 * 1000; // 1 minute between refresh attempts
let isRefreshing = false;

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

// Add retry configuration for network errors
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to wait/delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to determine if error is retryable
const isRetryableError = (error) => {
  if (!error.response) {
    // Network errors (no response received)
    return error.code === 'ERR_NETWORK' || 
           error.code === 'ECONNABORTED' || 
           error.code === 'ENOTFOUND' || 
           error.code === 'ECONNREFUSED';
  }
  
  // Server errors that might be temporary
  return error.response.status >= 500 && error.response.status < 600;
};

// Add request interceptor to include bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Increase timeout for specific endpoints that are known to be slow
      if (config.url?.includes('/appointments/list-view') || 
          config.url?.includes('/appointments/stats')) {
        config.timeout = 45000; // 45 seconds for appointment endpoints
        console.log(`🕐 Extended timeout to 45s for ${config.url}`);
      }
      
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
        console.log('🚀 Headers:', config.headers);
        
        // Log request data for sync requests
        if (config.url?.includes('/sync/') && config.data) {
          console.log('🚀 Request Data Size:', JSON.stringify(config.data).length, 'characters');
          console.log('🚀 Request Data (first 500 chars):', JSON.stringify(config.data).substring(0, 500));
        }
        
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
      const dataSize = Array.isArray(response.data) ? response.data.length : 
                      response.data ? Object.keys(response.data).length : 0;
      console.log(`✅ ${response.status}: ${response.config.url} (${dataSize} items)`);
      
      // For sync responses, show detailed data
      if (response.config.url?.includes('/sync/')) {
        console.log('✅ Sync Response Data:', JSON.stringify(response.data, null, 2));
      }
    }
    
    // For successful responses, wrap in standard format
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
  async (error) => {
    // Handle 404s more gracefully for "no content" scenarios
    if (error.response?.status === 404) {
      const errorMessage = error.response?.data?.message || error.message || '';
      const isNoContentScenario = errorMessage.toLowerCase().includes('no items found') || 
                                  errorMessage.toLowerCase().includes('no data found') ||
                                  errorMessage.toLowerCase().includes('not found for this category');
      
      if (isNoContentScenario) {
        // Treat as successful empty result (like 204 No Content)
        console.log(`📦 404: ${error.config?.url || 'No URL'} (empty result)`);
        
        return {
          success: true,
          data: [], // Return empty array for no items found
          status: 204, // Treat as No Content
          message: errorMessage
        };
      }
    }
    
    console.log(`❌ ${error.response?.status || 'No status'}: ${error.config?.url || 'No URL'} - ${error.message}`);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response?.data?.retryAfter || 60;
      console.log(`⏳ Rate limited. Retry after ${retryAfter} seconds`);
      return Promise.reject({
        success: false,
        status: 429,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`
      });
    }
    
    // Handle token expiration
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      console.log(`🔐 Token error detected: ${errorCode}`);
      
      const now = Date.now();
      
      // Check if we should attempt a refresh
      if (isRefreshing || (now - lastTokenRefreshAttempt) < MIN_REFRESH_INTERVAL) {
        console.log('⏳ Skipping token refresh - too soon since last attempt');
        return Promise.reject(error);
      }
      
      if (errorCode === 'INVALID_API_TOKEN') {
        console.log('🔐 API token expired, attempting to refresh...');
        lastTokenRefreshAttempt = now;
        isRefreshing = true;
        
        try {
          // Get the Azure AD token
          const azureToken = await AsyncStorage.getItem('azureToken');
          if (!azureToken) {
            throw new Error('No Azure token available for refresh');
          }

          // Exchange the Azure token for a new API token
          const tokenResponse = await apiClient.post('/auth/token-exchange', {
            azureToken: azureToken
          });

          if (tokenResponse.data?.token) {
            // Update the token in storage and cache
            await AsyncStorage.setItem('authToken', tokenResponse.data.token);
            updateTokenCache(tokenResponse.data.token);
            
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${tokenResponse.data.token}`;
            isRefreshing = false;
            return apiClient(error.config);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          isRefreshing = false;
          
          // Check if Azure token also expired
          if (refreshError.response?.data?.code === 'TOKEN_EXPIRED') {
            console.log('🔐 Azure AD token expired, redirecting to login...');
            // Clear all tokens
            await AsyncStorage.multiRemove(['authToken', 'azureToken']);
            clearTokenCache();
            // Redirect to login
            router.replace('/login');
          } else {
            // Other error during refresh
            console.error('❌ Unexpected error during token refresh:', refreshError);
            router.replace('/login');
          }
        }
      } else if (errorCode === 'TOKEN_EXPIRED') {
        console.log('🔐 Azure AD token expired, redirecting to login...');
        // Clear all tokens
        await AsyncStorage.multiRemove(['authToken', 'azureToken']);
        clearTokenCache();
        // Redirect to login
        router.replace('/login');
      }
    }
    
    // Only log full details in development or for critical errors
    if (__DEV__ || (error.response?.status && error.response.status >= 500)) {
      console.log(`❌ Response data:`, error.response?.data);
      console.log(`❌ Network error:`, error.code);
    }
    
    // Add retry logic for network errors
    const config = error.config;
    if (config && isRetryableError(error)) {
      // Initialize retry count if not present
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount++;
        const retryDelay = RETRY_DELAY * config.__retryCount;
        
        console.log(`🔄 Retrying request (${config.__retryCount}/${MAX_RETRIES}) after ${retryDelay}ms: ${config.url}`);
        
        // Wait before retrying
        await delay(retryDelay);
        
        // Retry the request
        return apiClient(config);
      } else {
        console.log(`❌ Max retries (${MAX_RETRIES}) exceeded for: ${config.url}`);
      }
    }
    
    // For error responses, format error information
    const errorResponse = {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Unknown error occurred',
      code: error.code,
      retries: config?.__retryCount || 0
    };
    
    return Promise.reject(errorResponse);
  }
);

export default apiClient; 