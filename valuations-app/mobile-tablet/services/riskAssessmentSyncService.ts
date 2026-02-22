import api from '../api';
import * as apiModule from '../api';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { SYNC_CONFIG, getEnvironmentConfig } from '../config/syncConfig';
import {
  getPendingSyncRiskAssessmentItems,
  getPendingSyncAppointments,
  getPendingSyncRiskAssessmentMasters,
  getPendingSyncMediaFiles,
  getPendingSyncDeletedMediaFiles,
  markRiskAssessmentItemsAsSynced,
  markAppointmentsAsSynced,
  markRiskAssessmentMastersAsSynced,
  markMediaFilesAsSynced,
  updateMediaFile,
  updateRiskAssessmentItem,
  RiskAssessmentItem,
  RiskAssessmentMaster,
  Appointment,
  MediaFile
} from '../utils/db';

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
   * Sync all pending changes to the server with batching
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
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters, pendingMediaFiles, pendingDeletedMediaFiles] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters(),
        getPendingSyncMediaFiles(),
        getPendingSyncDeletedMediaFiles()
      ]);

      console.log('Pending changes found:', {
        riskAssessmentItems: pendingRiskAssessmentItems.length,
        appointments: pendingAppointments.length,
        riskAssessmentMasters: pendingRiskAssessmentMasters.length,
        mediaFiles: pendingMediaFiles.length
      });

      // Return early if no changes to sync
      if (pendingRiskAssessmentItems.length === 0 && pendingAppointments.length === 0 && 
          pendingRiskAssessmentMasters.length === 0 && pendingMediaFiles.length === 0 && pendingDeletedMediaFiles.length === 0) {
        return {
          success: true,
          message: 'No pending changes to sync.',
          synced: {
            riskAssessmentItems: 0,
            appointments: 0,
            riskAssessmentMasters: 0,
            mediaFiles: 0,
            deletedMediaFiles: 0
          }
        };
      }

      // Use batched sync for better performance
      return await riskAssessmentSyncService.syncPendingChangesInBatches(
        pendingRiskAssessmentItems,
        pendingAppointments,
        pendingRiskAssessmentMasters,
        pendingMediaFiles,
        pendingDeletedMediaFiles
      );
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
   * Sync pending changes in smaller batches to improve performance
   * @param {RiskAssessmentItem[]} pendingRiskAssessmentItems
   * @param {Appointment[]} pendingAppointments
   * @param {RiskAssessmentMaster[]} pendingRiskAssessmentMasters
   * @param {MediaFile[]} pendingMediaFiles
   * @param {MediaFile[]} pendingDeletedMediaFiles
   * @returns {Promise<Object>} Sync result
   */
  syncPendingChangesInBatches: async (
    pendingRiskAssessmentItems: RiskAssessmentItem[],
    pendingAppointments: Appointment[],
    pendingRiskAssessmentMasters: RiskAssessmentMaster[],
    pendingMediaFiles: MediaFile[],
    pendingDeletedMediaFiles: MediaFile[]
  ) => {
         try {
       // Get sync configuration (use production config by default)
       const syncConfig = getEnvironmentConfig('production');
       const { batchSizes, delays } = syncConfig;
       
       // Defensive check for configuration
       if (!batchSizes || !delays) {
         console.error('❌ Sync configuration is missing batchSizes or delays');
         return {
           success: false,
           error: 'Sync configuration is incomplete'
         };
       }
       
       // Validate batch sizes are numbers
       if (typeof batchSizes.riskAssessmentItems !== 'number' || 
           typeof batchSizes.appointments !== 'number' || 
           typeof batchSizes.riskAssessmentMasters !== 'number' || 
           typeof batchSizes.mediaFiles !== 'number') {
         console.error('❌ Batch sizes are not valid numbers:', batchSizes);
         return {
           success: false,
           error: 'Invalid batch sizes configuration'
         };
       }

       console.log('🔧 Using sync configuration:', { batchSizes, delays });

       let totalSynced = {
         riskAssessmentItems: 0,
         appointments: 0,
         riskAssessmentMasters: 0,
         mediaFiles: 0,
         deletedMediaFiles: 0
       };

       // Sync deleted media files first (to clean up before uploading new ones)
       if (pendingDeletedMediaFiles.length > 0) {
         console.log(`Syncing ${pendingDeletedMediaFiles.length} deleted media files...`);
         
         const deletedMediaResult = await riskAssessmentSyncService.syncDeletedMediaFiles(pendingDeletedMediaFiles);
         
         if (deletedMediaResult.success) {
           totalSynced.deletedMediaFiles += deletedMediaResult.deleted || 0;
           console.log(`✅ Deleted media files synced successfully: ${deletedMediaResult.deleted} files`);
         } else {
           console.error('❌ Deleted media files sync failed:', deletedMediaResult.error);
         }
       }

       // Sync media files (since they might be referenced by other entities)
       if (pendingMediaFiles.length > 0) {
         console.log(`Syncing ${pendingMediaFiles.length} media files in batches of ${batchSizes.mediaFiles}...`);
         
         for (let i = 0; i < pendingMediaFiles.length; i += batchSizes.mediaFiles) {
           const batch = pendingMediaFiles.slice(i, i + batchSizes.mediaFiles);
           console.log(`Uploading media batch ${Math.floor(i / batchSizes.mediaFiles) + 1}: ${batch.length} files`);
           
           const mediaUploadResult = await riskAssessmentSyncService.syncMediaFiles(batch);
           
           if (mediaUploadResult.success) {
             totalSynced.mediaFiles += mediaUploadResult.uploaded || 0;
             console.log(`✅ Media batch uploaded successfully: ${mediaUploadResult.uploaded} files`);
           } else {
             console.error('❌ Media batch upload failed:', mediaUploadResult.error);
           }
           
           // Delay between media batches
           await new Promise(resolve => setTimeout(resolve, delays.betweenMediaBatches));
         }
       }

       // Sync risk assessment items in batches
       if (pendingRiskAssessmentItems.length > 0) {
         console.log(`Syncing ${pendingRiskAssessmentItems.length} risk assessment items in batches of ${batchSizes.riskAssessmentItems}...`);
         
         for (let i = 0; i < pendingRiskAssessmentItems.length; i += batchSizes.riskAssessmentItems) {
           const batch = pendingRiskAssessmentItems.slice(i, i + batchSizes.riskAssessmentItems);
           console.log(`Syncing risk assessment items batch ${Math.floor(i / batchSizes.riskAssessmentItems) + 1}: ${batch.length} items`);
           
           const batchResult = await riskAssessmentSyncService.syncRiskAssessmentItemsBatch(batch);
           
           if (batchResult.success) {
             totalSynced.riskAssessmentItems += batch.length;
             console.log(`✅ Risk assessment items batch synced successfully: ${batch.length} items`);
           } else {
             console.error('❌ Risk assessment items batch sync failed:', batchResult.error);
           }
           
           // Delay between batches
           await new Promise(resolve => setTimeout(resolve, delays.betweenBatches));
         }
       }

       // Sync appointments in batches
       if (pendingAppointments.length > 0) {
         console.log(`Syncing ${pendingAppointments.length} appointments in batches of ${batchSizes.appointments}...`);
         
         for (let i = 0; i < pendingAppointments.length; i += batchSizes.appointments) {
           const batch = pendingAppointments.slice(i, i + batchSizes.appointments);
           console.log(`Syncing appointments batch ${Math.floor(i / batchSizes.appointments) + 1}: ${batch.length} items`);
           
           const batchResult = await riskAssessmentSyncService.syncAppointmentsBatch(batch);
           
           if (batchResult.success) {
             totalSynced.appointments += batch.length;
             console.log(`✅ Appointments batch synced successfully: ${batch.length} items`);
           } else {
             console.error('❌ Appointments batch sync failed:', batchResult.error);
           }
           
           // Delay between batches
           await new Promise(resolve => setTimeout(resolve, delays.betweenBatches));
         }
       }

       // Sync risk assessment masters in batches
       if (pendingRiskAssessmentMasters.length > 0) {
         console.log(`Syncing ${pendingRiskAssessmentMasters.length} risk assessment masters in batches of ${batchSizes.riskAssessmentMasters}...`);
         
         for (let i = 0; i < pendingRiskAssessmentMasters.length; i += batchSizes.riskAssessmentMasters) {
           const batch = pendingRiskAssessmentMasters.slice(i, i + batchSizes.riskAssessmentMasters);
           console.log(`Syncing risk assessment masters batch ${Math.floor(i / batchSizes.riskAssessmentMasters) + 1}: ${batch.length} items`);
           
           const batchResult = await riskAssessmentSyncService.syncRiskAssessmentMastersBatch(batch);
           
           if (batchResult.success) {
             totalSynced.riskAssessmentMasters += batch.length;
             console.log(`✅ Risk assessment masters batch synced successfully: ${batch.length} items`);
           } else {
             console.error('❌ Risk assessment masters batch sync failed:', batchResult.error);
           }
           
           // Delay between batches
           await new Promise(resolve => setTimeout(resolve, delays.betweenBatches));
         }
       }

      console.log('=== BATCH SYNC COMPLETED ===');
      console.log('Total synced:', totalSynced);
      
      return {
        success: true,
        synced: totalSynced,
        message: `Successfully synced ${totalSynced.riskAssessmentItems} items, ${totalSynced.appointments} appointments, ${totalSynced.riskAssessmentMasters} masters, ${totalSynced.mediaFiles} media files, and ${totalSynced.deletedMediaFiles} deleted media files in batches.`
      };
    } catch (error) {
      console.error('=== BATCH SYNC ERROR ===');
      console.error('Error in batch sync:', error);
      return {
        success: false,
        error: (error as Error).message || 'Batch sync failed'
      };
    }
  },

  /**
   * Sync a batch of risk assessment items
   * @param {RiskAssessmentItem[]} batch
   * @returns {Promise<Object>} Sync result
   */
  syncRiskAssessmentItemsBatch: async (batch: RiskAssessmentItem[]) => {
    try {
      // Log detailed information about pending risk assessment items
      console.log('=== SYNCING RISK ASSESSMENT ITEMS BATCH ===');
      console.log(`Batch contains ${batch.length} items`);

      // Prepare sync data for this batch
      const syncData = {
        deviceId: "mobile-tablet-device",
        userId: "current-user-id",
        appointments: [],
        riskAssessmentMasters: [],
        riskAssessmentItems: batch.map((item: RiskAssessmentItem) => {
          const isNewItem = item.riskassessmentitemid > 1000000000000;
          
          const syncItem = {
            riskassessmentitemid: isNewItem ? null : item.riskassessmentitemid,
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
            notes: item.notes,
            isDeleted: item.isDeleted ? true : false,
            _localId: item.riskassessmentitemid
          } as any;

          delete syncItem.appointmentid;
          return syncItem;
        }),
        deletedEntities: []
      };

      console.log('Sending batch to server...');
      const response = await api.syncChanges(syncData);

      if (response.success) {
        console.log('✅ Batch sync successful');
        
        // Handle deleted entities from backend response
        console.log('🔍 Checking for deleted entities in response...');
        console.log('🔍 response.data?.results?.deletedEntities:', response.data?.results?.deletedEntities);
        
        if (response.data?.results?.deletedEntities && response.data.results.deletedEntities.deletedItems && response.data.results.deletedEntities.deletedItems.length > 0) {
          console.log('🗑️ Processing deleted entities from backend response...');
          console.log('🗑️ Deleted items to process:', response.data.results.deletedEntities.deletedItems);
          const { hardDeleteRiskAssessmentItem } = await import('../utils/db');
          
          for (const deletedEntity of response.data.results.deletedEntities.deletedItems) {
            try {
              if (deletedEntity.entityType === 'riskAssessmentItem') {
                console.log(`🗑️ Actually deleting item ${deletedEntity.riskassessmentitemid} from SQLite (confirmed by backend)`);
                const deleteResult = await hardDeleteRiskAssessmentItem(deletedEntity.riskassessmentitemid);
                console.log(`🗑️ Delete result for item ${deletedEntity.riskassessmentitemid}:`, deleteResult);
              }
            } catch (error) {
              console.error(`❌ Error deleting entity ${deletedEntity.riskassessmentitemid}:`, error);
            }
          }
          console.log(`✅ Successfully processed ${response.data.results.deletedEntities.deletedItems.length} deleted entities`);
        } else {
          console.log('ℹ️ No deleted entities found in response');
        }
        
        // Process updated items from backend response (new approach)
        if (response.data?.results?.riskAssessmentItems?.updatedItems && Array.isArray(response.data.results.riskAssessmentItems.updatedItems)) {
          console.log('🔄 Processing updated items from backend response...');
          
          const updatedItems = response.data.results.riskAssessmentItems.updatedItems;
          console.log(`📝 Processing ${updatedItems.length} updated items`);
          
          for (const updatedItem of updatedItems) {
            try {
              // Check if this was a new item (has _localId different from backend ID)
              const isNewItem = updatedItem._localId && updatedItem._localId !== updatedItem.riskassessmentitemid;
              
              if (isNewItem) {
                console.log(`🆕 Processing new item: local ID ${updatedItem._localId} → backend ID ${updatedItem.riskassessmentitemid}`);
                
                // For new items, delete the old record and insert with new backend ID
                const { runSql } = await import('../utils/db');
                
                // Delete the old record with the local/timestamp ID
                await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [updatedItem._localId]);
                console.log(`🗑️ Deleted local record with ID ${updatedItem._localId}`);
                
                // Insert new record with backend ID
                await runSql(`
                  INSERT INTO risk_assessment_items (
                    riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
                    commaseparatedlist, selectedanswer, qty, price, description, model, location,
                    assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
                    dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
                    synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  updatedItem.riskassessmentitemid, updatedItem.riskassessmentcategoryid, updatedItem.itemprompt,
                  updatedItem.itemtype, updatedItem.rank, updatedItem.commaseparatedlist, updatedItem.selectedanswer,
                  updatedItem.qty, updatedItem.price, updatedItem.description, updatedItem.model, updatedItem.location,
                  updatedItem.assessmentregisterid, updatedItem.assessmentregistertypeid, updatedItem.datecreated,
                  updatedItem.createdbyid, updatedItem.dateupdated, updatedItem.updatedbyid, 1, // issynced = 1
                  updatedItem.syncversion || 1, updatedItem.deviceid, updatedItem.syncstatus, updatedItem.synctimestamp,
                  updatedItem.hasphoto, updatedItem.latitude, updatedItem.longitude, updatedItem.notes,
                  0, // pending_sync = 0
                  updatedItem.appointmentid || null
                ]);
                console.log(`✅ Inserted new record with backend ID ${updatedItem.riskassessmentitemid}`);
              } else {
                console.log(`🔄 Updating existing item: ${updatedItem.riskassessmentitemid}`);
                
                // For existing items, just update normally
              await updateRiskAssessmentItem({
                riskassessmentitemid: updatedItem.riskassessmentitemid,
                riskassessmentcategoryid: updatedItem.riskassessmentcategoryid,
                itemprompt: updatedItem.itemprompt,
                itemtype: updatedItem.itemtype,
                rank: updatedItem.rank,
                commaseparatedlist: updatedItem.commaseparatedlist,
                selectedanswer: updatedItem.selectedanswer,
                qty: updatedItem.qty,
                price: updatedItem.price,
                description: updatedItem.description,
                model: updatedItem.model,
                location: updatedItem.location,
                assessmentregisterid: updatedItem.assessmentregisterid,
                assessmentregistertypeid: updatedItem.assessmentregistertypeid,
                datecreated: updatedItem.datecreated,
                createdbyid: updatedItem.createdbyid,
                dateupdated: updatedItem.dateupdated,
                updatedbyid: updatedItem.updatedbyid,
                issynced: 1,
                syncversion: updatedItem.syncversion || 1,
                deviceid: updatedItem.deviceid,
                syncstatus: updatedItem.syncstatus,
                synctimestamp: updatedItem.synctimestamp,
                hasphoto: updatedItem.hasphoto,
                latitude: updatedItem.latitude,
                longitude: updatedItem.longitude,
                notes: updatedItem.notes,
                  pending_sync: 0,
                  appointmentid: updatedItem.appointmentid
              });
                console.log(`✅ Updated existing item ${updatedItem.riskassessmentitemid}`);
              }
            } catch (error) {
              console.error(`❌ Error processing item ${updatedItem.riskassessmentitemid}:`, error);
            }
          }
          
          // Items are already marked as synced by the update/insert operations above
          console.log(`✅ Successfully processed ${updatedItems.length} items from backend response`);
          
          // Handle any errors reported by the backend
          if (response.data?.results?.riskAssessmentItems?.errors && Array.isArray(response.data.results.riskAssessmentItems.errors) && response.data.results.riskAssessmentItems.errors.length > 0) {
            console.warn('⚠️ Backend reported errors for some items:');
            response.data.results.riskAssessmentItems.errors.forEach((error: any) => {
              console.warn(`❌ Error for item ${error._localId}: ${error.error} (${error.code})`);
            });
          }
        } else {
          // Fallback: Mark items as synced using original IDs (for backward compatibility)
          console.log('⚠️ No updatedItems in response, falling back to marking original items as synced');
        const itemIds = batch.map(item => item.riskassessmentitemid);
          console.log('📝 Marking items as synced:', itemIds);
        await markRiskAssessmentItemsAsSynced(itemIds);
        }
        
        return { success: true };
      } else {
        console.error('❌ Batch sync failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Error in risk assessment items batch sync:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Sync a batch of appointments
   * @param {Appointment[]} batch
   * @returns {Promise<Object>} Sync result
   */
  syncAppointmentsBatch: async (batch: Appointment[]) => {
    try {
      console.log('=== SYNCING APPOINTMENTS BATCH ===');
      console.log(`Batch contains ${batch.length} appointments`);

      const syncData = {
        deviceId: "mobile-tablet-device",
        userId: "current-user-id",
        appointments: batch.map((apt: Appointment) => ({
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
        riskAssessmentMasters: [],
        riskAssessmentItems: [],
        deletedEntities: []
      };

      console.log('Sending appointments batch to server...');
      const response = await api.syncChanges(syncData);

      if (response.success) {
        console.log('✅ Appointments batch sync successful');
        
        const appointmentIds = batch.map(apt => apt.appointmentID);
        await markAppointmentsAsSynced(appointmentIds);
        
        return { success: true };
      } else {
        console.error('❌ Appointments batch sync failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Error in appointments batch sync:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Sync a batch of risk assessment masters
   * @param {RiskAssessmentMaster[]} batch
   * @returns {Promise<Object>} Sync result
   */
  syncRiskAssessmentMastersBatch: async (batch: RiskAssessmentMaster[]) => {
    try {
      console.log('=== SYNCING RISK ASSESSMENT MASTERS BATCH ===');
      console.log(`Batch contains ${batch.length} masters`);

      const syncData = {
        deviceId: "mobile-tablet-device",
        userId: "current-user-id",
        appointments: [],
        riskAssessmentMasters: batch.map((master: RiskAssessmentMaster) => ({
          riskassessmentid: master.riskassessmentid,
          assessmenttypename: master.assessmenttypename,
          surveydate: master.surveydate,
          clientnumber: master.clientnumber,
          comments: master.comments,
          totalvalue: master.totalvalue,
          iscomplete: master.iscomplete ? true : false
        })),
        riskAssessmentItems: [],
        deletedEntities: []
      };

      console.log('Sending masters batch to server...');
      const response = await api.syncChanges(syncData);

      if (response.success) {
        console.log('✅ Masters batch sync successful');
        
        const masterIds = batch.map(master => master.riskassessmentid);
        await markRiskAssessmentMastersAsSynced(masterIds);
        
        return { success: true };
      } else {
        console.error('❌ Masters batch sync failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Error in masters batch sync:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * OLD SINGLE BATCH SYNC - DEPRECATED
   * This method is kept for backward compatibility but is no longer recommended
   * Use syncPendingChanges() instead which calls syncPendingChangesInBatches()
   */
  syncPendingChangesOld: async () => {
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
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters, pendingMediaFiles, pendingDeletedMediaFiles] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters(),
        getPendingSyncMediaFiles(),
        getPendingSyncDeletedMediaFiles()
      ]);

      console.log('Pending changes found:', {
        riskAssessmentItems: pendingRiskAssessmentItems.length,
        appointments: pendingAppointments.length,
        riskAssessmentMasters: pendingRiskAssessmentMasters.length,
        mediaFiles: pendingMediaFiles.length
      });

      // Sync media files first (since they might be referenced by other entities)
      let syncedMediaFiles = 0;
      if (pendingMediaFiles.length > 0) {
        console.log(`Syncing ${pendingMediaFiles.length} media files...`);
        const mediaUploadResult = await riskAssessmentSyncService.syncMediaFiles(pendingMediaFiles);
        
        if (!mediaUploadResult.success) {
          console.error('Media upload failed:', mediaUploadResult.error);
        } else {
          syncedMediaFiles = mediaUploadResult.uploaded || 0;
          console.log(`Successfully uploaded ${syncedMediaFiles} media files`);
        }
      }

      // Log detailed information about pending risk assessment items
      if (pendingRiskAssessmentItems.length > 0) {
        console.log('=== PENDING RISK ASSESSMENT ITEMS (Raw from SQLite) ===');
        pendingRiskAssessmentItems.forEach((item, index) => {
          console.log(`Item ${index + 1} (Full SQLite Record):`, JSON.stringify(item, null, 2));
        });
        
        console.log('=== SUMMARY OF PENDING ITEMS ===');
        pendingRiskAssessmentItems.forEach((item, index) => {
          console.log(`Item ${index + 1} Summary:`, {
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
            dateupdated: item.dateupdated,
            hasphoto: item.hasphoto,
            notes: item.notes,
            location: item.location
          });
        });
      }

      // If no non-media changes to sync, return early
      if (pendingRiskAssessmentItems.length === 0 && pendingAppointments.length === 0 && pendingRiskAssessmentMasters.length === 0) {
        return {
          success: true,
          message: `Synced ${syncedMediaFiles} media files. No other pending changes to sync.`,
          synced: {
            riskAssessmentItems: 0,
            appointments: 0,
            riskAssessmentMasters: 0,
            mediaFiles: syncedMediaFiles
          }
        };
      }

      // Prepare sync data in the expected format (excluding media files - already synced)
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
          // Detect if this is a new item created locally (timestamp-based ID > 1000000000000)
          const isNewItem = item.riskassessmentitemid > 1000000000000;
          
          // Create sync object without appointmentid
          const syncItem = {
            riskassessmentitemid: isNewItem ? null : item.riskassessmentitemid, // Send null for new items
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
            notes: item.notes,
            isDeleted: item.isDeleted ? true : false,
            // Keep local ID for tracking response mapping
            _localId: item.riskassessmentitemid
          } as any; // Use any to allow deleting appointmentid

          // Remove appointmentid from the sync data
          delete syncItem.appointmentid;
          
          return syncItem;
        }),
        deletedEntities: (() => {
          const deletedItems = pendingRiskAssessmentItems
            .filter(item => item.qty === 0 && item.price === 0 && item.description === '' && item.model === '' && item.location === '' && item.notes === '')
            .map(item => ({
              riskassessmentitemid: item.riskassessmentitemid,
              riskassessmentcategoryid: item.riskassessmentcategoryid,
              entityType: 'riskAssessmentItem'
            }));
          
          if (deletedItems.length > 0) {
            console.log('🗑️ Sending items for deletion to backend:', deletedItems.map(item => item.riskassessmentitemid));
          }
          
          return deletedItems;
        })()
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
      
      // Debug: Log the full response structure
      if (response.data) {
        console.log('=== FULL RESPONSE DATA ===');
        console.log('Response data size:', JSON.stringify(response.data).length, 'bytes');
        
        if (response.data.results) {
          console.log('=== RESULTS STRUCTURE ===');
          console.log('Results keys:', Object.keys(response.data.results));
          
          if (response.data.results.deletedEntities) {
            console.log('🗑️ Found deletedEntities in response:', response.data.results.deletedEntities);
            if (response.data.results.deletedEntities.deletedItems) {
              console.log('🗑️ Found deletedItems array with', response.data.results.deletedEntities.deletedItems.length, 'items');
            }
          } else {
            console.log('⚠️ No deletedEntities found in response');
          }
        }
      }
      
      if (response.success) {
        console.log('Server sync successful:', response.data);
        
        // Handle deleted entities from backend response
        console.log('🔍 Checking for deleted entities in response...');
        console.log('🔍 response.data?.results?.deletedEntities:', response.data?.results?.deletedEntities);
        
        if (response.data?.results?.deletedEntities && response.data.results.deletedEntities.deletedItems && response.data.results.deletedEntities.deletedItems.length > 0) {
          console.log('🗑️ Processing deleted entities from backend response...');
          console.log('🗑️ Deleted items to process:', response.data.results.deletedEntities.deletedItems);
          const { hardDeleteRiskAssessmentItem } = await import('../utils/db');
          
          for (const deletedEntity of response.data.results.deletedEntities.deletedItems) {
            try {
              if (deletedEntity.entityType === 'riskAssessmentItem') {
                console.log(`🗑️ Actually deleting item ${deletedEntity.riskassessmentitemid} from SQLite (confirmed by backend)`);
                const deleteResult = await hardDeleteRiskAssessmentItem(deletedEntity.riskassessmentitemid);
                console.log(`🗑️ Delete result for item ${deletedEntity.riskassessmentitemid}:`, deleteResult);
              }
            } catch (error) {
              console.error(`❌ Error deleting entity ${deletedEntity.riskassessmentitemid}:`, error);
            }
          }
          console.log(`✅ Successfully processed ${response.data.results.deletedEntities.deletedItems.length} deleted entities`);
        } else {
          // Backend did not return deletedEntities - items remain marked for deletion until backend confirms
          const itemsMarkedForDeletion = pendingRiskAssessmentItems.filter(item => 
            item.isDeleted === 1
          );
          
          if (itemsMarkedForDeletion.length > 0) {
            console.log('⚠️ Backend did not return deletedEntities confirmation for items marked for deletion');
            console.log('🗑️ Items remain marked for deletion until backend confirms:', itemsMarkedForDeletion.map(item => item.riskassessmentitemid));
            console.log('ℹ️ These items will be re-sent in the next sync attempt');
          } else {
            console.log('ℹ️ No items marked for deletion found in pending items');
          }
        }

        // Process updated items from backend response (new approach)
        if (response.data?.results?.riskAssessmentItems?.updatedItems && Array.isArray(response.data.results.riskAssessmentItems.updatedItems) && response.data.results.riskAssessmentItems.updatedItems.length > 0) {
          console.log('🔄 Processing updated items from backend response...');
          
          const updatedItems = response.data.results.riskAssessmentItems.updatedItems;
          console.log(`📝 Processing ${updatedItems.length} updated items`);
          
          for (const updatedItem of updatedItems) {
            try {
              // Check if this was a new item (has _localId different from backend ID)
              const isNewItem = updatedItem._localId && updatedItem._localId !== updatedItem.riskassessmentitemid;
              
              if (isNewItem) {
                console.log(`🆕 Processing new item: local ID ${updatedItem._localId} → backend ID ${updatedItem.riskassessmentitemid}`);
                
                // For new items, delete the old record and insert with new backend ID
                const { runSql } = await import('../utils/db');
                
                // Delete the old record with the local/timestamp ID
                await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [updatedItem._localId]);
                console.log(`🗑️ Deleted local record with ID ${updatedItem._localId}`);
                
                // Insert new record with backend ID
                await runSql(`
                  INSERT INTO risk_assessment_items (
                    riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
                    commaseparatedlist, selectedanswer, qty, price, description, model, location,
                    assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
                    dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
                    synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  updatedItem.riskassessmentitemid, updatedItem.riskassessmentcategoryid, updatedItem.itemprompt,
                  updatedItem.itemtype, updatedItem.rank, updatedItem.commaseparatedlist, updatedItem.selectedanswer,
                  updatedItem.qty, updatedItem.price, updatedItem.description, updatedItem.model, updatedItem.location,
                  updatedItem.assessmentregisterid, updatedItem.assessmentregistertypeid, updatedItem.datecreated,
                  updatedItem.createdbyid, updatedItem.dateupdated, updatedItem.updatedbyid, 1, // issynced = 1
                  updatedItem.syncversion || 1, updatedItem.deviceid, updatedItem.syncstatus, updatedItem.synctimestamp,
                  updatedItem.hasphoto, updatedItem.latitude, updatedItem.longitude, updatedItem.notes,
                  0, // pending_sync = 0
                  updatedItem.appointmentid || null
                ]);
                console.log(`✅ Inserted new record with backend ID ${updatedItem.riskassessmentitemid}`);
              } else {
                console.log(`🔄 Updating existing item: ${updatedItem.riskassessmentitemid}`);
                
                // For existing items, just update normally
                await updateRiskAssessmentItem({
                  riskassessmentitemid: updatedItem.riskassessmentitemid,
                  riskassessmentcategoryid: updatedItem.riskassessmentcategoryid,
                  itemprompt: updatedItem.itemprompt,
                  itemtype: updatedItem.itemtype,
                  rank: updatedItem.rank,
                  commaseparatedlist: updatedItem.commaseparatedlist,
                  selectedanswer: updatedItem.selectedanswer,
                  qty: updatedItem.qty,
                  price: updatedItem.price,
                  description: updatedItem.description,
                  model: updatedItem.model,
                  location: updatedItem.location,
                  assessmentregisterid: updatedItem.assessmentregisterid,
                  assessmentregistertypeid: updatedItem.assessmentregistertypeid,
                  datecreated: updatedItem.datecreated,
                  createdbyid: updatedItem.createdbyid,
                  dateupdated: updatedItem.dateupdated,
                  updatedbyid: updatedItem.updatedbyid,
                  issynced: 1,
                  syncversion: updatedItem.syncversion || 1,
                  deviceid: updatedItem.deviceid,
                  syncstatus: updatedItem.syncstatus,
                  synctimestamp: updatedItem.synctimestamp,
                  hasphoto: updatedItem.hasphoto,
                  latitude: updatedItem.latitude,
                  longitude: updatedItem.longitude,
                  notes: updatedItem.notes,
                  pending_sync: 0,
                  appointmentid: updatedItem.appointmentid
                });
                console.log(`✅ Updated existing item ${updatedItem.riskassessmentitemid}`);
              }
            } catch (error) {
              console.error(`❌ Error processing item ${updatedItem.riskassessmentitemid}:`, error);
            }
          }
          
          console.log(`✅ Successfully processed ${updatedItems.length} items from backend response`);
          
          // Handle any errors reported by the backend
          if (response.data?.results?.riskAssessmentItems?.errors && Array.isArray(response.data.results.riskAssessmentItems.errors) && response.data.results.riskAssessmentItems.errors.length > 0) {
            console.warn('⚠️ Backend reported errors for some items:');
            response.data.results.riskAssessmentItems.errors.forEach((error: any) => {
              console.warn(`❌ Error for item ${error._localId}: ${error.error} (${error.code})`);
            });
          }
          
          // Note: Deleted entities are processed outside this block to avoid duplication
        }
        
        
        // Only mark items as synced if they are NOT marked for deletion
        const itemsNotMarkedForDeletion = pendingRiskAssessmentItems.filter(item => 
          item.isDeleted !== 1
        );
        
        if (itemsNotMarkedForDeletion.length > 0) {
          // Fallback: Mark items as synced using original IDs (for backward compatibility)
          console.log('⚠️ No updatedItems in response, falling back to marking original items as synced');
          const itemIds = itemsNotMarkedForDeletion.map((item: RiskAssessmentItem) => item.riskassessmentitemid);
          console.log('📝 Marking items as synced:', itemIds);
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
            riskAssessmentMasters: pendingRiskAssessmentMasters.length,
            mediaFiles: syncedMediaFiles
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
   * Sync deleted media files to the server
   * @param {MediaFile[]} deletedMediaFiles - Array of deleted media files to sync
   * @returns {Promise<Object>} Sync result
   */
  syncDeletedMediaFiles: async (deletedMediaFiles: MediaFile[]) => {
    try {
      console.log(`Processing ${deletedMediaFiles.length} deleted media files for deletion`);
      
      if (deletedMediaFiles.length === 0) {
        return { success: true, deleted: 0 };
      }

      // Send deletion requests via sync API (backend expects BackendMediaID)
      const deletionPromises = deletedMediaFiles.map(async (mediaFile) => {
        try {
          const backendMediaID = (mediaFile as any).BackendMediaID;
          const localMediaID = mediaFile.MediaID;
          if (backendMediaID == null) {
            console.log(`⚠️ No BackendMediaID for media file ${localMediaID}, skipping backend deletion`);
            return { success: true, mediaID: mediaFile.MediaID };
          }
          console.log(`🗑️ Deleting media from backend: BackendMediaID=${backendMediaID} (local MediaID=${localMediaID})`);
          const deleteResult = await api.deleteMedia(backendMediaID);
          if (deleteResult.success) {
            console.log(`✅ Deleted media BackendMediaID ${backendMediaID} from backend via sync`);
            return { success: true, mediaID: mediaFile.MediaID };
          } else {
            console.error(`❌ Failed to delete media BackendMediaID ${backendMediaID}:`, deleteResult.message);
            return { success: false, mediaID: mediaFile.MediaID, error: deleteResult.message };
          }
        } catch (error) {
          console.error(`❌ Error deleting media file ${mediaFile.MediaID}:`, error);
          return { success: false, mediaID: mediaFile.MediaID, error: (error as Error).toString() };
        }
      });

      const results = await Promise.all(deletionPromises);
      const successfulDeletions = results.filter(r => r.success);
      const failedDeletions = results.filter(r => !r.success);

      console.log(`🗑️ Deleted ${successfulDeletions.length} media files, ${failedDeletions.length} failed`);

      // Mark successfully deleted files as synced
      if (successfulDeletions.length > 0) {
        const deletedMediaIds = successfulDeletions.map(r => r.mediaID).filter((id): id is number => id !== undefined);
        if (deletedMediaIds.length > 0) {
          await markMediaFilesAsSynced(deletedMediaIds);
          console.log(`✅ Marked ${deletedMediaIds.length} deleted media files as synced`);
        }
      }

      return {
        success: true,
        deleted: successfulDeletions.length,
        failed: failedDeletions.length
      };
    } catch (error) {
      console.error('Error syncing deleted media files:', error);
      return {
        success: false,
        error: (error as Error).message || 'Deleted media sync failed'
      };
    }
  },

  /**
   * Sync media files to the server
   * @param {MediaFile[]} mediaFiles - Array of media files to sync
   * @returns {Promise<Object>} Sync result
   */
  syncMediaFiles: async (mediaFiles: MediaFile[]) => {
    try {
      console.log(`Processing ${mediaFiles.length} media files for upload`);
      
      const mediaFilesWithData: Array<{
        mediaID?: number;
        fileName: string;
        fileType: string;
        entityName: string;
        entityID: number;
        base64Data: string;
        metadata?: string;
        uploadedAt: string;
        uploadedBy?: string;
      }> = [];

      // Read each file as base64 for JSON upload (Option B per API: Content-Type application/json, base64 in "data")
      for (const mediaFile of mediaFiles) {
        try {
          if (mediaFile.LocalPath) {
            const fileInfo = await FileSystem.getInfoAsync(mediaFile.LocalPath);
            if (fileInfo.exists) {
              const base64Data = await FileSystem.readAsStringAsync(mediaFile.LocalPath, {
                encoding: FileSystem.EncodingType.Base64
              });

              const mediaFileData: any = {
                fileName: mediaFile.FileName,
                fileType: mediaFile.FileType,
                entityName: mediaFile.EntityName,
                entityID: mediaFile.EntityID,
                base64Data,
                metadata: mediaFile.Metadata,
                uploadedAt: mediaFile.UploadedAt,
                uploadedBy: mediaFile.UploadedBy
              };

              if (mediaFile.MediaID !== undefined) {
                mediaFileData.mediaID = mediaFile.MediaID;
              }

              mediaFilesWithData.push(mediaFileData);
            }
          }
        } catch (error) {
          console.error(`Error preparing media file ${mediaFile.FileName}:`, error);
        }
      }

      if (mediaFilesWithData.length === 0) {
        return { success: true, uploaded: 0 };
      }

      console.log(`Uploading ${mediaFilesWithData.length} media files to backend`);

      // Check if uploadMediaBatch is available
      if (typeof api.uploadMediaBatch !== 'function') {
        console.error('uploadMediaBatch function is not available in API module');
        console.log('Available API functions:', Object.keys(api));
        console.log('API module type:', typeof api);
        
        // Try alternative import
        if (typeof apiModule.default?.uploadMediaBatch === 'function') {
          console.log('Using alternative import for uploadMediaBatch');
          try {
            const uploadResult = await apiModule.default.uploadMediaBatch(mediaFilesWithData);

            if (uploadResult.success && uploadResult.data) {
            console.log('Media batch upload successful:', uploadResult.data);
            
            // Update local media files with BackendMediaID and server URL so backend delete works later
            if (uploadResult.data.results) {
              for (const result of uploadResult.data.results) {
                if (result.success && result.originalMediaID != null) {
                  const localMediaFile = mediaFiles.find(mf => mf.MediaID === result.originalMediaID);
                  if (localMediaFile) {
                    const blobUrl = result.data?.mediaFile?.blobURL ?? result.data?.blobUrl ?? result.blobUrl;
                    const newBackendId = result.backendMediaID ?? localMediaFile.BackendMediaID;
                    await updateMediaFile({
                      ...localMediaFile,
                      BlobURL: blobUrl || localMediaFile.BlobURL,
                      BackendMediaID: newBackendId ?? localMediaFile.BackendMediaID,
                      pending_sync: 0
                    });
                    console.log(`✅ Media synced: local MediaID ${localMediaFile.MediaID} → BackendMediaID ${newBackendId ?? 'unchanged'} (${localMediaFile.FileName})`);
                  }
                }
              }
            }

            // Mark only successfully uploaded files as synced
            const successfulUploads = uploadResult.data.results?.filter((r: any) => r.success) || [];
            const uploadedMediaIds = successfulUploads
              .map((result: any) => result.originalMediaID)
              .filter((id: any): id is number => typeof id === 'number');
            
            if (uploadedMediaIds.length > 0) {
              await markMediaFilesAsSynced(uploadedMediaIds);
              console.log(`Marked ${uploadedMediaIds.length} media files as synced`);
            }

            return {
              success: true,
              uploaded: successfulUploads.length
            };
          } else {
            console.error('Media batch upload failed:', uploadResult);
            return {
              success: false,
              error: uploadResult.message || 'Media upload failed'
            };
          }
          } catch (mediaError) {
            console.error('Error during media upload:', mediaError);
            // Don't fail the entire sync for media upload errors
            return {
              success: false,
              error: `Media upload failed: ${(mediaError as Error).message || 'Unknown error'}`,
              nonCritical: true // Mark as non-critical so it doesn't break main sync
            };
          }
        } else {
          return {
            success: false,
            error: 'uploadMediaBatch function is not available in either import'
          };
        }
      } else {
        // Use batch upload API
        try {
          const uploadResult = await api.uploadMediaBatch(mediaFilesWithData);

        if (uploadResult.success && uploadResult.data) {
          console.log('Media batch upload successful:', uploadResult.data);
          
          // Update local media files with BackendMediaID and server URL so backend delete works later
          if (uploadResult.data.results) {
            for (const result of uploadResult.data.results) {
              if (result.success && result.originalMediaID != null) {
                const localMediaFile = mediaFiles.find(mf => mf.MediaID === result.originalMediaID);
                if (localMediaFile) {
                  const blobUrl = result.data?.mediaFile?.blobURL ?? result.data?.blobUrl ?? result.blobUrl;
                  await updateMediaFile({
                    ...localMediaFile,
                    BlobURL: blobUrl || localMediaFile.BlobURL,
                    BackendMediaID: result.backendMediaID ?? localMediaFile.BackendMediaID,
                    pending_sync: 0
                  });
                  const newBackendId = result.backendMediaID ?? localMediaFile.BackendMediaID;
                  console.log(`✅ Media synced: local MediaID ${localMediaFile.MediaID} → BackendMediaID ${newBackendId ?? 'unchanged'} (${localMediaFile.FileName})`);
                }
              }
            }
          }

          // Mark only successfully uploaded files as synced
          const successfulUploads = uploadResult.data.results?.filter((r: any) => r.success) || [];
          const uploadedMediaIds = successfulUploads
            .map((result: any) => result.originalMediaID)
            .filter((id: any): id is number => typeof id === 'number');
          
          if (uploadedMediaIds.length > 0) {
            await markMediaFilesAsSynced(uploadedMediaIds);
            console.log(`Marked ${uploadedMediaIds.length} media files as synced`);
          }

          return {
            success: true,
            uploaded: successfulUploads.length
          };
        } else {
          console.error('Media batch upload failed:', uploadResult);
          return {
            success: false,
            error: uploadResult.message || 'Media upload failed'
          };
        }
        } catch (mediaError) {
          console.error('Error during media upload (main API):', mediaError);
          // Don't fail the entire sync for media upload errors
          return {
            success: false,
            error: `Media upload failed: ${(mediaError as Error).message || 'Unknown error'}`,
            nonCritical: true // Mark as non-critical so it doesn't break main sync
          };
        }
      }

    } catch (error) {
      console.error('Error syncing media files:', error);
      return {
        success: false,
        error: (error as Error).message || 'Media sync failed'
      };
    }
  },

  /**
   * Get count of pending changes
   * @returns {Promise<Object>} Count of pending items
   */
  getPendingChangesCount: async () => {
    try {
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters, pendingMediaFiles, pendingDeletedMediaFiles] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters(),
        getPendingSyncMediaFiles(),
        getPendingSyncDeletedMediaFiles()
      ]);

      return {
        riskAssessmentItems: pendingRiskAssessmentItems.length,
        appointments: pendingAppointments.length,
        riskAssessmentMasters: pendingRiskAssessmentMasters.length,
        mediaFiles: pendingMediaFiles.length,
        deletedMediaFiles: pendingDeletedMediaFiles.length,
        total: pendingRiskAssessmentItems.length + pendingAppointments.length + pendingRiskAssessmentMasters.length + pendingMediaFiles.length + pendingDeletedMediaFiles.length
      };
    } catch (error) {
      console.error('Error getting pending changes count:', error);
      return {
        riskAssessmentItems: 0,
        appointments: 0,
        riskAssessmentMasters: 0,
        mediaFiles: 0,
        deletedMediaFiles: 0,
        total: 0
      };
    }
  },

  // Debug function to inspect pending changes without syncing
  debugPendingChanges: async () => {
    console.log('=== DEBUG: INSPECTING PENDING CHANGES ===');
    
    const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters, pendingMediaFiles, pendingDeletedMediaFiles] = await Promise.all([
      getPendingSyncRiskAssessmentItems(),
      getPendingSyncAppointments(),
      getPendingSyncRiskAssessmentMasters(),
      getPendingSyncMediaFiles(),
      getPendingSyncDeletedMediaFiles()
    ]);

    console.log('=== PENDING COUNTS ===');
    console.log('Risk Assessment Items:', pendingRiskAssessmentItems.length);
    console.log('Appointments:', pendingAppointments.length);
    console.log('Risk Assessment Masters:', pendingRiskAssessmentMasters.length);
    console.log('Media Files:', pendingMediaFiles.length);
    console.log('Deleted Media Files:', pendingDeletedMediaFiles.length);

    if (pendingRiskAssessmentItems.length > 0) {
      console.log('=== PENDING RISK ASSESSMENT ITEMS ===');
      pendingRiskAssessmentItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.riskassessmentitemid,
          categoryId: item.riskassessmentcategoryid,
          prompt: item.itemprompt,
          description: item.description,
          qty: item.qty,
          price: item.price,
          pending_sync: item.pending_sync,
          dateupdated: item.dateupdated
        });
      });
    }

    return {
      riskAssessmentItems: pendingRiskAssessmentItems.length,
      appointments: pendingAppointments.length,
      riskAssessmentMasters: pendingRiskAssessmentMasters.length,
      mediaFiles: pendingMediaFiles.length,
      deletedMediaFiles: pendingDeletedMediaFiles.length
    };
  }
};

export default riskAssessmentSyncService; 