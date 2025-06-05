// Test our mobile app's media API integration
const api = require('./api/index.ts').default;

// Simple test image as base64
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0DC+hwAAAABJRU5ErkJggg==';

async function testMobileMediaIntegration() {
  console.log('🔄 Testing Mobile App Media Integration...\n');

  try {
    // Test 1: Upload media using our mobile API
    console.log('1️⃣ Testing Mobile App Media Upload');
    const uploadResult = await api.uploadMedia({
      fileName: 'mobile-app-test.png',
      fileType: 'image/png', // Our app sends MIME type
      entityName: 'risk_assessment_item',
      entityID: 999,
      base64Data: TEST_IMAGE_BASE64,
      metadata: JSON.stringify({
        description: 'Mobile app integration test',
        source: 'mobile-app',
        timestamp: new Date().toISOString()
      }),
      deviceId: 'mobile-tablet-device',
      userId: 'mobile-user'
    });

    if (uploadResult.success) {
      console.log('✅ Mobile Media Upload Success');
      console.log('📄 Response:', uploadResult.data);
    } else {
      console.log('❌ Mobile Media Upload Failed:', uploadResult.message);
    }
    console.log('');

    // Test 2: Get media for entity using our mobile API
    console.log('2️⃣ Testing Mobile App Media Retrieval');
    const retrievalResult = await api.getMediaForEntity('risk_assessment_item', 999);

    if (retrievalResult.success) {
      console.log('✅ Mobile Media Retrieval Success');
      console.log('📄 Found', retrievalResult.data.mediaFiles?.length || 0, 'media files');
    } else {
      console.log('❌ Mobile Media Retrieval Failed:', retrievalResult.message);
    }
    console.log('');

    // Test 3: Test sync health check
    console.log('3️⃣ Testing Mobile App Sync Health Check');
    const healthResult = await api.getSyncHealth();

    if (healthResult.success) {
      console.log('✅ Mobile Sync Health Check Success');
      console.log('📄 Health Status:', healthResult.data.success);
    } else {
      console.log('❌ Mobile Sync Health Check Failed:', healthResult.message);
    }

    console.log('\n🎉 Mobile App Media Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Mobile App Media Integration Test...');
testMobileMediaIntegration().catch(error => {
  console.error('Test execution failed:', error);
}); 