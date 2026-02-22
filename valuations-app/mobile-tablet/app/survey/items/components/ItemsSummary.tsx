import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
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
        <Button
          mode="contained"
          onPress={onAddItem}
          style={itemsSummaryStyles.addButton}
          contentStyle={itemsSummaryStyles.addButtonContent}
          labelStyle={itemsSummaryStyles.addButtonText}
          icon="plus"
        >
          Add Item
        </Button>
        
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

