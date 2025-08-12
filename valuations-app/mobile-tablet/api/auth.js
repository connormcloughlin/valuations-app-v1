import apiClient, { updateTokenCache, clearTokenCache } from './client';

/**
 * Authentication related API methods
 */
const authApi = {
  /**
   * Set authentication token for subsequent requests
   * @param {string} token - JWT token
   */
  setAuthToken: (token) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateTokenCache(token); // Update the cache
      console.log('🔐 Auth token set and cached');
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      clearTokenCache(); // Clear the cache
      console.log('🔐 Auth token cleared');
    }
  },

  /**
   * Verify token with the backend
   * @returns {Promise<Object>} Response with validation result
   */
  verifyToken: async () => {
    try {
      console.log('🔐 Verifying token...');
      
      const response = await apiClient.get('/auth/verify');
      console.log('🔐 Token verification successful');
      return response;
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      
      // Handle the normalized error responses from the backend
      if (error.response?.data) {
        // Return the normalized error response from the backend
        return {
          success: false,
          data: error.response.data,
          message: error.response.data.message || error.message
        };
      }
      
      // Fallback for network errors or other issues
      return {
        success: false,
        data: {
          valid: false,
          message: 'Network error during token verification',
          code: 'VERIFICATION_ERROR'
        },
        message: error.message
      };
    }
  },

  /**
   * Exchange Azure AD token for API token
   * @param {string} azureToken - Azure AD access token
   * @param {Object} userInfo - Additional user information from Azure AD
   * @returns {Promise<Object>} Response with API token
   */
  exchangeToken: async (azureToken, userInfo = null) => {
    try {
      console.log('🔄 Starting token exchange...');
      
      // Validate inputs
      if (!azureToken) {
        throw new Error('Azure token is required for token exchange');
      }
      
      // Temporarily set the Azure AD token for this request
      const originalAuth = apiClient.defaults.headers.common['Authorization'];
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${azureToken}`;
      
      const requestData = {
        azureToken: azureToken,
        userInfo: userInfo || {}
      };
      
      const response = await apiClient.post('/auth/token-exchange', requestData);
      
      // Restore original auth header
      if (originalAuth) {
        apiClient.defaults.headers.common['Authorization'] = originalAuth;
      } else {
        delete apiClient.defaults.headers.common['Authorization'];
      }
      
      console.log('🔄 Token exchange successful');
      
      // Set the new API token automatically if included in response
      if (response.data?.token) {
        authApi.setAuthToken(response.data.token);
        console.log('🔄 API token set in client for subsequent requests');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Token exchange error:', error.message);
      
      // Handle different types of errors
      if (error.response?.data) {
        // Server returned an error response
        return {
          success: false,
          status: error.response.status,
          data: error.response.data,
          message: error.response.data.message || error.message
        };
      } else if (error.code === 'ERR_NETWORK') {
        // Network error (server not reachable)
        return {
          success: false,
          status: 0,
          data: {
            code: 'NETWORK_ERROR',
            message: 'Unable to reach the server. Please check your connection.'
          },
          message: 'Network error during token exchange'
        };
      } else if (error.code === 'ECONNABORTED') {
        // Request timeout
        return {
          success: false,
          status: 0,
          data: {
            code: 'TIMEOUT_ERROR',
            message: 'Request timed out. Please try again.'
          },
          message: 'Token exchange request timed out'
        };
      } else {
        // Other errors
        return {
          success: false,
          status: 0,
          data: {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred during token exchange.'
          },
          message: error.message || 'Unknown error during token exchange'
        };
      }
    }
  },

  /**
   * Login user and get authentication token
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Response with token
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Set auth token automatically if included in response
      if (response.data?.token) {
        authApi.setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  }
};

export default authApi; 