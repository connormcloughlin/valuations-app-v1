const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://192.168.0.105:5000/api';
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0DC+hwAAAABJRU5ErkJggg==';

// Simulate the uploadMediaBatch function implementation
async function testUploadMediaBatch(mediaFiles) {
  try {
    console.log('🔄 Testing Batch Upload:', mediaFiles.length, 'files');
    
    const results = [];
    
    for (const mediaFile of mediaFiles) {
      try {
        console.log('📱 Uploading:', mediaFile.fileName);
        
        // Convert base64 to FormData
        const formData = new FormData();
        
        // Convert base64 to buffer
        const byteCharacters = Buffer.from(mediaFile.base64Data, 'base64');
        
        formData.append('file', byteCharacters, {
          filename: mediaFile.fileName,
          contentType: mediaFile.fileType
        });
        formData.append('entityName', mediaFile.entityName);
        formData.append('entityId', mediaFile.entityID.toString());
        
        // Map MIME type to backend expected type
        let backendFileType = 'photo';
        if (mediaFile.fileType.includes('image')) {
          backendFileType = 'photo';
        } else if (mediaFile.fileType.includes('pdf') || mediaFile.fileType.includes('document')) {
          backendFileType = 'document';
        } else if (mediaFile.fileName.toLowerCase().includes('signature')) {
          backendFileType = 'signature';
        }
        
        formData.append('fileType', backendFileType);
        formData.append('deviceId', 'mobile-device');
        formData.append('userId', mediaFile.uploadedBy || 'mobile-user');
        
        if (mediaFile.metadata) {
          formData.append('metadata', mediaFile.metadata);
        }
        
        const response = await axios.post(`${BASE_URL}/sync/media/upload`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        
        results.push({
          success: true,
          data: response.data,
          status: response.status,
          originalMediaID: mediaFile.mediaID
        });
        
        console.log('✅', mediaFile.fileName, '- Success');
      } catch (error) {
        console.error('❌', mediaFile.fileName, '- Failed:', error.response?.data?.message || error.message);
        results.push({
          success: false,
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
          originalMediaID: mediaFile.mediaID
        });
      }
    }
    
    return {
      success: true,
      data: { uploaded: results.filter(r => r.success).length, results },
      status: 200
    };
  } catch (error) {
    console.error('Batch upload failed:', error.message);
    return {
      success: false,
      message: error.message,
      status: 500
    };
  }
}

async function testBatchUpload() {
  console.log('🚀 Testing Media Batch Upload Functionality\n');
  
  // Create test media files
  const testMediaFiles = [
    {
      mediaID: 1001,
      fileName: 'test-photo-1.png',
      fileType: 'image/png',
      entityName: 'riskAssessmentItem',
      entityID: 2,
      base64Data: TEST_IMAGE_BASE64,
      metadata: JSON.stringify({
        description: 'Test photo 1',
        testRun: true,
        timestamp: new Date().toISOString()
      }),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'test-user'
    },
    {
      mediaID: 1002,
      fileName: 'test-photo-2.png',
      fileType: 'image/png',
      entityName: 'riskAssessmentItem',
      entityID: 2,
      base64Data: TEST_IMAGE_BASE64,
      metadata: JSON.stringify({
        description: 'Test photo 2',
        testRun: true,
        timestamp: new Date().toISOString()
      }),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'test-user'
    },
    {
      mediaID: 1003,
      fileName: 'test-signature.png',
      fileType: 'image/png',
      entityName: 'riskAssessmentItem',
      entityID: 2,
      base64Data: TEST_IMAGE_BASE64,
      metadata: JSON.stringify({
        description: 'Test signature',
        testRun: true,
        timestamp: new Date().toISOString()
      }),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'test-user'
    }
  ];
  
  console.log(`📦 Uploading ${testMediaFiles.length} media files...\n`);
  
  const result = await testUploadMediaBatch(testMediaFiles);
  
  console.log('\n📊 Batch Upload Results:');
  console.log('========================');
  console.log('Success:', result.success);
  
  if (result.success) {
    console.log('Total uploaded:', result.data.uploaded, '/', testMediaFiles.length);
    console.log('\nIndividual results:');
    result.data.results.forEach((res, index) => {
      const file = testMediaFiles[index];
      if (res.success) {
        console.log(`✅ ${file.fileName}: Media ID ${res.data.mediaFile?.mediaID}`);
      } else {
        console.log(`❌ ${file.fileName}: ${res.message}`);
      }
    });
  } else {
    console.log('❌ Batch upload failed:', result.message);
  }
  
  console.log('\n🎉 Batch Upload Test Complete!');
  
  if (result.success && result.data.uploaded === testMediaFiles.length) {
    console.log('✅ All files uploaded successfully - uploadMediaBatch function is working!');
  } else {
    console.log('⚠️ Some files failed to upload - check the logs above');
  }
}

// Run the test
testBatchUpload().catch(error => {
  console.error('Test execution failed:', error);
}); 