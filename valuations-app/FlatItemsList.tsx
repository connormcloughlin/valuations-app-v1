import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Item } from './types';
import { predefinedItemsListStyles } from '../../../GlobalStyles';

export interface FlatItemsListProps {
  items: Item[];
  editItems: { [key: string]: any };
  expandedItem: string | null;
  autoSavedItems: { [key: string]: boolean };
  itemPhotos: { [key: string]: any[] };
  fieldConfig: any[];
  dynamicFieldConfig: any[];
  useCustomFields: boolean;
  groupingStrategy?: any;
  onEdit: (itemId: string, fieldName: string, value: string) => void;
  onAutoSave: (itemId: string) => void;
  onToggleExpansion: (itemId: string) => void;
  onViewPhotos: (itemId: string) => void;
  onDelete: (item: Item) => void;
  onDuplicate: (item: Item) => void;
  renderDynamicFields: (itemId: string, editData: any) => React.ReactNode;
  hasDataCaptured: (item: Item) => boolean;
  onAddNewItem?: (addNewCustomItem: () => void) => void;
  // Sync-related props for UI updates
  pendingChangesCount?: number;
  syncing?: boolean;
}

export default function FlatItemsList({
  items,
  editItems,
  expandedItem,
  autoSavedItems,
  itemPhotos,
  fieldConfig,
  dynamicFieldConfig,
  useCustomFields,
  groupingStrategy,
  onEdit,
  onAutoSave,
  onToggleExpansion,
  onViewPhotos,
  onDelete,
  onDuplicate,
  renderDynamicFields,
  hasDataCaptured,
  onAddNewItem,
  pendingChangesCount,
  syncing
}: FlatItemsListProps) {
  return (
    <Card style={predefinedItemsListStyles.card}>
      <Card.Content style={predefinedItemsListStyles.predefinedContent}>
        <View style={predefinedItemsListStyles.scrollIndicator}>
          <MaterialCommunityIcons name="gesture-swipe-down" size={16} color="#7f8c8d" />
          <Text style={predefinedItemsListStyles.scrollHint}>Tap items to view and edit details</Text>
        </View>
        
        <ScrollView 
          style={predefinedItemsListStyles.predefinedList}
          contentContainerStyle={predefinedItemsListStyles.predefinedListContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {/* Render all fields for all items in a single flat form (no per-item container) */}
          <View style={{ width: '100%' }}>
            {items.map((item, itemIndex) => {
              const itemId = String(item.id);
              return (
                <React.Fragment key={itemId}>
                  {renderDynamicFields(itemId, editItems[itemId] || {})}
                </React.Fragment>
              );
            })}
          </View>
          
          {items.length === 0 && (
            <View style={predefinedItemsListStyles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#bdc3c7" />
              <Text style={predefinedItemsListStyles.emptyStateText}>No predefined items found</Text>
              <Text style={predefinedItemsListStyles.emptyStateSubtext}>Try refreshing or add custom items</Text>
            </View>
          )}
        </ScrollView>
        
        {items.length > 10 && (
          <View style={predefinedItemsListStyles.scrollIndicator}>
            <MaterialCommunityIcons name="gesture-swipe-up" size={16} color="#7f8c8d" />
          </View>
        )}
      </Card.Content>
    </Card>
  );
} 