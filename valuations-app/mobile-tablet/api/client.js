import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { 
  isApiKeyMode, 
  isJwtMode, 
  API_KEY, 
  API_KEY_HEADER_NAME, 
  USER_CONTEXT_HEADER_NAME,
  validateApiKeyConfig 
} from '../constants/apiConfig';

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

// Token cache to avoid AsyncStorage calls on every request (JWT mode only)
let cachedToken = null;
let tokenLastFetched = 0;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Add rate limiting for token refresh (JWT mode only)
let lastTokenRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 60 * 1000; // 1 minute between refresh attempts
let isRefreshing = false;

// User context cache for API key mode
let cachedUserContext = null;
let userContextLastFetched = 0;
const USER_CONTEXT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Function to get token with caching (JWT mode only)
async function getCachedToken() {
  if (!isJwtMode()) {
    return null;
  }
  
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

// Function to get user context with caching (API key mode only)
async function getCachedUserContext() {
  if (!isApiKeyMode()) {
    return null;
  }
  
  const now = Date.now();
  
  // If we have cached user context and it's not expired, use it
  if (cachedUserContext && (now - userContextLastFetched) < USER_CONTEXT_CACHE_DURATION) {
    return cachedUserContext;
  }
  
  // Fetch fresh user context from AsyncStorage
  try {
    const userContext = await AsyncStorage.getItem('userContext');
    cachedUserContext = userContext ? JSON.parse(userContext) : null;
    userContextLastFetched = now;
    
    if (cachedUserContext) {
      console.log(`👤 User context refreshed from AsyncStorage`);
    } else {
      console.log('⚠️ No user context found in AsyncStorage');
    }
    
    return cachedUserContext;
  } catch (error) {
    console.error('❌ Error fetching user context from AsyncStorage:', error);
    return null;
  }
}

// Function to clear token cache (call when user logs out)
export function clearTokenCache() {
  cachedToken = null;
  tokenLastFetched = 0;
  cachedUserContext = null;
  userContextLastFetched = 0;
  console.log('🔐 Token and user context cache cleared');
}

// Function to update token cache (call when user logs in)
export function updateTokenCache(token) {
  cachedToken = token;
  tokenLastFetched = Date.now();
  console.log('🔐 Token cache updated');
}

// Function to update user context cache (call when user logs in)
export function updateUserContextCache(userContext) {
  cachedUserContext = userContext;
  userContextLastFetched = Date.now();
  console.log('👤 User context cache updated');
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

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    // Only log essential request information
    const fullUrl = `${config.baseURL}${config.url}`;
    
    // Special logging for auth endpoints only
    if (config.url === '/auth/verify' || config.url === '/auth/token-exchange') {
      console.log(`🚀 ${config.method?.toUpperCase()}: ${fullUrl}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add request interceptor to include authentication headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Validate API key configuration
      if (isApiKeyMode() && !validateApiKeyConfig()) {
        console.error('❌ API key configuration validation failed');
        return Promise.reject(new Error('API key configuration invalid'));
      }
      
      // Increase timeout for specific endpoints that are known to be slow
      if (config.url?.includes('/appointments/list-view') || 
          config.url?.includes('/appointments/stats')) {
        config.timeout = 45000; // 45 seconds for appointment endpoints
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
        
        console.log(`🚀 ${config.method?.toUpperCase() || 'GET'}: ${fullUrl}`);
        
        // Log request data for sync requests
        if (config.url?.includes('/sync/') && config.data) {
          console.log('🚀 Request Data Size:', JSON.stringify(config.data).length, 'characters');
        }
      }
      
      // Handle authentication based on mode
      if (isApiKeyMode()) {
        // API Key authentication mode
        if (API_KEY) {
          config.headers[API_KEY_HEADER_NAME] = API_KEY;
          
          // Add user context header
          const userContext = await getCachedUserContext();
          if (userContext) {
            config.headers[USER_CONTEXT_HEADER_NAME] = JSON.stringify(userContext);
          }
          
          // Log user information for debugging (only in dev)
          if (__DEV__ && userContext) {
            console.log('🔑 API Key User:', userContext.email, '->', config.url);
          }
          
          // Debug logging for API key authentication
          if (__DEV__) {
            console.log('🔑 API Key Auth Debug:', {
              hasApiKey: !!API_KEY,
              hasUserContext: !!userContext,
              apiKeyHeader: API_KEY_HEADER_NAME,
              userContextHeader: USER_CONTEXT_HEADER_NAME,
              url: config.url,
              headers: {
                [API_KEY_HEADER_NAME]: API_KEY ? '***' : 'missing',
                [USER_CONTEXT_HEADER_NAME]: userContext ? '***' : 'missing'
              }
            });
          }
        }
      } else if (isJwtMode()) {
        // JWT authentication mode
        const token = await getCachedToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Log user information for debugging (only in dev)
          if (__DEV__) {
            try {
              const userData = await AsyncStorage.getItem('userData');
              if (userData) {
                const user = JSON.parse(userData);
                console.log('🔐 JWT User:', user.email, '->', config.url);
              }
            } catch (userError) {
              // Silent fail for user data logging
            }
          }
        }
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
    // Only log essential response information for auth endpoints
    if (response.config.url === '/auth/verify' || response.config.url === '/auth/token-exchange') {
      console.log(`✅ ${response.status}: ${response.config.url}`);
    }
    
    // For successful responses, wrap in standard format
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
  async (error) => {
    // Only log essential error information for auth endpoints
    if (error.config?.url === '/auth/verify' || error.config?.url === '/auth/token-exchange') {
      console.log(`❌ ${error.response?.status || 'No status'}: ${error.config?.url} - ${error.message}`);
    }
    
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
    
    // Handle authentication errors
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      console.log(`🔐 Authentication error detected: ${errorCode}`);
      
      if (isApiKeyMode()) {
        // API Key mode error handling
        if (errorCode === 'INVALID_API_KEY') {
          console.log('🔑 Invalid API key, redirecting to login...');
          // Clear user context
          await AsyncStorage.removeItem('userContext');
          clearTokenCache();
          // Redirect to login
          router.replace('/login');
        } else if (errorCode === 'INVALID_USER_CONTEXT') {
          console.log('👤 Invalid user context, refreshing user context...');
          // Clear user context cache and retry
          cachedUserContext = null;
          userContextLastFetched = 0;
          // Retry the original request
          return apiClient(error.config);
        }
      } else if (isJwtMode()) {
        // JWT mode error handling
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