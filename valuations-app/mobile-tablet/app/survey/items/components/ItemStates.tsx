import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemStatesProps } from './types';
import { itemStatesStyles } from '../../../GlobalStyles';

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
      <View style={itemStatesStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={itemStatesStyles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={itemStatesStyles.errorContainer}>
        <Text style={itemStatesStyles.errorText}>{error}</Text>
        {onRetry && (
          <Button 
            mode="contained" 
            onPress={onRetry}
            style={itemStatesStyles.retryButton}
          >
            Retry
          </Button>
        )}
        {isOffline && (
          <Text style={itemStatesStyles.offlineHint}>
            You are currently offline. Showing cached data if available.
          </Text>
        )}
        {fromCache && !isOffline && (
          <Text style={itemStatesStyles.offlineHint}>
            Using cached data. Items were loaded from local storage.
          </Text>
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={itemStatesStyles.emptyState}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#bdc3c7" />
        <Text style={itemStatesStyles.emptyStateText}>No items added yet</Text>
        <Text style={itemStatesStyles.emptyStateSubtext}>Tap the 'Add Item' button to get started</Text>
      </View>
    );
  }

  return null;
}

