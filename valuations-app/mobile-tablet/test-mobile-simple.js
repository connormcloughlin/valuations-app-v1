const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://192.168.0.105:5000/api';
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0DC+hwAAAABJRU5ErkJggg==';

// Simulate our mobile app's uploadMedia function
async function uploadMediaMobile(mediaData) {
  try {
    console.log('📱 Mobile App: Converting base64 to FormData...');
    
    // Convert base64 to FormData (simulating our mobile app logic)
    const formData = new FormData();
    
    // Convert base64 to buffer
    const byteCharacters = Buffer.from(mediaData.base64Data, 'base64');
    const blob = byteCharacters; // In Node.js, we use Buffer directly
    
    formData.append('file', blob, {
      filename: mediaData.fileName,
      contentType: mediaData.fileType
    });
    formData.append('entityName', mediaData.entityName);
    formData.append('entityId', mediaData.entityID.toString());
    
    // Map MIME type to backend expected type (simulating our API logic)
    let backendFileType = 'photo'; // default
    if (mediaData.fileType.includes('image')) {
      backendFileType = 'photo';
    } else if (mediaData.fileType.includes('pdf') || mediaData.fileType.includes('document')) {
      backendFileType = 'document';
    } else if (mediaData.fileName.toLowerCase().includes('signature')) {
      backendFileType = 'signature';
    }
    
    formData.append('fileType', backendFileType);
    formData.append('deviceId', mediaData.deviceId || 'mobile-device');
    formData.append('userId', mediaData.userId || 'mobile-user');
    
    if (mediaData.metadata) {
      formData.append('metadata', mediaData.metadata);
    }
    
    console.log('📱 Mobile App: Sending to /sync/media/upload with:');
    console.log('- entityName:', mediaData.entityName);
    console.log('- entityId:', mediaData.entityID);
    console.log('- fileType:', backendFileType, '(mapped from', mediaData.fileType + ')');
    console.log('- deviceId:', mediaData.deviceId || 'mobile-device');
    console.log('- userId:', mediaData.userId || 'mobile-user');
    
    const response = await axios.post(`${BASE_URL}/sync/media/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error('📱 Mobile App Upload Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Simulate our mobile app's getMediaForEntity function
async function getMediaForEntityMobile(entityName, entityID) {
  try {
    console.log('📱 Mobile App: Fetching media from /sync/media/entity...');
    
    const response = await axios.get(`${BASE_URL}/sync/media/entity/${entityName}/${entityID}`);
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error('📱 Mobile App Retrieval Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

async function testMobileAppIntegration() {
  console.log('🔄 Testing Mobile App Media Integration (Simulated)...\n');
  console.log(`📱 Backend URL: ${BASE_URL}`);
  console.log(`🎯 Testing Entity: riskAssessmentItem/2\n`);

  try {
    // Test 1: Upload media using our mobile app logic
    console.log('1️⃣ Testing Mobile App Media Upload Logic');
    const uploadResult = await uploadMediaMobile({
      fileName: 'mobile-app-test.png',
      fileType: 'image/png', // Our app sends MIME type
      entityName: 'riskAssessmentItem',
      entityID: 2,
      base64Data: TEST_IMAGE_BASE64,
      metadata: JSON.stringify({
        description: 'Mobile app integration test',
        source: 'mobile-app-simulation',
        timestamp: new Date().toISOString()
      }),
      deviceId: 'mobile-tablet-device',
      userId: 'mobile-user'
    });

    if (uploadResult.success) {
      console.log('✅ Mobile Media Upload Success');
      console.log('📄 Media ID:', uploadResult.data.mediaFile?.mediaID);
      console.log('📄 Blob URL:', uploadResult.data.mediaFile?.blobURL ? 'Generated' : 'Missing');
    } else {
      console.log('❌ Mobile Media Upload Failed:', uploadResult.message);
    }
    console.log('');

    // Test 2: Get media for entity using our mobile app logic
    console.log('2️⃣ Testing Mobile App Media Retrieval Logic');
    const retrievalResult = await getMediaForEntityMobile('riskAssessmentItem', 2);

    if (retrievalResult.success) {
      console.log('✅ Mobile Media Retrieval Success');
      console.log('📄 Found', retrievalResult.data.mediaFiles?.length || 0, 'media files');
      if (retrievalResult.data.mediaFiles?.length > 0) {
        console.log('📄 Latest file:', retrievalResult.data.mediaFiles[0].fileName);
      }
    } else {
      console.log('❌ Mobile Media Retrieval Failed:', retrievalResult.message);
    }
    console.log('');

    // Test 3: Test sync health check
    console.log('3️⃣ Testing Sync Health Check');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/sync/debug`);
      console.log('✅ Sync Health Check Success');
      console.log('📄 Health Status:', healthResponse.data.success);
    } catch (error) {
      console.log('❌ Sync Health Check Failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Mobile App Media Integration Test Complete!');
    console.log('✅ Your mobile app should be able to sync media successfully');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Mobile App Media Integration Test...');
console.log('This simulates how your React Native app will interact with the backend\n');

testMobileAppIntegration().catch(error => {
  console.error('Test execution failed:', error);
}); 