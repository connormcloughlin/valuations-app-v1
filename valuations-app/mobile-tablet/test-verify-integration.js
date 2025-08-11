// Test script to verify integration with the implemented verify API
// This tests the mobile app's verify calls against the backend implementation

const fetch = require('node-fetch');
const { API_BASE_URL } = require('./constants/apiConfig');

async function testVerifyIntegration() {
  console.log('🧪 Testing verify API integration...\n');
  
  try {
    // Test 1: Test with no token (should return normalized error)
    console.log('1. Testing with no token...');
    const noTokenResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', noTokenResponse.status);
    const noTokenResult = await noTokenResponse.json();
    console.log('Response:', noTokenResult);
    
    if (noTokenResult.valid === false && noTokenResult.code === 'INVALID_TOKEN') {
      console.log('✅ No token correctly returns normalized error response');
    } else {
      console.log('❌ No token response format unexpected');
    }
    
    // Test 2: Test with invalid token (should return normalized error)
    console.log('\n2. Testing with invalid token...');
    const invalidToken = 'invalid.token.here';
    
    const invalidResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${invalidToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', invalidResponse.status);
    const invalidResult = await invalidResponse.json();
    console.log('Response:', invalidResult);
    
    if (invalidResult.valid === false && invalidResult.code === 'INVALID_TOKEN') {
      console.log('✅ Invalid token correctly returns normalized error response');
    } else {
      console.log('❌ Invalid token response format unexpected');
    }
    
    // Test 3: Test with expired token (should return normalized error)
    console.log('\n3. Testing with expired token...');
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJleHAiOjE2MDAwMDAwMDB9.expired';
    
    const expiredResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', expiredResponse.status);
    const expiredResult = await expiredResponse.json();
    console.log('Response:', expiredResult);
    
    if (expiredResult.valid === false && expiredResult.code === 'INVALID_TOKEN') {
      console.log('✅ Expired token correctly returns normalized error response');
    } else {
      console.log('❌ Expired token response format unexpected');
    }
    
    // Test 4: Test rate limiting (if we can trigger it)
    console.log('\n4. Testing rate limiting behavior...');
    console.log('Note: This would require multiple rapid requests to trigger rate limiting');
    console.log('The mobile app should handle RATE_LIMITED responses gracefully');
    
    console.log('\n✅ Verify API integration tests completed!');
    console.log('\n📝 Summary:');
    console.log('- All error responses should be normalized (valid: false, code: INVALID_TOKEN)');
    console.log('- Mobile app should handle these responses correctly');
    console.log('- Rate limiting should be handled gracefully');
    console.log('- Fresh user data should be retrieved on successful validation');
    
  } catch (error) {
    console.error('❌ Error testing verify integration:', error);
  }
}

// Run the tests
testVerifyIntegration();
