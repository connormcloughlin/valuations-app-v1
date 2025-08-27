// Simple API key configuration test
const Constants = require('expo-constants');

console.log('🔧 === API KEY CONFIGURATION TEST ===');

// Check environment variables
console.log('🔧 process.env.API_KEY:', !!process.env.API_KEY);
console.log('🔧 process.env.API_BASE_URL:', process.env.API_BASE_URL);

// Check Expo constants
console.log('🔧 Constants.expoConfig?.extra?.apiKey:', !!Constants.expoConfig?.extra?.apiKey);
console.log('🔧 Constants.expoConfig?.extra?.apiBaseUrl:', Constants.expoConfig?.extra?.apiBaseUrl);

// Check if API key is configured
const apiKey = process.env.API_KEY || Constants.expoConfig?.extra?.apiKey;
const apiBaseUrl = process.env.API_BASE_URL || Constants.expoConfig?.extra?.apiBaseUrl;

console.log('\n🔧 === CONFIGURATION SUMMARY ===');
console.log('🔧 API Key configured:', !!apiKey);
console.log('🔧 API Base URL:', apiBaseUrl);

if (apiKey) {
  console.log('🔧 API Key length:', apiKey.length);
  console.log('🔧 API Key preview:', apiKey.substring(0, 8) + '...');
} else {
  console.log('❌ API Key is missing!');
  console.log('💡 Make sure to set API_KEY in your .env.development file');
}

console.log('\n🔧 === ENVIRONMENT FILES CHECK ===');
console.log('💡 Check if these files exist:');
console.log('   - .env.development');
console.log('   - .env.staging');
console.log('   - .env.production');

console.log('\n🔧 === NEXT STEPS ===');
console.log('1. If API key is missing, create/update .env.development file');
console.log('2. Set API_KEY=your-actual-api-key in the file');
console.log('3. Restart the development server');
console.log('4. Login to the app to set up user context');

console.log('🔧 === END TEST ===');
