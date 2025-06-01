import React, { useContext, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import SyncContext from '../context/SyncContext';

const SyncScreen = () => {
  const syncContext = useContext(SyncContext);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncLog(log => [...log, `Sync started at ${new Date().toLocaleTimeString()}`]);
    try {
      if (syncContext && syncContext.performSync) {
        await syncContext.performSync(false); // don't show alerts
        setSyncLog(log => [...log, `Sync successful at ${new Date().toLocaleTimeString()}`]);
      } else {
        setSyncLog(log => [...log, 'Sync function not available in context.']);
      }
    } catch (e: any) {
      setSyncLog(log => [...log, `Sync failed: ${e.message}`]);
    } finally {
      setSyncing(false);
    }
  };

  const effectiveSyncing = syncing || syncContext?.isSyncing;
  const effectiveOnline = isOnline ?? syncContext?.isOnline;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Data Sync</Text>
      <Text>Status: {effectiveOnline === null ? 'Checking...' : effectiveOnline ? 'Online' : 'Offline'}</Text>
      <Text>Last Sync: {syncContext?.lastSyncTime ? new Date(syncContext.lastSyncTime).toLocaleString() : 'Never'}</Text>
      <Button title={effectiveSyncing ? 'Syncing...' : 'Sync Now'} onPress={handleSync} disabled={effectiveSyncing || !effectiveOnline} />
      {effectiveSyncing && <ActivityIndicator style={{ marginTop: 10 }} />}
      <Text style={styles.logTitle}>Sync Log:</Text>
      {syncLog.length === 0 ? (
        <Text style={styles.logEntry}>No sync actions yet.</Text>
      ) : (
        syncLog.slice().reverse().map((entry, idx) => (
          <Text key={idx} style={styles.logEntry}>{entry}</Text>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  logTitle: {
    marginTop: 24,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#34495e',
  },
  logEntry: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

export default SyncScreen; 