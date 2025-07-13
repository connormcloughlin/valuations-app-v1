import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemsSummaryProps } from './types';
import { itemsSummaryStyles } from '../../../GlobalStyles';

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
    <View style={itemsSummaryStyles.container}>
      {/* Summary Header */}
      <View style={itemsSummaryStyles.summaryHeader}>
        <Text style={itemsSummaryStyles.summaryTitle}>Items ({userItemsCount})</Text>
        <Text style={itemsSummaryStyles.summaryTotal}>Total: R{totalValue.toLocaleString()}</Text>
      </View>
      
      {/* Buttons Row */}
      <View style={itemsSummaryStyles.buttonRow}>
        <TouchableOpacity
          style={itemsSummaryStyles.addButton}
          onPress={onAddItem}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={itemsSummaryStyles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
        
        <Button
          mode="outlined"
          onPress={onSync}
          disabled={syncing || pendingChangesCount === 0}
          loading={syncing}
          style={[
            itemsSummaryStyles.syncButton,
            { 
              borderColor: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
            }
          ]}
          contentStyle={itemsSummaryStyles.syncButtonContent}
          labelStyle={[
            itemsSummaryStyles.syncButtonText,
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
          style={itemsSummaryStyles.doneButton}
          onPress={onDone}
          labelStyle={itemsSummaryStyles.doneButtonText}
        >
          Done
        </Button>
      </View>
    </View>
  );
}

