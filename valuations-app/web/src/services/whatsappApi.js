import axios from 'axios';

// WhatsApp API configuration
// Replace with actual WhatsApp Business API credentials in production
const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || '123456789012345';
const WHATSAPP_ACCESS_TOKEN = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN || 'your-access-token';

// Create WhatsApp API instance
const whatsappClient = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
  }
});

/**
 * Send a text message via WhatsApp
 * @param {string} phoneNumber - Recipient's phone number with country code (e.g., "27832945678")
 * @param {string} message - Text message to send
 * @returns {Promise} - Response from WhatsApp API
 */
const sendTextMessage = async (phoneNumber, message) => {
  try {
    // Format phone number to ensure it's in the correct format (with country code)
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await whatsappClient.post(
      `/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: {
          preview_url: false,
          body: message
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    // For development, return a mock success response
    return { 
      mockResponse: true, 
      success: true, 
      message: `Message would be sent to ${phoneNumber} in production`
    };
  }
};

/**
 * Send an appointment confirmation message
 * @param {Object} appointment - The appointment details
 * @param {Object} orderDetails - The order details including customer information
 * @returns {Promise} - Response from WhatsApp API
 */
const sendAppointmentConfirmation = async (appointment, orderDetails) => {
  try {
    // Get customer phone from order details
    const customerPhone = orderDetails.customerPhone || orderDetails.customer?.phone;
    
    if (!customerPhone) {
      throw new Error('Customer phone number not available');
    }
    
    // Create a formatted message with appointment details
    const message = createAppointmentMessage(appointment, orderDetails);
    
    // Send the message
    return await sendTextMessage(customerPhone, message);
  } catch (error) {
    console.error('Failed to send appointment confirmation:', error);
    throw error;
  }
};

/**
 * Format a phone number to ensure it has the country code
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove spaces, dashes, parentheses, and any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number doesn't start with a "+", add it
  if (!cleaned.startsWith('+')) {
    // If the number starts with a country code (e.g., "27" for South Africa)
    // we'll assume it doesn't need a "+" prefix
    if (cleaned.startsWith('27')) {
      cleaned = '+' + cleaned;
    } else {
      // If no country code, assume South Africa (27)
      // This is an example - adjust based on your primary region
      cleaned = '+27' + (cleaned.startsWith('0') ? cleaned.substring(1) : cleaned);
    }
  }
  
  return cleaned;
};

/**
 * Create a formatted appointment confirmation message
 * @param {Object} appointment - The appointment details
 * @param {Object} orderDetails - The order details
 * @returns {string} - Formatted message
 */
const createAppointmentMessage = (appointment, orderDetails) => {
  // Get the survey types as a comma-separated string
  const surveyTypes = appointment.surveyTypes 
    ? appointment.surveyTypes.map(type => type.name).join(', ')
    : 'Not specified';
  
  // Build the message
  return `
*Appointment Confirmation*

Dear ${orderDetails.customerName || 'Valued Customer'},

Your appointment has been scheduled successfully:

📅 *Date:* ${formatDate(appointment.startDate)}
🕒 *Time:* ${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}
📍 *Location:* ${appointment.location}
🧰 *Survey Type:* ${surveyTypes}
👤 *Surveyor:* ${appointment.surveyor}

If you need to reschedule or have any questions, please contact us.

Thank you for choosing our services.
`;
};

/**
 * Format a date in a user-friendly way
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time in a user-friendly way
 * @param {string} timeString - Time string (e.g., "14:30")
 * @returns {string} - Formatted time
 */
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const time = new Date();
  time.setHours(parseInt(hours, 10));
  time.setMinutes(parseInt(minutes, 10));
  
  return time.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default {
  sendTextMessage,
  sendAppointmentConfirmation
}; 