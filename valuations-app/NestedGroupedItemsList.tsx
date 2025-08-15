import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Item } from './types';
import { predefinedItemsListStyles } from '../../../GlobalStyles';

export interface NestedGroupedItemsListProps {
  items: Item[];
  groupedItems: { [primaryKey: string]: { [secondaryKey: string]: Item[] } };
  editItems: { [key: string]: any };
  expandedItem: string | null;
  expandedGroup: string | null;
  expandedSecondaryGroups: { [key: string]: boolean };
  autoSavedItems: { [key: string]: boolean };
  itemPhotos: { [key: string]: any[] };
  fieldConfig: any[];
  dynamicFieldConfig: any[];
  useCustomFields: boolean;
  groupingStrategy: any;
  onEdit: (itemId: string, fieldName: string, value: string) => void;
  onAutoSave: (itemId: string) => void;
  onToggleExpansion: (itemId: string) => void;
  onToggleGroupExpansion: (groupKey: string) => void;
  onToggleSecondaryGroup: (primaryKey: string, secondaryKey: string) => void;
  onViewPhotos: (itemId: string) => void;
  onDelete: (item: Item) => void;
  onDuplicate: (item: Item) => void;
  renderDynamicFields: (itemId: string, editData: any) => React.ReactNode;
  hasDataCaptured: (item: Item) => boolean;
  isSecondaryGroupExpanded: (primaryKey: string, secondaryKey: string) => boolean;
  onAddNewItem?: (addNewCustomItem: () => void) => void;
  // Sync-related props for UI updates
  pendingChangesCount?: number;
  syncing?: boolean;
}

