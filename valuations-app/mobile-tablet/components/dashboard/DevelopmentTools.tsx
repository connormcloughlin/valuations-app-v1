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
  const { clearAuthData } = useAuth();
  
  // Only render in development mode
  if (!__DEV__) {
    return null;
  }

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
      await clearAuthData();
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
            onPress={handleCheckUpdate}
            style={developmentToolsStyles.debugButton}
            icon="update"
            disabled={checkingUpdate}
          >
            Check for Updates
          </Button>
          {checkingUpdate && <ActivityIndicator style={{ marginTop: 8 }} />}
          {updateResult && <Text style={{ marginTop: 8 }}>{updateResult}</Text>}
        </Card.Content>
      </Card>
    </View>
  );
}; 