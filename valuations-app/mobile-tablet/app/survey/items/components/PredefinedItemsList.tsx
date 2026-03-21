import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Card, Divider, Button, TextInput as PaperTextInput, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PredefinedItemsListProps, Item } from './types';
import ItemStates from './ItemStates';
import CameraModal from './CameraModal';
import PhotoGalleryModal from './PhotoGalleryModal';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { ValidationService } from '../../../../services/validationService';
import { FieldConfiguration, FieldValidationError } from '../../../../types/dynamicUI';
// Import centralized styles
import { predefinedItemsListStyles } from '../../../GlobalStyles';
// Import required services and utilities
import riskAssessmentSyncService from '../../../../services/riskAssessmentSyncService';
import mediaService from '../../../../services/mediaService';
// Dynamic import to prevent bundling at startup
const getDbUtils = () => import('../../../../utils/db');
// Use require for ImagePicker to avoid type issues
const ImagePicker = require('expo-image-picker');
import { debugLog, verboseLog, infoLog } from '../../../../utils/debugUtils';

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
  categoryConfig,
  useCustomFields = false,
  groupingStrategy,
  assessmentType,
  onRefresh, 
  onSelectItem,
  onAddNewItem,
  onSyncStatusChange,
  onSyncRequest,
  onTotalsChange,
  onForceRemount
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
    debugLog('Loading state check:', {
      useCustomFields,
      dynamicFieldConfigLength: dynamicFieldConfig?.length || 0,
      dynamicFieldConfigExists: !!dynamicFieldConfig,
      propsItemsLength: propsItems?.length || 0
    });
    
    // If we have items but no dynamic field config yet, and useCustomFields is true, show loading
    if (useCustomFields && propsItems && propsItems.length > 0) {
      const hasValidDynamicConfig = dynamicFieldConfig && dynamicFieldConfig.length > 0;
      if (!hasValidDynamicConfig) {
        debugLog('Showing loading state - waiting for dynamic field config');
        return true;
      }
    }
    
    // Also show loading if we're expecting custom fields but the config is still loading
    if (useCustomFields && dynamicFieldConfig && dynamicFieldConfig.length === 0) {
      debugLog('Showing loading state - useCustomFields is true but no dynamic config yet');
      return true;
    }
    
    return false;
  }, [useCustomFields, dynamicFieldConfig, propsItems]);
  
  if (isDynamicFieldConfigLoading) {
    return (
      <View style={predefinedItemsListStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={predefinedItemsListStyles.loadingText}>Loading dynamic field configuration...</Text>
        <Text style={[predefinedItemsListStyles.loadingText, { fontSize: 12, color: '#666', marginTop: 8 }]}>
          {useCustomFields ? 'Configuring custom fields...' : 'Preparing field layout...'}
        </Text>
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
  const [itemPhotos, setItemPhotos] = useState<{ [key: string]: any[] }>({});
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
      quantity: assessmentType === 'INVENTORY' ? '1' : '',
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
        quantity: assessmentType === 'INVENTORY' ? '1' : '',
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

  // Helper function to get default quantity based on assessment type
  const getDefaultQuantity = useCallback((item: Item): string => {
    // Only default to '1' if assessment type is "INVENTORY"
    if (assessmentType === 'INVENTORY') {
      return item.quantity || '1';
    }
    // For non-inventory assessments, return empty string or existing value
    return item.quantity || '';
  }, [assessmentType]);

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
        value = getDefaultQuantity(item);
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
  }, [getDefaultQuantity]);

  // Calculate and expose totals to parent component
  const calculateTotals = useCallback(() => {
    let itemCount = 0;
    let totalValue = 0;

    items.forEach(item => {
      const itemId = String(item.id);
      const editedItem = editItems[itemId];
      
      // Count item if it has been edited and has a quantity > 0, or if it's an original item with values
      const quantity = editedItem?.quantity ? parseInt(editedItem.quantity, 10) : parseInt(getDefaultQuantity(item), 10);
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
  }, [items, editItems, getDefaultQuantity]);

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
    // For hasDataCaptured, we need to check the actual database value, not the display default
    // If user has edited, use the edited value; otherwise use the original DB value
    const quantity = editedItem?.quantity ? parseInt(editedItem.quantity, 10) : parseInt((item as any).qty || 0, 10);
    const price = editedItem?.price ? parseFloat(editedItem.price) : parseFloat(item.price || '0');
    const description = editedItem?.description || item.description || '';
    const model = editedItem?.model || item.model || '';
    const notes = editedItem?.notes || item.notes || '';
    
    // Check if quantity has meaningful data:
    // - For INVENTORY: quantity > 0 (since DB stores 0, but UI displays 1 as default)
    // - For non-INVENTORY: quantity > 0
    const hasQuantityData = quantity > 0;
    
    // Has data if ANY meaningful field has a value:
    // - quantity greater than 0 (actual DB value, not display default)
    // - price greater than 0
    // - description is not empty
    // - model is not empty
    // - notes is not empty
    return hasQuantityData || (price > 0) || (description && description.trim() !== '') || 
           (model && model.trim() !== '') || (notes && notes.trim() !== '');
  }, [editItems, assessmentType]);

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
        
        // --- REFRESH LOGIC FOR ALL STRUCTURES ---
        if (typeof onRefresh === 'function') {
          console.log('🔄 Sync completed, calling onRefresh to reload data from SQLite with updated backend IDs');
          await onRefresh();
          
          // --- FORCE FULL LOCAL STATE RESET ---
          console.log('🔄 Forcing full local state reset after refresh. propsItems:', propsItems.length, 'items');
          console.log('🔄 Items before reset:', items.map(i => ({ id: i.id, type: i.type, description: i.description })));
          
          setItems(propsItems);
          setEditItems({});
          setAutoSavedItems({});
          setExpandedItem(null);
          setExpandedGroup(null);
          setExpandedSecondaryGroups({});
          
          console.log('🔄 Items after reset:', propsItems.map(i => ({ id: i.id, type: i.type, description: i.description })));
          // --- END FULL LOCAL STATE RESET ---
          
          if (typeof onForceRemount === 'function') {
            console.log('🔄 Forcing full component remount after sync/refresh');
            onForceRemount();
          }
        }
        // --- END REFRESH LOGIC ---
        
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

  // --- FORCE LOCAL STATE TO MATCH PROPS AFTER REFRESH ---
  useEffect(() => {
    setItems(propsItems);
  }, [propsItems]);
  // --- END FORCE LOCAL STATE TO MATCH PROPS ---

  // Add ref for auto-save timeout
  const autoSaveTimeoutRef = useRef<number | null>(null);

  // Handle editing a field - updated for dynamic fields
  const handleEdit = (itemId: string, fieldName: string, value: string) => {
    setEditItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [fieldName]: value,
      }
    }));

    // Debounced auto-save to prevent excessive saves and accordion collapse
    // For dropdowns and checkbox we save immediately so sync sends the correct value
    const isDropdownField = fieldName === 'selectedanswer';
    const isCheckboxField = fieldName === 'excludefromreport';
    if (!isDropdownField && !isCheckboxField) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('🔄 handleEdit: calling autoSaveItem for', itemId, fieldName, value);
        // Pass the current value explicitly to avoid stale state
        autoSaveItem(itemId, { [fieldName]: value });
      }, 2000); // 2 second delay to prevent immediate saves
    } else {
      // Immediate save for dropdowns with explicit override to avoid stale state
      autoSaveItem(itemId, { [fieldName]: value });
    }
  };

  // Auto-save function that saves changes to SQLite
  const autoSaveItem = async (id: string, overrideChanges?: { [key: string]: any }) => {
    console.log('🔄 [autoSaveItem] Called for item:', id);
    const item = items.find(i => String(i.id) === String(id));
    if (!item) {
      console.error('❌ [autoSaveItem] No item found in local state for id:', id);
      return;
    }
    
    // Use override changes if provided, otherwise get from editItems
    const changes = overrideChanges ?? (editItems[id] || {});
    console.log('🔄 [autoSaveItem] Changes to save:', changes);
    console.log('🔄 [autoSaveItem] Override changes provided:', !!overrideChanges);

    // Import database functions
    const { getAllRiskAssessmentItems, updateRiskAssessmentItem, insertRiskAssessmentItem } = await import('../../../../utils/db');
    
    // Check if item exists in database
    const existingItems = await getAllRiskAssessmentItems();
    const existingItem = existingItems.find(dbItem => 
      String(dbItem.riskassessmentitemid) === String(item.id)
    );

    const excludefromreportVal = (v: unknown) => (v === true || v === 'true' || v === '1') ? 1 : 0;

    if (existingItem) {
      // Update existing item
      const updated: any = {
        ...existingItem,
        itemprompt: changes.type ?? existingItem.itemprompt ?? '',
        selectedanswer: changes.selectedanswer ?? existingItem.selectedanswer ?? '',
        qty: Number(changes.quantity ?? getDefaultQuantity(item)) || 0,
        price: Number(changes.price ?? existingItem.price) || 0,
        description: changes.description ?? existingItem.description ?? '',
        model: changes.model ?? existingItem.model ?? '',
        location: changes.room ?? existingItem.location ?? '',
        notes: changes.notes ?? existingItem.notes ?? '',
        excludefromreport: excludefromreportVal(changes.excludefromreport ?? existingItem.excludefromreport),
        pending_sync: 1,
      };
      console.log('🔄 [autoSaveItem] updateRiskAssessmentItem called with:', updated);
      await updateRiskAssessmentItem(updated);
      // For dropdowns, ensure the updated value is reflected in local state as soon as DB save completes
      if (changes.selectedanswer !== undefined) {
        setItems(prevItems =>
          prevItems.map(prevItem =>
            String(prevItem.id) === id
              ? { ...prevItem, selectedanswer: changes.selectedanswer }
              : prevItem
          )
        );
      }
    } else {
      // Insert new item (for custom-new- or duplicate- items)
      console.log('🔄 [autoSaveItem] Inserting new item:', id);
      
      // Create new SQLite item
      // For temporary IDs, generate a unique negative ID to avoid conflicts
      const tempId = id.startsWith('custom-new-') || id.startsWith('duplicate-') 
        ? -Math.abs(Number(id.replace('custom-new-', '').replace('duplicate-', ''))) 
        : Number(id);
      
      const newSqliteItem: any = {
        riskassessmentitemid: tempId,
        riskassessmentcategoryid: Number(categoryId),
        itemprompt: changes.type ?? item.type ?? '',
        itemtype: item.itemtype ?? 0, // Preserve the original itemtype
        rank: item.rank ?? 0, // Preserve the original rank
        commaseparatedlist: item.commaseparatedlist ?? '',
        selectedanswer: changes.selectedanswer ?? item.selectedanswer ?? '',
        qty: Number(changes.quantity ?? getDefaultQuantity(item)) || 0,
        price: Number(changes.price ?? item.price) || 0,
        description: changes.description ?? item.description ?? '',
        model: changes.model ?? item.model ?? '',
        location: changes.room ?? item.room ?? '',
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
        notes: changes.notes ?? item.notes ?? '',
        excludefromreport: excludefromreportVal(changes.excludefromreport ?? (item as any).excludefromreport),
        pending_sync: 1,
        appointmentid: undefined
      };
      
      console.log('🔄 [autoSaveItem] insertRiskAssessmentItem called with:', newSqliteItem);
      await insertRiskAssessmentItem(newSqliteItem);
      console.log('🔄 [autoSaveItem] Saved to database but keeping original ID:', id);

      // Don't change the item ID - keep it as 'duplicate-123' so "Save New Item" button shows
      // Only update the values, not the ID
      setItems(prevItems => 
        prevItems.map(prevItem => 
          String(prevItem.id) === id ? {
            ...prevItem,
            type: changes.type ?? prevItem.type ?? '',
            quantity: changes.quantity ?? getDefaultQuantity(prevItem),
            price: changes.price ?? prevItem.price ?? '0',
            description: changes.description ?? prevItem.description ?? '',
            model: changes.model ?? prevItem.model ?? '',
            room: changes.room ?? prevItem.room ?? '',
            notes: changes.notes ?? prevItem.notes ?? '',
            ...(changes.excludefromreport !== undefined && { excludefromreport: excludefromreportVal(changes.excludefromreport) })
          } : prevItem
        )
      );
    }
    
    // Update local items state for existing items (if not already done above)
    if (!id.startsWith('custom-new-') && !id.startsWith('duplicate-')) {
      setItems(prevItems => 
        prevItems.map(prevItem => 
          String(prevItem.id) === id ? {
            ...prevItem,
            type: changes.type ?? prevItem.type ?? '',
            quantity: changes.quantity ?? getDefaultQuantity(prevItem),
            price: changes.price ?? prevItem.price ?? '0',
            description: changes.description ?? prevItem.description ?? '',
            model: changes.model ?? prevItem.model ?? '',
            room: changes.room ?? prevItem.room ?? '',
            notes: changes.notes ?? prevItem.notes ?? '',
            ...(changes.excludefromreport !== undefined && { excludefromreport: excludefromreportVal(changes.excludefromreport) })
          } : prevItem
        )
      );
    }

      // Mark as auto-saved but keep the changes visible
      // For new items, use the new SQLite ID if it was created
      const finalId = id; // Use the original ID, the auto-save logic above handles ID updates
      setAutoSavedItems(prev => ({ ...prev, [finalId]: true }));

      // Ensure local UI reflects selectedanswer immediately if it changed
      if (changes.selectedanswer !== undefined) {
        setItems(prevItems =>
          prevItems.map(prevItem =>
            String(prevItem.id) === id
              ? { ...prevItem, selectedanswer: changes.selectedanswer }
              : prevItem
          )
        );
      }

      // Only update pending changes count for real IDs (not temporary ones)
      if (!id.startsWith('custom-new-') && !id.startsWith('duplicate-')) {
        const count = await riskAssessmentSyncService.getPendingChangesCount();
        setPendingChangesCount(count.total);
      }

      console.log('=== PREDEFINED ITEMS: Auto-save completed successfully ===');
      console.log('Item ID:', id);
      console.log('Changes applied:', JSON.stringify(changes, null, 2));
  };

  // Add explicit save function that changes the ID
  const explicitSaveItem = async (id: string) => {
    console.log('🔄 [explicitSaveItem] Called for item:', id);
    
    // First, auto-save to ensure data is in database
    await autoSaveItem(id);
    
    // Then change the ID to database ID
    const item = items.find(i => String(i.id) === String(id));
    if (!item) {
      console.error('❌ [explicitSaveItem] No item found for id:', id);
      return;
    }
    
    const changes = editItems[id] || {};
    
    // For temporary IDs, find the record by the negative temp ID we created
    const { getAllRiskAssessmentItems, updateRiskAssessmentItem } = await import('../../../../utils/db');
    const existingItems = await getAllRiskAssessmentItems();
    
    // Find the record with the negative temp ID
    const tempId = -Math.abs(Number(id.replace('custom-new-', '').replace('duplicate-', '')));
    const existingItem = existingItems.find(dbItem => 
      dbItem.riskassessmentitemid === tempId
    );
    
    if (existingItem) {
      console.log('🔄 [explicitSaveItem] Found existing item with temp ID:', tempId);
      
      // Generate a new positive ID (simulate what the backend would assign)
      const newDbId = Date.now(); // Use timestamp as unique ID
      
      // Update the record with a new positive ID
      const updatedItem: any = {
        ...existingItem,
        riskassessmentitemid: newDbId, // Change to positive ID
        pending_sync: 1,
        dateupdated: new Date().toISOString()
      };
      
      // Remove the old temp record and insert the new one
      const { runSql } = await import('../../../../utils/db');
      await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [tempId]);
      await runSql(`
        INSERT INTO risk_assessment_items (
          riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
          commaseparatedlist, selectedanswer, qty, price, description, model, location,
          assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
          dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
          synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        updatedItem.riskassessmentitemid, updatedItem.riskassessmentcategoryid, updatedItem.itemprompt,
        updatedItem.itemtype, updatedItem.rank, updatedItem.commaseparatedlist, updatedItem.selectedanswer,
        updatedItem.qty, updatedItem.price, updatedItem.description, updatedItem.model, updatedItem.location,
        updatedItem.assessmentregisterid, updatedItem.assessmentregistertypeid, updatedItem.datecreated,
        updatedItem.createdbyid, updatedItem.dateupdated, updatedItem.updatedbyid, updatedItem.issynced,
        updatedItem.syncversion, updatedItem.deviceid, updatedItem.syncstatus, updatedItem.synctimestamp,
        updatedItem.hasphoto, updatedItem.latitude, updatedItem.longitude, updatedItem.notes,
        updatedItem.pending_sync, updatedItem.appointmentid
      ]);
      
      const newItemId = String(newDbId);
      console.log('🔄 [explicitSaveItem] Changing item ID from', id, 'to', newItemId);
      
      // Update the item ID in the items array
      setItems(prevItems => 
        prevItems.map(prevItem => 
          String(prevItem.id) === id ? {
            ...prevItem,
            id: newItemId, // Change to database ID
            type: changes.type ?? prevItem.type ?? '',
            quantity: changes.quantity ?? getDefaultQuantity(prevItem),
            price: changes.price ?? prevItem.price ?? '0',
            description: changes.description ?? prevItem.description ?? '',
            model: changes.model ?? prevItem.model ?? '',
            room: changes.room ?? prevItem.room ?? '',
            notes: changes.notes ?? prevItem.notes ?? '',
            rank: prevItem.rank || 0, // Preserve the rank value
            itemtype: prevItem.itemtype || 0 // Preserve the itemtype value
          } : prevItem
        )
      );
      
      // Preserve expanded state when item ID changes
      if (expandedItem === id) {
        setExpandedItem(newItemId);
      }
      
      // Update editItems to use the new ID
      setEditItems(prev => {
        const newEditItems = { ...prev };
        if (newEditItems[id]) {
          newEditItems[newItemId] = newEditItems[id];
          delete newEditItems[id];
        }
        return newEditItems;
      });
      
      // Update autoSavedItems to use the new ID
      setAutoSavedItems(prev => {
        const newAutoSavedItems = { ...prev };
        if (newAutoSavedItems[id]) {
          newAutoSavedItems[newItemId] = newAutoSavedItems[id];
          delete newAutoSavedItems[id];
        }
        return newAutoSavedItems;
      });
      
      // Now update the sync count since we have a real ID
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingChangesCount(count.total);
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
          const { getAllRiskAssessmentItems } = await getDbUtils();
          const existingItems = await getAllRiskAssessmentItems();
          
          // Handle both temp IDs (negative) and real IDs (positive)
          let existingItem;
          const itemId = String(itemToUpdate.id);
          if (itemId.startsWith('custom-new-') || itemId.startsWith('duplicate-')) {
            // Find by negative temp ID
            const tempId = -Math.abs(Number(itemId.replace('custom-new-', '').replace('duplicate-', '')));
            existingItem = existingItems.find(dbItem => dbItem.riskassessmentitemid === tempId);
          } else {
            // Find by positive real ID
            existingItem = existingItems.find(dbItem => 
              String(dbItem.riskassessmentitemid) === itemId
            );
          }

          if (existingItem) {
            const updated: any = {
              ...existingItem,  // Preserve all existing database fields
              hasphoto: 1,
              pending_sync: 1,
              issynced: 0,
              dateupdated: new Date().toISOString()
            };
            
            const { updateRiskAssessmentItem } = await getDbUtils();
            await updateRiskAssessmentItem(updated);
            
            // Only update pending changes count for real IDs (not temporary ones)
            if (!itemId.startsWith('custom-new-') && !itemId.startsWith('duplicate-')) {
              const count = await riskAssessmentSyncService.getPendingChangesCount();
              setPendingChangesCount(count.total);
            }
          }
        }

        // Reload photos for this item to update the UI immediately (same as selectFromGallery)
        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
        
        Alert.alert('Success', 'Photo saved successfully!');
        // Keep Add Photo modal open so user can take more or choose from gallery
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true
      });
      
      if (!result.canceled && result.assets?.length && currentPhotoItemId) {
        const itemToUpdate = items.find(i => String(i.id) === currentPhotoItemId);
        for (const asset of result.assets) {
          await mediaService.savePhoto(
            asset.uri,
            'riskAssessmentItem',
            Number(currentPhotoItemId),
            {
              category: 'predefined-item',
              timestamp: new Date().toISOString(),
              source: 'gallery'
            }
          );
        }

        // Update the item to indicate it has a photo (once)
        if (itemToUpdate) {
          const { getAllRiskAssessmentItems } = await getDbUtils();
          const existingItems = await getAllRiskAssessmentItems();
          let existingItem;
          const itemId = String(itemToUpdate.id);
          if (itemId.startsWith('custom-new-') || itemId.startsWith('duplicate-')) {
            const tempId = -Math.abs(Number(itemId.replace('custom-new-', '').replace('duplicate-', '')));
            existingItem = existingItems.find(dbItem => dbItem.riskassessmentitemid === tempId);
          } else {
            existingItem = existingItems.find(dbItem =>
              String(dbItem.riskassessmentitemid) === itemId
            );
          }

          if (existingItem) {
            const updated: any = {
              ...existingItem,
              hasphoto: 1,
              pending_sync: 1,
              issynced: 0,
              dateupdated: new Date().toISOString()
            };
            const { updateRiskAssessmentItem } = await getDbUtils();
            await updateRiskAssessmentItem(updated);
            if (!itemId.startsWith('custom-new-') && !itemId.startsWith('duplicate-')) {
              const count = await riskAssessmentSyncService.getPendingChangesCount();
              setPendingChangesCount(count.total);
            }
          }
        }

        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));

        const count = result.assets.length;
        Alert.alert('Success', count === 1 ? 'Photo saved successfully!' : `${count} photos saved successfully!`);
        // Keep Add Photo modal open so user can add more
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
    console.log(`📸 handleViewPhotos for item ${itemId}:`, { 
      photosCount: photos.length, 
      photos: photos.map(p => ({ 
        id: p.MediaID, 
        backendId: (p as any).BackendMediaID, 
        fileName: p.FileName 
      })),
      allItemPhotos: Object.keys(itemPhotos).map(key => ({ itemId: key, count: itemPhotos[key].length }))
    });
    
    if (photos.length === 0) {
      // If no photos, directly open camera
      console.log(`📸 No photos found for item ${itemId}, opening camera`);
      handleTakePhoto(itemId);
      return;
    }
    
    console.log(`📸 Opening photo gallery for item ${itemId} with ${photos.length} photos`);
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
  type GroupedItemsType = FlatGroups | NestedGroups | null;

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
    verboseLog('DEBUG: groupedItems useMemo triggered');
    verboseLog('DEBUG: Full groupingStrategy object:', JSON.stringify(groupingStrategy, null, 2));
    verboseLog('DEBUG: Items count for grouping:', items.length);
    verboseLog('DEBUG: Items for grouping:', items.map(item => ({ id: item.id, type: item.type, room: item.room })));
    
    // If no grouping strategy is provided, return items without grouping
    if (!groupingStrategy?.strategy_type) {
      debugLog('No grouping strategy found - returning items without grouping');
      verboseLog('groupingStrategy object:', groupingStrategy);
      return null; // Signal that no grouping should be applied
    }
    
    // Require explicit grouping strategy configuration
    const effectiveGroupingStrategy = groupingStrategy.strategy_type;
    
    debugLog('Grouping items using strategy:', effectiveGroupingStrategy);
    
    // Check if we have a 2-tier grouping strategy configured
    const strategyConfig = groupingStrategy?.strategy_config;
    verboseLog('Raw strategy config:', strategyConfig);
    verboseLog('Strategy type:', effectiveGroupingStrategy);
    
    // Handle both string (legacy) and object (new) types for strategy_config
    let parsedConfig: any = null;
    try {
      parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
    } catch (error) {
      debugLog('Error parsing strategy config:', error);
      parsedConfig = null;
    }
    
    const hasTwoTierGrouping = parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group;
    
    if (__DEV__) {
      console.log('🔧 Parsed config:', parsedConfig);
      console.log('🔧 Has two-tier grouping:', hasTwoTierGrouping);
    }
    
    if (hasTwoTierGrouping) {
      if (__DEV__) console.log('🔧 Using 2-tier grouping:', parsedConfig.primary_group, '->', parsedConfig.secondary_group);
    
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
      
      console.log('🔧 DEBUG: Final nested groups structure:', nestedGroups);
      return nestedGroups;
      } else {
      // Single-tier grouping (original logic) - return in compatible format
      const flatGroups: { [key: string]: Item[] } = {};
      
      items.forEach(item => {
        let groupKey: string;
        
        switch (effectiveGroupingStrategy) {
          case 'by_type':
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
            
          default:
            // Unknown strategy - fall back to type grouping
            groupKey = item.type || 'Unknown Items';
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

  // Helper function to find which group an item belongs to
  const findItemGroup = useCallback((item: Item) => {
    if (!groupedItems || groupedItems === null) {
      console.log('🔍 findItemGroup: No groupedItems available');
      return null; // No grouping
    }
    
    console.log('🔍 findItemGroup: Searching for item', item.id, 'in groupedItems:', {
      isNestedGrouping: isNestedGrouping(groupedItems),
      totalPrimaryGroups: isNestedGrouping(groupedItems) ? Object.keys(groupedItems).length : Object.keys(groupedItems as FlatGroups).length
    });
    
    if (isNestedGrouping(groupedItems)) {
      // For nested grouping, find primary and secondary group
      for (const [primaryKey, secondaryGroups] of Object.entries(groupedItems)) {
        for (const [secondaryKey, groupItems] of Object.entries(secondaryGroups)) {
          if (groupItems.some(groupItem => String(groupItem.id) === String(item.id))) {
            console.log('🔍 findItemGroup: Found item in nested group:', { primaryKey, secondaryKey, groupSize: groupItems.length });
            return { primaryGroup: primaryKey, secondaryGroup: secondaryKey, items: groupItems };
          }
        }
      }
    } else {
      // For flat grouping
      const flatGroups = groupedItems as FlatGroups;
      for (const [groupKey, groupItems] of Object.entries(flatGroups)) {
        if (groupItems.some(groupItem => String(groupItem.id) === String(item.id))) {
          console.log('🔍 findItemGroup: Found item in flat group:', { groupKey, groupSize: groupItems.length });
          return { group: groupKey, items: groupItems };
        }
      }
    }
    
    console.log('🔍 findItemGroup: Item not found in any group');
    return null;
  }, [groupedItems, isNestedGrouping]);

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
              console.log('🗑️ Deleting item:', itemId);
              
              // If it's not a new item, mark it for deletion in the database
              if (!itemToDelete.id.startsWith('custom-new-') && !itemToDelete.id.startsWith('duplicate-')) {
                console.log('🗑️ Marking existing item for deletion in SQLite database:', itemToDelete.id);
                
                // Mark as deleted (will be synced to backend)
                const { deleteRiskAssessmentItem } = await import('../../../../utils/db');
                await deleteRiskAssessmentItem(Number(itemToDelete.id));
                
                console.log('✅ Record marked for deletion in SQLite database');
                
                // Update pending changes count
                const count = await riskAssessmentSyncService.getPendingChangesCount();
                setPendingChangesCount(count.total);
              } else {
                console.log('🗑️ Deleting new/temporary item (no database record to delete)');
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

  // Function to duplicate an item with the same itemprompt
  const duplicateItem = useCallback((originalItem: Item) => {
    console.log('🔄 === DUPLICATE ITEM FUNCTION CALLED ===');
    console.log('🔄 Original item:', originalItem);
    console.log('🔄 Original item type:', originalItem.type);
    console.log('🔄 Original item rank:', originalItem.rank);
    console.log('🔄 Original item rank type:', typeof originalItem.rank);
    console.log('🔄 Original item rank value:', JSON.stringify(originalItem.rank));
    console.log('🔄 Original item full object:', JSON.stringify(originalItem, null, 2));
    console.log('🔄 Current items count before duplication:', items.length);
    
    // Debug: Check if rank exists in the original item's SQLite data
    (async () => {
      try {
        const { getAllRiskAssessmentItems } = await import('../../../../utils/db');
        const allItems = await getAllRiskAssessmentItems();
        const sqliteItem = allItems.find(dbItem => String(dbItem.riskassessmentitemid) === String(originalItem.id));
        if (sqliteItem) {
          console.log('🔄 SQLite item rank:', sqliteItem.rank);
          console.log('🔄 SQLite item rank type:', typeof sqliteItem.rank);
          console.log('🔄 SQLite item full object:', JSON.stringify(sqliteItem, null, 2));
        } else {
          console.log('🔄 No SQLite item found for original item ID:', originalItem.id);
        }
      } catch (error) {
        console.log('🔄 Error checking SQLite data:', error);
      }
    })();
    
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
        quantity: assessmentType === 'INVENTORY' ? '1' : '',
        price: '',
        room: '',
        notes: '',
        rank: originalItem.rank || 0, // Preserve the rank from the original item
        itemtype: originalItem.itemtype || 0, // Preserve the itemtype from the original item
        categoryId: categoryId
      };
      
      console.log('🔄 Duplicated item rank after assignment:', duplicatedItem.rank);
      console.log('🔄 Duplicated item rank type:', typeof duplicatedItem.rank);
      console.log('🔄 Duplicated item rank value:', JSON.stringify(duplicatedItem.rank));
      
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
        console.log('🔄 Duplicated item rank value:', duplicatedItem.rank);
      }
    } else {
      // For flat grouping, use the original logic
      duplicatedItem = {
        id: `duplicate-${Date.now()}`,
        type: originalItem.type, // Keep the same itemprompt
        description: '',
        model: '',
        quantity: assessmentType === 'INVENTORY' ? '1' : '',
        price: '',
        room: '',
        notes: '',
        rank: originalItem.rank || 0, // Preserve the rank from the original item
        itemtype: originalItem.itemtype || 0, // Preserve the itemtype from the original item
        categoryId: categoryId
      };
      
      console.log('🔄 Flat grouping - Duplicated item rank after assignment:', duplicatedItem.rank);
      console.log('🔄 Flat grouping - Duplicated item rank type:', typeof duplicatedItem.rank);
      console.log('🔄 Flat grouping - Duplicated item rank value:', JSON.stringify(duplicatedItem.rank));
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
        quantity: duplicatedItem.quantity || (assessmentType === 'INVENTORY' ? '1' : ''),
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
    console.log('🔄 Final duplicated item rank:', duplicatedItem.rank);
    console.log('🔄 Final duplicated item rank type:', typeof duplicatedItem.rank);
    console.log('🔄 Final duplicated item rank value:', JSON.stringify(duplicatedItem.rank));
    console.log('🔄 === DUPLICATE ITEM FUNCTION COMPLETED ===');
  }, [categoryId, items.length, isNestedGrouping, groupedItems, groupingStrategy, getItemFieldValue]);

  // Load photos for all items (silent)
  useEffect(() => {
    if (items.length > 0) {
      const loadPhotos = async () => {
        console.log('📸 Loading photos for items:', items.map(item => ({ id: item.id, type: item.type })));
        
        const photoPromises = items.map(async (item) => {
          try {
            const { getMediaFilesByEntity } = await import('../../../../utils/db');
            const itemId = Number(item.id);
            console.log(`📸 Loading photos for item ${item.id} (numeric: ${itemId})`);
            
            const mediaFiles = await getMediaFilesByEntity('riskAssessmentItem', itemId, false);
            console.log(`📸 Found ${mediaFiles.length} photos for item ${item.id}:`, mediaFiles.map(m => ({ 
              id: m.MediaID, 
              backendId: (m as any).BackendMediaID, 
              fileName: m.FileName 
            })));
            
            return { itemId: item.id, photos: mediaFiles };
          } catch (error) {
            console.error(`📸 Error loading photos for item ${item.id}:`, error);
            return { itemId: item.id, photos: [] };
          }
        });

        const results = await Promise.all(photoPromises);
        const newItemPhotos: { [key: string]: any[] } = {};

        results.forEach(({ itemId, photos }) => {
          newItemPhotos[itemId] = photos;
          console.log(`📸 Set photos for item ${itemId}: ${photos.length} photos`);
        });

        console.log('📸 Final itemPhotos state:', Object.keys(newItemPhotos).map(key => ({ itemId: key, photoCount: newItemPhotos[key].length })));
        setItemPhotos(newItemPhotos);
      };

      loadPhotos();
    }
  }, [items]);

  // Helper function to render dynamic fields based on configuration respecting display_order
  const renderDynamicFields = useCallback((itemId: string, editData: any) => {
    if (!dynamicFieldConfig || dynamicFieldConfig.length === 0) {
      // Fall back to legacy hardcoded fields
      return renderLegacyFields(itemId, editData);
    }

    const item = items.find(i => String(i.id) === itemId);
    if (!item) return null;

    // Per-item field config lookup (Option B fallback rule)
    const itemPromptKey = (item.type || '').toLowerCase().trim();
    const itemLevelFields = categoryConfig?.itemFieldConfigs?.[itemPromptKey];
    const effectiveFieldConfig = itemLevelFields ?? dynamicFieldConfig;
    if (__DEV__ && itemPromptKey) {
      const source = itemLevelFields ? 'per-item' : 'category';
      console.log(`🔧 Field config for "${itemPromptKey}": using ${source} config (visible: ${effectiveFieldConfig.filter(f => f.display_on_ui === 1).map(f => f.item_fields).join(', ')})`);
    }

    const itemErrors = validationErrors[itemId] || [];
    
    // Determine which fields are being used for grouping and should be excluded from editing
    const getGroupingFields = (): string[] => {
      if (!groupingStrategy) {
        return []; // No exclusions when no grouping strategy is configured
      }
      
      // Check if this is a new item (custom-new- or duplicate-)
      const isNewItem = item.id.toString().startsWith('custom-new-') || item.id.toString().startsWith('duplicate-');
      
      // For new items, allow editing of grouping fields so users can set Room Name and Item Name
      if (isNewItem) {
        console.log('🔧 New item detected - allowing grouping fields to be editable for proper categorization');
        return []; // No exclusions for new items
      }
      
      const effectiveStrategy = groupingStrategy.strategy_type;
      
      const fields: string[] = [];
      
      // Handle 2-tier grouping
      const strategyConfig = groupingStrategy.strategy_config;
      let parsedConfig: any = null;
      try {
        parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
      } catch (error) {
        parsedConfig = null;
      }
      
      if (parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group) {
        // 2-tier grouping: exclude both primary and secondary fields for existing items
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
        switch (effectiveStrategy) {
          case 'by_type':
            fields.push('type'); // ItemPrompt field
            break;
          case 'by_location':
            fields.push('room'); // Location field
            break;
          case 'by_brand':
            fields.push('model'); // Model field
            break;
          case 'by_value_range':
            fields.push('price'); // Price field
            break;
          default:
            // Unknown grouping strategy, no fields excluded
            break;
        }
      }
      
      return fields;
    };
    
    const groupingFields = getGroupingFields();

    // Get visible fields, exclude grouping fields, and sort by display_order
    const visibleFieldsBeforeGroupingFilter = effectiveFieldConfig
      .filter(field => field.display_on_ui === 1);
    
    const visibleFields = visibleFieldsBeforeGroupingFilter
      .filter(field => !groupingFields.includes(field.item_fields)) // Exclude grouping fields
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    if (__DEV__) {
      console.log('🔍 Visible fields being rendered:', visibleFields.map(f => f.item_fields));
      console.log('🔍 Grouping fields being excluded:', groupingFields);
    }
    
    // Debug: Check items for commaseparatedlist values
    const itemsWithCommaList = items.filter(item => item.commaseparatedlist);
    
    // Debug: Check if rank field is in dynamic field config
    const rankField = effectiveFieldConfig?.find(field => field.item_fields === 'rank');
    if (__DEV__) {
      console.log('🔍 Rank field in dynamic config:', rankField);
      console.log('🔍 All dynamic field config fields:', effectiveFieldConfig?.map(f => f.item_fields));
    }

    const renderField = (field: any) => {
      const fieldName = field.item_fields;
      
      // Process commaseparatedlist for selectedanswer field
      if (fieldName === 'selectedanswer' && item.commaseparatedlist) {
        if (__DEV__) console.log('🎯 Processing commaseparatedlist for selectedanswer field:', item.commaseparatedlist);
        
        // Parse the comma-separated list and create dropdown options
        const commaSeparatedOptions = item.commaseparatedlist.split(',').map(option => option.trim()).filter(option => option.length > 0);
        
        if (commaSeparatedOptions.length > 0) {
          // Create dropdown options from the comma-separated list and sort alphabetically
          const dropdownOptions = commaSeparatedOptions
            .map((option, index) => ({
              option_value: option,
              option_label: option,
              is_active: true
            }))
            .sort((a, b) => (a.option_label || '').localeCompare(b.option_label || ''));
          
          // Create a new field configuration with the dropdown options
          const enhancedField = {
            ...field,
            dropdownOptions: dropdownOptions,
            field_type: 'dropdown' // Use dropdown to match InlineDropdown
          };
          
          if (__DEV__) {
            console.log('🎯 Enhanced selectedanswer field with dropdown options:', {
              originalFieldType: field.field_type,
              enhancedFieldType: enhancedField.field_type,
              dropdownOptionsCount: enhancedField.dropdownOptions.length,
              dropdownOptions: enhancedField.dropdownOptions
            });
          }
          
          // Use the enhanced field for rendering
          field = enhancedField;
        }
      }
      
      // Create a local copy of the field for rendering
      let renderField = { ...field };
      
      // Debug logging for selectedanswer field
      if (__DEV__ && fieldName === 'selectedanswer') {
        console.log('🎯 Processing selectedanswer field for item:', item.id, {
          hasCommaseparatedlist: !!item.commaseparatedlist,
          commaseparatedlistValue: item.commaseparatedlist,
          dropdownOptionsCount: field.dropdownOptions?.length || 0
        });
      }
      
      // Get current value with proper fallback to original item values
      const getFieldValue = (fieldName: string) => {
        if (editData[fieldName] !== undefined) return editData[fieldName];
        
        // Fallback to original item values
        switch (fieldName) {
          case 'quantity': return getDefaultQuantity(item);
          case 'price': return (item.price && String(item.price) !== '0') ? String(item.price) : '';
          case 'description': return item.description || '';
          case 'model': return item.model || '';
          case 'room': return item.room || '';
          case 'notes': return item.notes || '';
          case 'type': return item.type || '';
          case 'selectedanswer': 
            if (__DEV__) {
              console.log(`🔍 [getFieldValue] selectedanswer for item ${itemId}:`, {
                itemSelectedAnswer: item.selectedanswer,
                itemId: item.id,
                itemType: typeof item.selectedanswer
              });
            }
            return item.selectedanswer || '';
          default:
            return (item as any)[fieldName] ?? '';
        }
      };
      
      const currentValue = getFieldValue(fieldName);
      const fieldError = itemErrors.find(e => e.fieldName === fieldName);
      
      // Debug logging for selectedanswer field rendering
      if (__DEV__ && fieldName === 'selectedanswer') {
        console.log('🎯 Rendering selectedanswer field with:', {
          fieldType: field.field_type,
          currentValue,
          hasDropdownOptions: !!field.dropdownOptions && field.dropdownOptions.length > 0,
          dropdownOptionsCount: field.dropdownOptions?.length || 0
        });
      }
      
      return (
        <View key={fieldName} style={[
          predefinedItemsListStyles.dynamicFieldContainer,
          field.field_type === 'notes' ? { width: '100%' } : { flex: 1 }
        ]}>
          {/* When no grouping strategy, do not render field label for any field */}
          {(!groupingStrategy) ? (
            (fieldName === 'type' || fieldName === 'ItemPrompt') ? (
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>
                {currentValue}
              </Text>
            ) : (
              <DynamicFieldRenderer
                field={renderField}
                value={currentValue}
                onChange={(fieldName, value) => handleEdit(itemId, fieldName, value)}
                validationError={fieldError}
                handwritingEnabled={false}
                onOpenHandwriting={() => {}}
                itemId={itemId}
                itemPhotos={itemPhotos}
                onTakePhoto={handleViewPhotos}
                hideLabel={true}
                // Avoid firing onBlur auto-save for dropdowns to prevent stale value saves
                onBlur={() => {
                  if (fieldName !== 'selectedanswer') {
                    // Get the current value from the field to avoid stale state
                    const currentValue = getFieldValue(fieldName);
                    autoSaveItem(itemId, { [fieldName]: currentValue });
                  }
                }}
                // Add data attributes for focus restoration
                dataAttributes={{
                  'data-item-id': itemId,
                  'data-field': fieldName
                }}
              />
            )
          ) : (
            <>
          <Text style={predefinedItemsListStyles.detailLabel}>{field.field_label}:</Text>
          <DynamicFieldRenderer
                field={renderField}
            value={currentValue}
            onChange={(fieldName, value) => handleEdit(itemId, fieldName, value)}
            validationError={fieldError}
            handwritingEnabled={false}
            onOpenHandwriting={() => {}}
            itemId={itemId}
            itemPhotos={itemPhotos}
            onTakePhoto={handleViewPhotos}
            hideLabel={true}
            onBlur={() => {
              if (fieldName !== 'selectedanswer') {
                // Get the current value from the field to avoid stale state
                const currentValue = getFieldValue(fieldName);
                autoSaveItem(itemId, { [fieldName]: currentValue });
              }
            }}
            // Add data attributes for focus restoration
            dataAttributes={{
              'data-item-id': itemId,
              'data-field': fieldName
            }}
          />
            </>
          )}
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
          <View style={predefinedItemsListStyles.detailRow}>
            <View style={[predefinedItemsListStyles.detailItem, { flex: 2 }]}>
              <Text style={predefinedItemsListStyles.detailLabel}>Item Type (Required):</Text>
              <PaperTextInput
                value={editData.type ?? (item.type || '')}
                onChangeText={(value) => handleEdit(itemId, 'type', value)}
                onBlur={() => {
                  const currentValue = editData.type ?? (item.type || '');
                  autoSaveItem(itemId, { type: currentValue });
                }}
                style={[predefinedItemsListStyles.editInput, { borderColor: editData.type ? '#e0e0e0' : '#f44336' }]}
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
              ? predefinedItemsListStyles.notesSection
              : predefinedItemsListStyles.detailRow
          ]}>
            {rowFields.map(field => renderField(field))}
          </View>
        ))}
      </>
    );
  }, [dynamicFieldConfig, categoryConfig, validationErrors, handleEdit, items, itemPhotos, handleViewPhotos, autoSaveItem, groupingStrategy, getDefaultQuantity]);

  // Helper function to check if a field should be visible
  const isFieldVisible = useCallback((fieldName: string) => {
    verboseLog(`=== FIELD VISIBILITY CHECK FOR '${fieldName}' ===`);
    verboseLog(`useCustomFields: ${useCustomFields}`);
    verboseLog(`dynamicFieldConfig length: ${dynamicFieldConfig?.length || 0}`);
    verboseLog(`dynamicFieldConfig:`, JSON.stringify(dynamicFieldConfig, null, 2));
    
    // Try dynamic field configuration first
    if (dynamicFieldConfig && dynamicFieldConfig.length > 0) {
      verboseLog(`Searching for field '${fieldName}' in dynamic config...`);
      
      // Show all available fields
      dynamicFieldConfig.forEach((field, index) => {
        verboseLog(`  [${index}] item_fields: "${field.item_fields}", display_on_ui: ${field.display_on_ui}`);
      });
      
      const fieldConfig = dynamicFieldConfig.find(f => f.item_fields === fieldName);
      const isVisible = fieldConfig && fieldConfig.display_on_ui === 1;
      
      verboseLog(`Found field config:`, fieldConfig || 'NOT FOUND');
      verboseLog(`Field '${fieldName}': ${isVisible ? 'VISIBLE' : 'HIDDEN'} (dynamic config)`);
      verboseLog(`=== END FIELD VISIBILITY CHECK ===`);
      return isVisible;
    }
    
    // Fall back to legacy field configuration
    if (!useCustomFields || !fieldConfig || fieldConfig.length === 0) {
      // No custom configuration, show all fields
      debugLog(`Field '${fieldName}': visible (no custom config) - useCustomFields: ${useCustomFields}, fieldConfig: ${fieldConfig ? `array[${fieldConfig.length}]` : 'null/undefined'}`);
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
    const quantity = editData.quantity ?? getDefaultQuantity(item);
    const price = editData.price ?? ((item.price && String(item.price) !== '0') ? String(item.price) : '');
    const description = editData.description ?? (item.description || '');
    const model = editData.model ?? (item.model || '');
    const room = editData.room ?? (item.room || '');
    const notes = editData.notes ?? (item.notes || '');

    return (
      <>
        {/* Show type field for new custom items (not duplicates) */}
        {isNewItem && (
          <View style={predefinedItemsListStyles.detailRow}>
            <View style={[predefinedItemsListStyles.detailItem, { flex: 2 }]}>
              <Text style={predefinedItemsListStyles.detailLabel}>Item Type (Required):</Text>
              <PaperTextInput
                value={type}
                onChangeText={(value) => handleEdit(itemId, 'type', value)}
                onBlur={() => {
                  autoSaveItem(itemId, { type: type });
                }}
                style={[predefinedItemsListStyles.editInput, { borderColor: type ? '#e0e0e0' : '#f44336' }]}
                dense
                placeholder="Enter item type (e.g., 'Painting', 'Furniture', etc.)"
                autoFocus={true}
              />
            </View>
          </View>
        )}
        
        <View style={predefinedItemsListStyles.detailRow}>
          {isFieldVisible('description') && (
            <View style={predefinedItemsListStyles.detailItem}>
              <Text style={predefinedItemsListStyles.detailLabel}>Description:</Text>
              <PaperTextInput
                value={description}
                onChangeText={(value) => handleEdit(itemId, 'description', value)}
                onBlur={() => {
                  autoSaveItem(itemId, { description: description });
                }}
                style={predefinedItemsListStyles.editInput}
                dense
                placeholder="Enter description"
              />
            </View>
          )}
          {isFieldVisible('model') && (
            <View style={predefinedItemsListStyles.detailItem}>
              <Text style={predefinedItemsListStyles.detailLabel}>Model:</Text>
              <PaperTextInput
                value={model}
                onChangeText={(value) => handleEdit(itemId, 'model', value)}
                onBlur={() => {
                  autoSaveItem(itemId, { model: model });
                }}
                style={predefinedItemsListStyles.editInput}
                dense
                placeholder="Enter model"
              />
            </View>
          )}
        </View>

        <View style={predefinedItemsListStyles.detailRow}>
          {isFieldVisible('quantity') && (
            <View style={predefinedItemsListStyles.detailItem}>
              <Text style={predefinedItemsListStyles.detailLabel}>Quantity:</Text>
              <PaperTextInput
                value={quantity}
                onChangeText={(value) => handleEdit(itemId, 'quantity', value)}
                onBlur={() => {
                  autoSaveItem(itemId, { quantity: quantity });
                }}
                keyboardType="numeric"
                style={predefinedItemsListStyles.editInput}
                dense
                placeholder="1"
              />
            </View>
          )}
          {isFieldVisible('price') && (
            <View style={predefinedItemsListStyles.detailItem}>
              <Text style={predefinedItemsListStyles.detailLabel}>Price:</Text>
              <PaperTextInput
                value={price}
                onChangeText={(value) => handleEdit(itemId, 'price', value)}
                onBlur={() => {
                  autoSaveItem(itemId, { price: price });
                }}
                keyboardType="numeric"
                style={predefinedItemsListStyles.editInput}
                dense
                placeholder="0.00"
                left={<PaperTextInput.Affix text="R" />}
              />
            </View>
          )}
        </View>

        <View style={predefinedItemsListStyles.detailRow}>
          {isFieldVisible('room') && (
            <View style={predefinedItemsListStyles.detailItem}>
              <Text style={predefinedItemsListStyles.detailLabel}>Room:</Text>
              <PaperTextInput
                value={room}
                onChangeText={(value) => handleEdit(itemId, 'room', value)}
                onBlur={() => {
                  autoSaveItem(itemId, { room: room });
                }}
                style={predefinedItemsListStyles.editInput}
                dense
                placeholder="Enter room/location"
              />
            </View>
          )}
          {isFieldVisible('photos') && (
            <View style={predefinedItemsListStyles.detailItem}>
              <Text style={predefinedItemsListStyles.detailLabel}>Photos:</Text>
              <View style={predefinedItemsListStyles.photoSection}>
                <TouchableOpacity
                  style={predefinedItemsListStyles.photoButton}
                  onPress={() => {
                    console.log(`📸 Photo button pressed for item ${itemId}, current photos:`, itemPhotos[itemId]?.length || 0);
                    handleViewPhotos(itemId);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={(itemPhotos[itemId]?.length || 0) > 0 ? "image-multiple" : "camera"} 
                    size={16} 
                    color="#4a90e2" 
                  />
                  <Text style={predefinedItemsListStyles.photoButtonText}>
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
          <View style={predefinedItemsListStyles.notesSection}>
            <Text style={predefinedItemsListStyles.detailLabel}>Notes:</Text>
            <PaperTextInput
              value={notes}
              onChangeText={(value) => handleEdit(itemId, 'notes', value)}
              onBlur={() => {
                autoSaveItem(itemId, { notes: notes });
              }}
              style={predefinedItemsListStyles.editInputMultiline}
              multiline
              numberOfLines={2}
              dense
              placeholder="Add notes..."
            />
          </View>
        )}
      </>
    );
  }, [items, isFieldVisible, handleEdit, autoSaveItem, itemPhotos, handleViewPhotos, getDefaultQuantity]);

  return (
    <>
    <Card style={predefinedItemsListStyles.card}>
      <Card.Title title={categoryTitle}  />
      <Divider />
      
      <Card.Content style={predefinedItemsListStyles.predefinedContent}>
        <View style={predefinedItemsListStyles.scrollIndicator}>
          <MaterialCommunityIcons name="gesture-swipe-down" size={16} color="#7f8c8d" />
          <Text style={predefinedItemsListStyles.scrollHint}>Tap items to view and edit details</Text>
        </View>
        <ScrollView 
          ref={scrollViewRef}
          style={predefinedItemsListStyles.predefinedList}
          contentContainerStyle={predefinedItemsListStyles.predefinedListContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          refreshControl={<RefreshControl refreshing={syncing} onRefresh={handleSync} />}
        >
          {groupedItems === null ? (
            // Render all fields for all items in a single flat form (no per-item container)
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
          ) : isNestedGrouping(groupedItems) ? (
            // Render nested (2-tier) grouping
            Object.entries(groupedItems).sort(([a, aGroups], [b, bGroups]) => {
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
                    onPress={() => toggleGroupExpansion(primaryKey)}
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
                              onPress={() => toggleSecondaryGroup(primaryKey, secondaryKey)}
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
                                  
                                  // Check if this is a new custom item (starts with 'custom-new-' or 'duplicate-')
                                  const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');
                                  
                                  // Check if item has meaningful data captured
                                  const hasData = hasDataCaptured(item);
                                  
                                  // Create a summary for the item (description, model, or "Item #X")
                                  const itemSummary = description ? description 
                                                    : model ? model
                                                    : `Item #${index + 1}`;
                                  
                                  return (
                                    <View key={item.id} style={predefinedItemsListStyles.accordionContainer}>
                                      {/* Main item row - show summary instead of repeating the group name */}
                                      <TouchableOpacity 
                                        style={[
                                          predefinedItemsListStyles.predefinedItem,
                                          predefinedItemsListStyles.secondaryGroupItemRow, // Different styling for items within secondary groups
                                          index % 2 === 1 ? predefinedItemsListStyles.predefinedItemAlt : null,
                                          isExpanded ? predefinedItemsListStyles.predefinedItemExpanded : null,
                                          isAutoSaved ? predefinedItemsListStyles.predefinedItemAutoSaved : null
                                        ]}
                                        onPress={() => toggleExpansion(item.id)}
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
                                        <View style={predefinedItemsListStyles.expandedContent}>
                                          <View style={predefinedItemsListStyles.detailsContainer}>
                                            {/* Dynamic Item Details Grid */}
                                            <View style={predefinedItemsListStyles.detailsGrid}>
                                              {isDynamicFieldConfigLoading ? (
                                                <View style={predefinedItemsListStyles.fieldLoadingContainer}>
                                                  <ActivityIndicator size="small" color="#4a90e2" />
                                                  <Text style={predefinedItemsListStyles.fieldLoadingText}>Loading fields...</Text>
                                                </View>
                                              ) : (
                                                renderDynamicFields(itemId, editItems[itemId] || {})
                                              )}
                                            </View>

                                            {/* Action buttons */}
                                            <View style={predefinedItemsListStyles.actionButtonsContainer}>
                                                                      {isNewItem && (
                          <TouchableOpacity
                            style={[predefinedItemsListStyles.saveButton, { opacity: type ? 1 : 0.5 }]}
                            onPress={() => explicitSaveItem(itemId)}
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
                                                  onPress={() => duplicateItem(item)}
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
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            // Render flat (single-tier) grouping  
            Object.entries(groupedItems as FlatGroups).sort(([a, aItems], [b, bItems]) => {
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
                  onPress={() => toggleGroupExpansion(groupKey)}
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
            
            // Check if this is a new custom item (starts with 'custom-new-' or 'duplicate-')
            const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');
            
            // Check if item has meaningful data captured
            const hasData = hasDataCaptured(item);
            
            // Create a summary for the item (description, model, or "Item #X")
            const itemSummary = description ? description 
                              : model ? model
                              : `Item #${index + 1}`;
            
            return (
              <View key={item.id} style={predefinedItemsListStyles.accordionContainer}>
                {/* Main item row - show summary instead of repeating the group name */}
                <TouchableOpacity 
                  style={[
                    predefinedItemsListStyles.predefinedItem,
                    predefinedItemsListStyles.groupItemRow, // Different styling for items within groups
                    index % 2 === 1 ? predefinedItemsListStyles.predefinedItemAlt : null,
                    isExpanded ? predefinedItemsListStyles.predefinedItemExpanded : null,
                    isAutoSaved ? predefinedItemsListStyles.predefinedItemAutoSaved : null
                  ]}
                  onPress={() => toggleExpansion(item.id)}
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
                  <View style={predefinedItemsListStyles.expandedContent}>
                    <View style={predefinedItemsListStyles.detailsContainer}>
                      {/* Dynamic Item Details Grid */}
                      <View style={predefinedItemsListStyles.detailsGrid}>
                        {isDynamicFieldConfigLoading ? (
                          <View style={predefinedItemsListStyles.fieldLoadingContainer}>
                            <ActivityIndicator size="small" color="#4a90e2" />
                            <Text style={predefinedItemsListStyles.fieldLoadingText}>Loading fields...</Text>
                          </View>
                        ) : (
                          renderDynamicFields(itemId, editItems[itemId] || {})
                        )}
                      </View>

                      {/* Action buttons */}
                      <View style={predefinedItemsListStyles.actionButtonsContainer}>
                        {isNewItem && (
                          <TouchableOpacity
                            style={[predefinedItemsListStyles.saveButton, { opacity: type ? 1 : 0.5 }]}
                            onPress={() => explicitSaveItem(itemId)}
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
                            onPress={() => duplicateItem(item)}
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
            })
          )}
          
          {(groupedItems === null ? items.length === 0 : (isNestedGrouping(groupedItems) ? Object.keys(groupedItems).length === 0 : Object.keys(groupedItems as FlatGroups).length === 0)) && (
            <View style={predefinedItemsListStyles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#bdc3c7" />
              <Text style={predefinedItemsListStyles.emptyStateText}>No predefined items found</Text>
              <Text style={predefinedItemsListStyles.emptyStateSubtext}>Try refreshing or add custom items</Text>
            </View>
          )}
        </ScrollView>
        {(groupedItems === null ? items.length > 10 : (isNestedGrouping(groupedItems) ? Object.keys(groupedItems).length > 3 : Object.keys(groupedItems as FlatGroups).length > 3)) && (
          <View style={predefinedItemsListStyles.scrollIndicator}>
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

