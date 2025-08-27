// Simple API key check script - run this to verify your configuration
console.log('🔧 === API KEY CONFIGURATION CHECK ===');

// Check if environment variables are loaded
console.log('🔧 Environment Variables:');
console.log('   API_KEY:', process.env.API_KEY ? '✅ Set' : '❌ Missing');
console.log('   API_BASE_URL:', process.env.API_BASE_URL || '❌ Missing');

// Check if .env files exist
const fs = require('fs');
const path = require('path');

console.log('\n🔧 Environment Files:');
const envFiles = ['.env', '.env.development', '.env.staging', '.env.production'];
envFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
});

console.log('\n🔧 === TROUBLESHOOTING ===');
if (!process.env.API_KEY) {
  console.log('❌ API_KEY is not set!');
  console.log('💡 Solutions:');
  console.log('   1. Create a .env.development file in the valuations-app folder');
  console.log('   2. Add: API_KEY=your-actual-api-key');
  console.log('   3. Restart your development server');
} else {
  console.log('✅ API_KEY is configured');
  console.log('💡 Next step: Login to the app to set up user context');
}

console.log('\n🔧 === QUICK FIX ===');
console.log('If API_KEY is missing, create .env.development with:');
console.log('API_KEY=your-dev-api-key');
console.log('API_BASE_URL=http://192.168.0.105:5000/api');

console.log('\n🔧 === END CHECK ===');
