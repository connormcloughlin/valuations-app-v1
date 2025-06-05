const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const BASE_URL = 'http://192.168.0.105:5000/api';

// Create test image files for different scenarios
const createTestImage = (name = 'test') => {
  // Simple 1x1 PNG file in base64
  const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0DC+hwAAAABJRU5ErkJggg==';
  return Buffer.from(pngData, 'base64');
};

const createTestDocument = () => {
  // Simple text file as PDF-like content
  return Buffer.from('Test document content for sync API testing', 'utf8');
};

// Test data for sync operations
const testDeviceId = 'test-device-' + Date.now();
const testUserId = 'test-user-sync';
const testEntityId = 999; // Using a test entity ID

async function testSyncMediaAPI() {
  console.log('🔄 Testing Sync API MediaFile Operations...\n');
  console.log(`📱 Device ID: ${testDeviceId}`);
  console.log(`👤 User ID: ${testUserId}`);
  console.log(`🎯 Test Entity ID: ${testEntityId}\n`);

  const testResults = {
    healthCheck: false,
    mediaUpload: false,
    mediaRetrieval: false,
    mediaEntityList: false,
    syncChanges: false,
    syncBatch: false,
    syncSessions: false,
    totalTests: 7,
    passedTests: 0
  };

  try {
    // Test 1: Sync Health Check
    console.log('1️⃣ Testing Sync API Health Check');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/sync/debug`);
      console.log('✅ Sync Health Check Success:', healthResponse.data.success);
      console.log('📄 Total Sessions:', healthResponse.data.analysis?.totalSessions);
      console.log('📄 Success Rate:', healthResponse.data.debugInfo?.successRate);
      testResults.healthCheck = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('⚠️ Sync Health Check Failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 2: Upload Media File via Sync API
    console.log('2️⃣ Testing Sync Media File Upload');
    let uploadedMediaId = null;
    try {
      const form = new FormData();
      const testImageBuffer = createTestImage();
      
      form.append('file', testImageBuffer, {
        filename: 'sync-test-image.png',
        contentType: 'image/png'
      });
      form.append('entityName', 'appointment');
      form.append('entityId', testEntityId.toString());
      form.append('fileType', 'photo');
      form.append('deviceId', testDeviceId);
      form.append('userId', testUserId);
      form.append('metadata', JSON.stringify({ 
        description: 'Sync API test image',
        testRun: true,
        syncTest: true,
        timestamp: new Date().toISOString(),
        deviceId: testDeviceId
      }));

      console.log('📋 Debug: Sending exactly:');
      console.log('- entityName:', 'appointment');
      console.log('- entityId:', testEntityId.toString());
      console.log('- fileType:', 'photo');
      console.log('- deviceId:', testDeviceId);
      console.log('- userId:', testUserId);

      const uploadResponse = await axios.post(
        `${BASE_URL}/sync/media/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      console.log('✅ Sync Media Upload Success');
      uploadedMediaId = uploadResponse.data.mediaFile?.mediaID;
      console.log('📄 Created Media ID:', uploadedMediaId);
      console.log('📄 Blob URL:', uploadResponse.data.mediaFile?.blobURL ? 'Generated' : 'Missing');
      testResults.mediaUpload = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('❌ Sync Media Upload Failed:', error.response?.data || error.message);
      if (error.response?.data?.error) {
        console.log('Error Details:', error.response.data.error);
      }
    }
    console.log('');

    // Test 3: Get Media File Metadata via Media API (for verification)
    console.log('3️⃣ Testing Media File Retrieval (Verification)');
    if (uploadedMediaId) {
      try {
        const mediaResponse = await axios.get(`${BASE_URL}/media/${uploadedMediaId}`);
        console.log('✅ Media Retrieval Success');
        console.log('📄 File Name:', mediaResponse.data.data.fileName);
        console.log('📄 File Type:', mediaResponse.data.data.fileType);
        console.log('📄 Entity:', `${mediaResponse.data.data.entityName}/${mediaResponse.data.data.entityID}`);
        testResults.mediaRetrieval = true;
        testResults.passedTests++;
      } catch (error) {
        console.log('❌ Media Retrieval Failed:', error.response?.data || error.message);
      }
    } else {
      console.log('⚠️ Skipping retrieval test - no media ID available');
    }
    console.log('');

    // Test 4: Get Media Files by Entity via Sync API
    console.log('4️⃣ Testing Sync Media Files by Entity');
    try {
      const entityResponse = await axios.get(`${BASE_URL}/sync/media/entity/appointment/${testEntityId}`);
      console.log('✅ Sync Media Entity List Success');
      console.log('📄 Found', entityResponse.data.mediaFiles?.length || 0, 'media files for appointment', testEntityId);
      if (entityResponse.data.mediaFiles?.length > 0) {
        console.log('📄 Latest file:', entityResponse.data.mediaFiles[0].fileName);
      }
      testResults.mediaEntityList = true;
      testResults.passedTests++;
    } catch (error) {
      console.log('❌ Sync Media Entity List Failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 5: Upload Multiple Media Types
    console.log('5️⃣ Testing Multiple Media Type Uploads');
    const mediaTypes = [
      { type: 'signature', filename: 'sync-test-signature.png', contentType: 'image/png', buffer: createTestImage('signature') },
      { type: 'document', filename: 'sync-test-document.pdf', contentType: 'application/pdf', buffer: createTestDocument() }
    ];

    for (const media of mediaTypes) {
      try {
        const form = new FormData();
        
        form.append('file', media.buffer, {
          filename: media.filename,
          contentType: media.contentType
        });
        form.append('entityName', 'appointment');
        form.append('entityId', testEntityId.toString());
        form.append('fileType', media.type);
        form.append('deviceId', testDeviceId);
        form.append('userId', testUserId);
        form.append('metadata', JSON.stringify({ 
          description: `Sync API test ${media.type}`,
          testRun: true,
          mediaType: media.type,
          timestamp: new Date().toISOString()
        }));

        const uploadResponse = await axios.post(
          `${BASE_URL}/sync/media/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        
        console.log(`✅ ${media.type} upload successful:`, uploadResponse.data.mediaFile?.mediaID);
      } catch (error) {
        console.log(`❌ ${media.type} upload failed:`, error.response?.data || error.message);
      }
    }
    console.log('');

    // Final Summary
    console.log('📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Passed: ${testResults.passedTests}/${testResults.totalTests} tests`);
    console.log(`❌ Failed: ${testResults.totalTests - testResults.passedTests}/${testResults.totalTests} tests`);
    console.log('');

    if (testResults.passedTests >= 4) {
      console.log('🎉 Media upload tests working! Ready for mobile integration.');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Critical Test Failure:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Comprehensive Sync Media API Test...');
testSyncMediaAPI().catch(error => {
  console.error('Test execution failed:', error);
}); 