export default function NestedGroupedItemsList({
  items,
  groupedItems,
  editItems,
  expandedItem,
  expandedGroup,
  expandedSecondaryGroups,
  autoSavedItems,
  itemPhotos,
  fieldConfig,
  dynamicFieldConfig,
  useCustomFields,
  groupingStrategy,
  onEdit,
  onAutoSave,
  onToggleExpansion,
  onToggleGroupExpansion,
  onToggleSecondaryGroup,
  onViewPhotos,
  onDelete,
  onDuplicate,
  renderDynamicFields,
  hasDataCaptured,
  isSecondaryGroupExpanded,
  onAddNewItem,
  pendingChangesCount,
  syncing
}: NestedGroupedItemsListProps) {
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
          {/* Render nested (2-tier) grouping */}
          {Object.entries(groupedItems).sort(([a, aGroups], [b, bGroups]) => {
            // Check if primary grouping is by location
            const strategyConfig = groupingStrategy?.strategy_config;
            let parsedConfig: any = null;
            try {
              parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
            } catch (error) {
              parsedConfig = null;
            }
            
            const isLocationGrouping = parsedConfig && parsedConfig.primary_group === 'Location';
            
            if (isLocationGrouping) {
              // Sort alphabetically for location grouping
              return a.localeCompare(b);
            } else {
              // Sort by rank for other groupings
              const aItems = Object.values(aGroups).flat();
              const bItems = Object.values(bGroups).flat();
              const aRank = aItems.length > 0 ? (aItems[0] as any).rank || 0 : 0;
              const bRank = bItems.length > 0 ? (bItems[0] as any).rank || 0 : 0;
              return aRank - bRank;
            }
          }).map(([primaryKey, secondaryGroups], primaryIndex) => {
            const isPrimaryExpanded = expandedGroup === primaryKey;
            const allItemsInPrimary = Object.values(secondaryGroups).flat();
            const itemsWithDataInPrimary = allItemsInPrimary.filter(item => hasDataCaptured(item));
            const totalItemsInPrimary = itemsWithDataInPrimary.length;
            const hasAnyDataInPrimary = totalItemsInPrimary > 0;
            
            return (
              <View key={primaryKey} style={predefinedItemsListStyles.groupContainer}>
                {/* Primary Group Header */}
                <TouchableOpacity 
                  style={[
                    predefinedItemsListStyles.groupHeader,
                    primaryIndex % 2 === 1 ? predefinedItemsListStyles.groupHeaderAlt : null,
                    isPrimaryExpanded ? predefinedItemsListStyles.groupHeaderExpanded : null
                  ]}
                  onPress={() => onToggleGroupExpansion(primaryKey)}
                  activeOpacity={0.7}
                >
                  <Text style={predefinedItemsListStyles.groupTitle}>
                    {primaryKey}
                  </Text>
                  
                  <View style={predefinedItemsListStyles.groupIndicators}>
                    {/* Show count badge if there are items with meaningful data in primary group */}
                    {hasAnyDataInPrimary && (
                      <View style={predefinedItemsListStyles.countBadge}>
                        <Text style={predefinedItemsListStyles.countBadgeText}>{totalItemsInPrimary}</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons 
                      name={isPrimaryExpanded ? "chevron-down" : "chevron-right"} 
                      size={20} 
                      color="#6c757d" 
                    />
                  </View>
                </TouchableOpacity>

                {/* Secondary Groups */}
                {isPrimaryExpanded && (
                  <View style={predefinedItemsListStyles.groupItems}>
                    {Object.entries(secondaryGroups).sort(([a, aItems], [b, bItems]) => {
                      // Check if secondary grouping is by location
                      const strategyConfig = groupingStrategy?.strategy_config;
                      let parsedConfig: any = null;
                      try {
                        parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
                      } catch (error) {
                        parsedConfig = null;
                      }
                      
                      const isLocationGrouping = parsedConfig && parsedConfig.secondary_group === 'Location';
                      
                      if (isLocationGrouping) {
                        // Sort alphabetically for location grouping
                        return a.localeCompare(b);
                      } else {
                        // Sort by rank for other groupings
                        const aRank = aItems.length > 0 ? (aItems[0] as any).rank || 0 : 0;
                        const bRank = bItems.length > 0 ? (bItems[0] as any).rank || 0 : 0;
                        return aRank - bRank;
                      }
                    }).map(([secondaryKey, items]) => {
                      const isSecondaryExpanded = isSecondaryGroupExpanded(primaryKey, secondaryKey);
                      const itemsWithDataInSecondary = items.filter(item => hasDataCaptured(item));
                      const secondaryItemCount = itemsWithDataInSecondary.length;
                      const hasAnyDataInSecondary = secondaryItemCount > 0;
                      
                      return (
                        <View key={`${primaryKey}-${secondaryKey}`} style={predefinedItemsListStyles.secondaryGroupContainer}>
                          {/* Secondary Group Header */}
                          <TouchableOpacity 
                            style={predefinedItemsListStyles.secondaryGroupHeader}
                            onPress={() => onToggleSecondaryGroup(primaryKey, secondaryKey)}
                            activeOpacity={0.7}
                          >
                            <Text style={predefinedItemsListStyles.secondaryGroupTitle}>
                              {secondaryKey}
                            </Text>
                            
                            <View style={predefinedItemsListStyles.groupIndicators}>
                              {/* Show count badge if there are items with meaningful data in secondary group */}
                              {hasAnyDataInSecondary && (
                                <View style={predefinedItemsListStyles.secondaryCountBadge}>
                                  <Text style={predefinedItemsListStyles.countBadgeText}>{secondaryItemCount}</Text>
                                </View>
                              )}
                              
                              <MaterialCommunityIcons 
                                name={isSecondaryExpanded ? "chevron-down" : "chevron-right"} 
                                size={18} 
                                color="#6c757d" 
                              />
                            </View>
                          </TouchableOpacity>

                          {/* Secondary Group Items */}
                          {isSecondaryExpanded && (
                            <View style={predefinedItemsListStyles.secondaryGroupItems}>
                              {items.map((item: Item, index: number) => {
                                const isExpanded = expandedItem === item.id;
                                const itemId = String(item.id);
                                const isAutoSaved = autoSavedItems[itemId];
                                
                                // Get current field values (edited or original)
                                const type = editItems[itemId]?.type ?? (item.type || '');
                                const quantity = editItems[itemId]?.quantity ?? String(item.quantity || '1');
                                const price = editItems[itemId]?.price ?? String(item.price || '');
                                const description = editItems[itemId]?.description ?? (item.description || '');
                                const model = editItems[itemId]?.model ?? (item.model || '');
                                const room = editItems[itemId]?.room ?? (item.room || '');
                                const notes = editItems[itemId]?.notes ?? (item.notes || '');
                                
                                // Check if this is a new custom item
                                const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');
                                
                                // Check if item has meaningful data captured
                                const hasData = hasDataCaptured(item);
                                
                                // Create a summary for the item
                                const itemSummary = description ? description 
                                                  : model ? model
                                                  : `Item #${index + 1}`;
                                
                                return (
                                  <View key={item.id} style={predefinedItemsListStyles.accordionContainer}>
                                    {/* Main item row - show summary instead of repeating the group name */}
                                    <TouchableOpacity 
                                      style={[
                                        predefinedItemsListStyles.predefinedItem,
                                        predefinedItemsListStyles.secondaryGroupItemRow,
                                        index % 2 === 1 ? predefinedItemsListStyles.predefinedItemAlt : null,
                                        isExpanded ? predefinedItemsListStyles.predefinedItemExpanded : null,
                                        isAutoSaved ? predefinedItemsListStyles.predefinedItemAutoSaved : null
                                      ]}
                                      onPress={() => onToggleExpansion(item.id)}
                                      activeOpacity={0.7}
                                    >
                                      <View style={predefinedItemsListStyles.itemSummaryContainer}>
                                        <Text style={predefinedItemsListStyles.itemSummaryText} numberOfLines={1} ellipsizeMode="tail">
                                          {itemSummary}
                                        </Text>
                                        {hasData && (
                                          <Text style={predefinedItemsListStyles.itemValueText}>
                                            {quantity}x @ R{price}
                                          </Text>
                                        )}
                                      </View>
                                      
                                      {/* Indicators container */}
                                      <View style={predefinedItemsListStyles.indicatorsContainer}>
                                        {/* Data capture indicator */}
                                        {hasData && (
                                          <MaterialCommunityIcons 
                                            name="database-check" 
                                            size={16} 
                                            color="#2196F3" 
                                            style={{ marginRight: 4 }} 
                                          />
                                        )}
                                        
                                        {/* Auto-save indicator */}
                                        {isAutoSaved && (
                                          <MaterialCommunityIcons 
                                            name="check-circle" 
                                            size={16} 
                                            color="#4CAF50" 
                                            style={{ marginRight: 4 }} 
                                          />
                                        )}
                                        
                                        {/* Delete button - show for items with data or new items */}
                                        {(hasData || isNewItem) && (
                                          <TouchableOpacity
                                            style={predefinedItemsListStyles.deleteIconButton}
                                            onPress={(e) => {
                                              e.stopPropagation();
                                              onDelete(item);
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                          >
                                            <MaterialCommunityIcons 
                                              name="delete-outline" 
                                              size={16} 
                                              color="#e74c3c" 
                                            />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                      
                                      <MaterialCommunityIcons 
                                        name={isExpanded ? "chevron-down" : "chevron-right"} 
                                        size={20} 
                                        color="#6c757d" 
                                      />
                                    </TouchableOpacity>

                                    {/* Expanded details section */}
                                    {isExpanded && (
                                      <View style={predefinedItemsListStyles.expandedContent}>
                                        <View style={predefinedItemsListStyles.detailsContainer}>
                                          {/* Dynamic Item Details Grid */}
                                          <View style={predefinedItemsListStyles.detailsGrid}>
                                            {renderDynamicFields(itemId, editItems[itemId] || {})}
                                          </View>

                                          {/* Action buttons */}
                                          <View style={predefinedItemsListStyles.actionButtonsContainer}>
                                            {isNewItem && (
                                              <TouchableOpacity
                                                style={[predefinedItemsListStyles.saveButton, { opacity: type ? 1 : 0.5 }]}
                                                onPress={() => onAutoSave(itemId)}
                                                disabled={!type}
                                              >
                                                <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                                                <Text style={predefinedItemsListStyles.saveButtonText}>Save New Item</Text>
                                              </TouchableOpacity>
                                            )}
                                            
                                            {/* Add Another button - only show for saved items */}
                                            {!isNewItem && hasData && (
                                              <TouchableOpacity
                                                style={predefinedItemsListStyles.duplicateButton}
                                                onPress={() => onDuplicate(item)}
                                              >
                                                <MaterialCommunityIcons name="content-duplicate" size={20} color="#4a90e2" />
                                                <Text style={predefinedItemsListStyles.duplicateButtonText}>Add Another {type || item.type}</Text>
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          )}

                          {/* Add New Item Button for Secondary Group */}
                          {isSecondaryExpanded && onAddNewItem && (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                backgroundColor: '#f8f9fa',
                                borderTopWidth: 1,
                                borderTopColor: '#e9ecef',
                                marginTop: 8
                              }}
                              onPress={() => {
                                // Create a new item with the secondary group type
                                const addNewCustomItem = () => {
                                  const newItemId = `custom-new-${Date.now()}`;
                                  const newItem: Item = {
                                    id: newItemId,
                                    type: secondaryKey, // Set the secondary group type as default
                                    quantity: '1',
                                    price: '0',
                                    description: '',
                                    model: '',
                                    room: '',
                                    notes: '',
                                    selectedanswer: '',
                                    commaseparatedlist: ''
                                  };
                                  // This would need to be handled by the parent component
                                  // For now, we'll just call the onAddNewItem callback
                                  onAddNewItem(() => {
                                    console.log('Add new item for secondary group:', secondaryKey);
                                  });
                                };
                                addNewCustomItem();
                              }}
                            >
                              <MaterialCommunityIcons name="plus" size={20} color="#4a90e2" />
                              <Text style={{ marginLeft: 8, color: '#4a90e2', fontWeight: '500' }}>Add {secondaryKey}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          
          {Object.keys(groupedItems).length === 0 && (
            <View style={predefinedItemsListStyles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#bdc3c7" />
              <Text style={predefinedItemsListStyles.emptyStateText}>No predefined items found</Text>
              <Text style={predefinedItemsListStyles.emptyStateSubtext}>Try refreshing or add custom items</Text>
            </View>
          )}
        </ScrollView>
        
        {Object.keys(groupedItems).length > 3 && (
          <View style={predefinedItemsListStyles.scrollIndicator}>
            <MaterialCommunityIcons name="gesture-swipe-up" size={16} color="#7f8c8d" />
          </View>
        )}
      </Card.Content>
    </Card>
  );
} 