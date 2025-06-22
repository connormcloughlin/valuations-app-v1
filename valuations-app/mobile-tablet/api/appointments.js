import apiClient from './client';
import axios from 'axios';
import offlineStorage from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';
import { API_BASE_URL } from '../constants/apiConfig';

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
        const cachedResponse = await offlineStorage.getDataForKey('appointments');
        if (cachedResponse && cachedResponse.data) {
          // Extract the actual data array
          const cachedData = Array.isArray(cachedResponse.data) ? cachedResponse.data : [];
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
                       appointment.ordersList.clientsName || 
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
      
      // If requested ID is '0', convert to '5297' for API compatibility
      const adjustedId = idString === '0' ? '5297' : idString;
      
      // If offline, try to get from storage
      if (!isOnline) {
        const cachedResponse = await offlineStorage.getDataForKey('appointments');
        if (cachedResponse && cachedResponse.data) {
          // Extract the data array from response
          const cachedData = Array.isArray(cachedResponse.data) ? cachedResponse.data : [];
          
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
        // Try the with-order endpoint first (provides most complete data)
        console.log(`Trying /appointments/${adjustedId}/with-order endpoint`);
        const response = await apiClient.get(`/appointments/${adjustedId}/with-order`);
        
        // Handle potential nested data structure
        let appointmentData = response.data;
        if (response.data && response.data.data && typeof response.data.data === 'object') {
          appointmentData = response.data.data;
        }
        
        // Ensure consistent ID format
        if (appointmentData && typeof appointmentData === 'object') {
          // Fix IDs
          if (appointmentData.id !== undefined && appointmentData.id.toString() === '0') {
            appointmentData.id = '5297';
          }
          if (appointmentData.appointmentId !== undefined && appointmentData.appointmentId.toString() === '0') {
            appointmentData.appointmentId = '5297';
          }
          
          // Add ID if not present
          if (!appointmentData.id && !appointmentData.appointmentId) {
            appointmentData.id = adjustedId;
            appointmentData.appointmentId = adjustedId;
          }
          
          // Map appointmentID if it exists but id/appointmentId don't
          if (appointmentData.appointmentID && (!appointmentData.id && !appointmentData.appointmentId)) {
            appointmentData.id = appointmentData.appointmentID.toString();
            appointmentData.appointmentId = appointmentData.appointmentID.toString();
          }
          
          // Normalize field names for consistency
          const address = appointmentData.address || 
                         appointmentData.location || 
                         appointmentData.property_address || 
                         appointmentData.FullAddress ||
                         (appointmentData.ordersList && appointmentData.ordersList.fullAddress) ||
                         'No address provided';
          
          // First check for client in the main object, then look in ordersList if it exists
          let client = 'Unknown client';
          if (appointmentData.client) {
            client = appointmentData.client;
          } else if (appointmentData.clientName) {
            client = appointmentData.clientName;
          } else if (appointmentData.clientsName) {
            client = appointmentData.clientsName;
          } else if (appointmentData.Client) {
            client = appointmentData.Client;
          } else if (appointmentData.ordersList && appointmentData.ordersList.client) {
            client = appointmentData.ordersList.client;
          } else if (appointmentData.ordersList && appointmentData.ordersList.clientsName) {
            client = appointmentData.ordersList.clientsName;
          } else if (appointmentData.ordersList && appointmentData.ordersList.Client) {
            client = appointmentData.ordersList.Client;
          } else if (appointmentData.customer_name) {
            client = appointmentData.customer_name;
          }
          
          // Get the date from various possible fields
          const date = appointmentData.date || 
                      appointmentData.appointmentDate || 
                      appointmentData.startTime ||
                      appointmentData.Start_Time ||
                      appointmentData.appointment_date || 
                      new Date().toISOString().split('T')[0];
          
          // Extract order number from various fields
          const orderNumber = appointmentData.orderNumber || 
                             appointmentData.orderID || 
                             appointmentData.OrderID ||
                             (appointmentData.ordersList ? appointmentData.ordersList.orderid : null) ||
                             'Unknown order';
          
          // Extract additional fields from the updated API response
          const followUpDate = appointmentData.followUpDate || null;
          const arrivalTime = appointmentData.arrivalTime || null;
          const departureTime = appointmentData.departureTime || null;
          const category = appointmentData.category || null;
          const outOfTown = appointmentData.outoftown || 'No';
          const surveyorComments = appointmentData.surveyorComments || null;
          const surveyorEmail = appointmentData.surveyorEmail || null;
          
          // Get order details
          const orderDetails = appointmentData.ordersList || {};
          
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
          
          // Determine status of appointment (status, meeting status, invite status)
          const status = appointmentData.status || appointmentData.meetingStatus || appointmentData.inviteStatus || 'booked';
          const Invite_Status = appointmentData.inviteStatus || appointmentData.Invite_Status || status;
          
          // Get dates
          const dateModified = appointmentData.dateModified || 
                             (orderDetails.dateModified ? orderDetails.dateModified : null);
          const orderDate = orderDetails.orderdate || null;
          const dateCompleted = orderDetails.dateCompleted || null;
          
          // Update the appointment data with normalized fields
          appointmentData = {
            ...appointmentData,
            id: adjustedId,
            appointmentId: adjustedId,
            address,
            client,
            date,
            orderNumber,
            // Add status fields
            Invite_Status,
            status,
            // Add dates
            followUpDate,
            arrivalTime, 
            departureTime,
            dateModified,
            orderDate,
            dateCompleted,
            // Add category and out of town
            category,
            outOfTown,
            // Add surveyor details
            surveyor,
            surveyorID,
            surveyorComments,
            surveyorEmail,
            // Add location details
            region,
            city,
            // Add insurance details
            policy,
            sumInsured,
            insurer,
            broker,
            // Preserve original data
            originalAppointment: appointmentData,
            originalOrdersList: orderDetails
          };
        }
        
        return {
          ...response,
          data: appointmentData
        };
      } catch (withOrderError) {
        console.error(`Error with /with-order endpoint: ${withOrderError.message}`);
        
        // Try the basic appointment endpoint as fallback
        try {
          console.log(`Trying fallback to /appointments/${adjustedId} endpoint`);
          const fallbackResponse = await apiClient.get(`/appointments/${adjustedId}`);
          
          let appointmentData = fallbackResponse.data;
          if (fallbackResponse.data && fallbackResponse.data.data && typeof fallbackResponse.data.data === 'object') {
            appointmentData = fallbackResponse.data.data;
          }
          
          // Normalize data from fallback endpoint
          if (appointmentData && typeof appointmentData === 'object') {
            // Add ID if not present
            if (!appointmentData.id && !appointmentData.appointmentId) {
              appointmentData.id = adjustedId;
              appointmentData.appointmentId = adjustedId;
            }
            
            // Normalize field names for consistency
            const address = appointmentData.address || 
                           appointmentData.location || 
                           appointmentData.property_address || 
                           appointmentData.FullAddress ||
                           'No address provided';
            
            // First check for client in the main object, then look in ordersList if it exists
            let client = 'Unknown client';
            if (appointmentData.client) {
              client = appointmentData.client;
            } else if (appointmentData.clientName) {
              client = appointmentData.clientName;
            } else if (appointmentData.clientsName) {
              client = appointmentData.clientsName;
            } else if (appointmentData.Client) {
              client = appointmentData.Client;
            } else if (appointmentData.ordersList && appointmentData.ordersList.client) {
              client = appointmentData.ordersList.client;
            } else if (appointmentData.ordersList && appointmentData.ordersList.clientsName) {
              client = appointmentData.ordersList.clientsName;
            } else if (appointmentData.ordersList && appointmentData.ordersList.Client) {
              client = appointmentData.ordersList.Client;
            } else if (appointmentData.customer_name) {
              client = appointmentData.customer_name;
            }
            
            const date = appointmentData.date || 
                        appointmentData.appointmentDate || 
                        appointmentData.startTime ||
                        appointmentData.Start_Time ||
                        appointmentData.appointment_date || 
                        new Date().toISOString().split('T')[0];
            
            const orderNumber = appointmentData.orderNumber || 
                               appointmentData.orderID || 
                               appointmentData.OrderID ||
                               appointmentData.order_id || 
                               'Unknown order';
            
            // Update the appointment data with normalized fields
            appointmentData = {
              ...appointmentData,
              id: adjustedId,
              appointmentId: adjustedId,
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
            ...fallbackResponse,
            data: appointmentData
          };
        } catch (fallbackError) {
          console.error(`Error with fallback endpoint: ${fallbackError.message}`);
          
          // Both endpoint attempts failed, try getting from the full list
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
  },

  /**
   * Get appointments with their associated orders
   * @param {Object} options - Pagination and filter options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.pageSize - Number of items per page
   * @returns {Promise<Object>} Response with appointments and orders data
   */
  getAppointmentsWithOrders: async (options = {}) => {
    try {
      // Set default pagination values
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      
      // Check if we're online first
      const isOnline = connectionUtils.isConnected();
      console.log(`Connection status before fetching appointments with orders: ${isOnline ? 'Online' : 'Offline'}`);
      
      // If offline, get from storage and paginate locally
      if (!isOnline) {
        const cachedResponse = await offlineStorage.getDataForKey('appointmentsWithOrders');
        if (cachedResponse && cachedResponse.data) {
          console.log(`Using cached appointments with orders (offline)`);
          
          // Extract the data array from response
          const cachedData = Array.isArray(cachedResponse.data) ? cachedResponse.data : [];
          
          // Calculate pagination
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = cachedData.slice(startIndex, endIndex);
          
          return {
            success: true,
            data: paginatedData,
            pagination: {
              page,
              pageSize,
              totalItems: cachedData.length,
              totalPages: Math.ceil(cachedData.length / pageSize),
              hasMore: endIndex < cachedData.length
            },
            fromCache: true
          };
        } else {
          return {
            success: false,
            message: 'You are offline and no cached appointment data is available.'
          };
        }
      }
      
      // Online - fetch from server with pagination params
      console.log(`Fetching appointments with orders from server (page ${page}, pageSize ${pageSize})`);
      const response = await apiClient.get('/appointments/with-orders', {
        params: { page, pageSize }
      });
      
      // Ensure data is an array
      let appointmentsData = [];
      let totalItems = 0;
      
      if (response.data && typeof response.data === 'object') {
        // Handle the case where data is inside a 'data' property (common API pattern)
        if (Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
          // Get total count from metadata if available
          totalItems = response.data.meta?.totalCount || response.data.total || appointmentsData.length;
          console.log('Found appointments in response.data.data array');
        } else if (Array.isArray(response.data)) {
          appointmentsData = response.data;
          totalItems = appointmentsData.length;
          console.log('Found appointments in response.data array');
        } else {
          console.log('Response data is not an array:', response.data);
          appointmentsData = [];
          totalItems = 0;
        }
      }
      
      // Process appointments with orders
      const processedAppointments = appointmentsData.map((appointment, index) => {
        // Get order data (if available)
        const order = appointment.ordersList || {};
        
        // Use consistent ID field
        const id = appointment.appointmentID?.toString() || String(index + 1);
        
        // Map fields to consistent structure
        return {
          id: id,
          appointmentId: id,
          orderID: appointment.orderID || order.orderid,
          orderNumber: appointment.orderID?.toString() || 'Unknown',
          address: appointment.location || order.fullAddress || 'No address provided',
          client: appointment.client || (order.client || order.clientsName || 'Client name pending'),
          date: appointment.startTime || order.orderdate || new Date().toISOString(),
          policyNo: order.policy || '',
          policyNumber: order.policy || '',
          sumInsured: order.sumInsured || 0,
          broker: order.broker || '',
          notes: appointment.comments || '',
          status: appointment.meetingStatus || 'scheduled',
          Invite_Status: appointment.inviteStatus || 'booked',
          // Preserve original data
          originalAppointment: appointment,
          originalOrder: order
        };
      });
      
      console.log(`Processed ${processedAppointments.length} appointments with orders (page ${page})`);
      
      // Cache all fetched data for offline use
      const cachedResponse = await offlineStorage.getDataForKey('appointmentsWithOrders');
      // Extract data array from response, or use empty array if null/undefined
      const existingCachedData = cachedResponse?.data || [];
      
      // Create a map of existing appointments by ID for quick lookup
      const existingAppointmentsMap = new Map();
      
      // Safely iterate over the array (check if it's iterable first)
      if (Array.isArray(existingCachedData)) {
        existingCachedData.forEach(app => {
          if (app && app.id) {
            existingAppointmentsMap.set(app.id, app);
          }
        });
      } else {
        console.log('No valid cached appointments found or cache is not an array');
      }
      
      // Merge new appointments with existing ones (replacing duplicates)
      processedAppointments.forEach(app => {
        existingAppointmentsMap.set(app.id, app);
      });
      
      // Convert map back to array
      const updatedCacheData = Array.from(existingAppointmentsMap.values());
      
      // Cache the merged result
      await offlineStorage.storeDataForKey('appointmentsWithOrders', updatedCacheData);
      console.log(`Cached ${updatedCacheData.length} total appointments with orders`);
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasMore = page < totalPages;
      
      return {
        ...response,
        data: processedAppointments,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasMore
        }
      };
    } catch (error) {
      console.error('Error fetching appointments with orders:', error);
      return error.success === false ? error : { success: false, message: error.message, data: [] };
    }
  },

  /**
   * Get appointments with orders by status
   * @param {string} status - Status of appointments to fetch
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.pageSize - Number of items per page
   * @returns {Promise<Object>} Response with filtered appointments
   */
  getAppointmentsWithOrdersByStatus: async (status, options = {}) => {
    try {
      // Set default pagination values
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      
      // First get appointments with orders for the current page
      const response = await appointmentsApi.getAppointmentsWithOrders({ page, pageSize });
      
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
          message: 'No appointments available',
          pagination: response.pagination || { page, pageSize, totalItems: 0, totalPages: 0, hasMore: false }
        };
      }
      
      console.log(`Filtering ${appointmentsArray.length} appointments by status: ${status}`);
      
      // Helper function to determine appointment status based on various fields
      const getAppointmentStatus = (appointment) => {
        // First check inviteStatus (from the API) or Invite_Status (our normalized field)
        if (appointment.inviteStatus) {
          return appointment.inviteStatus.toLowerCase();
        }
        if (appointment.Invite_Status) {
          return appointment.Invite_Status.toLowerCase();
        }
        
        // Check the meetingStatus or status fields
        if (appointment.meetingStatus) {
          return appointment.meetingStatus.toLowerCase();
        }
        if (appointment.status) {
          return appointment.status.toLowerCase();
        }
        
        // Fallback to default status based on order status if available
        if (appointment.originalOrder && appointment.originalOrder.orderStatus) {
          const orderStatus = appointment.originalOrder.orderStatus.toLowerCase();
          if (orderStatus === 'completed' || orderStatus === 'done') {
            return 'completed';
          }
          if (orderStatus === 'in progress' || orderStatus === 'started') {
            return 'in-progress';
          }
          return 'booked';
        }
        
        // Default to booked
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
                   appointmentStatus === 'booked' ||
                   appointmentStatus === 'assigned';
          
          case 'in-progress':
            return appointmentStatus === 'in-progress' || 
                   appointmentStatus === 'in_progress' ||
                   appointmentStatus === 'started';
          
          case 'completed':
            return appointmentStatus === 'completed' ||
                   appointmentStatus === 'done';
            
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
      
      // Return the filtered data with appropriate pagination info
      const finalData = deduplicatedData;
      const paginationInfo = {
        ...response.pagination,
        totalItems: response.pagination.totalItems || 0, // Preserve the original total count
        totalPages: Math.ceil((response.pagination.totalItems || 0) / pageSize),
        hasMore: page < Math.ceil((response.pagination.totalItems || 0) / pageSize)
      };
      
      // Remove auto-fetching of more data - this was causing multiple API calls
      // The UI will now explicitly request the next page when the user clicks "Next"
      
      return {
        ...response,
        data: finalData,
        pagination: paginationInfo
      };
    } catch (error) {
      console.error(`Error fetching ${status} appointments with orders:`, error);
      return error.success === false ? error : { 
        success: false, 
        message: error.message || `Failed to get ${status} appointments with orders`,
        data: []
      };
    }
  },

  /**
   * Get appointments using the list-view endpoint with status filtering
   * @param {Object} options - Search and pagination options
   * @param {string} options.status - Status filter ('Booked', 'In-Progress', 'Completed')
   * @param {string} options.surveyor - Surveyor ID to filter by (optional)
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.pageSize - Number of items per page
   * @param {string} options.startDateFrom - Start date filter (ISO string)
   * @param {string} options.startDateTo - End date filter (ISO string)
   * @returns {Promise<Object>} Response with filtered appointments
   */
  getAppointmentsByListView: async (options = {}) => {
    try {
      // Set default values
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const status = options.status || 'Booked'; // Default to 'Booked' for scheduled appointments
      const surveyor = options.surveyor || null;
      const startDateFrom = options.startDateFrom || null;
      const startDateTo = options.startDateTo || null;

      // Check if we're online first
      const isOnline = connectionUtils.isConnected();
      console.log(`Connection status before fetching appointments by list-view: ${isOnline ? 'Online' : 'Offline'}`);
      
      // If offline, get from storage and filter
      if (!isOnline) {
        const cachedResponse = await offlineStorage.getDataForKey('appointmentsByListView');
        if (cachedResponse && cachedResponse.data) {
          console.log(`Using cached list-view appointments (offline)`);
          
          // Extract data and filter by status, surveyor, and date range
          const cachedData = Array.isArray(cachedResponse.data) ? cachedResponse.data : [];
          const filteredData = cachedData.filter(appointment => {
            // Filter by status
            if (appointment.inviteStatus !== status) return false;
            
            // Filter by surveyor if provided
            if (surveyor && appointment.surveyorID !== surveyor) return false;
            
            // Filter by date range if provided
            if (startDateFrom || startDateTo) {
              const appointmentDate = new Date(appointment.date || appointment.Start_Time);
              
              if (startDateFrom) {
                const fromDate = new Date(startDateFrom);
                if (appointmentDate < fromDate) return false;
              }
              
              if (startDateTo) {
                const toDate = new Date(startDateTo);
                if (appointmentDate > toDate) return false;
              }
            }
            
            return true;
          });
          
          // Calculate pagination
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = filteredData.slice(startIndex, endIndex);
          
          return {
            success: true,
            data: paginatedData,
            pagination: {
              page,
              pageSize,
              totalItems: filteredData.length,
              totalPages: Math.ceil(filteredData.length / pageSize),
              hasMore: endIndex < filteredData.length
            },
            fromCache: true
          };
        } else {
          return {
            success: false,
            message: 'You are offline and no cached appointment data is available.'
          };
        }
      }
      
      // Online - fetch from server with parameters
      console.log(`Fetching appointments from list-view with status: ${status}, page: ${page}`);
      
      // Build query parameters
      const params = {
        page,
        pageSize,
        inviteStatus: status
      };
      
      // Add surveyor parameter if provided
      if (surveyor) {
        params.surveyor = surveyor;
      }
      
      // Add date range parameters if provided
      if (startDateFrom) {
        params.startDateFrom = startDateFrom;
      }
      if (startDateTo) {
        params.startDateTo = startDateTo;
      }
      
      // Make the API call with parameters - try with direct axios call to troubleshoot
      console.log(`Calling API endpoint with params: ${JSON.stringify(params)}`);
      console.log(`API base URL is: ${API_BASE_URL}`);
      
      try {
        // Use apiClient which has bearer token authentication
        console.log(`Making authenticated API call to: /appointments/list-view`);
        const response = await apiClient.get('/appointments/list-view', { 
          params,
          timeout: 45000 // 45 second timeout for list-view endpoint
        });
        console.log('API call successful');
        
        // If we got here, the response was successful
        const axiosResponse = {
          success: true,
          data: response.data,
          status: response.status
        };
        
        // Ensure data is an array
        let appointmentsData = [];
        let totalItems = 0;
        
        if (axiosResponse.data && typeof axiosResponse.data === 'object') {
          // Handle the case where data is inside a 'data' property (common API pattern)
          if (Array.isArray(axiosResponse.data.data)) {
            appointmentsData = axiosResponse.data.data;
            // Get total count from metadata if available
            totalItems = axiosResponse.data.meta?.totalCount || axiosResponse.data.total || appointmentsData.length;
            console.log('Found appointments in response.data.data array');
          } else if (Array.isArray(axiosResponse.data)) {
            appointmentsData = axiosResponse.data;
            totalItems = appointmentsData.length;
            console.log('Found appointments in response.data array');
          } else {
            console.log('Response data is not an array:', axiosResponse.data);
            appointmentsData = [];
            totalItems = 0;
          }
        }
        
        // Process appointments
        const processedAppointments = appointmentsData.map((appointment, index) => {
          // Use consistent ID field with index as suffix to ensure uniqueness
          const baseId = appointment.AppointmentID?.toString() || String(index + 1);
          const id = `${baseId}`;
          
          // Map fields directly from the flat API response structure
          return {
            id: id,
            appointmentId: id,
            appointmentIndex: index, // Add index for additional uniqueness if needed by components
            orderID: appointment.OrderID,
            orderNumber: appointment.OrderID?.toString() || 'Unknown',
            address: appointment.Location || 'No address provided',
            client: appointment.Client || 'Client name pending',
            date: appointment.Start_Time || new Date().toISOString(),
            policyNo: appointment.Policy || '',
            policyNumber: appointment.Policy || '',
            sumInsured: appointment['Sum Insured'] || 0,
            broker: appointment.Broker || '',
            notes: appointment.Comments || '',
            status: appointment.Meeting_Status || 'scheduled',
            Invite_Status: appointment.Invite_Status || status,
            surveyor: appointment.Surveyor || '',
            surveyorID: appointment.SurveyorID || null,
            category: appointment.Category || '',
            fullAddress: appointment.FullAddress || appointment.Location || '',
            region: appointment.Region || '',
            city: appointment.City || '',
            insurer: appointment.Insurer || '',
            orderStatus: appointment['Order Status'] || '',
            dateModified: appointment.date_modified || appointment.DateModified || null,
            lastEdited: appointment.date_modified || appointment.DateModified || null,
            // Store original data for reference
            originalData: appointment
          };
        });
        
        console.log(`Processed ${processedAppointments.length} appointments from list-view (page ${page})`);
        
        // Cache all fetched data for offline use
        const cachedResponse = await offlineStorage.getDataForKey('appointmentsByListView');
        // Extract data array from response, or use empty array if null/undefined
        const existingCachedData = cachedResponse?.data || [];
        
        // Create a map of existing appointments by ID for quick lookup
        const existingAppointmentsMap = new Map();
        
        // Safely iterate over the array (check if it's iterable first)
        if (Array.isArray(existingCachedData)) {
          existingCachedData.forEach(app => {
            if (app && app.id) {
              existingAppointmentsMap.set(app.id, app);
            }
          });
        } else {
          console.log('No valid cached appointments found or cache is not an array');
        }
        
        // Merge new appointments with existing ones (replacing duplicates)
        processedAppointments.forEach(app => {
          existingAppointmentsMap.set(app.id, app);
        });
        
        // Convert map back to array
        const updatedCacheData = Array.from(existingAppointmentsMap.values());
        
        // Cache the merged result
        await offlineStorage.storeDataForKey('appointmentsByListView', updatedCacheData);
        console.log(`Cached ${updatedCacheData.length} total appointments from list-view`);
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / pageSize);
        const hasMore = page < totalPages;
        
        return {
          ...axiosResponse,
          data: processedAppointments,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasMore
          }
        };
      } catch (error) {
        console.error('Error fetching appointments from list-view:', error);
        return error.success === false ? error : { success: false, message: error.message, data: [] };
      }
    } catch (error) {
      console.error('Error fetching appointments from list-view:', error);
      return error.success === false ? error : { success: false, message: error.message, data: [] };
    }
  },

  /**
   * Update an appointment's status
   * @param {string} appointmentId - ID of the appointment to update
   * @param {Object} updates - Fields to update
   * @param {string} updates.InviteStatus - New status value
   * @returns {Promise<Object>} Response with updated appointment data
   */
  updateAppointment: async (appointmentId, updates) => {
    try {
      console.log(`Updating appointment ${appointmentId} with:`, updates);
      const response = await apiClient.put(`/appointments/${appointmentId}`, updates);
      return response;
    } catch (error) {
      console.error(`Error updating appointment ${appointmentId}:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get appointment statistics
   * @returns {Promise<Object>} Response with appointment stats by invite status
   */
  getAppointmentStats: async () => {
    try {
      console.log('Fetching appointment statistics');
      
      const response = await apiClient.get('/appointments/stats');
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get appointment by order number
   * @param {string} orderNumber - Order number to search for
   * @returns {Promise<Object>} Response with appointment data
   */
  getAppointmentByOrder: async (orderNumber) => {
    try {
      console.log(`Fetching appointment for order number: ${orderNumber}`);
      
      const response = await apiClient.get(`/appointments/order/${orderNumber}`);
      
      if (response.data) {
        // Process the appointment data similar to getAppointmentById
        let appointmentData = response.data;
        if (response.data && response.data.data && typeof response.data.data === 'object') {
          appointmentData = response.data.data;
        }
        
        // Normalize the appointment data
        if (appointmentData && typeof appointmentData === 'object') {
          const address = appointmentData.address || 
                         appointmentData.location || 
                         appointmentData.property_address || 
                         appointmentData.FullAddress ||
                         'No address provided';
          
          const client = appointmentData.client || 
                        appointmentData.clientName || 
                        appointmentData.clientsName || 
                        appointmentData.Client ||
                        'Unknown client';
          
          const date = appointmentData.date || 
                      appointmentData.appointmentDate || 
                      appointmentData.startTime ||
                      appointmentData.Start_Time ||
                      appointmentData.appointment_date || 
                      new Date().toISOString().split('T')[0];
          
          const appointmentId = appointmentData.id || 
                               appointmentData.appointmentId || 
                               appointmentData.appointmentID || 
                               appointmentData.AppointmentID;
          
          // Update the appointment data with normalized fields
          appointmentData = {
            ...appointmentData,
            id: appointmentId?.toString(),
            appointmentId: appointmentId?.toString(),
            address,
            client,
            date,
            orderNumber: orderNumber,
            // Preserve the original Invite_Status if available
            Invite_Status: appointmentData.Invite_Status || appointmentData.status || 'booked',
            // Keep the status field as a backup
            status: appointmentData.status || appointmentData.Invite_Status || 'booked'
          };
        }
        
        return {
          success: true,
          data: appointmentData,
          status: response.status
        };
      }
      
      throw new Error('Empty response from API');
    } catch (error) {
      console.error(`Error fetching appointment for order ${orderNumber}:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  }
};

export default appointmentsApi; 