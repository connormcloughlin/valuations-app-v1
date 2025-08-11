// Test script to verify the token validation fix
// This simulates the authentication flow to ensure expired tokens are properly rejected

const jwt = require('jsonwebtoken');

// Mock JWT decode function (same as in AuthContext)
const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded;
  } catch (error) {
    console.error('❌ Failed to decode JWT:', error);
    return null;
  }
};

// Mock token expiration check (same as in AuthContext)
const isTokenExpired = (token) => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true; // Consider invalid if no expiration
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true; // Consider expired on error
  }
};

// Test cases
function runTests() {
  console.log('🧪 Testing token validation logic...\n');

  // Test 1: Valid token (not expired)
  console.log('1. Testing valid token...');
  const validToken = jwt.sign(
    { 
      id: '1', 
      email: 'test@example.com', 
      role: 'user',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    },
    'test-secret'
  );
  
  const isValid = !isTokenExpired(validToken);
  console.log(`   Valid token result: ${isValid ? '✅ PASS' : '❌ FAIL'}`);

  // Test 2: Expired token
  console.log('\n2. Testing expired token...');
  const expiredToken = jwt.sign(
    { 
      id: '1', 
      email: 'test@example.com', 
      role: 'user',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    },
    'test-secret'
  );
  
  const isExpired = isTokenExpired(expiredToken);
  console.log(`   Expired token result: ${isExpired ? '✅ PASS' : '❌ FAIL'}`);

  // Test 3: Invalid token
  console.log('\n3. Testing invalid token...');
  const invalidToken = 'invalid.token.here';
  const isInvalid = isTokenExpired(invalidToken);
  console.log(`   Invalid token result: ${isInvalid ? '✅ PASS' : '❌ FAIL'}`);

  // Test 4: Token without expiration
  console.log('\n4. Testing token without expiration...');
  const noExpToken = jwt.sign(
    { 
      id: '1', 
      email: 'test@example.com', 
      role: 'user',
      name: 'Test User'
      // No exp field
    },
    'test-secret'
  );
  
  const hasNoExp = isTokenExpired(noExpToken);
  console.log(`   Token without expiration result: ${hasNoExp ? '✅ PASS' : '❌ FAIL'}`);

  // Test 5: Empty token
  console.log('\n5. Testing empty token...');
  const isEmpty = isTokenExpired('');
  console.log(`   Empty token result: ${isEmpty ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n✅ Token validation tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Valid tokens should return false (not expired)');
  console.log('- Expired tokens should return true (expired)');
  console.log('- Invalid tokens should return true (expired)');
  console.log('- Tokens without expiration should return true (expired)');
  console.log('- Empty tokens should return true (expired)');
}

// Run the tests
runTests();
