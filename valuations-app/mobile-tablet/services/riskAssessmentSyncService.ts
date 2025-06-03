import api from '../api';
import NetInfo from '@react-native-community/netinfo';
import {
  getPendingSyncRiskAssessmentItems,
  getPendingSyncAppointments,
  getPendingSyncRiskAssessmentMasters,
  markRiskAssessmentItemsAsSynced,
  markAppointmentsAsSynced,
  markRiskAssessmentMastersAsSynced,
  RiskAssessmentItem,
  RiskAssessmentMaster,
  Appointment
} from '../utils/db';

// Debug: Check if API module has syncChanges function
console.log('API module imported:', api);
console.log('syncChanges function available:', typeof api.syncChanges);
console.log('Available API functions:', Object.keys(api));

/**
 * Service for handling synchronization of risk assessment data between local storage and server
 */
const riskAssessmentSyncService = {
  /**
   * Check if device is currently connected to the internet
   * @returns {Promise<boolean>} Connection status
   */
  isConnected: async (): Promise<boolean> => {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true && netInfo.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  },

  /**
   * Sync all pending changes to the server
   * @returns {Promise<Object>} Sync result
   */
  syncPendingChanges: async () => {
    try {
      // Check internet connection
      if (!(await riskAssessmentSyncService.isConnected())) {
        return { 
          success: false, 
          error: 'No internet connection',
          offline: true
        };
      }

      console.log('Starting sync of pending changes...');

      // Get all pending changes from SQLite
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters()
      ]);

      console.log('Pending changes found:', {
        riskAssessmentItems: pendingRiskAssessmentItems.length,
        appointments: pendingAppointments.length,
        riskAssessmentMasters: pendingRiskAssessmentMasters.length
      });

      // Log detailed information about pending risk assessment items
      if (pendingRiskAssessmentItems.length > 0) {
        console.log('=== PENDING RISK ASSESSMENT ITEMS (Raw from SQLite) ===');
        pendingRiskAssessmentItems.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, {
            riskassessmentitemid: item.riskassessmentitemid,
            riskassessmentcategoryid: item.riskassessmentcategoryid,
            itemprompt: item.itemprompt,
            description: item.description,
            model: item.model,
            qty: item.qty,
            price: item.price,
            assessmentregisterid: item.assessmentregisterid,
            pending_sync: item.pending_sync,
            datecreated: item.datecreated,
            dateupdated: item.dateupdated
          });
        });
      }

      // If no changes to sync, return early
      if (pendingRiskAssessmentItems.length === 0 && pendingAppointments.length === 0 && pendingRiskAssessmentMasters.length === 0) {
        return {
          success: true,
          message: 'No pending changes to sync',
          synced: {
            riskAssessmentItems: 0,
            appointments: 0,
            riskAssessmentMasters: 0
          }
        };
      }

      // Prepare sync data in the expected format
      const syncData = {
        deviceId: "mobile-tablet-device", // TODO: Get actual device ID
        userId: "current-user-id", // TODO: Get actual user ID
        appointments: pendingAppointments.map((apt: Appointment) => ({
          appointmentID: apt.appointmentID,
          orderID: apt.orderID,
          startTime: apt.startTime,
          endTime: apt.endTime,
          followUpDate: apt.followUpDate,
          arrivalTime: apt.arrivalTime,
          departureTime: apt.departureTime,
          inviteStatus: apt.inviteStatus,
          meetingStatus: apt.meetingStatus,
          location: apt.location,
          comments: apt.comments,
          category: apt.category,
          outoftown: apt.outoftown,
          surveyorComments: apt.surveyorComments,
          eventId: apt.eventId,
          surveyorEmail: apt.surveyorEmail,
          dateModified: apt.dateModified
        })),
        riskAssessmentMasters: pendingRiskAssessmentMasters.map((master: RiskAssessmentMaster) => ({
          riskassessmentid: master.riskassessmentid,
          assessmenttypename: master.assessmenttypename,
          surveydate: master.surveydate,
          clientnumber: master.clientnumber,
          comments: master.comments,
          totalvalue: master.totalvalue,
          iscomplete: master.iscomplete ? true : false
        })),
        riskAssessmentItems: pendingRiskAssessmentItems.map((item: RiskAssessmentItem, index: number) => {
          const transformedItem = {
            riskassessmentitemid: item.riskassessmentitemid,
            riskassessmentcategoryid: item.riskassessmentcategoryid,
            itemprompt: item.itemprompt,
            itemtype: item.itemtype,
            rank: item.rank,
            commaseparatedlist: item.commaseparatedlist,
            selectedanswer: item.selectedanswer,
            qty: item.qty,
            price: item.price,
            description: item.description,
            model: item.model,
            location: item.location,
            assessmentregisterid: item.assessmentregisterid,
            assessmentregistertypeid: item.assessmentregistertypeid,
            datecreated: item.datecreated,
            createdbyid: item.createdbyid,
            dateupdated: item.dateupdated,
            updatedbyid: item.updatedbyid,
            issynced: item.issynced ? true : false,
            syncversion: item.syncversion,
            deviceid: item.deviceid,
            syncstatus: item.syncstatus,
            synctimestamp: item.synctimestamp,
            hasphoto: item.hasphoto ? true : false,
            latitude: item.latitude,
            longitude: item.longitude,
            notes: item.notes
          };
          
          console.log(`=== TRANSFORMED ITEM ${index + 1} FOR API ===`, transformedItem);
          return transformedItem;
        }),
        deletedEntities: [] // TODO: Implement deleted entities tracking
      };

      console.log('=== COMPLETE SYNC PAYLOAD ===');
      console.log('Sync data structure:', {
        deviceId: syncData.deviceId,
        userId: syncData.userId,
        appointmentsCount: syncData.appointments.length,
        riskAssessmentMastersCount: syncData.riskAssessmentMasters.length,
        riskAssessmentItemsCount: syncData.riskAssessmentItems.length,
        deletedEntitiesCount: syncData.deletedEntities.length
      });

      console.log('=== FULL PAYLOAD BEING SENT TO API ===');
      console.log(JSON.stringify(syncData, null, 2));

      // Send changes to server
      console.log('Calling api.syncChanges with prepared data...');
      const response = await api.syncChanges(syncData);

      console.log('=== API RESPONSE ===');
      console.log('Response received:', {
        success: response.success,
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        message: response.message
      });

      if (response.success) {
        console.log('Server sync successful:', response.data);

        // Mark items as synced in local database
        if (pendingRiskAssessmentItems.length > 0) {
          const itemIds = pendingRiskAssessmentItems.map((item: RiskAssessmentItem) => item.riskassessmentitemid);
          console.log('Marking risk assessment items as synced:', itemIds);
          await markRiskAssessmentItemsAsSynced(itemIds);
        }

        if (pendingAppointments.length > 0) {
          const appointmentIds = pendingAppointments.map((apt: Appointment) => apt.appointmentID);
          console.log('Marking appointments as synced:', appointmentIds);
          await markAppointmentsAsSynced(appointmentIds);
        }

        if (pendingRiskAssessmentMasters.length > 0) {
          const masterIds = pendingRiskAssessmentMasters.map((master: RiskAssessmentMaster) => master.riskassessmentid);
          console.log('Marking risk assessment masters as synced:', masterIds);
          await markRiskAssessmentMastersAsSynced(masterIds);
        }

        console.log('=== SYNC COMPLETED SUCCESSFULLY ===');
        return {
          success: true,
          synced: {
            riskAssessmentItems: pendingRiskAssessmentItems.length,
            appointments: pendingAppointments.length,
            riskAssessmentMasters: pendingRiskAssessmentMasters.length
          },
          serverResponse: response.data
        };
      } else {
        console.error('=== SERVER SYNC FAILED ===');
        console.error('Error response:', response);
        return {
          success: false,
          error: response.message || 'Server sync failed',
          details: response
        };
      }

    } catch (error) {
      console.error('=== SYNC ERROR ===');
      console.error('Error syncing pending changes:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return {
        success: false,
        error: (error as Error).message || 'Sync failed'
      };
    }
  },

  /**
   * Get count of pending changes
   * @returns {Promise<Object>} Count of pending items
   */
  getPendingChangesCount: async () => {
    try {
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters()
      ]);

      return {
        riskAssessmentItems: pendingRiskAssessmentItems.length,
        appointments: pendingAppointments.length,
        riskAssessmentMasters: pendingRiskAssessmentMasters.length,
        total: pendingRiskAssessmentItems.length + pendingAppointments.length + pendingRiskAssessmentMasters.length
      };
    } catch (error) {
      console.error('Error getting pending changes count:', error);
      return {
        riskAssessmentItems: 0,
        appointments: 0,
        riskAssessmentMasters: 0,
        total: 0
      };
    }
  }
};

export default riskAssessmentSyncService; 