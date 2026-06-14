import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityIndicator, Banner, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import pullSyncService, { PullSyncState } from '../services/pullSyncService';

interface SyncRefreshIndicatorProps {
  appointmentId?: string;
  onRefreshComplete?: () => void;
  style?: object;
}

export const SyncRefreshIndicator: React.FC<SyncRefreshIndicatorProps> = ({
  appointmentId,
  onRefreshComplete,
  style,
}) => {
  const [state, setState] = useState<PullSyncState>(pullSyncService.getState());
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    return pullSyncService.subscribe(setState);
  }, []);

  const handleRefresh = useCallback(async () => {
    setManualError(null);
    const result = await pullSyncService.pullServerChanges(
      appointmentId ? { appointmentId } : undefined
    );
    if (!result.success && !result.skipped) {
      setManualError(result.error ?? 'Refresh failed');
    } else if (result.success) {
      onRefreshComplete?.();
    }
  }, [appointmentId, onRefreshComplete]);

  const lastUpdatedLabel = state.lastPullAt
    ? new Date(state.lastPullAt).toLocaleString()
    : 'Not refreshed yet';

  return (
    <View style={style}>
      {state.conflictCount > 0 && (
        <Banner
          visible
          icon={({ size }) => (
            <MaterialCommunityIcons name="alert-circle-outline" size={size} color="#b45309" />
          )}
          style={styles.conflictBanner}
        >
          {state.conflictCount} local change
          {state.conflictCount === 1 ? '' : 's'} conflict with server updates. Sync your pending
          edits to reconcile.
        </Banner>
      )}

      <Card style={styles.card} elevation={1}>
        <View style={styles.row}>
          <View style={styles.left}>
            <MaterialCommunityIcons
              name={state.isRefreshing ? 'cloud-sync' : 'cloud-check-outline'}
              size={20}
              color={state.isRefreshing ? '#2563eb' : '#64748b'}
            />
            <View style={styles.textBlock}>
              <Text style={styles.title}>
                {state.isRefreshing ? 'Refreshing from server…' : 'Server sync'}
              </Text>
              <Text style={styles.subtitle}>Last updated: {lastUpdatedLabel}</Text>
              {manualError ? <Text style={styles.errorText}>{manualError}</Text> : null}
              {state.lastPullError && !manualError ? (
                <Text style={styles.errorText}>{state.lastPullError}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            {state.isRefreshing ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Button mode="outlined" compact onPress={handleRefresh}>
                Refresh
              </Button>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#b91c1c',
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictBanner: {
    marginBottom: 8,
    backgroundColor: '#fff7ed',
  },
});

export default SyncRefreshIndicator;
