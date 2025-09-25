import transportClient from '../core/transport/transportClient';
import { 
  isApiKeyMode, 
  isJwtMode, 
  API_KEY, 
  API_KEY_HEADER_NAME, 
  USER_CONTEXT_HEADER_NAME,
  validateApiKeyConfig 
} from '../constants/apiConfig';

/**
 * Authentication related API methods
 */
const authApi = {
  /**
   * Set authentication token for subsequent requests (JWT mode only)
   * @param {string} token - JWT token
   */
  setAuthToken: (token) => {
    if (isJwtMode()) {
      // Note: JWT mode not supported in API key mode
      console.log('⚠️ setAuthToken called but not in JWT mode');
    } else {
      console.log('⚠️ setAuthToken called but not in JWT mode');
    }
  },

  /**
   * Set user context for API key mode
   * @param {Object|null} userContext - User context object or null to clear
   */
  setUserContext: (userContext) => {
    if (isApiKeyMode()) {
      if (userContext) {
        console.log('👤 User context set for API key mode');
      } else {
        console.log('👤 User context cleared');
      }
    } else {
      console.log('⚠️ setUserContext called but not in API key mode');
    }
  },

  /**
   * Get current authentication mode
   * @returns {string} 'jwt' or 'api_key'
   */
  getAuthMode: () => {
    if (isApiKeyMode()) return 'api_key';
    if (isJwtMode()) return 'jwt';
    return 'unknown';
  },

  /**
   * Check if API key configuration is valid
   * @returns {boolean} True if valid
   */
  isApiKeyConfigValid: () => {
    return validateApiKeyConfig();
  },

  /**
   * Verify authentication with the backend
   * @returns {Promise<Object>} Response with validation result
   */
  verifyAuth: async () => {
    try {
      if (isApiKeyMode()) {
        console.log('🔑 Verifying API key authentication...');
        // For API key mode, we can verify by making a simple request
        const response = await transportClient.get('auth.verify', '/auth/verify');
        console.log('🔑 API key authentication verification successful');
        return response;
      } else if (isJwtMode()) {
        console.log('🔐 Verifying JWT token...');
        const response = await transportClient.get('auth.verify', '/auth/verify');
        console.log('🔐 JWT token verification successful');
        return response;
      } else {
        throw new Error('Unknown authentication mode');
      }
    } catch (error) {
      console.error('❌ Authentication verification error:', error.message);
      
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
          message: 'Network error during authentication verification',
          code: 'VERIFICATION_ERROR'
        },
        message: error.message
      };
    }
  },

  /**
   * Verify token with the backend (JWT mode only - deprecated)
   * @returns {Promise<Object>} Response with validation result
   */
  verifyToken: async () => {
    if (!isJwtMode()) {
      console.warn('⚠️ verifyToken called but not in JWT mode, use verifyAuth instead');
      return {
        success: false,
        data: {
          valid: false,
          message: 'verifyToken is deprecated for API key mode, use verifyAuth instead',
          code: 'DEPRECATED_METHOD'
        }
      };
    }
    return authApi.verifyAuth();
  },

  /**
   * Exchange Azure AD token for API token (JWT mode only)
   * @param {string} azureToken - Azure AD access token
   * @param {Object} userInfo - Additional user information from Azure AD
   * @returns {Promise<Object>} Response with API token
   */
  exchangeToken: async (azureToken, userInfo = null) => {
    if (!isJwtMode()) {
      console.warn('⚠️ exchangeToken called but not in JWT mode');
      return {
        success: false,
        data: {
          message: 'Token exchange is not available in API key mode',
          code: 'DEPRECATED_METHOD'
        }
      };
    }

    try {
      console.log('🔄 Starting token exchange...');
      console.log('🔄 Endpoint: /auth/token-exchange');
      console.log('🔄 Azure token length:', azureToken ? azureToken.length : 'null');
      console.log('🔄 User info:', userInfo);
      
      // Validate inputs
      if (!azureToken) {
        throw new Error('Azure token is required for token exchange');
      }
      
      const requestData = {
        azureToken: azureToken,
        userInfo: userInfo || {}
      };
      
      console.log('🔄 Request data structure:', {
        hasAzureToken: !!requestData.azureToken,
        azureTokenPreview: requestData.azureToken ? requestData.azureToken.substring(0, 20) + '...' : 'null',
        userInfo: requestData.userInfo
      });
      
      console.log('🔄 Making POST request to /auth/token-exchange...');
      const response = await transportClient.post('auth.token-exchange', '/auth/token-exchange', requestData);
      
      console.log('🔄 Token exchange response received:');
      console.log('🔄 Response success:', response?.success);
      console.log('🔄 Response status:', response?.status);
      console.log('🔄 Response data keys:', response?.data ? Object.keys(response.data) : 'no data');
      console.log('🔄 Full response structure:', JSON.stringify(response, null, 2));
      
      // Normalize success shapes from backend (token may be top-level or under data)
      const normalized = {
        success: response?.success ?? true,
        status: response?.status ?? 200,
        data: response?.data ?? response
      };

      const token = normalized.data?.token || normalized.token;
      const refreshToken = normalized.data?.refreshToken || normalized.refreshToken;

      if (token) {
        authApi.setAuthToken(token);
        console.log('🔄 API token set in client for subsequent requests');
      }
      
      return normalized;
    } catch (error) {
      console.error('❌ Token exchange error details:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response headers:', error.response?.headers);
      console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
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
   * Refresh JWT token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Response with new token
   */
  refreshToken: async (refreshToken) => {
    if (!isJwtMode()) {
      console.warn('⚠️ refreshToken called but not in JWT mode');
      return {
        success: false,
        data: {
          message: 'Token refresh is not available in API key mode',
          code: 'DEPRECATED_METHOD'
        }
      };
    }

    try {
      console.log('🔄 Starting token refresh...');
      
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }
      
      const requestData = {
        refreshToken: refreshToken
      };
      
      const response = await transportClient.post('auth.refresh-token', '/auth/refresh-token', requestData);
      
      console.log('🔄 Token refresh successful');
      
      return response;
    } catch (error) {
      console.error('❌ Token refresh error:', error.message);
      
      // Handle different types of errors
      if (error.response?.data) {
        return {
          success: false,
          status: error.response.status,
          data: error.response.data,
          message: error.response.data.message || error.message
        };
      } else if (error.code === 'ERR_NETWORK') {
        return {
          success: false,
          status: 0,
          data: {
            code: 'NETWORK_ERROR',
            message: 'Unable to reach the server. Please check your connection.'
          },
          message: 'Network error during token refresh'
        };
      } else if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          status: 0,
          data: {
            code: 'TIMEOUT_ERROR',
            message: 'Request timed out. Please try again.'
          },
          message: 'Token refresh request timed out'
        };
      } else {
        return {
          success: false,
          status: 0,
          data: {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred during token refresh.'
          },
          message: error.message || 'Unknown error during token refresh'
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
      const response = await transportClient.post('auth.login', '/auth/login', credentials);
      
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