import Constants from 'expo-constants';

// API base URL for the mobile-tablet app (must be provided via env or app config)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 
                           Constants.expoConfig?.extra?.apiBaseUrl || 
                           '';

if (!API_BASE_URL) {
  // Fail-fast: base URL must be configured; do not silently fall back
  console.error('❌ API_BASE_URL is not configured. Set EXPO_PUBLIC_API_BASE_URL or app.config extra.apiBaseUrl');
}

// User Context Header Configuration (JWT-only mode)
export const USER_CONTEXT_HEADER_NAME = Constants.expoConfig?.extra?.userContextHeaderName || 'X-User-Context';

// Authentication mode detection (JWT only as per S2 requirements)
export const isJwtMode = () => true; // Always use JWT mode