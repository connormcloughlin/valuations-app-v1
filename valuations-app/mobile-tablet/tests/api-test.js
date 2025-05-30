const api = require('../api');

async function testGetAppointmentById() {
  console.log('===== Testing getAppointmentById =====');
  console.log('Testing with appointmentId = "1"');
  
  try {
    // Test with a valid ID
    const result = await api.getAppointmentById('1');
    
    console.log('API Response Success:', result.success);
    console.log('Appointment Data Sample:');
    
    if (result.success && result.data) {
      const { id, address, client, date } = result.data;
      console.log({
        id,
        address,
        client,
        date
      });
      
      if (client === 'Unknown client') {
        console.error('❌ Client name is "Unknown client" - API may not be returning correct data structure');
      } else {
        console.log('✅ Client name successfully retrieved');
      }
    } else {
      console.error('❌ API call failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Exception during API call:', error);
  }
}

// Run the test
testGetAppointmentById(); 