import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { ItemsSummaryProps } from './types';
import { itemsSummaryStyles, itemsSummaryPhoneStyles } from '../../../GlobalStyles';

export default function ItemsSummary({ 
  userItemsCount, 
  totalValue, 
  onAddItem, 
  onDone, 
  pendingChangesCount, 
  syncing, 
  onSync 
}: ItemsSummaryProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 600;
  const s = isPhone ? itemsSummaryPhoneStyles : itemsSummaryStyles;

  return (
    <View style={s.container}>
      {/* Summary Header */}
      <View style={s.summaryHeader}>
        <Text style={s.summaryTitle}>Items ({userItemsCount})</Text>
        <Text style={s.summaryTotal}>Total: R{totalValue.toLocaleString()}</Text>
      </View>
      
      {/* Buttons Row */}
      <View style={s.buttonRow}>
        <Button
          mode="contained"
          onPress={onAddItem}
          style={s.addButton}
          contentStyle={s.addButtonContent}
          labelStyle={s.addButtonText}
          icon="plus"
          compact={isPhone}
          uppercase={false}
        >
          {isPhone ? 'Add' : 'Add Item'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={onSync}
          disabled={syncing || pendingChangesCount === 0}
          loading={syncing}
          style={[
            s.syncButton,
            { 
              borderColor: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
            }
          ]}
          contentStyle={s.syncButtonContent}
          labelStyle={[
            s.syncButtonText,
            { 
              color: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
            }
          ]}
          icon="cloud-upload"
          compact={isPhone}
          uppercase={false}
        >
          {syncing
            ? (isPhone ? 'Sync...' : 'Syncing...')
            : `Sync (${pendingChangesCount})`}
        </Button>
        
        <Button
          mode="contained"
          style={s.doneButton}
          onPress={onDone}
          labelStyle={s.doneButtonText}
          compact={isPhone}
          uppercase={false}
        >
          Done
        </Button>
      </View>
    </View>
  );
}

