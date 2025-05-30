// Simple test script for the appointments API
const axios = require('axios');

// API Configuration
const API_CONFIG = {
  BASE_URL: 'http://192.168.0.105:5000/api',
  TIMEOUT: 60000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Test multiple endpoint variations
async function testEndpointVariations() {
  console.log('===== Testing Appointment API Endpoints =====');
  
  const appointmentId = '5297';
  
  // List of endpoint variations to try
  const endpoints = [
    `/appointments/${appointmentId}/with-order`,
    `/appointments/${appointmentId}`,
    `/appointments/detail/${appointmentId}`,
    `/appointments/withorder/${appointmentId}`,
    `/appointment/${appointmentId}`,
    `/appointments/${appointmentId}/order`
  ];
  
  // Try each endpoint
  for (const endpoint of endpoints) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    console.log(`\nTesting endpoint: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: API_CONFIG.HEADERS,
        timeout: API_CONFIG.TIMEOUT
      });
      
      console.log('✅ Success! Status:', response.status);
      console.log('Response data sample:');
      
      if (response.data) {
        // Log key fields from response
        const data = response.data;
        console.log(JSON.stringify({
          id: data.id || data.appointmentId,
          address: data.address || data.location || 'Not available',
          client: data.client || data.clientsName || data.clientName || 'Not available',
          date: data.date || data.appointmentDate || 'Not available'
        }, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed:', error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
      }
    }
  }
}

// Run the test
testEndpointVariations(); 