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
  formData.append('fileType', 'photo'); // Changed from 'image/png' to 'photo'
  formData.append('deviceId', TEST_DEVICE_ID);
  formData.append('userId', TEST_USER_ID);
  formData.append('metadata', JSON.stringify({ 
    description: 'Mobile app test image',
    testRun: true,
    source: 'mobile-tablet',
    timestamp: new Date().toISOString()
  }));

  console.log('📋 Debug: Sending FormData with:');
  console.log('- entityName:', 'risk_assessment_item');
  console.log('- entityId:', '999');
  console.log('- fileType:', 'photo');
  console.log('- deviceId:', TEST_DEVICE_ID);
  console.log('- userId:', TEST_USER_ID);
  console.log('- filename:', 'mobile-test-image.png');

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

  uploadedMediaId = uploadResponse.data.mediaId;
  console.log('✅ Media uploaded successfully. Media ID:', uploadedMediaId);
} catch (error) {
  console.error('❌ Error uploading media:', error);
} 