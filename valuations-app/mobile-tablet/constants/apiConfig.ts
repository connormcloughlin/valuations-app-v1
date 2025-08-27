import Constants from 'expo-constants';

// API base URL for the mobile-tablet app
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 
                           Constants.expoConfig?.extra?.apiBaseUrl || 
                           'https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api';

// API Key Authentication Configuration
export const API_KEY = Constants.expoConfig?.extra?.apiKey;
export const API_KEY_HEADER_NAME = Constants.expoConfig?.extra?.apiKeyHeaderName || 'X-API-Key';
export const USER_CONTEXT_HEADER_NAME = Constants.expoConfig?.extra?.userContextHeaderName || 'X-User-Context';

// Authentication mode detection (API Key only)
export const isApiKeyMode = () => true; // Always use API key mode
export const isJwtMode = () => false; // Never use JWT mode

// API Key validation
export const validateApiKeyConfig = () => {
  if (isApiKeyMode() && !API_KEY) {
    console.warn('API Key mode enabled but no API key provided');
    return false;
  }
  return true;
}; 