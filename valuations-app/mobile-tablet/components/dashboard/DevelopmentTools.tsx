import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import * as Updates from 'expo-updates';
import ConfigurationService from '../../services/configurationService';
import { developmentToolsStyles } from '../../app/GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';

export const DevelopmentTools: React.FC = () => {
  const { logout } = useAuth();
  
  // Debug logging to check development mode
  console.log('🔧 DevelopmentTools: __DEV__ =', __DEV__);
  console.log('🔧 DevelopmentTools: process.env.NODE_ENV =', process.env.NODE_ENV);
  
  // Only render in development mode
  if (!__DEV__) {
    console.log('🔧 DevelopmentTools: Not rendering because __DEV__ is false');
    return null;
  }
  
  console.log('🔧 DevelopmentTools: Rendering development tools');

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  const handleCheckDBStats = async () => {
    console.log('🔧 Checking Database Stats...');
    try {
      const { getTableStats } = await import('../../utils/db');
      const stats = await getTableStats();
      console.log('📊 Current table stats:', stats);
      alert(`Database Stats:\n${JSON.stringify(stats, null, 2)}`);
    } catch (error) {
      console.error('Error getting stats:', error);
      alert(`Error: ${error}`);
    }
  };

  const handleClearTables = async () => {
    console.log('🗑️ Clearing cached tables...');
    try {
      const { clearAllCachedTables } = await import('../../utils/db');
      await clearAllCachedTables();
      alert('✅ All cached tables cleared successfully!');
    } catch (error) {
      console.error('Error clearing tables:', error);
      alert(`❌ Error: ${error}`);
    }
  };

  const handleForceReload = async () => {
    console.log('🔄 Force reloading from API...');
    try {
      const { forceReloadFromAPI } = await import('../../utils/db');
      await forceReloadFromAPI();
      alert('✅ Force reload completed! Next API calls will fetch fresh data.');
    } catch (error) {
      console.error('Error force reloading:', error);
      alert(`❌ Error: ${error}`);
    }
  };

  const handleClearConfigCache = async () => {
    console.log('🗑️ Clearing dynamic UI configuration cache...');
    try {
      await ConfigurationService.clearCache(); // Clear all configuration cache
      console.log('✅ Configuration cache cleared successfully');
      alert('✅ Dynamic UI configuration cache cleared!\n\nNext time you navigate to a category, it will fetch fresh field configuration from the API.');
    } catch (error) {
      console.error('Error clearing configuration cache:', error);
      alert(`❌ Error clearing cache: ${error}`);
    }
  };

  const handleClearAuthData = async () => {
    console.log('🔐 Clearing authentication data...');
    try {
      await logout();
      Alert.alert('Success', 'Authentication data cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear authentication data');
    }
  };

  const handleTestPrefetch = async () => {
    try {
      const { prefetchService } = await import('../../services/prefetchService');
      const result = await prefetchService.startAppointmentPrefetch('test-appointment-123', 'TEST-ORDER-456');
      Alert.alert('Prefetch Test', `Result: ${result ? 'Success' : 'Failed'}\n\nNote: Authentication is required for prefetching to work.`);
    } catch (error: any) {
      Alert.alert('Prefetch Test Error', `Error: ${error.message}\n\nThis is expected if no authentication token is available.`);
    }
  };

  const handleRefreshCategoryConfigs = async () => {
    console.log('🔄 Refreshing all category configurations...');
    try {
      const { prefetchService } = await import('../../services/prefetchService');
      const result = await prefetchService.refreshAllCategoryConfigurations();
      Alert.alert(
        'Category Configs Refresh', 
        result 
          ? '✅ Successfully refreshed all category configurations from API and stored in SQLite!' 
          : '❌ Failed to refresh category configurations. Check console for details.'
      );
    } catch (error: any) {
      Alert.alert('Category Configs Refresh Error', `Error: ${error.message}`);
    }
  };

  const handleClearCategoryConfigs = async () => {
    console.log('🗑️ Clearing all category configurations from SQLite...');
    try {
      const { prefetchService } = await import('../../services/prefetchService');
      await prefetchService.clearAllCategoryConfigurationsFromSQLite();
      Alert.alert('Category Configs Clear', '✅ Successfully cleared all category configurations from SQLite!');
    } catch (error: any) {
      Alert.alert('Category Configs Clear Error', `Error: ${error.message}`);
    }
  };

  const handleClearAllCache = async () => {
    console.log('🗑️ Clearing ALL system cache...');
    try {
      // Clear all types of cache in parallel for maximum efficiency
      const clearPromises = [];
      
      // 1. Clear API request cache (enhanced client)
      clearPromises.push(
        (async () => {
          try {
            const { enhancedApiClient } = await import('../../api/enhancedClient');
            await enhancedApiClient.clearCache();
            console.log('✅ Enhanced API client cache cleared');
          } catch (error) {
            console.error('❌ Error clearing enhanced API cache:', error);
          }
        })()
      );
      
      // 2. Clear offline storage cache
      clearPromises.push(
        (async () => {
          try {
            const offlineStorage = await import('../../utils/offlineStorage');
            await offlineStorage.clearAllOfflineData();
            console.log('✅ Offline storage cache cleared');
          } catch (error) {
            console.error('❌ Error clearing offline storage:', error);
          }
        })()
      );
      
      // 3. Clear API cached data (risk templates, assessments, etc.)
      clearPromises.push(
        (async () => {
          try {
            const api = await import('../../api/index');
            await api.default.clearAllCachedData();
            console.log('✅ API cached data cleared');
          } catch (error) {
            console.error('❌ Error clearing API cached data:', error);
          }
        })()
      );
      
      // 4. Clear database tables
      clearPromises.push(
        (async () => {
          try {
            const { clearAllCachedTables } = await import('../../utils/db');
            await clearAllCachedTables();
            console.log('✅ Database tables cleared');
          } catch (error) {
            console.error('❌ Error clearing database tables:', error);
          }
        })()
      );
      
      // 5. Clear configuration cache
      clearPromises.push(
        (async () => {
          try {
            await ConfigurationService.clearCache();
            console.log('✅ Configuration cache cleared');
          } catch (error) {
            console.error('❌ Error clearing configuration cache:', error);
          }
        })()
      );
      
      // 6. Clear category configurations
      clearPromises.push(
        (async () => {
          try {
            const { prefetchService } = await import('../../services/prefetchService');
            await prefetchService.clearAllCategoryConfigurationsFromSQLite();
            console.log('✅ Category configurations cleared');
          } catch (error) {
            console.error('❌ Error clearing category configurations:', error);
          }
        })()
      );
      
      // 7. Clear AsyncStorage cache keys
      clearPromises.push(
        (async () => {
          try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            const keys = await AsyncStorage.default.getAllKeys();
            
            // Filter out authentication and user data, keep only cache keys
            const cacheKeys = keys.filter(key => 
              key.includes('cache') || 
              key.includes('api_cache') || 
              key.includes('mobile_dashboard') ||
              key.includes('appointmentsByListView') ||
              key.includes('todays_appointments') ||
              key.includes('surveys_in_progress') ||
              key.includes('risk_assessment_hierarchy') ||
              key.includes('assessment_') ||
              key.includes('template_') ||
              key.includes('field_config_')
            );
            
            if (cacheKeys.length > 0) {
              await AsyncStorage.default.multiRemove(cacheKeys);
              console.log(`✅ Cleared ${cacheKeys.length} AsyncStorage cache keys`);
            }
          } catch (error) {
            console.error('❌ Error clearing AsyncStorage cache keys:', error);
          }
        })()
      );
      
      // Wait for all cache clearing operations to complete
      await Promise.all(clearPromises);
      
      console.log('🎉 ALL CACHE CLEARED SUCCESSFULLY!');
      Alert.alert(
        'Cache Cleared', 
        '✅ All system cache has been cleared successfully!\n\n' +
        '• Enhanced API client cache\n' +
        '• Offline storage cache\n' +
        '• API cached data\n' +
        '• Database tables\n' +
        '• Configuration cache\n' +
        '• Category configurations\n' +
        '• AsyncStorage cache keys\n\n' +
        'The app will now fetch fresh data from all APIs on next request.'
      );
      
    } catch (error: any) {
      console.error('❌ Error clearing all cache:', error);
      Alert.alert('Cache Clear Error', `Error: ${error.message}`);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateResult(null);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateResult('Update found and will be applied now. The app will reload.');
        Updates.reloadAsync();
      } else {
        setUpdateResult('No update available.');
      }
    } catch (e: any) {
      setUpdateResult('Error checking for update: ' + (e?.message || e));
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <View style={developmentToolsStyles.section}>
      <Text style={developmentToolsStyles.sectionTitle}>🛠️ Development Tools</Text>
      <Card style={developmentToolsStyles.debugSection}>
        <Card.Content>
          <Button 
            mode="contained" 
            onPress={handleCheckDBStats}
            style={developmentToolsStyles.debugButton}
            icon="database"
          >
            Check DB Stats
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleClearTables}
            style={developmentToolsStyles.debugButton}
            icon="delete"
          >
            Clear All Tables
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleForceReload}
            style={developmentToolsStyles.debugButton}
            icon="refresh"
          >
            Force API Reload
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleClearConfigCache}
            style={developmentToolsStyles.debugButton}
            icon="cached"
          >
            Clear Config Cache
          </Button>

          <Button 
            mode="outlined" 
            onPress={handleClearAuthData}
            style={developmentToolsStyles.debugButton}
            icon="logout"
          >
            Clear Auth Data
          </Button>

                     <Button 
             mode="outlined" 
             onPress={handleTestPrefetch}
             style={developmentToolsStyles.debugButton}
             icon="cached"
           >
             Test Prefetch
           </Button>

           <Button 
             mode="outlined" 
             onPress={handleRefreshCategoryConfigs}
             style={developmentToolsStyles.debugButton}
             icon="refresh"
           >
             Refresh Category Configs
           </Button>

           <Button 
             mode="outlined" 
             onPress={handleClearCategoryConfigs}
             style={developmentToolsStyles.debugButton}
             icon="delete"
           >
             Clear Category Configs
           </Button>

           <Button 
             mode="outlined" 
             onPress={handleCheckUpdate}
             style={developmentToolsStyles.debugButton}
             icon="update"
             disabled={checkingUpdate}
           >
             Check for Updates
           </Button>

           <Button 
             mode="contained" 
             onPress={handleClearAllCache}
             style={[developmentToolsStyles.debugButton, { backgroundColor: '#d32f2f', marginTop: 10 }]}
             icon="delete-sweep"
             buttonColor="#d32f2f"
           >
             🗑️ Clear ALL Cache
           </Button>
          {checkingUpdate && <ActivityIndicator style={{ marginTop: 8 }} />}
          {updateResult && <Text style={{ marginTop: 8 }}>{updateResult}</Text>}
        </Card.Content>
      </Card>
    </View>
  );
}; 