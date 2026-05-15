import transportClient from '../core/transport/transportClient';
import offlineStorage, { filterIncompleteAppointments, isAppointmentCompleted } from '../utils/offlineStorage';
import connectionUtils from '../utils/connectionUtils';
import { deleteAppointment } from '../utils/db';
import { 
  AppointmentListSchema, 
  AppointmentSchema, 
  DashboardStatsSchema,
  validateOrReject,
  validateArray,
  ValidationError 
} from '../core/schemas';

/**
 * Appointment related API methods using unified transport
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
      
      // If offline, get from storage (only incomplete appointments are cached)
      if (!isOnline) {
        const cachedResponse = await offlineStorage.getDataForKey('appointments');
        if (cachedResponse && cachedResponse.data) {
          // Extract the actual data array (already filtered to incomplete only)
          const cachedData = Array.isArray(cachedResponse.data) ? cachedResponse.data : [];
          console.log(`Using ${cachedData.length} cached incomplete appointments (offline)`);
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
      
      // Online - fetch from server using transport client
      console.log('Fetching appointments from server');
      const response = await transportClient.get('appointments.list', '/appointments');
      
      // Ensure data is an array and handle nested data structure
      let appointmentsData = [];
      
      if (response && typeof response === 'object') {
        // Handle the case where data is inside a 'data' property (common API pattern)
        if (Array.isArray(response.data)) {
          appointmentsData = response.data;
          console.log('Found appointments in response.data array');
        } else if (Array.isArray(response)) {
          appointmentsData = response;
          console.log('Found appointments in response array');
        } else {
          console.log('Response data is not an array:', response);
          // Extract potential appointments from object keys
          appointmentsData = Object.values(response).filter(item => 
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
                       appointment.ordersList?.clientsName || 
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
      
      // Validate the processed appointments against schema
      const validationResult = validateArray(AppointmentSchema, processedAppointments, 'appointments.list');
      
      if (!validationResult.success) {
        console.error('❌ Appointment data validation failed:', validationResult.errors);
        // Log validation errors but don't fail the request - return data with warnings
        console.warn('⚠️ Returning appointments with validation warnings');
      } else {
        console.log('✅ Appointment data validation passed');
      }
      
      // Cache only incomplete appointments for offline use (completed appointments fetched from API only)
      const incompleteAppointments = filterIncompleteAppointments(processedAppointments);
      if (incompleteAppointments.length > 0) {
        await offlineStorage.storeDataForKey('appointments', incompleteAppointments);
        console.log(`Cached ${incompleteAppointments.length} incomplete appointments (excluded ${processedAppointments.length - incompleteAppointments.length} completed)`);
      } else {
        console.log(`No incomplete appointments to cache (all ${processedAppointments.length} are completed)`);
      }
      
      return {
        success: true,
        data: processedAppointments, // Return all appointments (including completed) when online
        validationWarnings: (validationResult.errors || []).map(e => `${e.field}: ${e.message}`)
      };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, message: error.message, data: [] };
    }
  },
  
  /**
   * Get appointment details by ID
   * @param {string} appointmentId - ID of the appointment to fetch
   * @returns {Promise<Object>} Response with appointment data
   */
  getAppointmentById: async (appointmentId: string) => {
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
      
      // Online - fetch from server using transport client
      console.log(`Fetching appointment with ID: ${adjustedId}`);
      try {
        // Try the with-order endpoint first (provides most complete data)
        console.log(`Trying /appointments/${adjustedId}/with-order endpoint`);
        const response = await transportClient.get('appointments.detail', `/appointments/${adjustedId}/with-order`);
        
        // Handle potential nested data structure
        let appointmentData = response;
        if (response && response.data && typeof response.data === 'object') {
          appointmentData = response.data;
        }
        
        // Log the raw response for debugging
        console.log('🔍 RAW API RESPONSE STRUCTURE:');
        console.log('📊 Response type:', typeof response);
        console.log('📊 Response keys:', Object.keys(response || {}));
        console.log('📊 Response.data type:', typeof response?.data);
        console.log('📊 Response.data keys:', response?.data ? Object.keys(response.data) : 'N/A');
        console.log('📊 Final appointmentData type:', typeof appointmentData);
        console.log('📊 Final appointmentData keys:', Object.keys(appointmentData || {}));
        console.log('📊 Sample fields:');
        console.log('  - appointmentID:', appointmentData?.appointmentID, '(type:', typeof appointmentData?.appointmentID, ')');
        console.log('  - orderID:', appointmentData?.orderID, '(type:', typeof appointmentData?.orderID, ')');
        console.log('  - startTime:', appointmentData?.startTime, '(type:', typeof appointmentData?.startTime, ')');
        console.log('  - endTime:', appointmentData?.endTime, '(type:', typeof appointmentData?.endTime, ')');
        console.log('  - inviteStatus:', appointmentData?.inviteStatus, '(type:', typeof appointmentData?.inviteStatus, ')');
        console.log('  - location:', appointmentData?.location, '(type:', typeof appointmentData?.location, ')');
        console.log('  - comments:', appointmentData?.comments, '(type:', typeof appointmentData?.comments, ')');
        console.log('  - surveyorEmail:', appointmentData?.surveyorEmail, '(type:', typeof appointmentData?.surveyorEmail, ')');
        
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

          // SLA fields: with-order often returns them in ordersList
          const sla_status = appointmentData.sla_status ?? appointmentData.slaStatus ?? orderDetails.sla_status ?? orderDetails.slaStatus ?? null;
          const sla_start_date = appointmentData.sla_start_date ?? appointmentData.slaStartDate ?? orderDetails.sla_start_date ?? orderDetails.slaStartDate ?? null;
          const sla_due_date = appointmentData.sla_due_date ?? appointmentData.slaDueDate ?? orderDetails.sla_due_date ?? orderDetails.slaDueDate ?? null;
          const surveyor_start_date = appointmentData.surveyor_start_date ?? appointmentData.surveyorStartDate ?? orderDetails.surveyor_start_date ?? orderDetails.surveyorStartDate ?? null;
          const surveyor_due_date = appointmentData.surveyor_due_date ?? appointmentData.surveyorDueDate ?? orderDetails.surveyor_due_date ?? orderDetails.surveyorDueDate ?? null;
          const surveyor_status = appointmentData.surveyor_status ?? appointmentData.surveyorStatus ?? orderDetails.surveyor_status ?? orderDetails.surveyorStatus ?? null;
          const completed_at = appointmentData.completed_at ?? appointmentData.completedAt ?? orderDetails.completed_at ?? orderDetails.completedAt ?? null;

          const clientCell =
            orderDetails.clientCell ??
            orderDetails.ClientCell ??
            appointmentData.cell ??
            null;
          const clientLandline =
            orderDetails.clientPhoneNo ??
            orderDetails.ClientPhoneNo ??
            appointmentData.clientPhoneNo ??
            null;
          
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
            // SLA fields (from top level or ordersList)
            sla_status,
            sla_start_date,
            sla_due_date,
            surveyor_start_date,
            surveyor_due_date,
            surveyor_status,
            completed_at,
            // Top-level contact mirrors ordersList for consumers that read cell/phone only
            cell: clientCell ?? undefined,
            phone: clientLandline ?? appointmentData.phone ?? undefined,
            templates: appointmentData.templates ?? undefined,
            // Preserve original data
            originalAppointment: appointmentData,
            originalOrdersList: orderDetails
          };
        }
        
        // Log the final data structure before validation
        console.log('🔍 FINAL APPOINTMENT DATA BEFORE VALIDATION:');
        console.log('📊 Final data type:', typeof appointmentData);
        console.log('📊 Final data keys:', Object.keys(appointmentData || {}));
        console.log('📊 Key field values and types:');
        console.log('  - appointmentID:', appointmentData?.appointmentID, '(type:', typeof appointmentData?.appointmentID, ')');
        console.log('  - orderID:', appointmentData?.orderID, '(type:', typeof appointmentData?.orderID, ')');
        console.log('  - startTime:', appointmentData?.startTime, '(type:', typeof appointmentData?.startTime, ')');
        console.log('  - endTime:', appointmentData?.endTime, '(type:', typeof appointmentData?.endTime, ')');
        console.log('  - inviteStatus:', appointmentData?.inviteStatus, '(type:', typeof appointmentData?.inviteStatus, ')');
        console.log('  - location:', appointmentData?.location, '(type:', typeof appointmentData?.location, ')');
        console.log('  - comments:', appointmentData?.comments, '(type:', typeof appointmentData?.comments, ')');
        console.log('  - surveyorEmail:', appointmentData?.surveyorEmail, '(type:', typeof appointmentData?.surveyorEmail, ')');
        console.log('  - address:', appointmentData?.address, '(type:', typeof appointmentData?.address, ')');
        console.log('  - client:', appointmentData?.client, '(type:', typeof appointmentData?.client, ')');
        console.log('  - date:', appointmentData?.date, '(type:', typeof appointmentData?.date, ')');
        console.log('  - orderNumber:', appointmentData?.orderNumber, '(type:', typeof appointmentData?.orderNumber, ')');
        
        // Log fields that might be causing validation issues
        console.log('📊 Potentially problematic fields:');
        console.log('  - followUpDate:', appointmentData?.followUpDate, '(type:', typeof appointmentData?.followUpDate, ')');
        console.log('  - arrivalTime:', appointmentData?.arrivalTime, '(type:', typeof appointmentData?.arrivalTime, ')');
        console.log('  - departureTime:', appointmentData?.departureTime, '(type:', typeof appointmentData?.departureTime, ')');
        console.log('  - meetingStatus:', appointmentData?.meetingStatus, '(type:', typeof appointmentData?.meetingStatus, ')');
        console.log('  - category:', appointmentData?.category, '(type:', typeof appointmentData?.category, ')');
        console.log('  - outoftown:', appointmentData?.outoftown, '(type:', typeof appointmentData?.outoftown, ')');
        console.log('  - surveyorComments:', appointmentData?.surveyorComments, '(type:', typeof appointmentData?.surveyorComments, ')');
        console.log('  - eventId:', appointmentData?.eventId, '(type:', typeof appointmentData?.eventId, ')');
        console.log('  - dateModified:', appointmentData?.dateModified, '(type:', typeof appointmentData?.dateModified, ')');
        console.log('  - surveyorID:', appointmentData?.surveyorID, '(type:', typeof appointmentData?.surveyorID, ')');
        console.log('  - lastModifiedByID:', appointmentData?.lastModifiedByID, '(type:', typeof appointmentData?.lastModifiedByID, ')');
        console.log('  - isSynced:', appointmentData?.isSynced, '(type:', typeof appointmentData?.isSynced, ')');
        console.log('  - syncVersion:', appointmentData?.syncVersion, '(type:', typeof appointmentData?.syncVersion, ')');
        console.log('  - deviceID:', appointmentData?.deviceID, '(type:', typeof appointmentData?.deviceID, ')');
        console.log('  - syncStatus:', appointmentData?.syncStatus, '(type:', typeof appointmentData?.syncStatus, ')');
        console.log('  - syncTimestamp:', appointmentData?.syncTimestamp, '(type:', typeof appointmentData?.syncTimestamp, ')');
        console.log('  - latitude:', appointmentData?.latitude, '(type:', typeof appointmentData?.latitude, ')');
        console.log('  - longitude:', appointmentData?.longitude, '(type:', typeof appointmentData?.longitude, ')');
        
        // Normalize date fields to ISO datetime format before validation
        if (appointmentData && typeof appointmentData === 'object') {
          // Normalize datetime fields to ensure they're valid ISO strings
          const dateFields = ['startTime', 'endTime', 'followUpDate', 'arrivalTime', 'departureTime', 'dateModified', 'syncTimestamp'];
          dateFields.forEach(field => {
            if (appointmentData[field] !== null && appointmentData[field] !== undefined) {
              try {
                // If it's already a string, try to parse and reformat
                if (typeof appointmentData[field] === 'string') {
                  const date = new Date(appointmentData[field]);
                  if (!isNaN(date.getTime())) {
                    appointmentData[field] = date.toISOString();
                  } else {
                    // Invalid date string, set to null
                    appointmentData[field] = null;
                  }
                } else if (appointmentData[field] instanceof Date) {
                  appointmentData[field] = appointmentData[field].toISOString();
                }
              } catch (e) {
                // If parsing fails, set to null
                appointmentData[field] = null;
              }
            }
          });
        }
        
        // Validate the appointment data against schema
        const validationResult = validateOrReject(AppointmentSchema, appointmentData, 'appointments.detail');
        
        if (!validationResult.success) {
          // Use console.warn instead of console.error for validation warnings (non-critical)
          console.warn('⚠️ Appointment detail validation warnings:');
          const errors = validationResult.errors || [];
          errors.forEach((error, index) => {
            console.warn(`  ${index + 1}. Field: ${error.field}`);
            console.warn(`     Expected: ${error.message}`);
            console.warn(`     Received: ${error.value} (type: ${typeof error.value})`);
            console.warn(`     Context: ${error.context}`);
          });
          console.warn('⚠️ Returning appointment with validation warnings (app will continue to function)');
        } else {
          console.log('✅ Appointment detail validation passed');
        }
        
        return {
          success: true,
          data: appointmentData,
          validationWarnings: (validationResult.errors || []).map(e => `${e.field}: ${e.message}`)
        };
      } catch (withOrderError) {
        console.error(`Error with /with-order endpoint: ${withOrderError.message}`);
        
        // Try the basic appointment endpoint as fallback
        try {
          console.log(`Trying fallback to /appointments/${adjustedId} endpoint`);
          const fallbackResponse = await transportClient.get('appointments.detail', `/appointments/${adjustedId}`);
          
          let appointmentData = fallbackResponse;
          if (fallbackResponse && fallbackResponse.data && typeof fallbackResponse.data === 'object') {
            appointmentData = fallbackResponse.data;
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

            const fbOrder = appointmentData.ordersList || {};
            const fbCell =
              fbOrder.clientCell ??
              fbOrder.ClientCell ??
              appointmentData.cell ??
              null;
            const fbLandline =
              fbOrder.clientPhoneNo ??
              fbOrder.ClientPhoneNo ??
              appointmentData.clientPhoneNo ??
              null;
            
            // Update the appointment data with normalized fields
            appointmentData = {
              ...appointmentData,
              id: adjustedId,
              appointmentId: adjustedId,
              address,
              client,
              date,
              orderNumber,
              cell: fbCell ?? undefined,
              phone: fbLandline ?? appointmentData.phone ?? undefined,
              templates: appointmentData.templates ?? undefined,
              // Preserve the original Invite_Status if available
              Invite_Status: appointmentData.Invite_Status || appointmentData.status || 'booked',
              // Keep the status field as a backup
              status: appointmentData.status || appointmentData.Invite_Status || 'booked'
            };
          }
          
          // Normalize date fields for fallback data
          if (appointmentData && typeof appointmentData === 'object') {
            const dateFields = ['startTime', 'endTime', 'followUpDate', 'arrivalTime', 'departureTime', 'dateModified', 'syncTimestamp'];
            dateFields.forEach(field => {
              if (appointmentData[field] !== null && appointmentData[field] !== undefined) {
                try {
                  if (typeof appointmentData[field] === 'string') {
                    const date = new Date(appointmentData[field]);
                    if (!isNaN(date.getTime())) {
                      appointmentData[field] = date.toISOString();
                    } else {
                      appointmentData[field] = null;
                    }
                  } else if (appointmentData[field] instanceof Date) {
                    appointmentData[field] = appointmentData[field].toISOString();
                  }
                } catch (e) {
                  appointmentData[field] = null;
                }
              }
            });
          }
          
          // Validate the fallback appointment data
          const validationResult = validateOrReject(AppointmentSchema, appointmentData, 'appointments.detail.fallback');
          
          if (!validationResult.success) {
            // Use console.warn instead of console.error for validation warnings
            console.warn('⚠️ Fallback appointment validation warnings:', validationResult.errors);
            console.warn('⚠️ Returning fallback appointment with validation warnings (app will continue to function)');
          } else {
            console.log('✅ Fallback appointment validation passed');
          }
          
          return {
            success: true,
            data: appointmentData,
            validationWarnings: (validationResult.errors || []).map(e => `${e.field}: ${e.message}`)
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
      return { success: false, message: error.message };
    }
  },

  /**
   * Update an appointment's status
   * @param {string} appointmentId - ID of the appointment to update
   * @param {Object} updates - Fields to update
   * @param {string} updates.InviteStatus - New status value
   * @returns {Promise<Object>} Response with updated appointment data
   */
  updateAppointment: async (appointmentId: string, updates: any) => {
    try {
      console.log(`Updating appointment ${appointmentId} with:`, updates);
      
      // Validate the update data before sending
      const validationResult = validateOrReject(AppointmentSchema.partial(), updates, 'appointments.update');
      
      if (!validationResult.success) {
        console.error('❌ Update data validation failed:', validationResult.errors);
        return { 
          success: false, 
          message: 'Invalid update data', 
          validationErrors: (validationResult.errors || []).map(e => `${e.field}: ${e.message}`)
        };
      }
      
      console.log('✅ Update data validation passed');
      const response = await transportClient.put('appointments.update', `/appointments/${appointmentId}`, updates);
      
      // Check if appointment is being marked as completed
      const status = updates.inviteStatus || updates.Invite_Status || updates.status;
      if (status && isAppointmentCompleted({ Invite_Status: status, inviteStatus: status, status })) {
        // Delete from SQLite when marked as complete
        try {
          await deleteAppointment(appointmentId);
          console.log(`🗑️ Deleted completed appointment ${appointmentId} from SQLite`);
          
          // Also remove from AsyncStorage cache
          await offlineStorage.removeDataForKey('appointments');
          await offlineStorage.removeDataForKey('appointmentsByListView');
          await offlineStorage.removeDataForKey('appointmentsWithOrders');
          console.log(`🗑️ Cleared appointment caches after completion`);
        } catch (deleteError) {
          // Log but don't fail the update if deletion fails
          console.error(`⚠️ Failed to delete completed appointment from SQLite:`, deleteError);
        }
      }
      
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error updating appointment ${appointmentId}:`, error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Surveyor: update site address via mobile BFF → PATCH /api/mobile/appointment/:id/site-address
   */
  patchSiteAddress: async (appointmentId: string, body: Record<string, unknown>) => {
    try {
      const numericId = String(appointmentId).replace(/\D/g, "") || appointmentId;
      const response = await transportClient.patch(
        "mobile.appointment.site-address",
        `/mobile/appointment/${numericId}/site-address`,
        body,
        { timeout: 20000 }
      );
      try {
        await offlineStorage.removeDataForKey("appointmentsByListView");
        await offlineStorage.removeDataForKey("appointments");
      } catch (e) {
        console.warn("Could not clear appointment offline caches", e);
      }
      return { success: true, data: response };
    } catch (error: any) {
      const data = error.response?.data;
      const serverMessage =
        (typeof data?.error === "string" && data.error) ||
        data?.message ||
        error?.message;
      return {
        success: false,
        message: serverMessage || "Failed to update site address",
      };
    }
  },

  /**
   * Update risk assessment master status
   * @param {number} orderId - The order ID
   * @param {string} status - The status to set
   * @returns {Promise<Object>} Response with update result
   */
  updateRiskAssessmentMasterStatus: async (orderId: number, status: string) => {
    // Temporarily disabled: /api/risk-assessment-master/update-status
    // try {
    //   console.log(`Updating risk assessment master status - Order ID: ${orderId}, Status: ${status}`);
    //   const response = await transportClient.put(
    //     'risk-assessment.update-status',
    //     '/api/risk-assessment-master/update-status',
    //     { orderId, status }
    //   );
    //   if (response) {
    //     console.log('✅ Risk assessment master status updated successfully');
    //     return { success: true, data: response, message: 'Risk assessment master status updated successfully' };
    //   } else {
    //     console.error('❌ Failed to update risk assessment master status:', response);
    //     return { success: false, message: 'Failed to update risk assessment master status' };
    //   }
    // } catch (error: any) {
    //   console.error('Error updating risk assessment master status:', error);
    //   return { success: false, message: error.message || 'An error occurred while updating risk assessment master status' };
    // }
    console.log(`[Skipped] Risk assessment master update-status - Order ID: ${orderId}, Status: ${status}`);
    return { success: true, data: null, message: 'Update-status call disabled' };
  },

  /**
   * Get appointments using list-view endpoint with filtering options
   * @param {Object} options - Filtering options (page, pageSize, status, surveyor, dates)
   * @returns {Promise<Object>} Response with filtered appointments
   */
  getAppointmentsByListView: async (options: any = {}) => {
    try {
      // Set default values
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const status = options.status || 'Booked'; // Default to 'Booked' for scheduled appointments
      const surveyor = options.surveyor || null;
      const startDateFrom = options.startDateFrom || null;
      const startDateTo = options.startDateTo || null;

      // Align with UI: fresh async check (not stale sync isConnected)
      const isOnline = await connectionUtils.getStatus();
      const statusLower = (status || '').toString().toLowerCase();
      const isCompletedStatus = statusLower === 'completed';
      console.log(`Connection status before fetching appointments by list-view: ${isOnline ? 'Online' : 'Offline'}`);

      // Completed appointments/orders are never cached in SQLite or offline storage - always require API
      if (isCompletedStatus && !isOnline) {
        return {
          success: false,
          message: 'Completed appointments are not stored offline. Please connect to the network to view completed appointments.'
        };
      }
      if (isCompletedStatus) {
        // Skip cache entirely for Completed - always fetch from server
      } else if (!isOnline) {
        // If offline, get from storage and filter (incomplete appointments only)
        const cachedResponse = await offlineStorage.getDataForKey('appointmentsByListView');
        if (cachedResponse && cachedResponse.data) {
          console.log(`Using cached list-view appointments (offline - incomplete only)`);
          
          // Extract array: getApiData wraps storage; stored payload may be { data: rows } envelope
          const raw = cachedResponse.data as any;
          const cachedData = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(raw?.appointments)
                ? raw.appointments
                : [];
          console.log(`📦 Offline list-view cache resolved ${cachedData.length} appointment row(s)`);
          
          // Cached data only contains incomplete appointments
          const filteredData = cachedData.filter((appointment: any) => {
            // Filter by status
            if (appointment.inviteStatus !== status) return false;
            
            // Filter by surveyor if provided
            if (surveyor && appointment.surveyorID !== surveyor) return false;
            
            // Filter by date range if provided
            // Use parseUTCDate to ensure proper UTC date parsing
            if (startDateFrom || startDateTo) {
              const { parseUTCDate } = require('../utils/dateUtils');
              const appointmentDate = parseUTCDate(appointment.date || appointment.Start_Time || appointment.appointment_Date);
              
              if (!appointmentDate) return false; // Skip if date is invalid
              
              if (startDateFrom) {
                const fromDate = parseUTCDate(startDateFrom);
                if (!fromDate || appointmentDate < fromDate) return false;
              }
              
              if (startDateTo) {
                const toDate = parseUTCDate(startDateTo);
                if (!toDate || appointmentDate > toDate) return false;
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
      console.log(`📋 Fetching appointments from list-view with status: ${status}, page: ${page}`);
      
      // Build query parameters to match the working .js implementation
      const params: any = {
        page,
        pageSize,
        inviteStatus: status // Use inviteStatus instead of status to match backend
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
      
      console.log(`📋 Calling API endpoint with params:`, params);
      console.log(`📋 Full API call details:`, {
        endpointId: 'appointments.list-view',
        url: '/appointments/list-view',
        params: params,
        options: { timeout: 45000 }
      });
      
      // Online - fetch from server
      const response = await transportClient.get('appointments.list-view', '/mobile/appointment/list-view', params, {
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
      let appointmentsData: any[] = [];
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
      const processedAppointments = appointmentsData.map((appointment: any, index: number) => {
        // Use consistent ID field with index as suffix to ensure uniqueness
        const baseId = appointment.AppointmentID?.toString() || String(index + 1);
        const id = `${baseId}`;

        // SLA fields: support both snake_case and camelCase from API
        const sla_status = appointment.sla_status ?? appointment.slaStatus ?? null;
        const sla_start_date = appointment.sla_start_date ?? appointment.slaStartDate ?? null;
        const sla_due_date = appointment.sla_due_date ?? appointment.slaDueDate ?? null;
        const surveyor_start_date = appointment.surveyor_start_date ?? appointment.surveyorStartDate ?? null;
        const surveyor_due_date = appointment.surveyor_due_date ?? appointment.surveyorDueDate ?? null;
        const surveyor_status = appointment.surveyor_status ?? appointment.surveyorStatus ?? null;
        const completed_at = appointment.completed_at ?? appointment.completedAt ?? null;

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
          inviteStatus: appointment.Invite_Status || 'Unknown',
          Invite_Status: appointment.Invite_Status || 'Unknown',
          status: appointment.Invite_Status || 'Unknown',
          Start_Time: appointment.Start_Time,
          location: appointment.Location || 'No address provided',
          fullAddress: appointment.Location || 'No address provided',
          // SLA fields from list-view (Epic 2)
          sla_status,
          sla_start_date,
          sla_due_date,
          surveyor_start_date,
          surveyor_due_date,
          surveyor_status,
          completed_at
        };
      });
      
      console.log(`📋 Successfully processed ${processedAppointments.length} appointments for list-view`);
      
      // Store successful response for offline use (only incomplete appointments)
      const incompleteAppointments = filterIncompleteAppointments(processedAppointments);
      const incompleteTotalItems = incompleteAppointments.length;
      
      const responseToStore = {
        success: true,
        data: incompleteAppointments, // Only cache incomplete appointments
        totalItems: incompleteTotalItems,
        pagination: {
          page,
          pageSize,
          totalItems: incompleteTotalItems,
          totalPages: Math.ceil(incompleteTotalItems / pageSize),
          hasMore: (page * pageSize) < incompleteTotalItems
        },
        filteredBy: status,
        timestamp: new Date().toISOString()
      };
      
      // Only cache incomplete appointments; never cache when loading Completed list
      if (!isCompletedStatus && incompleteAppointments.length > 0) {
        await offlineStorage.storeDataForKey('appointmentsByListView', responseToStore);
        console.log(`Cached ${incompleteAppointments.length} incomplete list-view appointments (excluded ${processedAppointments.length - incompleteAppointments.length} completed)`);
      } else if (isCompletedStatus) {
        console.log('Completed list-view response not cached (completed appointments never stored in SQLite/offline)');
      } else {
        console.log(`No incomplete appointments to cache for list-view (all ${processedAppointments.length} are completed)`);
      }
      
      // Return all appointments (including completed) when online
      return {
        success: true,
        data: processedAppointments,
        totalItems,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
          hasMore: (page * pageSize) < totalItems
        },
        filteredBy: status,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error fetching appointments by list-view:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get appointments filtered by status
   * @param {string} status - Status to filter by ('scheduled', 'in-progress', 'completed')
   * @returns {Promise<Object>} Response with filtered appointments
   */
  getAppointmentsByStatus: async (status: string) => {
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
      const getAppointmentStatus = (appointment: any) => {
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
      const filteredData = appointmentsArray.filter((appointment: any) => {
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
      
      return {
        success: true,
        data: filteredData,
        totalCount: filteredData.length,
        filteredBy: status
      };
    } catch (error: any) {
      console.error(`Error filtering appointments by status ${status}:`, error);
      return { success: false, message: error.message, data: [] };
    }
  },

  /**
   * Get appointments with their associated orders
   * @param {Object} options - Options for pagination
   * @returns {Promise<Object>} Response with appointments and orders
   */
  getAppointmentsWithOrders: async (options: any = {}) => {
    try {
      // Set default pagination values
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      
      // Check if we're online first
      const isOnline = connectionUtils.isConnected();
      console.log(`Connection status before fetching appointments with orders: ${isOnline ? 'Online' : 'Offline'}`);
      
      // If offline, get from storage and paginate locally
      // Note: Only incomplete appointments are cached, so completed appointments won't be available offline
      if (!isOnline) {
        const cachedResponse = await offlineStorage.getDataForKey('appointmentsWithOrders');
        if (cachedResponse && cachedResponse.data) {
          console.log(`Using cached appointments with orders (offline - incomplete only)`);
          
          // Extract the data array from response (only incomplete appointments are cached)
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
            message: 'You are offline and no cached appointments with orders data is available.'
          };
        }
      }
      
      // Online - fetch from server with pagination params
      console.log(`Fetching appointments with orders from server (page ${page}, pageSize ${pageSize})`);
      const response = await transportClient.get('appointments.with-orders', '/appointments/with-orders', { page, pageSize });
      
      // Store successful response for offline use (only incomplete appointments)
      if (response && response.data) {
        const appointmentsData = Array.isArray(response.data) ? response.data : [];
        const incompleteAppointments = filterIncompleteAppointments(appointmentsData);
        
        if (incompleteAppointments.length > 0) {
          const incompleteResponse = {
            ...response,
            data: incompleteAppointments
          };
          await offlineStorage.storeDataForKey('appointmentsWithOrders', incompleteResponse);
          console.log(`Cached ${incompleteAppointments.length} incomplete appointments with orders (excluded ${appointmentsData.length - incompleteAppointments.length} completed)`);
        } else {
          console.log(`No incomplete appointments to cache with orders (all ${appointmentsData.length} are completed)`);
        }
      }
      
      return {
        success: true,
        data: response.data || response, // Return all appointments (including completed) when online
        status: 200
      };
    } catch (error: any) {
      console.error('Error fetching appointments with orders:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get appointments with orders filtered by status
   * @param {string} status - Status to filter by
   * @param {Object} options - Options for pagination
   * @returns {Promise<Object>} Response with filtered appointments and orders
   */
  getAppointmentsWithOrdersByStatus: async (status: string, options: any = {}) => {
    try {
      // Set default pagination values
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      
      // Get appointments with orders first
      const response = await appointmentsApi.getAppointmentsWithOrders({ page, pageSize });
      
      if (!response.success) {
        return response;
      }
      
      // Filter by status
      const appointmentsArray = Array.isArray(response.data) ? response.data : [];
      const filteredData = appointmentsArray.filter((appointment: any) => {
        const inviteStatus = appointment.Invite_Status || appointment.status;
        return inviteStatus && inviteStatus.toLowerCase().includes(status.toLowerCase());
      });
      
      return {
        success: true,
        data: filteredData,
        totalCount: filteredData.length,
        filteredBy: status
      };
    } catch (error: any) {
      console.error(`Error fetching appointments with orders by status ${status}:`, error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get appointment statistics
   * @returns {Promise<Object>} Response with appointment stats by invite status
   */
  getAppointmentStats: async () => {
    try {
      console.log('Fetching appointment statistics');
      const response = await transportClient.get('appointments.list', '/appointments/stats');
      
      // Validate the stats response against schema
      const validationResult = validateOrReject(DashboardStatsSchema, response, 'appointments.stats');
      
      if (!validationResult.success) {
        console.error('❌ Stats data validation failed:', validationResult.errors);
        console.warn('⚠️ Returning stats with validation warnings');
      } else {
        console.log('✅ Stats data validation passed');
      }
      
      return {
        success: true,
        data: response,
        status: 200,
        validationWarnings: (validationResult.errors || []).map(e => `${e.field}: ${e.message}`)
      };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Submit risk assessment for QA review
   * @param {number} orderId - The order ID to submit for QA review
   * @returns {Promise<Object>} Response with updated assessments
   */
  submitRiskAssessmentForQA: async (orderId: number, totalMileageKm?: number) => {
    try {
      console.log(`Submitting risk assessment for QA review - Order ID: ${orderId}`);
      
      const body: { orderId: number; totalMileageKm?: number } = { orderId };
      if (typeof totalMileageKm === 'number') {
        body.totalMileageKm = totalMileageKm;
      }

      const response = await transportClient.put(
        'risk-assessment.qa-submit',
        '/risk-assessment-master/submit-for-qa',
        body
      );
      
      // Transport client returns data directly, not wrapped in success object
      if (response) {
        console.log('✅ Risk assessment submitted for QA successfully');
        return {
          success: true,
          data: response,
          message: response.message || 'Risk assessment submitted for QA review successfully'
        };
      } else {
        console.error('❌ Failed to submit risk assessment for QA:', response);
        return {
          success: false,
          message: 'Failed to submit risk assessment for QA review'
        };
      }
    } catch (error: any) {
      console.error('Error submitting risk assessment for QA:', error);
      const data = error.response?.data;
      const serverMessage =
        (typeof data?.error === 'object' && data?.error?.message) ||
        data?.message ||
        (typeof data?.error === 'string' ? data.error : null);
      return {
        success: false,
        message: serverMessage || error.message || 'An error occurred while submitting for QA review',
      };
    }
  }
};

export default appointmentsApi;
