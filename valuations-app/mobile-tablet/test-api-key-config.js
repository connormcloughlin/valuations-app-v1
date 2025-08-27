// Test script to verify API key configuration
import { 
  isApiKeyMode, 
  isJwtMode, 
  API_KEY, 
  API_KEY_HEADER_NAME, 
  USER_CONTEXT_HEADER_NAME,
  validateApiKeyConfig 
} from './constants/apiConfig';

console.log('🔧 === API KEY CONFIGURATION TEST ===');
console.log('🔧 API Key Mode:', isApiKeyMode());
console.log('🔧 JWT Mode:', isJwtMode());
console.log('🔧 API Key configured:', !!API_KEY);
console.log('🔧 API Key Header Name:', API_KEY_HEADER_NAME);
console.log('🔧 User Context Header Name:', USER_CONTEXT_HEADER_NAME);
console.log('🔧 Config Valid:', validateApiKeyConfig());

if (API_KEY) {
  console.log('🔧 API Key length:', API_KEY.length);
  console.log('🔧 API Key preview:', API_KEY.substring(0, 8) + '...');
} else {
  console.log('❌ API Key is missing!');
}

console.log('🔧 === END API KEY CONFIGURATION TEST ===');
