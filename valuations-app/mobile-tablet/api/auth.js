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
      console.log('🔐 Verifying token with backend...');
      
      // Log the full URL being called
      const fullUrl = `${apiClient.defaults.baseURL}/auth/verify`;
      console.log('🔐 Full verify URL:', fullUrl);
      console.log('🔐 API Client base URL:', apiClient.defaults.baseURL);
      console.log('🔐 Current auth header:', apiClient.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
      
      // Log complete request configuration
      console.log('🔐 === COMPLETE REQUEST DETAILS ===');
      console.log('🔐 Method: GET');
      console.log('🔐 URL: /auth/verify');
      console.log('🔐 Base URL:', apiClient.defaults.baseURL);
      console.log('🔐 Full URL:', fullUrl);
      console.log('🔐 Timeout:', apiClient.defaults.timeout);
      console.log('🔐 Headers:', {
        'Content-Type': apiClient.defaults.headers.common['Content-Type'],
        'Accept': apiClient.defaults.headers.common['Accept'],
        'Authorization': apiClient.defaults.headers.common['Authorization'] ? 
          `Bearer ${apiClient.defaults.headers.common['Authorization'].substring(7, 20)}...` : 'None'
      });
      console.log('🔐 === END REQUEST DETAILS ===');
      
      const response = await apiClient.get('/auth/verify');
      console.log('🔐 Token verification response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      console.error('❌ Full error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        headers: error.config?.headers
      });
      
      // Log the complete failed request details
      console.error('❌ === FAILED REQUEST DETAILS ===');
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Request Base URL:', error.config?.baseURL);
      console.error('❌ Full Request URL:', `${error.config?.baseURL}${error.config?.url}`);
      console.error('❌ Request Method:', error.config?.method);
      console.error('❌ Request Headers:', error.config?.headers);
      console.error('❌ Request Timeout:', error.config?.timeout);
      console.error('❌ Network Error Code:', error.code);
      console.error('❌ Network Error Message:', error.message);
      console.error('❌ === END FAILED REQUEST DETAILS ===');
      
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
      console.log('🔄 Azure token length:', azureToken ? azureToken.length : 0);
      console.log('🔄 User info being sent:', userInfo);
      
      // Validate inputs
      if (!azureToken) {
        throw new Error('Azure token is required for token exchange');
      }
      
      // Log the full URL being called
      const fullUrl = `${apiClient.defaults.baseURL}/auth/token-exchange`;
      console.log('🔄 Full token exchange URL:', fullUrl);
      console.log('🔄 API Client base URL:', apiClient.defaults.baseURL);
      
      // Temporarily set the Azure AD token for this request
      const originalAuth = apiClient.defaults.headers.common['Authorization'];
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${azureToken}`;
      
      const requestData = {
        azureToken: azureToken,
        userInfo: userInfo || {}
      };
      
      console.log('🔄 Token exchange request data:', {
        azureToken: azureToken ? `${azureToken.substring(0, 20)}...` : 'null',
        userInfo: userInfo
      });
      
      // Log complete request configuration
      console.log('🔄 === TOKEN EXCHANGE REQUEST DETAILS ===');
      console.log('🔄 Method: POST');
      console.log('🔄 URL: /auth/token-exchange');
      console.log('🔄 Base URL:', apiClient.defaults.baseURL);
      console.log('🔄 Full URL:', fullUrl);
      console.log('🔄 Timeout:', apiClient.defaults.timeout);
      console.log('🔄 Headers:', {
        'Content-Type': apiClient.defaults.headers.common['Content-Type'],
        'Accept': apiClient.defaults.headers.common['Accept'],
        'Authorization': apiClient.defaults.headers.common['Authorization'] ? 
          `Bearer ${apiClient.defaults.headers.common['Authorization'].substring(7, 20)}...` : 'None'
      });
      console.log('🔄 === END TOKEN EXCHANGE REQUEST ===');
      
      const response = await apiClient.post('/auth/token-exchange', requestData);
      
      // Restore original auth header
      if (originalAuth) {
        apiClient.defaults.headers.common['Authorization'] = originalAuth;
      } else {
        delete apiClient.defaults.headers.common['Authorization'];
      }
      
      console.log('🔄 Token exchange successful');
      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response data:', response.data);
      
      // Set the new API token automatically if included in response
      if (response.data?.token) {
        authApi.setAuthToken(response.data.token);
        console.log('🔄 API token set in client for subsequent requests');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Token exchange error:', error.message);
      
      // Log the complete error details
      console.error('❌ === TOKEN EXCHANGE ERROR DETAILS ===');
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Code:', error.code);
      console.error('❌ Error Status:', error.response?.status);
      console.error('❌ Error Status Text:', error.response?.statusText);
      console.error('❌ Error URL:', error.config?.url);
      console.error('❌ Error Base URL:', error.config?.baseURL);
      console.error('❌ Error Method:', error.config?.method);
      console.error('❌ Error Headers:', error.config?.headers);
      console.error('❌ Error Data:', error.config?.data);
      console.error('❌ Response Data:', error.response?.data);
      console.error('❌ === END TOKEN EXCHANGE ERROR ===');
      
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