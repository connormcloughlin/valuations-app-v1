import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Card, Divider, Button, TextInput as PaperTextInput, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PredefinedItemsListProps, Item } from './types';
import ItemStates from './ItemStates';
import CameraModal from './CameraModal';
import PhotoGalleryModal from './PhotoGalleryModal';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { ValidationService } from '../../../../services/validationService';
import { FieldConfiguration, FieldValidationError } from '../../../../types/dynamicUI';
// Import required services and utilities
import riskAssessmentSyncService from '../../../../services/riskAssessmentSyncService';
import mediaService from '../../../../services/mediaService';
import {
  updateRiskAssessmentItem,
  RiskAssessmentItem,
  MediaFile,
  getAllRiskAssessmentItems
} from '../../../../utils/db';
// Use require for ImagePicker to avoid type issues
const ImagePicker = require('expo-image-picker');

export default function PredefinedItemsList({ 
  items: propsItems, 
  loading, 
  error, 
  categoryTitle, 
  categoryId,
  isOffline, 
  fromCache, 
  fieldConfig = [],
  dynamicFieldConfig = [],
  useCustomFields = false,
  groupingStrategy,
  onRefresh, 
  onSelectItem,
  onAddNewItem,
  onSyncStatusChange,
  onSyncRequest,
  onTotalsChange
}: PredefinedItemsListProps) {
  
  // Handle loading and error states BEFORE any hooks
  if (loading) {
    return <ItemStates loading={true} />;
  }

  if (error) {
    return (
      <ItemStates 
        error={error}
        onRetry={onRefresh}
        isOffline={isOffline}
        fromCache={fromCache}
      />
    );
  }

  // Handle dynamic field configuration loading state
  // Show loading when we expect dynamic config but it's not ready yet
  const isDynamicFieldConfigLoading = useMemo(() => {
    // Debug logging
    console.log('🔧 Loading state check:', {
      useCustomFields,
      dynamicFieldConfigLength: dynamicFieldConfig?.length || 0,
      dynamicFieldConfigExists: !!dynamicFieldConfig,
      propsItemsLength: propsItems?.length || 0
    });
    
    // If we have items but no dynamic field config yet, and useCustomFields is true, show loading
    if (useCustomFields && propsItems && propsItems.length > 0) {
      const hasValidDynamicConfig = dynamicFieldConfig && dynamicFieldConfig.length > 0;
      if (!hasValidDynamicConfig) {
        console.log('🔧 Showing loading state - waiting for dynamic field config');
        return true;
      }
    }
    
    return false;
  }, [useCustomFields, dynamicFieldConfig, propsItems]);
  
  if (isDynamicFieldConfigLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading field configuration...</Text>
      </View>
    );
  }
  
  // Manage local items state like ItemsTable does
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedSecondaryGroups, setExpandedSecondaryGroups] = useState<{ [key: string]: boolean }>({});
  // Editing state management
  const [editItems, setEditItems] = useState<{ [key: string]: any }>({});
  // Focus management for auto-save
  const [focusedField, setFocusedField] = useState<{ itemId: string; fieldName: string } | null>(null);
  const [pendingFocusRestore, setPendingFocusRestore] = useState<{ newItemId: string; fieldName: string } | null>(null);
  const [autoSavedItems, setAutoSavedItems] = useState<{ [key: string]: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: FieldValidationError[] }>({});
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  
  // Photo state management
  const [itemPhotos, setItemPhotos] = useState<{ [key: string]: MediaFile[] }>({});
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoItemId, setCurrentPhotoItemId] = useState<string | null>(null);
  const [addingAnotherPhoto, setAddingAnotherPhoto] = useState(false);
  
  // ScrollView ref for auto-scrolling to new items
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Initialize local items state with props items while preserving new/duplicate items
  useEffect(() => {
    if (propsItems && propsItems.length > 0) {
      console.log('PredefinedItemsList: Initializing local state with props items:', propsItems.length);
      
      // Preserve any existing new or duplicate items that were added locally
      setItems(prevItems => {
        const existingNewItems = prevItems.filter(item => 
          item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-')
        );
        
        if (existingNewItems.length > 0) {
          console.log(`PredefinedItemsList: Preserving ${existingNewItems.length} new/duplicate items during re-initialization`);
          // Merge props items with preserved new items
          return [...propsItems, ...existingNewItems];
        } else {
          // No new items to preserve, just use props items
          return propsItems;
        }
      });
    }
  }, [propsItems]);

  // Removed navigation effect - no longer needed without refresh logic

  // Function to add a new custom item to the list
  const addNewCustomItem = useCallback(() => {
    console.log('PredefinedItemsList: addNewCustomItem called!');
    const newItem: Item = {
      id: `custom-new-${Date.now()}`,
      type: '', // Empty - user will fill this in
      description: '',
      model: '',
      quantity: '1',
      price: '',
      room: '',
      notes: '',
      categoryId: categoryId // Use the categoryId prop
    };
    
    console.log('PredefinedItemsList: Creating new item:', newItem);
    
    // Add to local items state (at the bottom of the list)
    setItems(prevItems => {
      console.log('PredefinedItemsList: Adding new item to list, current items:', prevItems.length);
      return [...prevItems, newItem];
    });
    
    // Handle group expansion for new items based on grouping type
    if (isNestedGrouping(groupedItems)) {
      // For nested grouping, we can't predict the primary/secondary group until user fills in the fields
      // Just expand the new item for editing
      setExpandedItem(newItem.id);
      console.log('PredefinedItemsList: Expanded new item for editing in nested grouping:', newItem.id);
    } else {
      // For flat grouping, ensure "New Items" group is expanded
    setExpandedGroup('New Items');
    setExpandedItem(newItem.id);
      console.log('PredefinedItemsList: Expanded group "New Items" and item:', newItem.id);
    }
    
    // Set it as being edited
    setEditItems(prev => ({
      ...prev,
      [newItem.id]: {
        type: '',
        description: '',
        model: '',
        quantity: '1',
        price: '',
        room: '',
        notes: ''
      }
    }));
    console.log('PredefinedItemsList: Edit state set for new item');
    
    // Scroll to bottom to show the new item (with a small delay to allow rendering)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []); // Remove categoryId dependency since it's stable from props

  // Helper function to get item field value based on field name from strategy config
  const getItemFieldValue = useCallback((item: Item, fieldName: string): string => {
    let value: string;
    
    switch (fieldName) {
      case 'ItemPrompt':
        value = item.type || 'Unknown Type';
        break;
      case 'Location':
        value = item.room || 'No Location';
        break;
      case 'Description':
        value = item.description || 'No Description';
        break;
      case 'Model':
        value = item.model || 'No Model';
        break;
      case 'Qty':
        value = item.quantity || '1';
        break;
      case 'Price':
        value = item.price || '0';
        break;
      case 'Notes':
        value = item.notes || 'No Notes';
        break;
      default:
        // Try to get the value directly from the item using the field name
        value = (item as any)[fieldName] || `Unknown ${fieldName}`;
        break;
    }
    
    return value;
  }, []);

  // Calculate and expose totals to parent component
  const calculateTotals = useCallback(() => {
    let itemCount = 0;
    let totalValue = 0;

    items.forEach(item => {
      const itemId = String(item.id);
      const editedItem = editItems[itemId];
      
      // Count item if it has been edited and has a quantity > 0, or if it's an original item with values
      const quantity = editedItem?.quantity ? parseInt(editedItem.quantity, 10) : parseInt(item.quantity || '1', 10);
      const price = editedItem?.price ? parseFloat(editedItem.price) : parseFloat(item.price || '0');
      
      // Include items that have been edited or have existing values
      if (editedItem || (quantity > 0 && price > 0)) {
        if (quantity > 0) {
          itemCount += 1;
          totalValue += (quantity * price) || 0;
        }
      }
    });

    return { itemCount, totalValue };
  }, [items, editItems]);

  // CONSOLIDATED USEEFFECT 1: Data Loading and Initialization
  // Handles: items-dependent operations, photos loading, pending count, camera permissions
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (!items.length) return;
      
      try {
        // Load pending changes count
        const count = await riskAssessmentSyncService.getPendingChangesCount();
        if (isMounted) setPendingChangesCount(count.total);
        

        
      } catch (error) {
        console.error('Error in data initialization:', error);
      }
    };
    
    // Request camera permissions (only once)
    const requestCameraPermissions = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission', 
          'Please grant camera permissions to take photos of items.',
          [{ text: 'OK' }]
        );
      }
    };
    
    // Run initialization
    initializeData();
    requestCameraPermissions();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [items]);

  // Check if an item has meaningful data captured
  const hasDataCaptured = useCallback((item: Item) => {
    const itemId = String(item.id);
    const editedItem = editItems[itemId];
    
    // Get current values (edited or original)
    const quantity = editedItem?.quantity ? parseInt(editedItem.quantity, 10) : parseInt(item.quantity || '1', 10);
    const price = editedItem?.price ? parseFloat(editedItem.price) : parseFloat(item.price || '0');
    const description = editedItem?.description || item.description || '';
    const model = editedItem?.model || item.model || '';
    const notes = editedItem?.notes || item.notes || '';
    
    // Has data if ANY meaningful field has a value:
    // - quantity different from default (1)
    // - price different from default (0) 
    // - description is not empty
    // - model is not empty
    // - notes is not empty
    return (quantity !== 1) || (price > 0) || (description && description.trim() !== '') || 
           (model && model.trim() !== '') || (notes && notes.trim() !== '');
  }, [editItems]);

  // Handle sync
  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');
    
    try {
      console.log('=== PREDEFINED ITEMS: STARTING SYNC PROCESS ===');
      console.log('Current predefined items state:', items.length, 'items');
      console.log('Current edit state:', Object.keys(editItems).length, 'items being edited');
      console.log('Auto-saved items:', Object.keys(autoSavedItems).length, 'items auto-saved');
      
      // Debug: Log all current predefined items
      console.log('=== ALL PREDEFINED ITEMS IN STATE ===');
      items.forEach((item, index) => {
        console.log(`Predefined Item ${index + 1}:`, {
          id: item.id,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          categoryId: item.categoryId
        });
      });
      
      const result = await riskAssessmentSyncService.syncPendingChanges();
      
      if (result.success) {
        setSyncStatus('success');
        if (result.synced && (result.synced.riskAssessmentItems > 0 || result.synced.appointments > 0 || result.synced.riskAssessmentMasters > 0)) {
          setSyncMessage(`Successfully synced ${result.synced.riskAssessmentItems} risk assessment items, ${result.synced.riskAssessmentMasters} assessments, and ${result.synced.appointments} appointments.`);
        } else {
          setSyncMessage(result.message || 'No pending changes to sync.');
        }
        
        // Clear auto-saved state and edit state after successful sync
        setAutoSavedItems({});
        setEditItems({});
        
        // Update pending count
        const count = await riskAssessmentSyncService.getPendingChangesCount();
        setPendingChangesCount(count.total);
        
        // Show success alert
        Alert.alert(
          'Sync Complete',
          result.message || `Successfully synced ${(result.synced?.riskAssessmentItems || 0) + (result.synced?.riskAssessmentMasters || 0) + (result.synced?.appointments || 0)} items to server.`,
          [{ text: 'OK' }]
        );
      } else {
        setSyncStatus('error');
        setSyncMessage(result.error || 'Sync failed');
        
        // Show error alert
        Alert.alert(
          'Sync Failed',
          result.error || 'Failed to sync changes to server. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Unexpected error during sync');
      console.error('Sync error:', error);
      
      Alert.alert(
        'Sync Error',
        'An unexpected error occurred during sync. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSyncing(false);
    }
  }, []);

  // CONSOLIDATED USEEFFECT 2: Parent Communication (Non-calculated values)
  // Handles: parent callbacks that don't depend on changing state
  useEffect(() => {
    // Expose addNewCustomItem function to parent (only when function changes)
    if (onAddNewItem) {
      console.log('PredefinedItemsList: Passing addNewCustomItem function to parent');
      onAddNewItem(addNewCustomItem);
    }
    
    // Expose sync function to parent (only when function changes)
    if (onSyncRequest) {
      onSyncRequest(handleSync);
    }
  }, [onAddNewItem, addNewCustomItem, onSyncRequest, handleSync]);

  // SEPARATE USEEFFECT 3: Sync Status Updates
  // Handles: sync status changes (less frequent)
  useEffect(() => {
    if (onSyncStatusChange) {
      onSyncStatusChange(pendingChangesCount, syncing);
    }
  }, [onSyncStatusChange, pendingChangesCount, syncing]);

  // SEPARATE USEEFFECT 4: Totals Calculation
  // Handles: totals calculation (debounced to prevent excessive calls)
  useEffect(() => {
    if (onTotalsChange) {
      // Debounce the totals calculation to prevent excessive parent updates
      const timeoutId = setTimeout(() => {
        const { itemCount, totalValue } = calculateTotals();
        onTotalsChange(itemCount, totalValue);
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [onTotalsChange, items, editItems]); // Only depend on the actual data, not the function

  // SEPARATE USEEFFECT 5: Focus Restoration After Auto-Save
  // Handles: restoring focus to the correct field after ID changes during auto-save
  useEffect(() => {
    if (pendingFocusRestore) {
      console.log('🔧 Attempting to restore focus to:', pendingFocusRestore.fieldName, 'for item:', pendingFocusRestore.newItemId);
      
      // Small delay to ensure the DOM has updated with the new ID
      const timeoutId = setTimeout(() => {
        try {
          // Try to find the input field using a data attribute or similar
          // We'll use a more specific selector based on the field name and item ID
          const inputSelector = `input[data-item-id="${pendingFocusRestore.newItemId}"][data-field="${pendingFocusRestore.fieldName}"]`;
          const inputElement = document.querySelector(inputSelector) as HTMLInputElement;
          
          if (inputElement) {
            inputElement.focus();
            console.log('🔧 Successfully restored focus to:', pendingFocusRestore.fieldName);
          } else {
            console.log('🔧 Could not find input element to restore focus:', inputSelector);
          }
        } catch (error) {
          console.error('🔧 Error restoring focus:', error);
        } finally {
          // Clear the pending focus restoration
          setPendingFocusRestore(null);
        }
      }, 100); // 100ms delay for DOM update
      
      return () => clearTimeout(timeoutId);
    }
  }, [pendingFocusRestore]);



  // Handle editing a field - updated for dynamic fields
  const handleEdit = (id: string, field: string, value: string) => {
    console.log(`🔧 Editing field "${field}" for item ${id}:`, value);
    
    // Track the currently focused field for focus restoration after auto-save
    setFocusedField({ itemId: id, fieldName: field });
    
    setEditItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));

    // Validate the field if we have dynamic field configuration
    if (dynamicFieldConfig && dynamicFieldConfig.length > 0) {
      const fieldConfig = dynamicFieldConfig.find(f => f.item_fields === field);
      if (fieldConfig) {
        const error = ValidationService.validateField(fieldConfig, value);
        
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[id]) newErrors[id] = [];
          
          // Remove existing error for this field
          newErrors[id] = newErrors[id].filter(e => e.fieldName !== field);
          
          // Add new error if validation failed
          if (error) {
            newErrors[id].push(error);
          }
          
          // Clean up if no errors for this item
          if (newErrors[id].length === 0) {
            delete newErrors[id];
          }
          
          return newErrors;
        });
      }
    }
  };

  // Auto-save function that saves changes to SQLite
  const autoSaveItem = async (id: string) => {
    const changes = editItems[id];
    if (!changes) {
      console.log('❌ No changes to save for item:', id);
      return; // No changes to save
    }

    try {
      const item = items.find(i => String(i.id) === id);
      if (!item) {
        console.log('❌ No item found for ID:', id);
        return;
      }

      console.log('🔥 === PREDEFINED ITEMS: Auto-saving item ===');
      console.log('🆔 Item ID:', id);
      console.log('📝 Changes being saved:', JSON.stringify(changes, null, 2));
      console.log('🏷️ Type being saved:', changes.type);
      console.log('📋 Original item:', JSON.stringify(item, null, 2));

      const isNewItem = id.startsWith('custom-new-') || id.startsWith('duplicate-');
      let sqliteId: string = id; // Default to original ID
      
      if (isNewItem) {
        // Handle new custom items - insert them into SQLite
        console.log('Inserting new custom item into SQLite');
        
        // For new items, require at least the type to be filled
        if (!changes.type || changes.type.trim() === '') {
          console.log('New item requires type field - skipping save');
          return;
        }
        
        // Check if this is the first time the type is being saved (i.e., item creation)
        const isFirstTypeSave = !item.type || item.type.trim() === '';
        
        const { insertRiskAssessmentItem } = await import('../../../../utils/db');
        
        console.log('🗄️ CREATING SQLITE RECORD - Input data:');
        console.log('🗄️ Original item:', item);
        console.log('🗄️ Changes:', changes);
        console.log('🗄️ Room field - item.room:', item.room, 'changes.room:', changes.room);
        console.log('🗄️ Type field - item.type:', item.type, 'changes.type:', changes.type);
        
        // Create a new SQLite record for the custom item
        const newSqliteItem = {
          riskassessmentitemid: Date.now(), // Use timestamp as unique ID
          riskassessmentcategoryid: Number(item.categoryId) || 0,
          itemprompt: changes.type || item.type || '',
          itemtype: 1, // Custom item type
          rank: 0,
          commaseparatedlist: '',
          selectedanswer: '',
          qty: Number(changes.quantity) || Number(item.quantity) || 1,
          price: Number(changes.price) || Number(item.price) || 0,
          description: changes.description || item.description || '',
          model: changes.model || item.model || '',
          location: changes.room || item.room || '',
          assessmentregisterid: 0,
          assessmentregistertypeid: 0,
          datecreated: new Date().toISOString(),
          createdbyid: '',
          dateupdated: new Date().toISOString(),
          updatedbyid: '',
          issynced: 0,
          syncversion: 0,
          deviceid: '',
          syncstatus: '',
          synctimestamp: new Date().toISOString(),
          hasphoto: 0,
          latitude: 0,
          longitude: 0,
          notes: changes.notes || item.notes || '',
          pending_sync: 1 // Mark for sync
        };
        
        console.log('🗄️ SQLITE RECORD FINAL VALUES:');
        console.log('🗄️ itemprompt (type):', `"${newSqliteItem.itemprompt}"`);
        console.log('🗄️ location (room):', `"${newSqliteItem.location}"`);
        console.log('🗄️ description:', `"${newSqliteItem.description}"`);
        console.log('🗄️ model:', `"${newSqliteItem.model}"`);
        
        console.log('🗄️ SQLite record being created:');
        console.log('🆔 riskassessmentitemid:', newSqliteItem.riskassessmentitemid);
        console.log('🏷️ itemprompt (type):', `"${newSqliteItem.itemprompt}"`);
        console.log('📋 Full record:', JSON.stringify(newSqliteItem, null, 2));
        
        await insertRiskAssessmentItem(newSqliteItem);
        
        // Use the SQLite ID we already set
        sqliteId = String(newSqliteItem.riskassessmentitemid);
        console.log('Item saved to SQLite with ID:', sqliteId);
        console.log('Item details:', { 
          id: sqliteId, 
          type: newSqliteItem.itemprompt, 
          categoryId: newSqliteItem.riskassessmentcategoryid 
        });
        
        // Update local items state to reflect the saved changes immediately
        setItems(prevItems => {
          const updatedItems = prevItems.map(prevItem => 
            prevItem.id === id ? {
              ...prevItem,
              id: sqliteId,
              type: changes.type || prevItem.type || '',
              quantity: String(changes.quantity || prevItem.quantity || 1),
              price: String(changes.price || prevItem.price || 0),
              description: changes.description || prevItem.description || '',
              model: changes.model || prevItem.model || '',
              room: changes.room || prevItem.room || '',
              notes: changes.notes || prevItem.notes || ''
            } : prevItem
          );
          
          console.log('🔄 Items state updated after auto-save:');
          console.log('🔄 Old ID:', id, '→ New ID:', sqliteId);
          console.log('🔄 Updated items count:', updatedItems.length);
          
          // Find the updated item for debugging
          const updatedItem = updatedItems.find(item => item.id === sqliteId);
          if (updatedItem) {
            console.log('🔄 Updated item details:', {
              id: updatedItem.id,
              type: updatedItem.type,
              description: updatedItem.description,
              model: updatedItem.model,
              room: updatedItem.room
            });
          }
          
          return updatedItems;
        });
        
        // Update edit items with new ID
        setEditItems(prev => {
          const newEditItems = { ...prev };
          if (newEditItems[id]) {
            newEditItems[sqliteId] = newEditItems[id];
            delete newEditItems[id];
          }
          return newEditItems;
        });
        
        // Update expanded item if needed
        if (expandedItem === id) {
          setExpandedItem(sqliteId);
        }
        
        // Handle focus restoration for the field that was being edited
        if (focusedField && focusedField.itemId === id) {
          console.log('🔧 Setting up focus restoration:', focusedField.fieldName, 'for new ID:', sqliteId);
          setPendingFocusRestore({ newItemId: sqliteId, fieldName: focusedField.fieldName });
          setFocusedField(null); // Clear the old focus state
        }
        
        // For nested grouping, ensure secondary group expansion is maintained
        if (isNestedGrouping(groupedItems)) {
          const strategyConfig = groupingStrategy?.strategy_config;
          let parsedConfig: any = null;
          try {
            parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
          } catch (error) {
            parsedConfig = null;
          }
          
          if (parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group) {
            // Create a temporary updated item with the changes applied to get correct grouping values
            const updatedItemForGrouping = {
              ...item,
              type: changes.type ?? item.type,
              description: changes.description ?? item.description,
              model: changes.model ?? item.model,
              room: changes.room ?? item.room,
              quantity: changes.quantity ?? item.quantity,
              price: changes.price ?? item.price,
              notes: changes.notes ?? item.notes
            };
            
            // Find which groups this item belongs to using the updated values
            const primaryValue = getItemFieldValue(updatedItemForGrouping, parsedConfig.primary_group);
            const secondaryValue = getItemFieldValue(updatedItemForGrouping, parsedConfig.secondary_group);
            
            console.log('🔄 Maintaining group expansion after ID change:');
            console.log('🔄 Primary:', primaryValue, 'Secondary:', secondaryValue);
            console.log('🔄 Updated item for grouping:', updatedItemForGrouping);
            
            // Ensure primary group stays expanded
            setExpandedGroup(primaryValue);
            
            // Ensure secondary group stays expanded
            const secondaryCompositeKey = `${primaryValue}::${secondaryValue}`;
            setExpandedSecondaryGroups(prev => ({
              ...prev,
              [secondaryCompositeKey]: true
            }));
          }
        }
        
        console.log('New custom item inserted successfully with ID:', sqliteId);
        
        // Keep the edit state active so user can continue editing
        // Don't clear edit state - let user continue editing
        console.log('New custom item saved successfully - keeping edit state active for continued editing');
        
      } else {
        // Handle existing items - update them in SQLite
        const existingItems = await getAllRiskAssessmentItems();
        const existingItem = existingItems.find(dbItem => 
          String(dbItem.riskassessmentitemid) === String(item.id)
        );

        if (!existingItem) {
          console.error('No existing SQLite record found for predefined item:', id);
          return;
        }
        
        // Preserve existing data and only update changed fields (like ItemComponents.tsx)
        const updated: RiskAssessmentItem = {
          ...existingItem,  // Preserve all existing database fields
          itemprompt: changes.type ?? existingItem.itemprompt ?? '',
          qty: Number(changes.quantity ?? existingItem.qty) || 1,
          price: Number(changes.price ?? existingItem.price) || 0,
          description: changes.description ?? existingItem.description ?? '',
          model: changes.model ?? existingItem.model ?? '',
          location: changes.room ?? existingItem.location ?? '',
          notes: changes.notes ?? existingItem.notes ?? '',
          pending_sync: 1,
          issynced: 0,
          dateupdated: new Date().toISOString(),
        };
        
        await updateRiskAssessmentItem(updated);
        
                    // Update local items state immediately after database update (following ItemsTable pattern)
            // This ensures UI shows the saved changes even after sync completes
            setItems(prevItems => 
              prevItems.map(prevItem => 
                String(prevItem.id) === id ? {
                  ...prevItem,
                  type: updated.itemprompt || '',
                  quantity: String(updated.qty || 1),
                  price: String(updated.price),
                  description: updated.description || '',
                  model: updated.model || '',
                  room: updated.location || '',
                  notes: updated.notes || ''
                } : prevItem
              )
            );
      }

      // Mark as auto-saved but keep the changes visible
      // For new items, use the new SQLite ID if it was created
      const finalId = (isNewItem && sqliteId) ? sqliteId : id;
      setAutoSavedItems(prev => ({ ...prev, [finalId]: true }));

      // Update pending changes count immediately after database update
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingChangesCount(count.total);

      console.log('=== PREDEFINED ITEMS: Auto-save completed successfully ===');
      console.log('Item ID:', id);
      console.log('Changes applied:', JSON.stringify(changes, null, 2));
    } catch (error) {
      console.error('Auto-save failed for predefined item:', id, error);
    }
  };

  // Photo functions
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: undefined,
        quality: 1.0, // Full quality for high-value art
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true
      });
      
      if (!result.canceled && currentPhotoItemId) {
        const photoUri = result.assets[0].uri;
        
        // Save photo using media service
        const mediaFile = await mediaService.savePhoto(
          photoUri, 
          'riskAssessmentItem', 
          Number(currentPhotoItemId),
          {
            category: 'predefined-item',
            timestamp: new Date().toISOString(),
            exif: result.assets[0].exif
          }
        );

        // Update the item to indicate it has a photo - use same pattern as ItemComponents.tsx
        const itemToUpdate = items.find(i => String(i.id) === currentPhotoItemId);
        if (itemToUpdate) {
          // Get existing SQLite record to preserve all fields
          const existingItems = await getAllRiskAssessmentItems();
          const existingItem = existingItems.find(dbItem => 
            String(dbItem.riskassessmentitemid) === String(itemToUpdate.id)
          );

          if (existingItem) {
            const updated: RiskAssessmentItem = {
              ...existingItem,  // Preserve all existing database fields
              hasphoto: 1,
              pending_sync: 1,
              issynced: 0,
              dateupdated: new Date().toISOString()
            };
            
            await updateRiskAssessmentItem(updated);
            
            // Update pending changes count after database update
            const count = await riskAssessmentSyncService.getPendingChangesCount();
            setPendingChangesCount(count.total);
          }
        }

        // Reload photos for this item to update the UI immediately (same as selectFromGallery)
        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
        
        Alert.alert('Success', 'Photo saved successfully!');
      }
      
      setShowCamera(false);
      // If we're adding another photo, reopen gallery
      // Otherwise clear currentPhotoItemId
      if (addingAnotherPhoto) {
        setShowPhotoGallery(true);
        setAddingAnotherPhoto(false);
      } else {
        setCurrentPhotoItemId(null);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };
  
  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        aspect: undefined,
        quality: 1.0, // Full quality for high-value art
        mediaTypes: ImagePicker.MediaTypeOptions.Images
      });
      
      if (!result.canceled && currentPhotoItemId) {
        const photoUri = result.assets[0].uri;
        
        // Save photo using media service
        const mediaFile = await mediaService.savePhoto(
          photoUri, 
          'riskAssessmentItem', 
          Number(currentPhotoItemId),
          {
            category: 'predefined-item',
            timestamp: new Date().toISOString(),
            source: 'gallery'
          }
        );

        // Update the item to indicate it has a photo - use same pattern as ItemComponents.tsx
        const itemToUpdate = items.find(i => String(i.id) === currentPhotoItemId);
        if (itemToUpdate) {
          // Get existing SQLite record to preserve all fields
          const existingItems = await getAllRiskAssessmentItems();
          const existingItem = existingItems.find(dbItem => 
            String(dbItem.riskassessmentitemid) === String(itemToUpdate.id)
          );

          if (existingItem) {
            const updated: RiskAssessmentItem = {
              ...existingItem,  // Preserve all existing database fields
              hasphoto: 1,
              pending_sync: 1,
              issynced: 0,
              dateupdated: new Date().toISOString()
            };
            
            await updateRiskAssessmentItem(updated);
            
            // Update pending changes count after database update
            const count = await riskAssessmentSyncService.getPendingChangesCount();
            setPendingChangesCount(count.total);
          }
        }

        // Reload photos for this item (silent)
        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
        
        Alert.alert('Success', 'Photo saved successfully!');
      }
      
      setShowCamera(false);
      // If we're adding another photo, reopen gallery
      // Otherwise clear currentPhotoItemId
      if (addingAnotherPhoto) {
        setShowPhotoGallery(true);
        setAddingAnotherPhoto(false);
      } else {
        setCurrentPhotoItemId(null);
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleTakePhoto = (itemId: string) => {
    setCurrentPhotoItemId(itemId);
    setShowCamera(true);
  };

  const handleViewPhotos = (itemId: string) => {
    const photos = itemPhotos[itemId] || [];
    if (photos.length === 0) {
      // If no photos, directly open camera
      handleTakePhoto(itemId);
      return;
    }
    
    setCurrentPhotoItemId(itemId);
    setShowPhotoGallery(true);
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await mediaService.deletePhoto(photoId);
      
      // Reload photos for the affected item (silent)
      if (currentPhotoItemId) {
        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
      }
      
      // Update pending changes count
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingChangesCount(count.total);
      
      Alert.alert('Success', 'Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  };

  const toggleExpansion = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const toggleGroupExpansion = (groupKey: string) => {
    const isCurrentlyExpanded = expandedGroup === groupKey;
    setExpandedGroup(isCurrentlyExpanded ? null : groupKey);
    
    // When expanding a group, also expand all items in that group
    // When collapsing a group, collapse all items in that group
    if (!isCurrentlyExpanded) {
      // Expanding: auto-expand all items in this group
      if (isNestedGrouping(groupedItems)) {
        // For nested grouping, don't auto-expand individual items
        // Let user choose which secondary group to expand
      } else {
        // For flat grouping, check if there's only one item to auto-expand
        const flatGroups = groupedItems as FlatGroups;
        const groupItems = flatGroups[groupKey] || [];
      if (groupItems.length === 1) {
        // If only one item, expand it immediately
        setExpandedItem(groupItems[0].id);
      }
      // For multiple items, let user choose which one to expand
      }
    } else {
      // Collapsing: collapse any expanded item
      setExpandedItem(null);
    }
  };

  // Function to duplicate an item with the same itemprompt - moved after groupedItems definition

  // Function to delete an item
  const deleteItem = useCallback(async (itemToDelete: Item) => {
    const itemId = String(itemToDelete.id);
    
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete this item?${itemToDelete.type ? `\n\nItem: ${itemToDelete.type}` : ''}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting item:', itemId);
              
              // If it's not a new item, mark it as deleted in the database
              if (!itemToDelete.id.startsWith('custom-new-') && !itemToDelete.id.startsWith('duplicate-')) {
                // Get existing SQLite record
                const existingItems = await getAllRiskAssessmentItems();
                const existingItem = existingItems.find(dbItem => 
                  String(dbItem.riskassessmentitemid) === String(itemToDelete.id)
                );

                if (existingItem) {
                  // Mark as deleted and pending sync
                  const updated: RiskAssessmentItem = {
                    ...existingItem,
                    qty: 0, // Set quantity to 0 to effectively "delete"
                    price: 0, // Clear price
                    description: '', // Clear description
                    model: '', // Clear model
                    location: '', // Clear location
                    notes: '', // Clear notes
                    pending_sync: 1,
                    issynced: 0,
                    dateupdated: new Date().toISOString(),
                  };
                  
                  await updateRiskAssessmentItem(updated);
                  
                  // Update pending changes count
                  const count = await riskAssessmentSyncService.getPendingChangesCount();
                  setPendingChangesCount(count.total);
                }
              }
              
              // Remove from local state
              setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
              
              // Clear any edit state for this item
              setEditItems(prev => {
                const newEditItems = { ...prev };
                delete newEditItems[itemId];
                return newEditItems;
              });
              
              // Clear auto-saved state
              setAutoSavedItems(prev => {
                const newAutoSaved = { ...prev };
                delete newAutoSaved[itemId];
                return newAutoSaved;
              });
              
              // If this item was expanded, collapse it
              if (expandedItem === itemId) {
                setExpandedItem(null);
              }
              
              console.log('Item deleted successfully:', itemId);
              
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert(
                'Delete Failed',
                'Failed to delete the item. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [expandedItem]);

  // Helper function to scroll to a specific item by finding its group
  const scrollToItem = (itemId: string) => {
    console.log(`🎯 Navigating to item: ${itemId}`);
    
    // Group items by type
    const grouped = items.reduce((acc, item) => {
      const type = item.type || 'Unknown Items';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {} as Record<string, Item[]>);

    // Find the target item and its group
    let targetGroup = '';
    let foundItem: Item | null = null;

    for (const [groupName, groupItems] of Object.entries(grouped)) {
      const item = groupItems.find(i => String(i.id) === itemId);
      if (item) {
        targetGroup = groupName;
        foundItem = item;
        break;
      }
    }

    if (!foundItem) {
      console.warn(`❌ Item ${itemId} not found in any group`);
      return;
    }

    console.log(`✅ Found item in group: ${targetGroup}`);
    
    // Expand the group and highlight the item
    setExpandedGroup(targetGroup);
    setExpandedItem(itemId);

    // Scroll to the appropriate position
    setTimeout(() => {
      if (scrollViewRef.current) {
        // For items at the end of the list, scroll to the bottom
        if (targetGroup === 'Unknown Items' || Object.keys(grouped).indexOf(targetGroup) >= Object.keys(grouped).length - 2) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        } else {
          // For items at the top, scroll to the top
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }
    }, 100);
  };

  // Helper function to render dynamic fields based on configuration respecting display_order
  const renderDynamicFields = useCallback((itemId: string, editData: any) => {
    console.log('🎨 renderDynamicFields called:', {
      itemId,
      dynamicFieldConfigLength: dynamicFieldConfig?.length || 0,
      useCustomFields,
      hasEditData: !!editData && Object.keys(editData).length > 0
    });
    
    if (!dynamicFieldConfig || dynamicFieldConfig.length === 0) {
      console.log('🎨 Falling back to legacy fields - no dynamic config available');
      // Fall back to legacy hardcoded fields
      return renderLegacyFields(itemId, editData);
    }
    
    console.log('🎨 Using dynamic fields - config available:', dynamicFieldConfig.length, 'fields');

    const item = items.find(i => String(i.id) === itemId);
    if (!item) return null;

    const itemErrors = validationErrors[itemId] || [];
    
    // Determine which fields are being used for grouping and should be excluded from editing
    const getGroupingFields = (): string[] => {
      console.log('🔧 DEBUG getGroupingFields - groupingStrategy:', JSON.stringify(groupingStrategy, null, 2));
      
      // Default to 'by_type' even when no grouping strategy is provided (matches the grouping logic)
      const defaultStrategy = groupingStrategy?.strategy_type || 'by_type';
      console.log('🔧 Effective grouping strategy:', defaultStrategy);
      
      if (!groupingStrategy) {
        console.log('🔧 No groupingStrategy found, but defaulting to exclude "type" field for by_type grouping');
        return ['type']; // Default exclusion for by_type grouping
      }
      
      const fields: string[] = [];
      const effectiveGroupingStrategy = groupingStrategy.strategy_type || 'by_type';
      console.log('🔧 Effective grouping strategy:', effectiveGroupingStrategy);
      
      // Handle 2-tier grouping
      const strategyConfig = groupingStrategy.strategy_config;
      let parsedConfig: any = null;
      try {
        parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
      } catch (error) {
        parsedConfig = null;
      }
      
      if (parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group) {
        // 2-tier grouping: exclude both primary and secondary fields
        const primaryFieldMap: { [key: string]: string } = {
          'ItemPrompt': 'type',
          'Location': 'room',
          'Model': 'model',
          'Price': 'price'
        };
        const secondaryFieldMap: { [key: string]: string } = {
          'ItemPrompt': 'type',
          'Location': 'room', 
          'Model': 'model',
          'Price': 'price'
        };
        
        if (primaryFieldMap[parsedConfig.primary_group]) fields.push(primaryFieldMap[parsedConfig.primary_group]);
        if (secondaryFieldMap[parsedConfig.secondary_group]) fields.push(secondaryFieldMap[parsedConfig.secondary_group]);
      } else {
        // Single-tier grouping
        console.log('🔧 Using single-tier grouping strategy:', effectiveGroupingStrategy);
        switch (effectiveGroupingStrategy) {
          case 'by_type':
            console.log('🔧 Adding "type" field to exclusion list');
            fields.push('type'); // ItemPrompt field
            break;
          case 'by_location':
            console.log('🔧 Adding "room" field to exclusion list');
            fields.push('room'); // Location field
            break;
          case 'by_brand':
            console.log('🔧 Adding "model" field to exclusion list');
            fields.push('model'); // Model field
            break;
          case 'by_value_range':
            console.log('🔧 Adding "price" field to exclusion list');
            fields.push('price'); // Price field
            break;
          default:
            console.log('🔧 Unknown grouping strategy, no fields excluded');
        }
      }
      
      console.log('🔧 Final exclusion fields array:', fields);
      return fields;
    };
    
    const groupingFields = getGroupingFields();
    console.log('🔧 Grouping fields to exclude from editing:', groupingFields);
    console.log('🔧 Available dynamic fields BEFORE filtering:');
    dynamicFieldConfig.forEach((field, index) => {
      console.log(`  [${index}] item_fields: "${field.item_fields}", field_label: "${field.field_label}", display_on_ui: ${field.display_on_ui}`);
    });

    // Get visible fields, exclude grouping fields, and sort by display_order
    const visibleFieldsBeforeGroupingFilter = dynamicFieldConfig
      .filter(field => field.display_on_ui === 1);
    
    console.log('🔧 Visible fields BEFORE grouping filter:', visibleFieldsBeforeGroupingFilter.map(f => f.item_fields));
    
    const visibleFields = visibleFieldsBeforeGroupingFilter
      .filter(field => !groupingFields.includes(field.item_fields)) // Exclude grouping fields
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    console.log('🔧 Visible fields AFTER grouping filter:', visibleFields.map(f => f.item_fields));
    console.log('🔧 Dynamic fields render order (excluding grouping):', visibleFields.map(f => `${f.item_fields}(${f.display_order})`).join(', '));

    const renderField = (field: any) => {
      const fieldName = field.item_fields;
      
      // Get current value with proper fallback to original item values
      const getFieldValue = (fieldName: string) => {
        if (editData[fieldName] !== undefined) return editData[fieldName];
        
        // Fallback to original item values
        switch (fieldName) {
          case 'quantity': return String(item.quantity || '1');
          case 'price': return (item.price && String(item.price) !== '0') ? String(item.price) : '';
          case 'description': return item.description || '';
          case 'model': return item.model || '';
          case 'room': return item.room || '';
          case 'notes': return item.notes || '';
          case 'type': return item.type || '';
          default: return '';
        }
      };
      
      const currentValue = getFieldValue(fieldName);
      const fieldError = itemErrors.find(e => e.fieldName === fieldName);
      
      return (
        <View key={fieldName} style={[
          styles.dynamicFieldContainer,
          field.field_type === 'notes' ? { width: '100%' } : { flex: 1 }
        ]}>
          <Text style={styles.detailLabel}>{field.field_label}:</Text>
          <DynamicFieldRenderer
            field={field}
            value={currentValue}
            onChange={(fieldName, value) => handleEdit(itemId, fieldName, value)}
            validationError={fieldError}
            handwritingEnabled={false}
            onOpenHandwriting={() => {}}
            itemId={itemId}
            itemPhotos={itemPhotos}
            onTakePhoto={handleViewPhotos}
            hideLabel={true}
            onBlur={() => autoSaveItem(itemId)}
            // Add data attributes for focus restoration
            dataAttributes={{
              'data-item-id': itemId,
              'data-field': fieldName
            }}
          />
        </View>
      );
    };

    const isNewItem = item.id.toString().startsWith('custom-new-');

    // Group fields into rows for 2-column layout (except notes which is full width)
    const fieldRows: any[][] = [];
    let currentRow: any[] = [];
    
    visibleFields.forEach((field) => {
      // Notes and textarea fields get their own full-width row
      if (field.field_type === 'notes' || field.field_type === 'textarea') {
        // If current row has content, push it first
        if (currentRow.length > 0) {
          fieldRows.push([...currentRow]);
          currentRow = [];
        }
        // Add notes as a single-field row
        fieldRows.push([field]);
      } else {
        // Add to current row
        currentRow.push(field);
        // If current row is full (2 fields), start a new row
        if (currentRow.length === 2) {
          fieldRows.push([...currentRow]);
          currentRow = [];
        }
      }
    });
    
    // Add any remaining fields in the current row
    if (currentRow.length > 0) {
      fieldRows.push(currentRow);
    }

    return (
      <>
        {/* Show type field for new custom items */}
        {isNewItem && (
          <View style={styles.detailRow}>
            <View style={[styles.detailItem, { flex: 2 }]}>
              <Text style={styles.detailLabel}>Item Type (Required):</Text>
              <PaperTextInput
                value={editData.type ?? (item.type || '')}
                onChangeText={(value) => handleEdit(itemId, 'type', value)}
                onBlur={() => autoSaveItem(itemId)}
                style={[styles.editInput, { borderColor: editData.type ? '#e0e0e0' : '#f44336' }]}
                dense
                placeholder="Enter item type (e.g., 'Painting', 'Furniture', etc.)"
                autoFocus={true}
              />
            </View>
          </View>
        )}
        
        {/* Render fields in order based on display_order */}
        {fieldRows.map((rowFields, rowIndex) => (
          <View key={rowIndex} style={[
            rowFields.length === 1 && (rowFields[0].field_type === 'notes' || rowFields[0].field_type === 'textarea')
              ? styles.notesSection
              : styles.detailRow
          ]}>
            {rowFields.map(field => renderField(field))}
          </View>
        ))}
      </>
    );
  }, [dynamicFieldConfig, validationErrors, handleEdit, items, itemPhotos, handleViewPhotos, autoSaveItem, groupingStrategy]);

  // Helper function to check if a field should be visible
  const isFieldVisible = useCallback((fieldName: string) => {
    console.log(`🔍 === FIELD VISIBILITY CHECK FOR '${fieldName}' ===`);
    console.log(`🔍 useCustomFields: ${useCustomFields}`);
    console.log(`🔍 dynamicFieldConfig length: ${dynamicFieldConfig?.length || 0}`);
    console.log(`🔍 dynamicFieldConfig:`, JSON.stringify(dynamicFieldConfig, null, 2));
    
    // Try dynamic field configuration first
    if (dynamicFieldConfig && dynamicFieldConfig.length > 0) {
      console.log(`🔍 Searching for field '${fieldName}' in dynamic config...`);
      
      // Show all available fields
      dynamicFieldConfig.forEach((field, index) => {
        console.log(`  [${index}] item_fields: "${field.item_fields}", display_on_ui: ${field.display_on_ui}`);
      });
      
      const fieldConfig = dynamicFieldConfig.find(f => f.item_fields === fieldName);
      const isVisible = fieldConfig && fieldConfig.display_on_ui === 1;
      
      console.log(`🔍 Found field config:`, fieldConfig || 'NOT FOUND');
      console.log(`🔍 Field '${fieldName}': ${isVisible ? 'VISIBLE' : 'HIDDEN'} (dynamic config)`);
      console.log(`🔍 === END FIELD VISIBILITY CHECK ===`);
      return isVisible;
    }
    
    // Fall back to legacy field configuration
    if (!useCustomFields || !fieldConfig || fieldConfig.length === 0) {
      // No custom configuration, show all fields
      console.log(`Field '${fieldName}': visible (no custom config) - useCustomFields: ${useCustomFields}, fieldConfig: ${fieldConfig ? `array[${fieldConfig.length}]` : 'null/undefined'}`);
      return true;
    }
    
    // Map UI field names to API field names (legacy mapping)
    const fieldNameMapping: { [key: string]: string } = {
      'description': 'Description',
      'model': 'Model',
      'quantity': 'Qty',
      'price': 'Price',
      'room': 'Location',
      'notes': 'Notes',
      'photos': 'HasPhoto'
    };
    
    const apiFieldName = fieldNameMapping[fieldName.toLowerCase()];
    if (!apiFieldName) {
      console.log(`Field '${fieldName}': hidden (no mapping found for field name)`);
      return false;
    }
    
    // Check if the field name exists in the fieldConfig array and has display_on_ui = 1
    const fieldConfigItem = fieldConfig.find((config: any) => 
      config.item_fields && config.item_fields.toLowerCase() === apiFieldName.toLowerCase()
    );
    
    if (!fieldConfigItem) {
      console.log(`Field '${fieldName}': hidden (API field '${apiFieldName}' not found in field configuration)`);
      return false;
    }
    
    const isVisible = fieldConfigItem.display_on_ui === 1;
    console.log(`Field '${fieldName}': ${isVisible ? 'visible' : 'hidden'} (API field: '${apiFieldName}', display_on_ui=${fieldConfigItem.display_on_ui})`);
    return isVisible;
  }, [useCustomFields, fieldConfig, dynamicFieldConfig]);

  // Legacy hardcoded field renderer (kept for backward compatibility)
  const renderLegacyFields = useCallback((itemId: string, editData: any) => {
    console.log('🏠 renderLegacyFields called for item:', itemId);
    const item = items.find(i => String(i.id) === itemId);
    if (!item) return null;

    const isNewItem = item.id.startsWith('custom-new-');
    const type = editData.type ?? (item.type || '');
    const quantity = editData.quantity ?? String(item.quantity || '1');
    const price = editData.price ?? ((item.price && String(item.price) !== '0') ? String(item.price) : '');
    const description = editData.description ?? (item.description || '');
    const model = editData.model ?? (item.model || '');
    const room = editData.room ?? (item.room || '');
    const notes = editData.notes ?? (item.notes || '');

    return (
      <>
        {/* Show type field for new custom items (not duplicates) */}
        {isNewItem && (
          <View style={styles.detailRow}>
            <View style={[styles.detailItem, { flex: 2 }]}>
              <Text style={styles.detailLabel}>Item Type (Required):</Text>
              <PaperTextInput
                value={type}
                onChangeText={(value) => handleEdit(itemId, 'type', value)}
                onBlur={() => autoSaveItem(itemId)}
                style={[styles.editInput, { borderColor: type ? '#e0e0e0' : '#f44336' }]}
                dense
                placeholder="Enter item type (e.g., 'Painting', 'Furniture', etc.)"
                autoFocus={true}
              />
            </View>
          </View>
        )}
        
        <View style={styles.detailRow}>
          {isFieldVisible('description') && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Description:</Text>
              <PaperTextInput
                value={description}
                onChangeText={(value) => handleEdit(itemId, 'description', value)}
                onBlur={() => autoSaveItem(itemId)}
                style={styles.editInput}
                dense
                placeholder="Enter description"
              />
            </View>
          )}
          {isFieldVisible('model') && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Model:</Text>
              <PaperTextInput
                value={model}
                onChangeText={(value) => handleEdit(itemId, 'model', value)}
                onBlur={() => autoSaveItem(itemId)}
                style={styles.editInput}
                dense
                placeholder="Enter model"
              />
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          {isFieldVisible('quantity') && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <PaperTextInput
                value={quantity}
                onChangeText={(value) => handleEdit(itemId, 'quantity', value)}
                onBlur={() => autoSaveItem(itemId)}
                keyboardType="numeric"
                style={styles.editInput}
                dense
                placeholder="1"
              />
            </View>
          )}
          {isFieldVisible('price') && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Price:</Text>
              <PaperTextInput
                value={price}
                onChangeText={(value) => handleEdit(itemId, 'price', value)}
                onBlur={() => autoSaveItem(itemId)}
                keyboardType="numeric"
                style={styles.editInput}
                dense
                placeholder="0.00"
                left={<PaperTextInput.Affix text="R" />}
              />
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          {isFieldVisible('room') && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Room:</Text>
              <PaperTextInput
                value={room}
                onChangeText={(value) => handleEdit(itemId, 'room', value)}
                onBlur={() => autoSaveItem(itemId)}
                style={styles.editInput}
                dense
                placeholder="Enter room/location"
              />
            </View>
          )}
          {isFieldVisible('photos') && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Photos:</Text>
              <View style={styles.photoSection}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => handleViewPhotos(itemId)}
                >
                  <MaterialCommunityIcons 
                    name={(itemPhotos[itemId]?.length || 0) > 0 ? "image-multiple" : "camera"} 
                    size={16} 
                    color="#4a90e2" 
                  />
                  <Text style={styles.photoButtonText}>
                    {(itemPhotos[itemId]?.length || 0) > 0 
                      ? `${itemPhotos[itemId]?.length || 0} photo${(itemPhotos[itemId]?.length || 0) !== 1 ? 's' : ''}`
                      : 'Take Photo'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {isFieldVisible('notes') && (
          <View style={styles.notesSection}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <PaperTextInput
              value={notes}
              onChangeText={(value) => handleEdit(itemId, 'notes', value)}
              onBlur={() => autoSaveItem(itemId)}
              style={styles.editInputMultiline}
              multiline
              numberOfLines={2}
              dense
              placeholder="Add notes..."
            />
          </View>
        )}
      </>
    );
  }, [items, isFieldVisible, handleEdit, autoSaveItem, itemPhotos, handleViewPhotos]);

  // Type for nested grouping structure
  interface NestedGroups {
    [primaryKey: string]: {
      [secondaryKey: string]: Item[]
    }
  }

  // Type for flat grouping structure
  interface FlatGroups {
    [key: string]: Item[]
  }

  // Union type for all possible grouping structures
  type GroupedItemsType = FlatGroups | NestedGroups;

  // Helper function to check if grouping is nested (2-tier)
  const isNestedGrouping = useCallback((groups: GroupedItemsType): groups is NestedGroups => {
    const strategyConfig = groupingStrategy?.strategy_config;
    let parsedConfig: any = null;
    try {
      parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
    } catch (error) {
      parsedConfig = null;
    }
    return parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group;
  }, [groupingStrategy]);

  // Helper function to toggle secondary group expansion
  const toggleSecondaryGroup = (primaryKey: string, secondaryKey: string) => {
    const compositeKey = `${primaryKey}::${secondaryKey}`;
    setExpandedSecondaryGroups(prev => ({
      ...prev,
      [compositeKey]: !prev[compositeKey]
    }));
  };

  // Helper function to check if secondary group is expanded
  const isSecondaryGroupExpanded = (primaryKey: string, secondaryKey: string): boolean => {
    const compositeKey = `${primaryKey}::${secondaryKey}`;
    return !!expandedSecondaryGroups[compositeKey];
  };

  // Group items by strategy configuration - supports both single-tier and 2-tier grouping
  // CRITICAL: We only depend on 'items', NOT 'editItems' to prevent re-grouping while user types
  const groupedItems = useMemo(() => {
    console.log('🔧 DEBUG: Full groupingStrategy object:', JSON.stringify(groupingStrategy, null, 2));
    
    // Determine grouping strategy - default to 'by_type' (itemprompt) if none configured
    const effectiveGroupingStrategy = groupingStrategy?.strategy_type || 'by_type';
    
    console.log('🔧 Grouping items using strategy:', effectiveGroupingStrategy);
    
    // Check if we have a 2-tier grouping strategy configured
    const strategyConfig = groupingStrategy?.strategy_config;
    console.log('🔧 Raw strategy config:', strategyConfig);
    console.log('🔧 Strategy type:', effectiveGroupingStrategy);
    
    // Handle both string (legacy) and object (new) types for strategy_config
    let parsedConfig: any = null;
    try {
      parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
    } catch (error) {
      console.warn('🔧 Error parsing strategy config:', error);
      parsedConfig = null;
    }
    
    const hasTwoTierGrouping = parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group;
    
    console.log('🔧 Parsed config:', parsedConfig);
    console.log('🔧 Has two-tier grouping:', hasTwoTierGrouping);
    
    if (hasTwoTierGrouping) {
      console.log('🔧 Using 2-tier grouping:', parsedConfig.primary_group, '->', parsedConfig.secondary_group);
    
      // Create nested structure for 2-tier grouping
      const nestedGroups: NestedGroups = {};
      
      items.forEach(item => {
        const primaryValue = getItemFieldValue(item, parsedConfig.primary_group);
        const secondaryValue = getItemFieldValue(item, parsedConfig.secondary_group);
        
        // Debug log for first few items
        if (items.indexOf(item) < 3) {
          console.log(`🔧 Item ${item.id}: Primary(${parsedConfig.primary_group})="${primaryValue}", Secondary(${parsedConfig.secondary_group})="${secondaryValue}"`);
        }
        
        if (!nestedGroups[primaryValue]) {
          nestedGroups[primaryValue] = {};
        }
        
        if (!nestedGroups[primaryValue][secondaryValue]) {
          nestedGroups[primaryValue][secondaryValue] = [];
        }
        
        nestedGroups[primaryValue][secondaryValue].push(item);
      });
      
      console.log('🔧 Items grouped into nested structure:', Object.keys(nestedGroups).length, 'primary groups');
      Object.entries(nestedGroups).forEach(([primary, secondary]) => {
        console.log(`🔧   ${primary}: ${Object.keys(secondary).length} secondary groups`);
      });
      
      return nestedGroups;
      } else {
      // Single-tier grouping (original logic) - return in compatible format
      const flatGroups: { [key: string]: Item[] } = {};
      
      items.forEach(item => {
        let groupKey: string;
        
        switch (effectiveGroupingStrategy) {
          case 'by_type':
          default:
            groupKey = item.type || 'Unknown Items';
            break;
          
          case 'by_location':
            groupKey = item.room || 'No Location';
            break;
          
          case 'by_brand':
            groupKey = item.model || 'No Brand';
            break;
          
          case 'by_value_range':
            const price = parseFloat(item.price) || 0;
            if (price === 0) groupKey = 'No Value';
            else if (price < 1000) groupKey = 'Under R1,000';
            else if (price < 5000) groupKey = 'R1,000 - R5,000';
            else if (price < 10000) groupKey = 'R5,000 - R10,000';
            else groupKey = 'Over R10,000';
            break;
          
          case 'custom':
            if (parsedConfig && parsedConfig.customField) {
              groupKey = (item as any)[parsedConfig.customField] || 'Other';
            } else {
              groupKey = item.type || 'Unknown Items';
            }
            break;
      }
      
        if (!flatGroups[groupKey]) {
          flatGroups[groupKey] = [];
      }
        flatGroups[groupKey].push(item);
    });
    
      console.log('🔧 Items grouped into', Object.keys(flatGroups).length, 'groups:', Object.keys(flatGroups));
    
      return flatGroups;
    }
  }, [items, groupingStrategy, getItemFieldValue]);

  // Function to duplicate an item with the same itemprompt
  const duplicateItem = useCallback((originalItem: Item) => {
    console.log('🔄 === DUPLICATE ITEM FUNCTION CALLED ===');
    console.log('🔄 Original item:', originalItem);
    console.log('🔄 Original item type:', originalItem.type);
    console.log('🔄 Current items count before duplication:', items.length);
    
    // For nested grouping, we need to preserve the grouping field values
    let duplicatedItem: Item;
    
    if (isNestedGrouping(groupedItems)) {
      const strategyConfig = groupingStrategy?.strategy_config;
      let parsedConfig: any = null;
      try {
        parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
      } catch (error) {
        parsedConfig = null;
      }
      
      // Create duplicated item starting with base values
      duplicatedItem = {
        id: `duplicate-${Date.now()}`,
        type: originalItem.type,
        description: '',
        model: '',
        quantity: '1',
        price: '',
        room: '',
        notes: '',
        categoryId: categoryId
      };
      
      // Preserve the specific fields that are used for grouping
      if (parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group) {
        const primaryField = parsedConfig.primary_group;
        const secondaryField = parsedConfig.secondary_group;
        
        // Map grouping field names to item property names
        const setGroupingValue = (fieldName: string, value: string) => {
          console.log('🔧 setGroupingValue called:', fieldName, '→', value);
          switch (fieldName) {
            case 'ItemPrompt':
              duplicatedItem.type = value;
              console.log('🔧 Set type to:', duplicatedItem.type);
              break;
            case 'Location':
              duplicatedItem.room = value;
              console.log('🔧 Set room to:', duplicatedItem.room);
              break;
            case 'Model':
              duplicatedItem.model = value;
              console.log('🔧 Set model to:', duplicatedItem.model);
              break;
            case 'Description':
              duplicatedItem.description = value;
              console.log('🔧 Set description to:', duplicatedItem.description);
              break;
            default:
              // Try to set the field directly
              (duplicatedItem as any)[fieldName] = value;
              console.log('🔧 Set', fieldName, 'to:', (duplicatedItem as any)[fieldName]);
              break;
          }
        };
        
        // Get and preserve the primary grouping field value
        const primaryValue = getItemFieldValue(originalItem, primaryField);
        console.log('🔄 PRIMARY VALUE EXTRACTION:', primaryField, 'from item:', originalItem, '→', primaryValue);
        setGroupingValue(primaryField, primaryValue);
        
        // Get and preserve the secondary grouping field value
        const secondaryValue = getItemFieldValue(originalItem, secondaryField);
        console.log('🔄 SECONDARY VALUE EXTRACTION:', secondaryField, 'from item:', originalItem, '→', secondaryValue);
        setGroupingValue(secondaryField, secondaryValue);
        
        console.log('🔄 Nested grouping - preserved field values:');
        console.log('🔄 Primary field:', primaryField, '=', primaryValue);
        console.log('🔄 Secondary field:', secondaryField, '=', secondaryValue);
        console.log('🔄 Final duplicated item BEFORE state update:', duplicatedItem);
        console.log('🔄 Duplicated item room value:', duplicatedItem.room);
        console.log('🔄 Duplicated item type value:', duplicatedItem.type);
      }
    } else {
      // For flat grouping, use the original logic
      duplicatedItem = {
        id: `duplicate-${Date.now()}`,
        type: originalItem.type, // Keep the same itemprompt
        description: '',
        model: '',
        quantity: '1',
        price: '',
        room: '',
        notes: '',
        categoryId: categoryId
      };
    }
    
    console.log('🔄 Duplicated item to be created:', duplicatedItem);
    
    // Add to local items state
    setItems(prevItems => {
      console.log('🔄 Adding duplicated item to items array, current count:', prevItems.length);
      const newItems = [...prevItems, duplicatedItem];
      console.log('🔄 New items array count:', newItems.length);
      return newItems;
    });
    
    // Handle group expansion based on grouping type
    if (isNestedGrouping(groupedItems)) {
      // For nested grouping, we need to find and maintain the primary and secondary group expansion
      const strategyConfig = groupingStrategy?.strategy_config;
      let parsedConfig: any = null;
      try {
        parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
      } catch (error) {
        parsedConfig = null;
      }
      
      if (parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group) {
        // Find which primary group contains this item
        const primaryValue = getItemFieldValue(originalItem, parsedConfig.primary_group);
        const secondaryValue = getItemFieldValue(originalItem, parsedConfig.secondary_group);
        
        console.log('🔄 Nested grouping - Primary:', primaryValue, 'Secondary:', secondaryValue);
        
        // Keep primary group expanded
        setExpandedGroup(primaryValue);
        
        // Keep secondary group expanded
        const secondaryCompositeKey = `${primaryValue}::${secondaryValue}`;
        setExpandedSecondaryGroups(prev => ({
          ...prev,
          [secondaryCompositeKey]: true
        }));
        
        console.log('🔄 Expanded primary group:', primaryValue);
        console.log('🔄 Expanded secondary group:', secondaryCompositeKey);
      }
    } else {
      // For flat grouping, use the original logic
      setExpandedGroup(originalItem.type);
      console.log('🔄 Expanded group set to:', originalItem.type);
    }
    
    // Immediately expand the new item for editing
    setExpandedItem(duplicatedItem.id);
    console.log('🔄 Expanded item set to:', duplicatedItem.id);
    
    // Set it as being edited - preserve the duplicated item's field values
    setEditItems(prev => {
      const editState = {
        type: duplicatedItem.type,
        description: duplicatedItem.description || '',
        model: duplicatedItem.model || '',
        quantity: duplicatedItem.quantity || '1',
        price: duplicatedItem.price || '',
        room: duplicatedItem.room || '', // Preserve the room from duplication
        notes: duplicatedItem.notes || ''
      };
      
      console.log('🔧 Setting edit state for duplicated item:', duplicatedItem.id);
      console.log('🔧 Edit state being set:', editState);
      console.log('🔧 Duplicated item room value:', duplicatedItem.room);
      console.log('🔧 Edit state room value:', editState.room);
      
      return {
        ...prev,
        [duplicatedItem.id]: editState
      };
    });
    
    console.log('🔄 Edit state set for duplicated item');
    console.log('🔄 === DUPLICATE ITEM FUNCTION COMPLETED ===');
  }, [categoryId, items.length, isNestedGrouping, groupedItems, groupingStrategy, getItemFieldValue]);

  // Load photos for all items (silent)
  useEffect(() => {
    if (items.length > 0) {
      const loadPhotos = async () => {
        const photoPromises = items.map(async (item) => {
          try {
            const { getMediaFilesByEntity } = await import('../../../../utils/db');
            const mediaFiles = await getMediaFilesByEntity('riskAssessmentItem', Number(item.id), false);
            return { itemId: item.id, photos: mediaFiles };
          } catch (error) {
            return { itemId: item.id, photos: [] };
          }
        });

        const results = await Promise.all(photoPromises);
        const newItemPhotos: { [key: string]: MediaFile[] } = {};

        results.forEach(({ itemId, photos }) => {
          newItemPhotos[itemId] = photos;
        });

        setItemPhotos(newItemPhotos);
      };

      loadPhotos();
    }
  }, [items]);

  return (
    <>
    <Card style={styles.card}>
      <Card.Title title={categoryTitle}  />
      <Divider />
      
      <Card.Content style={styles.predefinedContent}>
        <View style={styles.scrollIndicator}>
          <MaterialCommunityIcons name="gesture-swipe-down" size={16} color="#7f8c8d" />
          <Text style={styles.scrollHint}>Tap items to view and edit details</Text>
        </View>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.predefinedList}
          contentContainerStyle={styles.predefinedListContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {isNestedGrouping(groupedItems) ? (
            // Render nested (2-tier) grouping
            Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([primaryKey, secondaryGroups], primaryIndex) => {
              const isPrimaryExpanded = expandedGroup === primaryKey;
              const allItemsInPrimary = Object.values(secondaryGroups).flat();
              const itemsWithDataInPrimary = allItemsInPrimary.filter(item => hasDataCaptured(item));
              const totalItemsInPrimary = itemsWithDataInPrimary.length;
              const hasAnyDataInPrimary = totalItemsInPrimary > 0;
              
              return (
                <View key={primaryKey} style={styles.groupContainer}>
                  {/* Primary Group Header */}
                  <TouchableOpacity 
                    style={[
                      styles.groupHeader,
                      primaryIndex % 2 === 1 ? styles.groupHeaderAlt : null,
                      isPrimaryExpanded ? styles.groupHeaderExpanded : null
                    ]}
                    onPress={() => toggleGroupExpansion(primaryKey)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.groupTitle}>
                      {primaryKey}
                    </Text>
                    
                    <View style={styles.groupIndicators}>
                      {/* Show count badge if there are items with meaningful data in primary group */}
                      {hasAnyDataInPrimary && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>{totalItemsInPrimary}</Text>
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
                    <View style={styles.groupItems}>
                      {Object.entries(secondaryGroups).sort(([a], [b]) => a.localeCompare(b)).map(([secondaryKey, items]) => {
                        const isSecondaryExpanded = isSecondaryGroupExpanded(primaryKey, secondaryKey);
                        const itemsWithDataInSecondary = items.filter(item => hasDataCaptured(item));
                        const secondaryItemCount = itemsWithDataInSecondary.length;
                        const hasAnyDataInSecondary = secondaryItemCount > 0;
                        
                        return (
                          <View key={`${primaryKey}-${secondaryKey}`} style={styles.secondaryGroupContainer}>
                            {/* Secondary Group Header */}
                            <TouchableOpacity 
                              style={styles.secondaryGroupHeader}
                              onPress={() => toggleSecondaryGroup(primaryKey, secondaryKey)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.secondaryGroupTitle}>
                                {secondaryKey}
                              </Text>
                              
                              <View style={styles.groupIndicators}>
                                {/* Show count badge if there are items with meaningful data in secondary group */}
                                {hasAnyDataInSecondary && (
                                  <View style={styles.secondaryCountBadge}>
                                    <Text style={styles.countBadgeText}>{secondaryItemCount}</Text>
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
                              <View style={styles.secondaryGroupItems}>
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
                                  
                                  // Check if this is a new custom item (starts with 'custom-new-' or 'duplicate-')
                                  const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');
                                  
                                  // Check if item has meaningful data captured
                                  const hasData = hasDataCaptured(item);
                                  
                                  // Create a summary for the item (description, model, or "Item #X")
                                  const itemSummary = description ? description 
                                                    : model ? model
                                                    : `Item #${index + 1}`;
                                  
                                  return (
                                    <View key={item.id} style={styles.accordionContainer}>
                                      {/* Main item row - show summary instead of repeating the group name */}
                                      <TouchableOpacity 
                                        style={[
                                          styles.predefinedItem,
                                          styles.secondaryGroupItemRow, // Different styling for items within secondary groups
                                          index % 2 === 1 ? styles.predefinedItemAlt : null,
                                          isExpanded ? styles.predefinedItemExpanded : null,
                                          isAutoSaved ? styles.predefinedItemAutoSaved : null
                                        ]}
                                        onPress={() => toggleExpansion(item.id)}
                                        activeOpacity={0.7}
                                      >
                                        <View style={styles.itemSummaryContainer}>
                                          <Text style={styles.itemSummaryText} numberOfLines={1} ellipsizeMode="tail">
                                            {itemSummary}
                                          </Text>
                                          {hasData && (
                                            <Text style={styles.itemValueText}>
                                              {quantity}x @ R{price}
                                            </Text>
                                          )}
                                        </View>
                                        
                                        {/* Indicators container */}
                                        <View style={styles.indicatorsContainer}>
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
                                              style={styles.deleteIconButton}
                                              onPress={(e) => {
                                                e.stopPropagation(); // Prevent row expansion
                                                deleteItem(item);
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
                                        <View style={styles.expandedContent}>
                                          <View style={styles.detailsContainer}>
                                            {/* Dynamic Item Details Grid */}
                                            <View style={styles.detailsGrid}>
                                              {isDynamicFieldConfigLoading ? (
                                                <View style={styles.fieldLoadingContainer}>
                                                  <ActivityIndicator size="small" color="#4a90e2" />
                                                  <Text style={styles.fieldLoadingText}>Loading fields...</Text>
                                                </View>
                                              ) : (
                                                renderDynamicFields(itemId, editItems[itemId] || {})
                                              )}
                                            </View>

                                            {/* Action buttons */}
                                            <View style={styles.actionButtonsContainer}>
                                              {isNewItem && (
                                                <TouchableOpacity
                                                  style={[styles.saveButton, { opacity: type ? 1 : 0.5 }]}
                                                  onPress={() => autoSaveItem(itemId)}
                                                  disabled={!type}
                                                >
                                                  <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                                                  <Text style={styles.saveButtonText}>Save New Item</Text>
                                                </TouchableOpacity>
                                              )}
                                              
                                              {/* Add Another button - only show for saved items */}
                                              {!isNewItem && hasData && (
                                                <TouchableOpacity
                                                  style={styles.duplicateButton}
                                                  onPress={() => duplicateItem(item)}
                                                >
                                                  <MaterialCommunityIcons name="content-duplicate" size={20} color="#4a90e2" />
                                                  <Text style={styles.duplicateButtonText}>Add Another {type || item.type}</Text>
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
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            // Render flat (single-tier) grouping  
            Object.entries(groupedItems as FlatGroups).sort(([a], [b]) => a.localeCompare(b)).map(([groupKey, groupItems], groupIndex) => {
            const isGroupExpanded = expandedGroup === groupKey;
            const groupItemCount = groupItems.length;
            
            return (
              <View key={groupKey} style={styles.groupContainer}>
                {/* Group Header */}
                <TouchableOpacity 
                  style={[
                    styles.groupHeader,
                    groupIndex % 2 === 1 ? styles.groupHeaderAlt : null,
                    isGroupExpanded ? styles.groupHeaderExpanded : null
                  ]}
                  onPress={() => toggleGroupExpansion(groupKey)}
                  activeOpacity={0.7}
                >
                    <Text style={styles.groupTitle}>
                      {groupKey}
                  </Text>
                  
                  {/* Group indicators */}
                  <View style={styles.groupIndicators}>
                    {(() => {
                      // Show count badge if more than 1 item OR if any item in group has data
                      const hasAnyDataInGroup = groupItems.some(item => hasDataCaptured(item));
                      return (groupItemCount > 1 || hasAnyDataInGroup) && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>{groupItemCount}</Text>
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

                {/* Group Items */}
                {isGroupExpanded && (
                  <View style={styles.groupItems}>
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
            
            // Check if this is a new custom item (starts with 'custom-new-' or 'duplicate-')
            const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');
            
            // Check if item has meaningful data captured
            const hasData = hasDataCaptured(item);
            
            // Create a summary for the item (description, model, or "Item #X")
            const itemSummary = description ? description 
                              : model ? model
                              : `Item #${index + 1}`;
            
            return (
              <View key={item.id} style={styles.accordionContainer}>
                {/* Main item row - show summary instead of repeating the group name */}
                <TouchableOpacity 
                  style={[
                    styles.predefinedItem,
                    styles.groupItemRow, // Different styling for items within groups
                    index % 2 === 1 ? styles.predefinedItemAlt : null,
                    isExpanded ? styles.predefinedItemExpanded : null,
                    isAutoSaved ? styles.predefinedItemAutoSaved : null
                  ]}
                  onPress={() => toggleExpansion(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemSummaryContainer}>
                    <Text style={styles.itemSummaryText} numberOfLines={1} ellipsizeMode="tail">
                      {itemSummary}
                    </Text>
                    {hasData && (
                      <Text style={styles.itemValueText}>
                        {quantity}x @ R{price}
                      </Text>
                    )}
                  </View>
                  
                  {/* Indicators container */}
                  <View style={styles.indicatorsContainer}>
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
                        style={styles.deleteIconButton}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent row expansion
                          deleteItem(item);
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
                  <View style={styles.expandedContent}>
                    <View style={styles.detailsContainer}>
                      {/* Dynamic Item Details Grid */}
                      <View style={styles.detailsGrid}>
                        {isDynamicFieldConfigLoading ? (
                          <View style={styles.fieldLoadingContainer}>
                            <ActivityIndicator size="small" color="#4a90e2" />
                            <Text style={styles.fieldLoadingText}>Loading fields...</Text>
                          </View>
                        ) : (
                          renderDynamicFields(itemId, editItems[itemId] || {})
                        )}
                      </View>

                      {/* Action buttons */}
                      <View style={styles.actionButtonsContainer}>
                        {isNewItem && (
                          <TouchableOpacity
                            style={[styles.saveButton, { opacity: type ? 1 : 0.5 }]}
                            onPress={() => autoSaveItem(itemId)}
                            disabled={!type}
                          >
                            <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>Save New Item</Text>
                          </TouchableOpacity>
                        )}
                        
                        {/* Add Another button - only show for saved items */}
                        {!isNewItem && hasData && (
                          <TouchableOpacity
                            style={styles.duplicateButton}
                            onPress={() => duplicateItem(item)}
                          >
                            <MaterialCommunityIcons name="content-duplicate" size={20} color="#4a90e2" />
                            <Text style={styles.duplicateButtonText}>Add Another {type || item.type}</Text>
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
            })
          )}
          
          {(isNestedGrouping(groupedItems) ? Object.keys(groupedItems).length === 0 : Object.keys(groupedItems as FlatGroups).length === 0) && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No predefined items found</Text>
              <Text style={styles.emptyStateSubtext}>Try refreshing or add custom items</Text>
            </View>
          )}
        </ScrollView>
        {(isNestedGrouping(groupedItems) ? Object.keys(groupedItems).length > 3 : Object.keys(groupedItems as FlatGroups).length > 3) && (
          <View style={styles.scrollIndicator}>
            <MaterialCommunityIcons name="gesture-swipe-up" size={16} color="#7f8c8d" />
          </View>
        )}
      </Card.Content>
    </Card>
    
    {/* Camera Modal */}
    <CameraModal
      visible={showCamera}
      onClose={() => {
        setShowCamera(false);
        setCurrentPhotoItemId(null);
      }}
      onTakePhoto={takePhoto}
      onSelectFromGallery={selectFromGallery}
    />
    
    {/* Photo Gallery Modal */}
    <PhotoGalleryModal
      key={`gallery-${currentPhotoItemId}-${(currentPhotoItemId ? itemPhotos[currentPhotoItemId]?.length : 0)}`}
      visible={showPhotoGallery}
      photos={currentPhotoItemId ? (itemPhotos[currentPhotoItemId] || []) : []}
      onClose={() => {
        setShowPhotoGallery(false);
        setCurrentPhotoItemId(null);
      }}
      onDeletePhoto={handleDeletePhoto}
      onTakeNewPhoto={() => {
        setShowPhotoGallery(false);
        setShowCamera(true);
        setAddingAnotherPhoto(true);
        // Don't clear currentPhotoItemId - we need it for the new photo
      }}
    />
  </>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  fieldLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fieldLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  card: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  predefinedContent: {
    padding: 0,
    paddingVertical: 8,
  },
  predefinedListContent: {
    paddingHorizontal: 16,
  },
  predefinedList: {
    flex: 1, // Use full available space
    minHeight: 200,
  },
  accordionContainer: {
    marginBottom: 2,
  },
  predefinedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  predefinedItemAlt: {
    backgroundColor: '#f9f9f9',
  },
  predefinedItemExpanded: {
    borderBottomColor: '#4a90e2',
    borderBottomWidth: 2,
  },
  predefinedItemAutoSaved: {
    backgroundColor: '#f0f8f0',
  },
  predefinedItemType: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
    fontWeight: '500',
  },
  expandedContent: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailsContainer: {
    padding: 16,
  },
  detailsGrid: {
    marginBottom: 16,
  },
  dynamicFieldContainer: {
    marginBottom: 12,
    marginRight: 8,
  },
  legacyFieldWrapper: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  editInput: {
    backgroundColor: '#fff',
    height: 36,
    fontSize: 14,
  },
  editInputMultiline: {
    backgroundColor: '#fff',
    fontSize: 14,
    minHeight: 50,
  },
  photoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f4f7',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  photoButtonText: {
    fontSize: 12,
    color: '#4a90e2',
    marginLeft: 4,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    flex: 1,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIconButton: {
    marginRight: 4,
    padding: 2,
  },
  // Group styles
  groupContainer: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e8f4f8',
    borderBottomWidth: 1,
    borderBottomColor: '#d0e8f0',
  },
  groupHeaderAlt: {
    backgroundColor: '#f0f8f0',
  },
  groupHeaderExpanded: {
    borderBottomColor: '#4a90e2',
    borderBottomWidth: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  twoTierGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    lineHeight: 20,
  },
  groupIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  groupItems: {
    backgroundColor: '#f8f9fa',
  },
  duplicateButton: {
    backgroundColor: '#f0f4f7',
    borderColor: '#4a90e2',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  duplicateButtonText: {
    color: '#4a90e2',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  // Item summary styles
  groupItemRow: {
    paddingLeft: 24, // Indent items within groups
    backgroundColor: '#fafafa',
  },
  itemSummaryContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  itemSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  itemValueText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  // Secondary grouping styles
  secondaryGroupContainer: {
    marginBottom: 2,
  },
  secondaryGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#f0f4f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8f0',
    marginLeft: 8,
  },
  secondaryGroupTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    flex: 1,
  },
  secondaryCountBadge: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  secondaryGroupItems: {
    backgroundColor: '#f8f9fa',
    marginLeft: 8,
  },
  secondaryGroupItemRow: {
    paddingLeft: 32, // Double indent for items within secondary groups
    backgroundColor: '#f5f6fa',
  },
}); 