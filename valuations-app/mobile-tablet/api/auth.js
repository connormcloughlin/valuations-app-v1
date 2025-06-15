import apiClient from './client';

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
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Exchange Azure AD token for API token
   * @param {string} azureToken - Azure AD access token
   * @returns {Promise<Object>} Response with API token
   */
  exchangeToken: async (azureToken) => {
    try {
      console.log('🔄 === TOKEN EXCHANGE START ===');
      console.log(`🔄 Azure AD token length: ${azureToken.length} characters`);
      console.log(`🔄 Azure AD token (first 50 chars): ${azureToken.substring(0, 50)}...`);
      console.log(`🔄 Azure AD token (last 50 chars): ...${azureToken.substring(azureToken.length - 50)}`);
      console.log(`🔄 Calling endpoint: /auth/token-exchange`);
      console.log(`🔄 Request payload: { azureToken: "[AZURE_TOKEN]" }`);
      
      // Temporarily set the Azure AD token for this request
      const originalAuth = apiClient.defaults.headers.common['Authorization'];
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${azureToken}`;
      
      console.log(`🔄 Making POST request to token exchange endpoint...`);
      const response = await apiClient.post('/auth/token-exchange', {
        azureToken: azureToken
      });
      
      // Restore original auth header
      if (originalAuth) {
        apiClient.defaults.headers.common['Authorization'] = originalAuth;
      } else {
        delete apiClient.defaults.headers.common['Authorization'];
      }
      
      console.log('🔄 === TOKEN EXCHANGE SUCCESS ===');
      console.log(`🔄 Response status: ${response.status}`);
      console.log(`🔄 Response success: ${response.success}`);
      console.log(`🔄 Response data:`, response.data);
      console.log(`🔄 API token received: ${response.data?.token ? 'Yes' : 'No'}`);
      console.log(`🔄 API token length: ${response.data?.token?.length || 0} characters`);
      if (response.data?.token) {
        console.log(`🔄 API token (first 50 chars): ${response.data.token.substring(0, 50)}...`);
        console.log(`🔄 API token (last 50 chars): ...${response.data.token.substring(response.data.token.length - 50)}`);
      }
      console.log('🔄 === END TOKEN EXCHANGE SUCCESS ===');
      
      // Set the new API token automatically if included in response
      if (response.data?.token) {
        authApi.setAuthToken(response.data.token);
        console.log('🔄 API token set in client for subsequent requests');
      }
      
      return response;
    } catch (error) {
      console.error('❌ === TOKEN EXCHANGE ERROR ===');
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error status:', error.status);
      console.error('❌ Error success:', error.success);
      console.error('❌ Full error object:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ === END TOKEN EXCHANGE ERROR ===');
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