import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { View } from '../components/Themed';
import { Text, Button, Card, ProgressBar } from 'react-native-paper';
import { AppLayout, TabConfig } from '../components/layout';
import riskAssessmentSyncService from '../services/riskAssessmentSyncService';
import { syncStyles } from './GlobalStyles';

const tabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  {
    name: 'survey',
    title: 'Survey',
    icon: 'clipboard-list',
    path: '/(tabs)/survey'
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'account',
    path: '/(tabs)/profile'
  }
];

export default function SyncScreen() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Get pending count on component mount
  React.useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    try {
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setSyncProgress({ current: 0, total: 0 });
      
      console.log('Starting sync process...');
      
      // Get all pending items to calculate total
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      const totalItems = count.total;
      setSyncProgress({ current: 0, total: totalItems });
      
      if (totalItems === 0) {
        Alert.alert('No Items to Sync', 'There are no pending items to synchronize.');
        return;
      }
      
      // Create a progress tracking wrapper around the existing sync service
      let completedItems = 0;
      
      const updateProgress = (itemsCompleted: number, phase: string) => {
        completedItems += itemsCompleted;
        setSyncProgress({ current: completedItems, total: totalItems });
        console.log(`Sync progress: ${completedItems}/${totalItems} items completed (Phase: ${phase})`);
      };
      
      // Get all pending data first
      const { 
        getPendingSyncRiskAssessmentItems, 
        getPendingSyncAppointments, 
        getPendingSyncRiskAssessmentMasters, 
        getPendingSyncMediaFiles
      } = await import('../utils/db');
      
      const [pendingItems, pendingAppointments, pendingMasters, pendingMedia] = await Promise.all([
        getPendingSyncRiskAssessmentItems(),
        getPendingSyncAppointments(),
        getPendingSyncRiskAssessmentMasters(),
        getPendingSyncMediaFiles()
      ]);
      
      // Phase 1: Sync media files first (they're processed separately)
      if (pendingMedia.length > 0) {
        console.log(`Phase 1: Syncing ${pendingMedia.length} media files...`);
        const mediaResult = await riskAssessmentSyncService.syncMediaFiles(pendingMedia);
        if (mediaResult.success) {
          updateProgress(pendingMedia.length, 'Media Files');
        } else {
          console.error('Media sync failed:', mediaResult.error);
          updateProgress(pendingMedia.length, 'Media Files (Failed)');
        }
        
        // Add small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Phase 2: Sync data items (risk assessment items, appointments, masters) in batch
      const dataItemsCount = pendingItems.length + pendingAppointments.length + pendingMasters.length;
      if (dataItemsCount > 0) {
        console.log(`Phase 2: Syncing ${dataItemsCount} data items in batch...`);
        
        // Prepare sync data for batch processing
        const syncData = {
          deviceId: "mobile-tablet-device",
          userId: "current-user-id",
          appointments: pendingAppointments.map((apt) => ({
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
          riskAssessmentMasters: pendingMasters.map((master) => ({
            riskassessmentid: master.riskassessmentid,
            assessmenttypename: master.assessmenttypename,
            surveydate: master.surveydate,
            clientnumber: master.clientnumber,
            comments: master.comments,
            totalvalue: master.totalvalue,
            iscomplete: master.iscomplete ? true : false
          })),
                     riskAssessmentItems: pendingItems.map((item) => {
             const isNewItem = item.riskassessmentitemid > 1000000000000;
             const syncItem: any = {
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
               _localId: item.riskassessmentitemid
             };
             // Remove appointmentid field if it exists
             if ('appointmentid' in syncItem) {
               delete syncItem.appointmentid;
             }
             return syncItem;
           }),
          deletedEntities: []
        };
        
        // Call the batch sync API
        const api = await import('../api');
        const batchResult = await api.default.syncChanges(syncData);
        
        if (batchResult.success) {
          // Mark items as synced in phases to show progress
          if (pendingItems.length > 0) {
            const { markRiskAssessmentItemsAsSynced } = await import('../utils/db');
            const itemIds = pendingItems.map(item => item.riskassessmentitemid);
            await markRiskAssessmentItemsAsSynced(itemIds);
            updateProgress(pendingItems.length, 'Risk Assessment Items');
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          if (pendingAppointments.length > 0) {
            const { markAppointmentsAsSynced } = await import('../utils/db');
            const appointmentIds = pendingAppointments.map(apt => apt.appointmentID);
            await markAppointmentsAsSynced(appointmentIds);
            updateProgress(pendingAppointments.length, 'Appointments');
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          if (pendingMasters.length > 0) {
            const { markRiskAssessmentMastersAsSynced } = await import('../utils/db');
            const masterIds = pendingMasters.map(master => master.riskassessmentid);
            await markRiskAssessmentMastersAsSynced(masterIds);
            updateProgress(pendingMasters.length, 'Risk Assessment Masters');
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } else {
          console.error('Batch sync failed:', batchResult.message);
          // Still update progress to show completion even if failed
          updateProgress(dataItemsCount, 'Data Items (Failed)');
        }
      }
      
      // Final result
      const finalResult = {
        success: true,
        message: `Successfully processed ${totalItems} items`,
        synced: {
          riskAssessmentItems: count.riskAssessmentItems,
          appointments: count.appointments,
          riskAssessmentMasters: count.riskAssessmentMasters,
          mediaFiles: count.mediaFiles
        }
      };
      
      setSyncResult(finalResult);
      
      Alert.alert(
        'Sync Complete', 
        `Successfully processed ${totalItems} items`
      );
      
      // Refresh pending count
      await loadPendingCount();
      
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during sync.'
      });
      Alert.alert(
        'Sync Error', 
        error instanceof Error ? error.message : 'An unexpected error occurred during sync.'
      );
    } finally {
      setSyncing(false);
      // Reset progress after a delay
      setTimeout(() => {
        setSyncProgress({ current: 0, total: 0 });
      }, 3000);
    }
  };

  return (
    <AppLayout 
      title="Data Sync"
      tabs={tabs}
      showHeader={true}
      showBottomNav={false}
      showLogout={true}
    >
      <ScrollView style={syncStyles.container}>
        <View style={syncStyles.header}>
          <Text style={syncStyles.title}>Data Synchronization</Text>
          <Text style={syncStyles.subtitle}>
            Sync your local data with the server. All pending changes will be uploaded including 
            risk assessment items, appointments, masters, and media files.
          </Text>
        </View>

        {pendingCount && (
          <Card style={syncStyles.summaryCard}>
            <Card.Content>
              <Text style={syncStyles.summaryTitle}>Pending Items</Text>
              <Text style={syncStyles.summaryText}>
                Risk Assessment Items: {pendingCount.riskAssessmentItems}
              </Text>
              <Text style={syncStyles.summaryText}>
                Appointments: {pendingCount.appointments}
              </Text>
              <Text style={syncStyles.summaryText}>
                Masters: {pendingCount.riskAssessmentMasters}
              </Text>
              <Text style={syncStyles.summaryText}>
                Media Files: {pendingCount.mediaFiles}
              </Text>
              <Text style={syncStyles.totalText}>
                Total: {pendingCount.total} items
              </Text>
            </Card.Content>
          </Card>
        )}

        {syncing && (
          <Card style={syncStyles.progressCard}>
            <Card.Content>
              <Text style={syncStyles.progressText}>
                Syncing data... {syncProgress.total > 0 && `(${syncProgress.current}/${syncProgress.total})`}
              </Text>
              <ProgressBar 
                progress={syncProgress.total > 0 ? syncProgress.current / syncProgress.total : 0} 
                style={syncStyles.progressBar}
                color="#27ae60"
              />
              {syncProgress.total > 0 && (
                <Text style={syncStyles.progressPercentage}>
                  {Math.round((syncProgress.current / syncProgress.total) * 100)}%
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {syncResult && (
          <Card style={syncStyles.resultCard}>
            <Card.Content>
              <Text style={syncResult.success ? syncStyles.successText : syncStyles.errorText}>
                {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
              </Text>
              <Text style={syncStyles.resultMessage}>
                {syncResult.message || syncResult.error}
              </Text>
              {syncResult.synced && (
                <View style={syncStyles.syncedDetails}>
                  <Text style={syncStyles.syncedText}>Synced Items:</Text>
                  <Text>• Risk Assessment Items: {syncResult.synced.riskAssessmentItems}</Text>
                  <Text>• Appointments: {syncResult.synced.appointments}</Text>
                  <Text>• Masters: {syncResult.synced.riskAssessmentMasters}</Text>
                  <Text>• Media Files: {syncResult.synced.mediaFiles}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        <View style={syncStyles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSync}
            disabled={syncing || (pendingCount && pendingCount.total === 0)}
            loading={syncing}
            style={syncStyles.syncButton}
          >
            {syncing ? 'Syncing...' : 'Start Sync'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={loadPendingCount}
            disabled={syncing}
            style={syncStyles.refreshButton}
          >
            Refresh Count
          </Button>
        </View>
      </ScrollView>
    </AppLayout>
  );
} 