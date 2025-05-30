// Test script for validating handling of the updated API response
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

// Updated sample response based on the actual API response structure
const sampleResponse = {
  "appointmentID": 5297,
  "orderID": 26305,
  "startTime": "2019-12-13 07:30:00",
  "endTime": "2019-12-13 11:00:00",
  "followUpDate": "2019-12-20 00:00:00",
  "arrivalTime": null,
  "departureTime": null,
  "inviteStatus": "In-progress",
  "meetingStatus": null,
  "location": "10 SANDHURST PLACE PORTION 46 OF ERF 210 SANDTON     Gauteng ",
  "comments": "27/11/2019 E-MAILED BROKER WAITING FOR CONTACT DETAILS 02/12/2019 APP BOOKED FOR NP ON 13/12 AT 09&#58;30",
  "category": "Inventory",
  "outoftown": "No",
  "surveyorComments": null,
  "eventId": null,
  "surveyorEmail": null,
  "dateModified": null,
  "ordersList": {
    "orderid": 26305,
    "orderStatus": "ASSIGNED",
    "policy": "653810229",
    "clientsName": null,
    "clientID": 57741,
    "client": "G BOLUS (G77 PTY LTD)",
    "title": "",
    "initials": "R",
    "requestedBy": "47800",
    "surveyor": "Nicole Powell",
    "poNo": null,
    "poNo2": null,
    "capturedBy": "",
    "sumInsured": 1080000,
    "requestedByField": "47800",
    "fullAddress": "10 SANDHURST PLACE PORTION 46 OF ERF 210 SANDTON   South Africa",
    "region": "Gauteng",
    "city": "",
    "surveyorID": 644,
    "orderdate": "2019-11-27 15:08:59",
    "dateModified": "2020-01-08 10:52:04",
    "dateAdded": "2019-11-27 15:08:59",
    "dateCompleted": "2020-01-08 10:52:22",
    "insurer": "ELITE WEALTH ASSETS INSURANCE",
    "broker": "NETWORK TRUST INSURANCE BROKERS",
    "month": "November",
    "year": 2019
  }
};

// Test function to process the response data according to our updated logic
function processAppointmentData(data) {
  // Map appointmentID if it exists but id/appointmentId don't
  const id = data.id || data.appointmentId || (data.appointmentID ? data.appointmentID.toString() : '5297');
  
  // Normalize field names for consistency
  const address = data.address || 
                  data.location || 
                  data.property_address || 
                  data.FullAddress ||
                  (data.ordersList && data.ordersList.fullAddress) ||
                  'No address provided';
  
  // Extract client name
  let client = 'Unknown client';
  if (data.client) {
    client = data.client;
  } else if (data.clientName) {
    client = data.clientName;
  } else if (data.clientsName) {
    client = data.clientsName;
  } else if (data.Client) {
    client = data.Client;
  } else if (data.ordersList && data.ordersList.client) {
    client = data.ordersList.client;
  } else if (data.ordersList && data.ordersList.clientsName) {
    client = data.ordersList.clientsName;
  }
  
  // Get the date from various possible fields
  const date = data.date || 
              data.appointmentDate || 
              data.startTime ||
              data.Start_Time ||
              data.appointment_date || 
              new Date().toISOString().split('T')[0];
  
  // Extract order number from various fields
  const orderNumber = data.orderNumber || 
                     data.orderID || 
                     data.OrderID ||
                     (data.ordersList ? data.ordersList.orderid : null) ||
                     'Unknown order';
  
  // Extract additional fields 
  const followUpDate = data.followUpDate || null;
  const arrivalTime = data.arrivalTime || null;
  const departureTime = data.departureTime || null;
  const category = data.category || null;
  const outOfTown = data.outoftown || 'No';
  const surveyorComments = data.surveyorComments || null;
  const surveyorEmail = data.surveyorEmail || null;
  
  // Get order details
  const orderDetails = data.ordersList || {};
  
  // Get surveyor information
  const surveyor = orderDetails.surveyor || null;
  const surveyorID = orderDetails.surveyorID || null;
  
  // Get region and city
  const region = orderDetails.region || null;
  const city = orderDetails.city || null;
  
  // Get insurer and broker
  const insurer = orderDetails.insurer || null;
  const broker = orderDetails.broker || null;
  
  // Get policy and sum insured
  const policy = orderDetails.policy || null;
  const sumInsured = orderDetails.sumInsured || null;
  
  // Determine status of appointment
  const status = data.status || data.meetingStatus || data.inviteStatus || 'booked';
  const Invite_Status = data.inviteStatus || data.Invite_Status || status;
  
  // Get dates
  const dateModified = data.dateModified || 
                     (orderDetails.dateModified ? orderDetails.dateModified : null);
  const orderDate = orderDetails.orderdate || null;
  const dateCompleted = orderDetails.dateCompleted || null;
  
  // Return processed data
  return {
    id,
    address,
    client,
    date,
    orderNumber,
    // Status fields
    Invite_Status,
    status,
    // Dates
    followUpDate,
    arrivalTime, 
    departureTime,
    dateModified,
    orderDate,
    dateCompleted,
    // Category and out of town
    category,
    outOfTown,
    // Surveyor details
    surveyor,
    surveyorID,
    surveyorComments,
    surveyorEmail,
    // Location details
    region,
    city,
    // Insurance details
    policy,
    sumInsured,
    insurer,
    broker
  };
}

// Test the data processing
async function testUpdatedApiResponse() {
  console.log('===== Testing Updated API Response Handling =====');
  
  // Process the sample data
  console.log('\nProcessing sample response data...');
  const processedData = processAppointmentData(sampleResponse);
  
  // Display the key fields we're interested in
  console.log('\nKey fields extracted:');
  console.log('- ID:', processedData.id);
  console.log('- Address:', processedData.address);
  console.log('- Client:', processedData.client);
  console.log('- Date:', processedData.date);
  console.log('- Status:', processedData.status);
  console.log('- Invite Status:', processedData.Invite_Status);
  console.log('- Category:', processedData.category);
  console.log('- Out of Town:', processedData.outOfTown);
  console.log('- Surveyor:', processedData.surveyor);
  console.log('- Region:', processedData.region);
  console.log('- Policy:', processedData.policy);
  console.log('- Sum Insured:', processedData.sumInsured);
  console.log('- Broker:', processedData.broker);
  console.log('- Insurer:', processedData.insurer);
  
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
      console.log('\nProcessing live API response...');
      const processedLiveData = processAppointmentData(response.data);
      
      // Display the key fields from the live API response
      console.log('\nKey fields from live API:');
      console.log('- ID:', processedLiveData.id);
      console.log('- Address:', processedLiveData.address);
      console.log('- Client:', processedLiveData.client);
      console.log('- Date:', processedLiveData.date);
      console.log('- Status:', processedLiveData.status);
      console.log('- Invite Status:', processedLiveData.Invite_Status);
      console.log('- Category:', processedLiveData.category);
      console.log('- Surveyor:', processedLiveData.surveyor);
      console.log('- Broker:', processedLiveData.broker);
      
      console.log('\n✅ Successfully processed live API response');
    }
  } catch (error) {
    console.error('\n❌ API call failed:', error.message);
  }
}

// Run the test
testUpdatedApiResponse(); 