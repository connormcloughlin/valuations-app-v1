import api from '../api';
import * as apiModule from '../api';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import {
  getPendingSyncRiskAssessmentItems,
  getPendingSyncAppointments,
  getPendingSyncRiskAssessmentMasters,
  getPendingSyncMediaFiles,
  markRiskAssessmentItemsAsSynced,
  markAppointmentsAsSynced,
  markRiskAssessmentMastersAsSynced,
  markMediaFilesAsSynced,
  updateMediaFile,
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
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters, pendingMediaFiles] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters(),
        getPendingSyncMediaFiles()
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
          
          return {
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
            // Keep local ID for tracking response mapping
            _localId: item.riskassessmentitemid
          };
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

      // Read file data for each media file
      for (const mediaFile of mediaFiles) {
        try {
          if (mediaFile.LocalPath) {
            const fileInfo = await FileSystem.getInfoAsync(mediaFile.LocalPath);
            if (fileInfo.exists) {
              // Read the file as base64
              const base64Data = await FileSystem.readAsStringAsync(mediaFile.LocalPath, {
                encoding: FileSystem.EncodingType.Base64
              });

              const mediaFileData: any = {
                fileName: mediaFile.FileName,
                fileType: mediaFile.FileType,
                entityName: mediaFile.EntityName,
                entityID: mediaFile.EntityID,
                base64Data: base64Data,
                metadata: mediaFile.Metadata,
                uploadedAt: mediaFile.UploadedAt,
                uploadedBy: mediaFile.UploadedBy
              };

              // Only add mediaID if it exists
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
          const uploadResult = await apiModule.default.uploadMediaBatch(mediaFilesWithData);

          if (uploadResult.success && uploadResult.data) {
            console.log('Media batch upload successful:', uploadResult.data);
            
            // Update local media files with server URLs
            if (uploadResult.data.results) {
              for (const result of uploadResult.data.results) {
                if (result.success && result.mediaID) {
                  const localMediaFile = mediaFiles.find(mf => mf.MediaID === result.mediaID);
                  if (localMediaFile) {
                    await updateMediaFile({
                      ...localMediaFile,
                      BlobURL: result.blobUrl || localMediaFile.BlobURL,
                      pending_sync: 0
                    });
                    console.log(`Updated local media file ${localMediaFile.FileName} with server URL`);
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
        } else {
          return {
            success: false,
            error: 'uploadMediaBatch function is not available in either import'
          };
        }
      } else {
        // Use batch upload API
        const uploadResult = await api.uploadMediaBatch(mediaFilesWithData);

        if (uploadResult.success && uploadResult.data) {
          console.log('Media batch upload successful:', uploadResult.data);
          
          // Update local media files with server URLs
          if (uploadResult.data.results) {
            for (const result of uploadResult.data.results) {
              if (result.success && result.mediaID) {
                const localMediaFile = mediaFiles.find(mf => mf.MediaID === result.mediaID);
                if (localMediaFile) {
                  await updateMediaFile({
                    ...localMediaFile,
                    BlobURL: result.blobUrl || localMediaFile.BlobURL,
                    pending_sync: 0
                  });
                  console.log(`Updated local media file ${localMediaFile.FileName} with server URL`);
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
      const [pendingRiskAssessmentItems, pendingAppointments, pendingRiskAssessmentMasters, pendingMediaFiles] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters(),
        getPendingSyncMediaFiles()
      ]);

      return {
        riskAssessmentItems: pendingRiskAssessmentItems.length,
        appointments: pendingAppointments.length,
        riskAssessmentMasters: pendingRiskAssessmentMasters.length,
        mediaFiles: pendingMediaFiles.length,
        total: pendingRiskAssessmentItems.length + pendingAppointments.length + pendingRiskAssessmentMasters.length + pendingMediaFiles.length
      };
    } catch (error) {
      console.error('Error getting pending changes count:', error);
      return {
        riskAssessmentItems: 0,
        appointments: 0,
        riskAssessmentMasters: 0,
        mediaFiles: 0,
        total: 0
      };
    }
  }
};

export default riskAssessmentSyncService; 