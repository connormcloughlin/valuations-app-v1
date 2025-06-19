import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemsSummaryProps } from './types';

export default function ItemsSummary({ 
  userItemsCount, 
  totalValue, 
  onAddItem, 
  onDone, 
  pendingChangesCount, 
  syncing, 
  onSync 
}: ItemsSummaryProps) {
  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Items ({userItemsCount})</Text>
        <Text style={styles.summaryTotal}>Total: R{totalValue.toLocaleString()}</Text>
      </View>
      
      {/* Buttons Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddItem}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
        
        <Button
          mode="outlined"
          onPress={onSync}
          disabled={syncing || pendingChangesCount === 0}
          loading={syncing}
          style={[
            styles.syncButton,
            { 
              borderColor: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
            }
          ]}
          contentStyle={styles.syncButtonContent}
          labelStyle={[
            styles.syncButtonText,
            { 
              color: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
            }
          ]}
          icon="cloud-upload"
        >
          {syncing ? 'Syncing...' : `Sync (${pendingChangesCount})`}
        </Button>
        
        <Button
          mode="contained"
          style={styles.doneButton}
          onPress={onDone}
          labelStyle={styles.doneButtonText}
        >
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  syncButton: {
    height: 48,
    justifyContent: 'center',
    flex: 1,
  },
  syncButtonContent: {
    height: 48,
  },
  syncButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  doneButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#2c3e50',
    flex: 1,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 