const axios = require('axios');
const FormData = require('form-data');

// Test configuration
const BASE_URL = 'http://192.168.0.105:5000/api'; // Update with your server IP
const TEST_DEVICE_ID = 'mobile-tablet-test';
const TEST_USER_ID = 'mobile-user-test';

// Simple test image as base64
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0DC+hwAAAABJRU5ErkJggg==';

async function testMediaSyncAPI() {
  console.log('🔄 Testing Media Sync API Integration...\n');
  console.log(`📱 Backend URL: ${BASE_URL}`);
  console.log(`📱 Device ID: ${TEST_DEVICE_ID}`);
  console.log(`👤 User ID: ${TEST_USER_ID}\n`);

  const testResults = {
    healthCheck: false,
    mediaUpload: false,
    mediaRetrieval: false,
    syncChanges: false,
    totalTests: 4,
    passedTests: 0
  };

  try {
    // Test 1: Sync Health Check
    console.log('1️⃣ Testing Sync Health Check');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/sync/debug`);
      console.log('✅ Sync Health Check Success:', healthResponse.data.success);
      testResults.healthCheck = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('⚠️ Sync Health Check Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 2: Upload Media File via Sync API (simulating our mobile app approach)
    console.log('2️⃣ Testing Mobile App Media Upload (Base64 → FormData conversion)');
    let uploadedMediaId = null;
    try {
      // Simulate what our mobile app does: convert base64 to FormData
      const formData = new FormData();
      
      // Convert base64 to buffer (simulating our mobile conversion)
      const byteCharacters = Buffer.from(TEST_IMAGE_BASE64, 'base64');
      
      formData.append('file', byteCharacters, {
        filename: 'mobile-test-image.png',
        contentType: 'image/png'
      });
      formData.append('entityName', 'risk_assessment_item');
      formData.append('entityId', '999');
      formData.append('fileType', 'image/png');
      formData.append('deviceId', TEST_DEVICE_ID);
      formData.append('userId', TEST_USER_ID);
      formData.append('metadata', JSON.stringify({ 
        description: 'Mobile app test image',
        testRun: true,
        source: 'mobile-tablet',
        timestamp: new Date().toISOString()
      }));

      const uploadResponse = await axios.post(
        `${BASE_URL}/sync/media/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      console.log('✅ Mobile Media Upload Success');
      uploadedMediaId = uploadResponse.data.mediaFile?.mediaID;
      console.log('📄 Created Media ID:', uploadedMediaId);
      console.log('📄 Blob URL:', uploadResponse.data.mediaFile?.blobURL ? 'Generated' : 'Missing');
      testResults.mediaUpload = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('❌ Mobile Media Upload Failed:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.data?.error) {
        console.log('Error Details:', error.response.data.error);
      }
    }
    console.log('');

    // Test 3: Get Media Files by Entity via Sync API
    console.log('3️⃣ Testing Sync Media Files by Entity');
    try {
      const entityResponse = await axios.get(`${BASE_URL}/sync/media/entity/risk_assessment_item/999`);
      console.log('✅ Sync Media Entity Retrieval Success');
      console.log('📄 Found', entityResponse.data.mediaFiles?.length || 0, 'media files');
      if (entityResponse.data.mediaFiles?.length > 0) {
        console.log('📄 Latest file:', entityResponse.data.mediaFiles[0].fileName);
      }
      testResults.mediaRetrieval = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('❌ Sync Media Entity Retrieval Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 4: Test Sync Changes (Pull from server)
    console.log('4️⃣ Testing Sync Changes (Pull from server)');
    try {
      const changesResponse = await axios.get(`${BASE_URL}/sync/changes`, {
        params: {
          deviceId: TEST_DEVICE_ID,
          userId: TEST_USER_ID,
          lastSyncTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
          entities: ['appointments', 'riskAssessmentMasters', 'riskAssessmentItems']
        }
      });
      console.log('✅ Sync Changes Success');
      console.log('📄 Response Keys:', Object.keys(changesResponse.data));
      testResults.syncChanges = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('❌ Sync Changes Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');

    // Summary
    console.log('📊 Mobile Media Sync Test Results');
    console.log('==================================');
    console.log(`✅ Passed: ${testResults.passedTests}/${testResults.totalTests} tests`);
    console.log(`❌ Failed: ${testResults.totalTests - testResults.passedTests}/${testResults.totalTests} tests`);
    console.log('');
    console.log('Individual Test Results:');
    console.log(`- Sync Health Check: ${testResults.healthCheck ? '✅' : '❌'}`);
    console.log(`- Mobile Media Upload: ${testResults.mediaUpload ? '✅' : '❌'}`);
    console.log(`- Media Entity Retrieval: ${testResults.mediaRetrieval ? '✅' : '❌'}`);
    console.log(`- Sync Changes (Pull): ${testResults.syncChanges ? '✅' : '❌'}`);
    console.log('');

    if (testResults.passedTests === testResults.totalTests) {
      console.log('🎉 All Mobile Media Sync Tests Passed!');
      console.log('✅ Your mobile app should be able to sync media successfully');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
      console.log('ℹ️ This will help identify what needs to be fixed in the backend API');
    }

  } catch (error) {
    console.error('❌ Critical Test Failure:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Mobile Media Sync API Test...');
console.log('Make sure your backend server is running and accessible');
console.log('');

testMediaSyncAPI().catch(error => {
  console.error('Test execution failed:', error);
}); 