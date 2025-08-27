// Manual user context setup script for testing
import AsyncStorage from '@react-native-async-storage/async-storage';
import authApi from './api/auth';

console.log('🔧 === MANUAL USER CONTEXT SETUP ===');

// Create a test user context
const testUserContext = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  azureId: 'test-azure-id-123'
};

async function setupUserContext() {
  try {
    // Store user context in AsyncStorage
    await AsyncStorage.setItem('userContext', JSON.stringify(testUserContext));
    console.log('✅ User context stored in AsyncStorage');
    
    // Set user context in API client cache
    authApi.setUserContext(testUserContext);
    console.log('✅ User context set in API client cache');
    
    // Verify the setup
    const storedContext = await AsyncStorage.getItem('userContext');
    if (storedContext) {
      const parsed = JSON.parse(storedContext);
      console.log('✅ Verified user context in AsyncStorage:', parsed);
    }
    
    console.log('🎉 User context setup complete!');
    console.log('You can now test API calls with API key authentication.');
    
  } catch (error) {
    console.error('❌ Error setting up user context:', error);
  }
}

// Run the setup
setupUserContext();
