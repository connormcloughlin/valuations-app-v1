import sessionService from '../auth/sessionService';
import { isJwtMode } from '../../constants/apiConfig';

/**
 * Header provider for transport client
 * Uses sessionService for secure token and user context management
 */
export async function getAuthHeaders(endpointId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  try {
    // Special case: token exchange endpoint should not require authentication
    // since we're exchanging Azure token FOR a JWT token
    if (endpointId === 'auth.token-exchange') {
      console.log('🔐 Token exchange endpoint - skipping session authentication');
      return headers;
    }

    if (isJwtMode()) {
      // Get headers from session service (includes JWT token and hashed user context)
      const sessionHeaders = await sessionService.getAuthHeaders();
      Object.assign(headers, sessionHeaders);
      
      console.log('🔐 Headers provided by sessionService');
    } else {
      console.warn('⚠️ API Key mode is deprecated as per S2 requirements');
    }
  } catch (error) {
    console.error('❌ Error getting auth headers from sessionService:', error);
  }

  return headers;
}
