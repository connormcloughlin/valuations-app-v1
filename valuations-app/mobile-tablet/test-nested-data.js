// Simple test script for processing the nested API response
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

// Test extracting client name from nested data structure
async function testNestedClientData() {
  console.log('===== Testing Client Name Extraction =====');
  
  // Example response based on the actual API response structure
  const sampleResponse = {
    "appointmentID": 5297,
    "orderID": 26305,
    "startTime": "2019-12-13 07:30:00",
    "endTime": "2019-12-13 11:00:00",
    "inviteStatus": "Booked",
    "location": "10 SANDHURST PLACE PORTION 46 OF ERF 210 SANDTON     Gauteng ",
    "comments": "27/11/2019 E-MAILED BROKER WAITING FOR CONTACT DETAILS",
    "category": "Inventory",
    "ordersList": {
      "orderid": 26305,
      "orderStatus": "ASSIGNED",
      "policy": "653810229",
      "clientsName": null,
      "clientID": 57741,
      "client": "G BOLUS (G77 PTY LTD)",
      "sumInsured": 1080000,
      "broker": "NETWORK TRUST INSURANCE BROKERS"
    }
  };
  
  // Function to extract client name using our improved logic
  function extractClientName(data) {
    let clientName = 'Unknown client';
    if (data.client) {
      clientName = data.client;
    } else if (data.clientName) {
      clientName = data.clientName;
    } else if (data.clientsName) {
      clientName = data.clientsName;
    } else if (data.Client) {
      clientName = data.Client;
    } else if (data.ordersList && data.ordersList.client) {
      clientName = data.ordersList.client;
    } else if (data.ordersList && data.ordersList.clientsName) {
      clientName = data.ordersList.clientsName;
    } else if (data.ordersList && data.ordersList.Client) {
      clientName = data.ordersList.Client;
    } else if (data.customer_name) {
      clientName = data.customer_name;
    }
    return clientName;
  }
  
  // Test with the sample response
  console.log('\nTesting with sample response data:');
  const clientName = extractClientName(sampleResponse);
  console.log('Extracted client name:', clientName);
  if (clientName === 'G BOLUS (G77 PTY LTD)') {
    console.log('✅ Successfully extracted client name from nested ordersList');
  } else {
    console.error('❌ Failed to extract client name correctly');
  }
  
  // Now try to fetch real data from the API
  try {
    console.log('\nTesting with live API call:');
    const appointmentId = '5297';
    const url = `${API_CONFIG.BASE_URL}/appointments/${appointmentId}/with-order`;
    
    console.log(`Making request to: ${url}`);
    
    const response = await axios.get(url, {
      headers: API_CONFIG.HEADERS,
      timeout: API_CONFIG.TIMEOUT
    });
    
    if (response.data) {
      const liveClientName = extractClientName(response.data);
      console.log('Extracted client name from API:', liveClientName);
      if (liveClientName !== 'Unknown client') {
        console.log('✅ Successfully extracted client name from live API');
      } else {
        console.error('❌ Failed to extract client name from live API');
        console.log('API response structure:', JSON.stringify(response.data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }
}

// Run the test
testNestedClientData(); 