// Test script to verify the exact URL being called for verify endpoint
// This will help debug the network connectivity issue

const axios = require('axios');
const Constants = require('expo-constants');

// Simulate the same configuration as the mobile app
const API_CONFIG = {
  BASE_URL: 'http://192.168.0.105:5000/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

console.log('🧪 Testing verify endpoint URL...\n');

// Create axios instance with same config as mobile app
const testClient = axios.create(API_CONFIG);

// Add request interceptor for logging
testClient.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('🚀 Test request details:');
    console.log('🚀 Full URL:', fullUrl);
    console.log('🚀 Method:', config.method?.toUpperCase());
    console.log('🚀 Headers:', config.headers);
    console.log('🚀 Timeout:', config.timeout);
    return config;
  }
);

async function testVerifyUrl() {
  try {
    console.log('1. Testing verify endpoint with no token...');
    
    const response = await testClient.get('/auth/verify');
    console.log('✅ Success response:', response.status, response.data);
    
  } catch (error) {
    console.log('❌ Error response:');
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Status Text:', error.response?.statusText);
    console.log('❌ Data:', error.response?.data);
    console.log('❌ Error Code:', error.code);
    console.log('❌ Error Message:', error.message);
    
    if (error.code === 'ERR_NETWORK') {
      console.log('\n🔍 Network Error Analysis:');
      console.log('🔍 This suggests the server is not reachable');
      console.log('🔍 Possible causes:');
      console.log('   - Backend server not running');
      console.log('   - Wrong IP address or port');
      console.log('   - Firewall blocking connection');
      console.log('   - Network connectivity issues');
    }
  }
}

// Run the test
testVerifyUrl();
