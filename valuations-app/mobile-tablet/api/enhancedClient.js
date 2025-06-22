import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import apiRequestManager from '../utils/apiRequestManager';

// Get API configuration from environment variables
const API_CONFIG = {
  BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || process.env.API_BASE_URL || 'https://localhost:5001/api',
  TIMEOUT: parseInt(Constants.expoConfig?.extra?.apiTimeout || process.env.API_TIMEOUT || '30000'),
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

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
      console.log(`🔐 Enhanced client: Token refreshed from AsyncStorage (${token.length} chars)`);
    } else {
      console.log('⚠️ Enhanced client: No auth token found in AsyncStorage');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Enhanced client: Error fetching token from AsyncStorage:', error);
    return null;
  }
}

// Function to clear token cache (call when user logs out)
export function clearTokenCache() {
  cachedToken = null;
  tokenLastFetched = 0;
  console.log('🔐 Enhanced client: Token cache cleared');
}

// Function to update token cache (call when user logs in)
export function updateTokenCache(token) {
  cachedToken = token;
  tokenLastFetched = Date.now();
  console.log('🔐 Enhanced client: Token cache updated');
}

/**
 * Enhanced API Client with request deduplication, caching, and circuit breaker
 */
class EnhancedApiClient {
  
  /**
   * Make a GET request with caching and deduplication
   */
  async get(url, config = {}) {
    return this.request({
      method: 'GET',
      url,
      ...config
    }, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache for GET requests
      skipDeduplication: false,
      ...config.requestOptions
    });
  }

  /**
   * Make a POST request (typically no caching)
   */
  async post(url, data, config = {}) {
    return this.request({
      method: 'POST',
      url,
      data,
      ...config
    }, {
      skipCache: true, // Don't cache POST requests
      skipDeduplication: true, // Don't deduplicate POST requests
      ...config.requestOptions
    });
  }

  /**
   * Make a PUT request (typically no caching)
   */
  async put(url, data, config = {}) {
    return this.request({
      method: 'PUT',
      url,
      data,
      ...config
    }, {
      skipCache: true, // Don't cache PUT requests
      skipDeduplication: true, // Don't deduplicate PUT requests
      ...config.requestOptions
    });
  }

  /**
   * Make a DELETE request (typically no caching)
   */
  async delete(url, config = {}) {
    return this.request({
      method: 'DELETE',
      url,
      ...config
    }, {
      skipCache: true, // Don't cache DELETE requests
      skipDeduplication: true, // Don't deduplicate DELETE requests
      ...config.requestOptions
    });
  }

  /**
   * Core request method using the API request manager
   */
  async request(config, requestOptions = {}) {
    try {
      // Prepare the full config
      const fullConfig = await this.prepareConfig(config);
      
      // Use the API request manager for deduplication and caching
      const response = await apiRequestManager.request(fullConfig, requestOptions);
      
      // Handle authentication errors
      if (response && response.status === 403) {
        await this.handleAuthError(response);
      }
      
      // Return in standard format
      return {
        success: true,
        data: response,
        status: 200 // The request manager returns the actual data, not the response object
      };
      
    } catch (error) {
      console.error('❌ Enhanced API Error:', error.message);
      
      // Handle specific error cases
      if (error.message.includes('Circuit breaker open')) {
        return {
          success: false,
          status: 503,
          message: 'Service temporarily unavailable. Please try again later.'
        };
      }
      
      // Handle 404s more gracefully for "no content" scenarios
      if (error.response?.status === 404) {
        const errorMessage = error.response?.data?.message || error.message || '';
        const isNoContentScenario = errorMessage.toLowerCase().includes('no items found') || 
                                    errorMessage.toLowerCase().includes('no data found') ||
                                    errorMessage.toLowerCase().includes('not found for this category');
        
        if (isNoContentScenario) {
          console.log(`📦 404: ${config.url || 'No URL'} (empty result)`);
          return {
            success: true,
            data: [], // Return empty array for no items found
            status: 204, // Treat as No Content
            message: errorMessage
          };
        }
      }
      
      // Standard error response
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
        code: error.code,
        retries: error.retries || 0
      };
    }
  }

  /**
   * Prepare request configuration with auth and base URL
   */
  async prepareConfig(config) {
    // Get the auth token
    const token = await getCachedToken();
    
    // Prepare headers
    const headers = {
      ...API_CONFIG.HEADERS,
      ...config.headers
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare full URL
    let url = config.url;
    if (!url.startsWith('http')) {
      url = API_CONFIG.BASE_URL + (url.startsWith('/') ? '' : '/') + url;
    }
    
    // Set timeout based on endpoint
    let timeout = config.timeout || API_CONFIG.TIMEOUT;
    if (config.url?.includes('/appointments/list-view') || 
        config.url?.includes('/appointments/stats')) {
      timeout = 45000; // 45 seconds for appointment endpoints
    }
    
    return {
      ...config,
      url,
      headers,
      timeout
    };
  }

  /**
   * Handle authentication errors
   */
  async handleAuthError(response) {
    const errorCode = response.data?.code;
    console.log(`🔐 Enhanced client: Token error detected: ${errorCode}`);
    
    const now = Date.now();
    
    // Check if we should attempt a refresh
    if (isRefreshing || (now - lastTokenRefreshAttempt) < MIN_REFRESH_INTERVAL) {
      console.log('⏳ Enhanced client: Skipping token refresh - too soon since last attempt');
      return;
    }
    
    if (errorCode === 'INVALID_API_TOKEN') {
      console.log('🔐 Enhanced client: API token expired, attempting to refresh...');
      lastTokenRefreshAttempt = now;
      isRefreshing = true;
      
      try {
        // Get the Azure AD token
        const azureToken = await AsyncStorage.getItem('azureToken');
        if (!azureToken) {
          throw new Error('No Azure token available for refresh');
        }

        // Exchange the Azure token for a new API token
        const tokenResponse = await this.post('/auth/token-exchange', {
          azureToken: azureToken
        }, { requestOptions: { skipCache: true, skipDeduplication: true } });

        if (tokenResponse.data?.token) {
          // Update the token in storage and cache
          await AsyncStorage.setItem('authToken', tokenResponse.data.token);
          updateTokenCache(tokenResponse.data.token);
          console.log('✅ Enhanced client: Token refreshed successfully');
        }
      } catch (refreshError) {
        console.error('❌ Enhanced client: Token refresh failed:', refreshError);
        isRefreshing = false;
        
        // Check if Azure token also expired
        if (refreshError.response?.data?.code === 'TOKEN_EXPIRED') {
          console.log('🔐 Enhanced client: Azure AD token expired, redirecting to login...');
          // Clear all tokens
          await AsyncStorage.multiRemove(['authToken', 'azureToken']);
          clearTokenCache();
          // Redirect to login
          router.replace('/login');
        }
      } finally {
        isRefreshing = false;
      }
    }
  }

  /**
   * Batch multiple requests efficiently
   */
  async batchRequest(requests, options = {}) {
    console.log(`📦 Enhanced client: Batch request with ${requests.length} requests`);
    
    // Prepare all configs
    const preparedRequests = await Promise.all(
      requests.map(async ({ config, options: requestOptions }) => ({
        config: await this.prepareConfig(config),
        options: requestOptions
      }))
    );
    
    // Use the API request manager's batch functionality
    const results = await apiRequestManager.batchRequest(preparedRequests, options);
    
    // Convert results to standard format
    return results.map(result => {
      if (result instanceof Error) {
        return {
          success: false,
          status: 500,
          message: result.message
        };
      }
      
      return {
        success: true,
        data: result,
        status: 200
      };
    });
  }

  /**
   * Clear all cached responses
   */
  async clearCache() {
    await apiRequestManager.clearCache();
    console.log('✅ Enhanced client: Cache cleared');
  }

  /**
   * Get performance statistics
   */
  async getStats() {
    const stats = await apiRequestManager.getStats();
    console.log('📊 Enhanced client stats:', stats);
    return stats;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    apiRequestManager.cleanupPendingRequests();
    console.log('🧹 Enhanced client: Cleanup completed');
  }
}

// Export singleton instance
export const enhancedApiClient = new EnhancedApiClient();

// Export individual functions for compatibility
export const clearTokenCache = enhancedApiClient.clearTokenCache;
export const updateTokenCache = enhancedApiClient.updateTokenCache;

export default enhancedApiClient; 