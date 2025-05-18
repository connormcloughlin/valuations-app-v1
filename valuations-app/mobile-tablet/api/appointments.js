import apiClient from './client';
import offlineStorage from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';

/**
 * Appointment related API methods
 */
const appointmentsApi = {
  /**
   * Get all appointments for the authenticated user
   * @returns {Promise<Object>} Response with appointments array
   */
  getAppointments: async () => {
    try {
      // Check if we're online first
      const isOnline = connectionUtils.isConnected();
      console.log(`Connection status before fetching appointments: ${isOnline ? 'Online' : 'Offline'}`);
      
      // If offline, get from storage
      if (!isOnline) {
        const cachedData = await offlineStorage.getDataForKey('appointments');
        if (cachedData) {
          console.log(`Using ${cachedData.length} cached appointments (offline)`);
          return {
            success: true,
            data: cachedData,
            fromCache: true
          };
        } else {
          return {
            success: false,
            message: 'You are offline and no cached appointment data is available.'
          };
        }
      }
      
      // Online - fetch from server
      console.log('Fetching appointments from server');
      const response = await apiClient.get('/appointments');
      
      // Ensure data is an array and handle nested data structure
      let appointmentsData = [];
      
      if (response.data && typeof response.data === 'object') {
        // Handle the case where data is inside a 'data' property (common API pattern)
        if (Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
          console.log('Found appointments in response.data.data array');
        } else if (Array.isArray(response.data)) {
          appointmentsData = response.data;
          console.log('Found appointments in response.data array');
        } else {
          console.log('Response data is not an array:', response.data);
          // Extract potential appointments from object keys
          appointmentsData = Object.values(response.data).filter(item => 
            item && typeof item === 'object' && (item.id || item.appointmentId)
          );
        }
      }
      
      // Process and deduplicate appointments
      const processedAppointments = [];
      const seenIds = new Set();
      
      appointmentsData.forEach((appointment, index) => {
        // Force string IDs for consistent comparison
        let id = appointment.id?.toString() || appointment.appointmentId?.toString() || String(index + 1);
        
        // If id is null, undefined, empty string, or already seen, assign a new unique id
        if (!id || seenIds.has(id)) {
          id = `appointment-${index + 1}`;
        }
        
        seenIds.add(id);
        
        // Determine address from various possible fields
        const address = appointment.address || 
                       appointment.location || 
                       appointment.property_address || 
                       'No address provided';
        
        // Determine client name from various possible fields
        const client = appointment.client || 
                      appointment.clientName || 
                      appointment.customer_name || 
                      'Unknown client';
        
        // Determine date from various possible fields
        const date = appointment.date || 
                    appointment.appointmentDate || 
                    appointment.startTime ||
                    appointment.appointment_date || 
                    new Date().toISOString().split('T')[0];
        
        // Determine order number
        const orderNumber = appointment.orderNumber || 
                           appointment.orderID || 
                           appointment.order_id || 
                           'Unknown order';
        
        // Create an appointment with the unique ID and normalized data
        processedAppointments.push({
          ...appointment,
          id: id,
          appointmentId: id,
          address: address,
          client: client,
          date: date,
          orderNumber: orderNumber,
          // Preserve the original Invite_Status if available
          Invite_Status: appointment.Invite_Status || appointment.status || 'booked',
          // Keep the status field as a backup
          status: appointment.status || appointment.Invite_Status || 'booked'
        });
      });
      
      console.log(`Processed ${processedAppointments.length} appointments with unique IDs`);
      
      // Cache the result for offline use
      if (response.success) {
        await offlineStorage.storeDataForKey('appointments', processedAppointments);
        console.log(`Cached ${processedAppointments.length} appointments`);
      }
      
      return {
        ...response,
        data: processedAppointments
      };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return error.success === false ? error : { success: false, message: error.message, data: [] };
    }
  },
  
  /**
   * Get appointment details by ID
   * @param {string} appointmentId - ID of the appointment to fetch
   * @returns {Promise<Object>} Response with appointment data
   */
  getAppointmentById: async (appointmentId) => {
    try {
      // Check if we're online
      const isOnline = connectionUtils.isConnected();
      
      // Convert ID to string for consistent comparison
      const idString = appointmentId.toString();
      
      // If requested ID is '0', convert to '1' for API compatibility
      const adjustedId = idString === '0' ? '1' : idString;
      
      // If offline, try to get from storage
      if (!isOnline) {
        const cachedData = await offlineStorage.getDataForKey('appointments');
        if (cachedData && Array.isArray(cachedData)) {
          // Look for the appointment with the adjusted ID
          const appointment = cachedData.find(a => 
            a.id?.toString() === adjustedId || 
            a.appointmentId?.toString() === adjustedId
          );
          
          if (appointment) {
            return {
              success: true,
              data: appointment,
              fromCache: true
            };
          }
        }
        return {
          success: false,
          message: 'You are offline and the requested appointment is not cached.'
        };
      }
      
      // Online - fetch from server
      console.log(`Fetching appointment with ID: ${adjustedId}`);
      try {
        const response = await apiClient.get(`/appointments/${adjustedId}`);
        
        // Handle potential nested data structure
        let appointmentData = response.data;
        if (response.data && response.data.data && typeof response.data.data === 'object') {
          appointmentData = response.data.data;
        }
        
        // Ensure consistent ID format
        if (appointmentData && typeof appointmentData === 'object') {
          // Fix IDs
          if (appointmentData.id !== undefined && appointmentData.id.toString() === '0') {
            appointmentData.id = '1';
          }
          if (appointmentData.appointmentId !== undefined && appointmentData.appointmentId.toString() === '0') {
            appointmentData.appointmentId = '1';
          }
          
          // Normalize field names for consistency
          const address = appointmentData.address || 
                         appointmentData.location || 
                         appointmentData.property_address || 
                         'No address provided';
          
          const client = appointmentData.client || 
                        appointmentData.clientName || 
                        appointmentData.customer_name || 
                        'Unknown client';
          
          const date = appointmentData.date || 
                      appointmentData.appointmentDate || 
                      appointmentData.startTime ||
                      appointmentData.appointment_date || 
                      new Date().toISOString().split('T')[0];
          
          const orderNumber = appointmentData.orderNumber || 
                             appointmentData.orderID || 
                             appointmentData.order_id || 
                             'Unknown order';
          
          // Update the appointment data with normalized fields
          appointmentData = {
            ...appointmentData,
            address,
            client,
            date,
            orderNumber,
            // Preserve the original Invite_Status if available
            Invite_Status: appointmentData.Invite_Status || appointmentData.status || 'booked',
            // Keep the status field as a backup
            status: appointmentData.status || appointmentData.Invite_Status || 'booked'
          };
        }
        
        return {
          ...response,
          data: appointmentData
        };
      } catch (endpointError) {
        console.error(`Error with specific endpoint: ${endpointError.message}`);
        
        // Fallback: try to get the appointment from the full list
        console.log('Trying to get appointment from full list');
        const allAppointmentsResponse = await appointmentsApi.getAppointments();
        
        if (allAppointmentsResponse.success && Array.isArray(allAppointmentsResponse.data)) {
          const appointment = allAppointmentsResponse.data.find(a => 
            a.id?.toString() === adjustedId || 
            a.appointmentId?.toString() === adjustedId
          );
          
          if (appointment) {
            return {
              success: true,
              data: appointment,
              message: 'Retrieved from appointments list'
            };
          }
        }
        
        // No appointment found
        return {
          success: false,
          message: `Appointment with ID ${adjustedId} not found.`
        };
      }
    } catch (error) {
      console.error(`Error fetching appointment ${appointmentId}:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },
  
  /**
   * Get appointments by status (scheduled, in-progress, completed)
   * @param {string} status - Status of appointments to fetch
   * @returns {Promise<Object>} Response with filtered appointments
   */
  getAppointmentsByStatus: async (status) => {
    try {
      // First get all appointments
      const response = await appointmentsApi.getAppointments();
      
      if (!response.success) {
        return { ...response, data: [] };
      }
      
      // Ensure we have an array to work with
      const appointmentsArray = Array.isArray(response.data) ? response.data : [];
      
      if (appointmentsArray.length === 0) {
        console.log(`No appointments found to filter by ${status} status`);
        return {
          success: true,
          data: [],
          message: 'No appointments available'
        };
      }
      
      console.log(`Filtering ${appointmentsArray.length} appointments by status: ${status}`);
      
      // Helper function to determine appointment status based on Invite_Status
      const getAppointmentStatus = (appointment) => {
        // First check the Invite_Status field (primary status field)
        if (appointment.Invite_Status) {
          return appointment.Invite_Status.toLowerCase();
        }
        
        // Fall back to status field if Invite_Status is not available
        if (appointment.status) {
          return appointment.status.toLowerCase();
        }
        
        // Otherwise infer from other properties
        if (appointment.submitted) {
          return 'completed';
        }
        
        if (appointment.lastEdited || appointment.lastModified) {
          return 'in-progress';
        }
        
        // Default to scheduled
        return 'booked';
      };
      
      // Filter by status with enhanced logic
      const filteredData = appointmentsArray.filter(appointment => {
        if (!appointment) return false;
        
        const appointmentStatus = getAppointmentStatus(appointment);
        
        switch(status) {
          case 'scheduled':
            return appointmentStatus === 'scheduled' || 
                   appointmentStatus === 'pending' || 
                   appointmentStatus === 'booked';
          
          case 'in-progress':
            return appointmentStatus === 'in-progress' || 
                   appointmentStatus === 'in_progress';
          
          case 'completed':
            return appointmentStatus === 'completed';
            
          default:
            return true;
        }
      });
      
      // Ensure no duplicate IDs in the filtered data
      const deduplicatedData = [];
      const seenIds = new Set();
      
      filteredData.forEach((appointment, index) => {
        const id = appointment.id?.toString() || `${status}-appointment-${index + 1}`;
        
        if (!seenIds.has(id)) {
          seenIds.add(id);
          deduplicatedData.push(appointment);
        } else {
          // Create a copy with a unique ID for duplicate entries
          deduplicatedData.push({
            ...appointment,
            id: `${id}-duplicate-${index}`,
            appointmentId: `${appointment.appointmentId || id}-duplicate-${index}`
          });
        }
      });
      
      console.log(`Filtered to ${deduplicatedData.length} ${status} appointments (after deduplication)`);
      
      return {
        ...response,
        data: deduplicatedData
      };
    } catch (error) {
      console.error(`Error fetching ${status} appointments:`, error);
      return error.success === false ? error : { 
        success: false, 
        message: error.message || `Failed to get ${status} appointments`,
        data: []
      };
    }
  }
};

export default appointmentsApi; 