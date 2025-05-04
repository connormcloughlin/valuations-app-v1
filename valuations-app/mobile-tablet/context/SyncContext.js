import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import syncService from '../services/syncService';
import storageService from '../services/storageService';
import api from '../api';

// Create the context
const SyncContext = createContext();

/**
 * Provider component for sync functionality
 */
export const SyncProvider = ({ children }) => {
  // State
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  
  // Initialize and set up network listeners
  useEffect(() => {
    // Initialize the sync service
    const initialize = async () => {
      // Check initial connection
      const isConnected = await syncService.isConnected();
      setIsOnline(isConnected);
      
      // Initialize API session (with stored credentials)
      await syncService.initializeSession();
      
      // Update pending sync count
      updatePendingSyncCount();
    };
    
    // Set up network change listener
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    
    initialize();
    
    // Clean up
    return () => {
      unsubscribeNetInfo();
    };
  }, []);
  
  // Update pending sync count helper
  const updatePendingSyncCount = async () => {
    const pendingSurveys = await storageService.getPendingSyncSurveys();
    setPendingSyncCount(pendingSurveys.length);
  };
  
  /**
   * Perform a full sync with the server
   * @param {boolean} showAlerts - Whether to show result alerts
   * @returns {Promise<Object>} Sync result
   */
  const performSync = async (showAlerts = true) => {
    if (isSyncing) return { success: false, error: 'Sync already in progress' };
    
    try {
      setIsSyncing(true);
      
      if (!isOnline) {
        if (showAlerts) {
          Alert.alert(
            'Offline Mode',
            'You are currently offline. Sync will be attempted when you reconnect.'
          );
        }
        return { success: false, error: 'No internet connection', offline: true };
      }
      
      // Perform full sync
      const result = await syncService.performFullSync();
      
      if (result.success) {
        // Update last sync time
        const timestamp = result.timestamp || new Date().toISOString();
        setLastSyncTime(timestamp);
        
        if (showAlerts) {
          Alert.alert(
            'Sync Complete', 
            `Successfully synced ${result.uploadResult.totalSynced} surveys to server\nDownloaded ${result.downloadResult.count || 0} surveys`
          );
        }
      } else if (showAlerts) {
        Alert.alert(
          'Sync Issue',
          result.error || 'There was an issue during synchronization'
        );
      }
      
      // Update pending count regardless of result
      await updatePendingSyncCount();
      
      return result;
    } catch (error) {
      console.error('Error in performSync:', error);
      
      if (showAlerts) {
        Alert.alert(
          'Sync Error',
          'An unexpected error occurred during synchronization'
        );
      }
      
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Save a survey locally and sync if appropriate
   * @param {Object} survey - Survey to save
   * @param {boolean} syncToServer - Whether to attempt immediate sync
   * @returns {Promise<Object>} Result with success status and survey data
   */
  const saveSurvey = async (survey, syncToServer = false) => {
    try {
      // Save to local storage first
      const needsSync = syncToServer || survey.status === 'completed';
      const saveResult = await storageService.saveSurvey(survey, needsSync);
      
      if (!saveResult) {
        return { success: false, error: 'Failed to save survey locally' };
      }
      
      // Update pending count
      await updatePendingSyncCount();
      
      // Sync immediately if requested and online
      if (syncToServer && isOnline) {
        setIsSyncing(true);
        
        try {
          const syncResult = await syncService.syncSurvey(survey.id);
          
          if (syncResult.success) {
            // Update last sync time
            setLastSyncTime(new Date().toISOString());
            
            // Update pending count after sync
            await updatePendingSyncCount();
            
            return { 
              success: true, 
              synced: true,
              data: syncResult.data || survey
            };
          } else {
            // Sync failed but local save succeeded
            return { 
              success: true, 
              synced: false, 
              syncError: syncResult.error,
              data: survey
            };
          }
        } finally {
          setIsSyncing(false);
        }
      }
      
      // Return success for local save
      return { 
        success: true, 
        synced: false,
        offline: !isOnline && syncToServer,
        data: survey 
      };
    } catch (error) {
      console.error('Error in saveSurvey:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Download surveys from the server
   * @param {boolean} showAlerts - Whether to show result alerts
   * @returns {Promise<Object>} Result with success status
   */
  const downloadSurveys = async (showAlerts = true) => {
    if (isSyncing) return { success: false, error: 'Sync already in progress' };
    
    try {
      setIsSyncing(true);
      
      if (!isOnline) {
        if (showAlerts) {
          Alert.alert(
            'Offline Mode',
            'You are currently offline. Cannot download new surveys.'
          );
        }
        return { success: false, error: 'No internet connection', offline: true };
      }
      
      // Perform download
      const result = await syncService.downloadSurveys();
      
      if (result.success) {
        // Update last sync time
        setLastSyncTime(new Date().toISOString());
        
        if (showAlerts) {
          Alert.alert(
            'Download Complete', 
            `Downloaded ${result.count || 0} surveys from server`
          );
        }
      } else if (showAlerts) {
        Alert.alert(
          'Download Issue',
          result.error || 'There was an issue downloading surveys'
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error in downloadSurveys:', error);
      
      if (showAlerts) {
        Alert.alert(
          'Download Error',
          'An unexpected error occurred while downloading surveys'
        );
      }
      
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Delete a survey
   * @param {string} surveyId - ID of survey to delete
   * @param {boolean} deleteFromServer - Whether to also delete from server
   * @returns {Promise<Object>} Result with success status
   */
  const deleteSurvey = async (surveyId, deleteFromServer = false) => {
    try {
      // Delete locally first
      const deleteResult = await storageService.deleteSurvey(surveyId);
      
      if (!deleteResult) {
        return { success: false, error: 'Failed to delete survey locally' };
      }
      
      // Update pending count
      await updatePendingSyncCount();
      
      // Delete from server if requested and online
      if (deleteFromServer && isOnline) {
        try {
          const serverResult = await api.deleteSurvey(surveyId);
          
          if (!serverResult.success) {
            return { 
              success: true, 
              serverDeleteFailed: true,
              error: serverResult.error 
            };
          }
        } catch (error) {
          console.error('Error deleting survey from server:', error);
          return { 
            success: true, 
            serverDeleteFailed: true,
            error: error.message 
          };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteSurvey:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Export context value
  const contextValue = {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingSyncCount,
    performSync,
    saveSurvey,
    downloadSurveys,
    deleteSurvey
  };
  
  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

/**
 * Custom hook to use the sync context
 */
export const useSync = () => {
  const context = useContext(SyncContext);
  
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  
  return context;
};

export default SyncContext; 