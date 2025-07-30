import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Item } from './types';
import { predefinedItemsListStyles } from '../../../GlobalStyles';

export interface GroupedItemsListProps {
  items: Item[];
  groupedItems: { [key: string]: Item[] };
  editItems: { [key: string]: any };
  expandedItem: string | null;
  expandedGroup: string | null;
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

export default function GroupedItemsList({
  items,
  groupedItems,
  editItems,
  expandedItem,
  expandedGroup,
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
  onViewPhotos,
  onDelete,
  onDuplicate,
  renderDynamicFields,
  hasDataCaptured,
  onAddNewItem,
  pendingChangesCount,
  syncing
}: GroupedItemsListProps) {
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
          {/* Render flat (single-tier) grouping */}
          {Object.entries(groupedItems).sort(([a, aItems], [b, bItems]) => {
            // Check if primary grouping is by location
            const effectiveGroupingStrategy = groupingStrategy?.strategy_type;
            const isLocationGrouping = effectiveGroupingStrategy === 'by_location';
            
            if (isLocationGrouping) {
              // Sort alphabetically for location grouping
              return a.localeCompare(b);
            } else {
              // Sort by rank for other groupings
              const aRank = aItems.length > 0 ? (aItems[0] as any).rank || 0 : 0;
              const bRank = bItems.length > 0 ? (bItems[0] as any).rank || 0 : 0;
              return aRank - bRank;
            }
          }).map(([groupKey, groupItems], groupIndex) => {
            const isGroupExpanded = expandedGroup === groupKey;
            const groupItemCount = groupItems.length;
            
            return (
              <View key={groupKey} style={predefinedItemsListStyles.groupContainer}>
                {/* Group Header */}
                <TouchableOpacity 
                  style={[
                    predefinedItemsListStyles.groupHeader,
                    groupIndex % 2 === 1 ? predefinedItemsListStyles.groupHeaderAlt : null,
                    isGroupExpanded ? predefinedItemsListStyles.groupHeaderExpanded : null
                  ]}
                  onPress={() => onToggleGroupExpansion(groupKey)}
                  activeOpacity={0.7}
                >
                  <Text style={predefinedItemsListStyles.groupTitle}>
                    {groupKey}
                  </Text>
                  
                  {/* Group indicators */}
                  <View style={predefinedItemsListStyles.groupIndicators}>
                    {(() => {
                      // Show count badge if more than 1 item OR if any item in group has data
                      const hasAnyDataInGroup = groupItems.some(item => hasDataCaptured(item));
                      return (groupItemCount > 1 || hasAnyDataInGroup) && (
                        <View style={predefinedItemsListStyles.countBadge}>
                          <Text style={predefinedItemsListStyles.countBadgeText}>{groupItemCount}</Text>
                        </View>
                      );
                    })()}
                    
                    <MaterialCommunityIcons 
                      name={isGroupExpanded ? "chevron-down" : "chevron-right"} 
                      size={20} 
                      color="#6c757d" 
                    />
                  </View>
                </TouchableOpacity>

                {/* Add New Item Button for Group */}
                {isGroupExpanded && onAddNewItem && (
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
                      // Create a new item with the group type
                      const addNewCustomItem = () => {
                        const newItemId = `custom-new-${Date.now()}`;
                        const newItem: Item = {
                          id: newItemId,
                          type: groupKey, // Set the group type as default
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
                          console.log('Add new item for group:', groupKey);
                        });
                      };
                      addNewCustomItem();
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#4a90e2" />
                    <Text style={{ marginLeft: 8, color: '#4a90e2', fontWeight: '500' }}>Add {groupKey}</Text>
                  </TouchableOpacity>
                )}

                {/* Group Items */}
                {isGroupExpanded && (
                  <View style={predefinedItemsListStyles.groupItems}>
                    {groupItems.map((item: Item, index: number) => {
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
                          {/* Main item row */}
                          <TouchableOpacity 
                            style={[
                              predefinedItemsListStyles.predefinedItem,
                              predefinedItemsListStyles.groupItemRow,
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
                              
                              {/* Delete button */}
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