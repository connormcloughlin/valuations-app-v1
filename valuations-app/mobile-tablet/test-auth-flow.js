// Test script to verify authentication flow
// Run this with: node test-auth-flow.js

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...');
  
  try {
    // Test 1: Check if auth tokens exist
    console.log('\n1. Checking stored authentication data...');
    const token = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('userData');
    
    console.log('Auth token exists:', !!token);
    console.log('User data exists:', !!userData);
    
    if (token && userData) {
      console.log('✅ Authentication data found');
      const parsedUser = JSON.parse(userData);
      console.log('User:', parsedUser.email);
    } else {
      console.log('❌ No authentication data found');
    }
    
    // Test 2: Simulate app initialization
    console.log('\n2. Simulating app initialization...');
    console.log('This would normally initialize database and check auth status');
    
    // Test 3: Check timing
    console.log('\n3. Checking timing...');
    const startTime = Date.now();
    
    // Simulate the delay we added
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = Date.now();
    console.log(`Delay took ${endTime - startTime}ms`);
    
    console.log('\n✅ Authentication flow test completed');
    
  } catch (error) {
    console.error('❌ Error testing auth flow:', error);
  }
}

// Run the test
testAuthFlow(); 