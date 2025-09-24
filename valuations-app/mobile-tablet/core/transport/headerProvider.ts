import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  isApiKeyMode, 
  isJwtMode, 
  API_KEY, 
  API_KEY_HEADER_NAME, 
  USER_CONTEXT_HEADER_NAME 
} from '../../constants/apiConfig';

/**
 * Header provider for transport client
 * Handles authentication headers based on current auth mode
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  try {
    if (isApiKeyMode()) {
      // API Key authentication mode
      if (API_KEY) {
        headers[API_KEY_HEADER_NAME] = API_KEY;
        
        // Get user context from storage
        const userContext = await AsyncStorage.getItem('userContext');
        if (userContext) {
          try {
            const parsedContext = JSON.parse(userContext);
            if (parsedContext.email) {
              // Send the JSON context header
              headers[USER_CONTEXT_HEADER_NAME] = userContext;
              
              // Send individual user context headers for backend compatibility
              headers['x-user-id'] = parsedContext.id || parsedContext.azureId;
              headers['x-user-email'] = parsedContext.email;
              headers['x-user-name'] = parsedContext.name;
              headers['x-user-type'] = parsedContext.role || parsedContext.userType || 'Surveyor';
              headers['x-user-roles'] = parsedContext.roles || parsedContext.userRoles || 'Surveyor';
              headers['x-user-groups'] = '';
              headers['x-user-entity-mappings'] = '';
              
              // Send mobile-specific headers
              headers['x-mobile-user-id'] = parsedContext.id || parsedContext.azureId;
              headers['x-mobile-user-email'] = parsedContext.email;
              headers['x-mobile-user-name'] = parsedContext.name;
              headers['x-mobile-user-type'] = parsedContext.role || parsedContext.userType || 'Surveyor';
              headers['x-mobile-user-roles'] = parsedContext.roles || parsedContext.userRoles || 'Surveyor';
              headers['x-mobile-user-groups'] = '';
              headers['x-mobile-entity-mappings'] = '';
              
              // Determine user role based on email
              const email = parsedContext.email?.toLowerCase() || '';
              if (email.includes('admin') || email.includes('administrator')) {
                headers['x-user-type'] = 'Admin';
                headers['x-user-roles'] = 'Admin';
                headers['x-mobile-user-type'] = 'Admin';
                headers['x-mobile-user-roles'] = 'Admin';
              } else if (email.includes('manager') || email.includes('supervisor')) {
                headers['x-user-type'] = 'Manager';
                headers['x-user-roles'] = 'Manager';
                headers['x-mobile-user-type'] = 'Manager';
                headers['x-mobile-user-roles'] = 'Manager';
              } else if (email.includes('office') || email.includes('backoffice')) {
                headers['x-user-type'] = 'Office Staff';
                headers['x-user-roles'] = 'Office Staff';
                headers['x-mobile-user-type'] = 'Office Staff';
                headers['x-mobile-user-roles'] = 'Office Staff';
              }
            }
          } catch (parseError) {
            console.error('❌ Error parsing user context:', parseError);
            // Still send the raw context in case backend can handle it
            headers[USER_CONTEXT_HEADER_NAME] = userContext;
          }
        }
      }
    } else if (isJwtMode()) {
      // JWT authentication mode
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('❌ Error getting auth headers:', error);
  }

  return headers;
}
