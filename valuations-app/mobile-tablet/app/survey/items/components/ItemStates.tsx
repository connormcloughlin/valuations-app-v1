import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemStatesProps } from './types';

export default function ItemStates({ 
  loading, 
  error, 
  isEmpty, 
  onRetry, 
  isOffline, 
  fromCache 
}: ItemStatesProps) {

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <Button 
            mode="contained" 
            onPress={onRetry}
            style={styles.retryButton}
          >
            Retry
          </Button>
        )}
        {isOffline && (
          <Text style={styles.offlineHint}>
            You are currently offline. Showing cached data if available.
          </Text>
        )}
        {fromCache && !isOffline && (
          <Text style={styles.offlineHint}>
            Using cached data. Items were loaded from local storage.
          </Text>
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#bdc3c7" />
        <Text style={styles.emptyStateText}>No items added yet</Text>
        <Text style={styles.emptyStateSubtext}>Tap the 'Add Item' button to get started</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
  },
  offlineHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 