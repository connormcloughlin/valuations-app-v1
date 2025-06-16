import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  clearAllCachedTables, 
  recreateAllTables, 
  clearTableData, 
  forceReloadFromAPI, 
  getTableStats,
  getAllRiskAssessmentItems,
  getAllRiskAssessmentMasters,
  getAllAppointments,
  getAllMediaFiles
} from '../utils/db';
import { prefetchService } from '../services/prefetchService';

export default function DebugDBScreen() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [lastAction, setLastAction] = useState<string>('');

  const executeAction = async (actionName: string, action: () => Promise<void>) => {
    try {
      setLoading(true);
      setLastAction(`Executing: ${actionName}...`);
      await action();
      setLastAction(`✅ Completed: ${actionName}`);
      await refreshStats();
    } catch (error) {
      setLastAction(`❌ Error in ${actionName}: ${error}`);
      console.error(`Error in ${actionName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const tableStats = await getTableStats();
      setStats(tableStats);
    } catch (error) {
      console.error('Error getting stats:', error);
    }
  };

  const showDetailedData = async (tableName: string) => {
    try {
      let data: any[] = [];
      let title = '';
      
      switch (tableName) {
        case 'risk_assessment_items':
          data = await getAllRiskAssessmentItems();
          title = 'Risk Assessment Items';
          break;
        case 'risk_assessment_master':
          data = await getAllRiskAssessmentMasters();
          title = 'Risk Assessment Masters';
          break;
        case 'appointments':
          data = await getAllAppointments();
          title = 'Appointments';
          break;
        case 'media_files':
          data = await getAllMediaFiles();
          title = 'Media Files';
          break;
      }
      
      Alert.alert(
        title,
        `Found ${data.length} records\n\nFirst few items:\n${JSON.stringify(data.slice(0, 2), null, 2)}`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error) {
      Alert.alert('Error', `Failed to get ${tableName} data: ${error}`);
    }
  };

  const triggerPrefetch = async () => {
    try {
      setLoading(true);
      setLastAction('Starting prefetch service...');
      
      // You'll need to provide an actual appointment ID
      const success = await prefetchService.startAppointmentPrefetch('test-appointment-id');
      
      setLastAction(success ? '✅ Prefetch started successfully' : '❌ Prefetch failed to start');
    } catch (error) {
      setLastAction(`❌ Prefetch error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshStats();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛠️ Database Debug Console</Text>
      
      {/* Current Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Current Table Statistics</Text>
                 {Object.entries(stats).map(([table, count]) => (
          <TouchableOpacity
            key={table}
            style={styles.statRow}
            onPress={() => showDetailedData(table)}
          >
            <Text style={styles.statText}>{table}: {count as number} records</Text>
            <Text style={styles.tapHint}>Tap to view data</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.refreshButton} onPress={refreshStats}>
          <Text style={styles.buttonText}>🔄 Refresh Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Clear Functions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗑️ Clear Functions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={() => executeAction('Clear All Cached Tables', clearAllCachedTables)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear All Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={() => executeAction('Recreate All Tables', recreateAllTables)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💥 Recreate All Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={() => executeAction('Force Reload from API', forceReloadFromAPI)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔄 Force API Reload</Text>
        </TouchableOpacity>
      </View>

      {/* Individual Table Clear */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Clear Individual Tables</Text>
        
        {['risk_assessment_items', 'risk_assessment_master', 'appointments', 'media_files'].map((tableName) => (
          <TouchableOpacity
            key={tableName}
            style={[styles.button, styles.secondaryButton]}
            onPress={() => executeAction(`Clear ${tableName}`, () => clearTableData(tableName as any))}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Clear {tableName}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reload Functions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 Reload Functions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={triggerPrefetch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🚀 Trigger Prefetch</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Last Action</Text>
        <Text style={styles.statusText}>{lastAction || 'No actions performed yet'}</Text>
        {loading && <Text style={styles.loadingText}>⏳ Working...</Text>}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Instructions</Text>
        <Text style={styles.instructionText}>
          1. Check current stats first{'\n'}
          2. Use "Clear All Tables" to remove cached data{'\n'}
          3. Use "Force API Reload" to clear both SQLite and AsyncStorage{'\n'}
          4. Use "Trigger Prefetch" to reload fresh data{'\n'}
          5. "Recreate All Tables" is the nuclear option{'\n'}
          6. Tap on table stats to view actual data
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  warningButton: {
    backgroundColor: '#fd7e14',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statText: {
    fontSize: 16,
    color: '#333',
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 