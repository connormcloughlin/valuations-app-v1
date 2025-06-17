import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card, Button } from 'react-native-paper';

export const DevelopmentTools: React.FC = () => {
  // Only render in development mode
  if (!__DEV__) {
    return null;
  }

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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛠️ Development Tools</Text>
      <Card style={styles.debugSection}>
        <Card.Content>
          <Button 
            mode="contained" 
            onPress={handleCheckDBStats}
            style={styles.debugButton}
            icon="database"
          >
            Check DB Stats
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleClearTables}
            style={styles.debugButton}
            icon="delete"
          >
            Clear All Tables
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleForceReload}
            style={styles.debugButton}
            icon="refresh"
          >
            Force API Reload
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  debugSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  debugButton: {
    marginBottom: 10,
  },
}); 