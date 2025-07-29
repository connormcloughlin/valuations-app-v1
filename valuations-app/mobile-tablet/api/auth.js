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
   * Exchange Azure AD token for API token
   * @param {string} azureToken - Azure AD access token
   * @param {Object} userInfo - Additional user information from Azure AD
   * @returns {Promise<Object>} Response with API token
   */
  exchangeToken: async (azureToken, userInfo = null) => {
    try {
      console.log('🔄 Starting token exchange...');
      console.log('🔄 User info being sent:', userInfo);
      
      // Temporarily set the Azure AD token for this request
      const originalAuth = apiClient.defaults.headers.common['Authorization'];
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${azureToken}`;
      
      const requestData = {
        azureToken: azureToken,
        userInfo: userInfo || {}
      };
      
      console.log('🔄 Token exchange request data:', requestData);
      
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
      return error.success === false ? error : { success: false, message: error.message };
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