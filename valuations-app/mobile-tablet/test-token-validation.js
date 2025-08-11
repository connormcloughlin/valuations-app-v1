// Test script to verify token validation
// Run this with: node test-token-validation.js

const fetch = require('node-fetch');
const { API_BASE_URL } = require('./constants/apiConfig');

async function testTokenValidation() {
  console.log('🧪 Testing token validation...');
  
  try {
    // Test 1: Test with invalid token
    console.log('\n1. Testing with invalid token...');
    const invalidToken = 'invalid.token.here';
    
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${invalidToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Invalid token correctly rejected');
    } else {
      console.log('❌ Invalid token not properly rejected');
    }
    
    // Test 2: Test with no token
    console.log('\n2. Testing with no token...');
    const noTokenResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', noTokenResponse.status);
    const noTokenResult = await noTokenResponse.json();
    console.log('Response:', noTokenResult);
    
    if (noTokenResponse.status === 401) {
      console.log('✅ No token correctly rejected');
    } else {
      console.log('❌ No token not properly rejected');
    }
    
    console.log('\n✅ Token validation test completed');
    
  } catch (error) {
    console.error('❌ Error testing token validation:', error);
  }
}

testTokenValidation();
