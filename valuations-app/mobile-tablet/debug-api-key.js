// Debug script for API key configuration and user context
const AsyncStorage = require('@react-native-async-storage/async-storage');
const { 
  API_KEY, 
  API_KEY_HEADER_NAME, 
  USER_CONTEXT_HEADER_NAME,
  validateApiKeyConfig 
} = require('./constants/apiConfig');

console.log('🔧 === API KEY DEBUG SCRIPT ===');

// Check API key configuration
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

// Check AsyncStorage for user context
console.log('\n🔧 === ASYNCSTORAGE DEBUG ===');
async function checkAsyncStorage() {
  try {
    const userContext = await AsyncStorage.getItem('userContext');
    const authToken = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('userData');
    
    console.log('🔧 User Context in AsyncStorage:', !!userContext);
    console.log('🔧 Auth Token in AsyncStorage:', !!authToken);
    console.log('🔧 User Data in AsyncStorage:', !!userData);
    
    if (userContext) {
      const parsed = JSON.parse(userContext);
      console.log('🔧 User Context Data:', parsed);
    }
    
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('🔧 User Data:', parsed);
    }
    
  } catch (error) {
    console.error('❌ Error reading AsyncStorage:', error);
  }
}

checkAsyncStorage().then(() => {
  console.log('\n🔧 === SETUP INSTRUCTIONS ===');
  console.log('1. Make sure you have logged in to the app');
  console.log('2. Check that your .env.development file has API_KEY set');
  console.log('3. The user context should be automatically set during login');
  console.log('4. If user context is missing, try logging out and back in');
  
  console.log('🔧 === END DEBUG SCRIPT ===');
});
