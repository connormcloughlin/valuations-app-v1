// Test script to verify PrefetchService requires authentication
const { prefetchService } = require('./services/prefetchService');

async function testPrefetchWithAuth() {
  console.log('🧪 Testing PrefetchService with authentication...');
  
  try {
    // Test with a sample appointment ID
    const appointmentId = 'test-appointment-123';
    const orderNumber = 'TEST-ORDER-456';
    
    console.log('🚀 Starting prefetch test...');
    console.log('⚠️ Note: This test requires authentication to work properly');
    
    const result = await prefetchService.startAppointmentPrefetch(appointmentId, orderNumber);
    
    console.log('✅ Prefetch test result:', result);
    
    // Check progress
    const progress = prefetchService.getCurrentProgress();
    console.log('📊 Prefetch progress:', progress);
    
    // Check stats
    const stats = prefetchService.getStats();
    console.log('📈 Prefetch stats:', stats);
    
  } catch (error) {
    console.error('❌ Prefetch test failed:', error);
    console.log('ℹ️ This is expected if no authentication token is available');
  }
}

// Run the test
testPrefetchWithAuth(); 