// Test script for Expo environment configuration
import Constants from 'expo-constants';

console.log('🔧 === EXPO API KEY CONFIGURATION TEST ===');

// Check Expo constants (this is how Expo loads environment variables)
console.log('🔧 Expo Constants:');
console.log('   Constants.expoConfig?.extra?.apiKey:', !!Constants.expoConfig?.extra?.apiKey);
console.log('   Constants.expoConfig?.extra?.apiBaseUrl:', Constants.expoConfig?.extra?.apiBaseUrl);

// Check if API key is configured
const apiKey = Constants.expoConfig?.extra?.apiKey;
const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

console.log('\n🔧 === CONFIGURATION SUMMARY ===');
console.log('🔧 API Key configured:', !!apiKey);
console.log('🔧 API Base URL:', apiBaseUrl);

if (apiKey) {
  console.log('🔧 API Key length:', apiKey.length);
  console.log('🔧 API Key preview:', apiKey.substring(0, 8) + '...');
  console.log('✅ API Key is properly configured!');
} else {
  console.log('❌ API Key is missing from Expo constants!');
  console.log('💡 This means the environment variables are not being loaded into Expo');
}

console.log('\n🔧 === NEXT STEPS ===');
if (apiKey) {
  console.log('✅ API Key is configured correctly');
  console.log('💡 Now login to the app to set up user context');
  console.log('💡 The API calls should work with API key authentication');
} else {
  console.log('❌ API Key is not configured');
  console.log('💡 Check your app.config.js file');
  console.log('💡 Make sure environment variables are properly mapped');
}

console.log('🔧 === END TEST ===');










