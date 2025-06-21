import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Divider, Button, TextInput as PaperTextInput, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PredefinedItemsListProps, Item } from './types';
import ItemStates from './ItemStates';
import CameraModal from './CameraModal';
import PhotoGalleryModal from './PhotoGalleryModal';
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
  useCustomFields = false,
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
  
  // Manage local items state like ItemsTable does
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  // Editing state management
  const [editItems, setEditItems] = useState<{ [key: string]: any }>({});
  const [autoSavedItems, setAutoSavedItems] = useState<{ [key: string]: boolean }>({});
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

  // Initialize local items state with props items (same pattern as ItemsTable)
  useEffect(() => {
    if (propsItems && propsItems.length > 0) {
      console.log('PredefinedItemsList: Initializing local state with props items:', propsItems.length);
      setItems(propsItems);
    }
  }, [propsItems]);

  // Function to add a new custom item to the list
  const addNewCustomItem = useCallback(() => {
    console.log('PredefinedItemsList: addNewCustomItem called!');
    const newItem: Item = {
      id: `custom-new-${Date.now()}`,
      type: '', // Empty - user will fill this in
      description: '',
      model: '',
      quantity: '1',
      price: '0',
      room: '',
      notes: '',
      categoryId: categoryId // Use the categoryId prop
    };
    
    console.log('PredefinedItemsList: Creating new item:', newItem);
    
    // Add to local items state
    setItems(prevItems => {
      console.log('PredefinedItemsList: Adding new item to list, current items:', prevItems.length);
      return [newItem, ...prevItems];
    });
    
    // Immediately expand the new item for editing
    setExpandedItem(newItem.id);
    console.log('PredefinedItemsList: Expanded item set to:', newItem.id);
    
    // Set it as being edited
    setEditItems(prev => ({
      ...prev,
      [newItem.id]: {
        type: '',
        description: '',
        model: '',
        quantity: '1',
        price: '0',
        room: '',
        notes: ''
      }
    }));
    console.log('PredefinedItemsList: Edit state set for new item');
  }, [categoryId]);

  // Expose the addNewCustomItem function to parent component
  useEffect(() => {
    console.log('PredefinedItemsList: onAddNewItem prop:', onAddNewItem);
    if (onAddNewItem) {
      console.log('PredefinedItemsList: Passing addNewCustomItem function to parent');
      onAddNewItem(addNewCustomItem);
    }
  }, [onAddNewItem, addNewCustomItem]);

  // Expose sync status to parent component
  useEffect(() => {
    if (onSyncStatusChange) {
      onSyncStatusChange(pendingChangesCount, syncing);
    }
  }, [pendingChangesCount, syncing, onSyncStatusChange]);

  // Expose sync function to parent component
  useEffect(() => {
    if (onSyncRequest) {
      onSyncRequest(handleSync);
    }
  }, [onSyncRequest]);

  // Calculate and expose totals to parent component
  const calculateTotals = useCallback(() => {
    let itemCount = 0;
    let totalValue = 0;

    items.forEach(item => {
      const itemId = String(item.id);
      const editedItem = editItems[itemId];
      
      // Count item if it has been edited and has a quantity > 0, or if it's an original item with values
      const quantity = editedItem?.quantity ? parseInt(editedItem.quantity, 10) : parseInt(item.quantity || '0', 10);
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

  // Check if an item has meaningful data captured
  const hasDataCaptured = useCallback((item: Item) => {
    const itemId = String(item.id);
    const editedItem = editItems[itemId];
    
    // Get current values (edited or original)
    const quantity = editedItem?.quantity ? parseInt(editedItem.quantity, 10) : parseInt(item.quantity || '0', 10);
    const price = editedItem?.price ? parseFloat(editedItem.price) : parseFloat(item.price || '0');
    const description = editedItem?.description || item.description || '';
    
    // Has data if (quantity > 0 and price > 0) OR description is not empty
    return (quantity > 0 && price > 0) || (description && description.trim() !== '');
  }, [editItems]);

  // Handle sync
  const handleSync = async () => {
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
  };

  // Expose totals to parent component
  useEffect(() => {
    if (onTotalsChange) {
      const { itemCount, totalValue } = calculateTotals();
      onTotalsChange(itemCount, totalValue);
    }
  }, [onTotalsChange, calculateTotals]);

  // Load pending changes count on mount and when items change
  useEffect(() => {
    const loadPendingChangesCount = async () => {
      try {
        const count = await riskAssessmentSyncService.getPendingChangesCount();
        setPendingChangesCount(count.total);
      } catch (error) {
        console.error('Error loading pending changes count:', error);
      }
    };
    
    loadPendingChangesCount();
  }, [items]);

  // Load photos for items
  useEffect(() => {
    loadPhotosForItems();
  }, [items]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission', 
          'Please grant camera permissions to take photos of items.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const loadPhotosForItems = async () => {
    console.log('PredefinedItemsList: Loading photos for items...');
    const photoMap: { [key: string]: MediaFile[] } = {};
    
    for (const item of items) {
      const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(item.id));
      photoMap[String(item.id)] = photos;
      console.log(`PredefinedItemsList: Item ${item.id} has ${photos.length} photos`);
    }
    
    setItemPhotos(photoMap);
    console.log('PredefinedItemsList: Photos loaded, total items with photos:', Object.keys(photoMap).filter(key => photoMap[key].length > 0).length);
  };

  // Handle editing a field
  const handleEdit = (id: string, field: 'type' | 'quantity' | 'price' | 'description' | 'model' | 'room' | 'notes', value: string) => {
    setEditItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Auto-save function that saves changes to SQLite
  const autoSaveItem = async (id: string) => {
    const changes = editItems[id];
    if (!changes) return; // No changes to save

    try {
      const item = items.find(i => String(i.id) === id);
      if (!item) return;

      console.log('=== PREDEFINED ITEMS: Auto-saving item ===');
      console.log('Item ID:', id);
      console.log('Changes:', changes);

      const isNewItem = id.startsWith('custom-new-') || id.startsWith('duplicate-');
      
      if (isNewItem) {
        // Handle new custom items - insert them into SQLite
        console.log('Inserting new custom item into SQLite');
        
        // For new items, require at least the type to be filled
        if (!changes.type || changes.type.trim() === '') {
          console.log('New item requires type field - skipping save');
          return;
        }
        
        const { insertRiskAssessmentItem } = await import('../../../../utils/db');
        
        // Create a new SQLite record for the custom item
        const newSqliteItem = {
          riskassessmentitemid: Date.now(), // Use timestamp as unique ID
          riskassessmentcategoryid: Number(item.categoryId) || 0,
          itemprompt: changes.type || '',
          itemtype: 1, // Custom item type
          rank: 0,
          commaseparatedlist: '',
          selectedanswer: '',
          qty: Number(changes.quantity) || 1,
          price: Number(changes.price) || 0,
          description: changes.description || '',
          model: changes.model || '',
          location: changes.room || '',
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
          notes: changes.notes || '',
          pending_sync: 1 // Mark for sync
        };
        
        await insertRiskAssessmentItem(newSqliteItem);
        
        // Update the item ID to match the SQLite ID for future updates
        const newId = String(newSqliteItem.riskassessmentitemid);
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === id ? { ...prevItem, id: newId } : prevItem
          )
        );
        
        // Update edit items with new ID
        setEditItems(prev => {
          const newEditItems = { ...prev };
          if (newEditItems[id]) {
            newEditItems[newId] = newEditItems[id];
            delete newEditItems[id];
          }
          return newEditItems;
        });
        
        // Update expanded item if needed
        if (expandedItem === id) {
          setExpandedItem(newId);
        }
        
        console.log('New custom item inserted successfully with ID:', newId);
        
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
          qty: Number(changes.quantity ?? existingItem.qty) || 0,
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
              quantity: String(updated.qty),
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
      setAutoSavedItems(prev => ({ ...prev, [id]: true }));

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

        // Reload photos for this item
        console.log('PredefinedItemsList: Reloading photos after taking photo...');
        await loadPhotosForItems();
        console.log('PredefinedItemsList: Photos reloaded after taking photo');
        
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

        // Reload photos for this item
        console.log('PredefinedItemsList: Reloading photos after selecting from gallery...');
        await loadPhotosForItems();
        console.log('PredefinedItemsList: Photos reloaded after selecting from gallery');
        
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
      
      // Reload photos for all items
      await loadPhotosForItems();
      
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
      const groupItems = groupedItems[groupKey] || [];
      if (groupItems.length === 1) {
        // If only one item, expand it immediately
        setExpandedItem(groupItems[0].id);
      }
      // For multiple items, let user choose which one to expand
    } else {
      // Collapsing: collapse any expanded item
      setExpandedItem(null);
    }
  };

  // Function to duplicate an item with the same itemprompt
  const duplicateItem = useCallback((originalItem: Item) => {
    console.log('Duplicating item with itemprompt:', originalItem.type);
    
    const duplicatedItem: Item = {
      id: `duplicate-${Date.now()}`,
      type: originalItem.type, // Keep the same itemprompt
      description: '',
      model: '',
      quantity: '1',
      price: '0',
      room: '',
      notes: '',
      categoryId: categoryId
    };
    
    // Add to local items state
    setItems(prevItems => [...prevItems, duplicatedItem]);
    
    // Auto-expand the group containing this item
    setExpandedGroup(originalItem.type);
    
    // Immediately expand the new item for editing
    setExpandedItem(duplicatedItem.id);
    
    // Set it as being edited
    setEditItems(prev => ({
      ...prev,
      [duplicatedItem.id]: {
        type: duplicatedItem.type,
        description: '',
        model: '',
        quantity: '1',
        price: '0',
        room: '',
        notes: ''
      }
    }));
    
    console.log('Duplicated item created:', duplicatedItem);
  }, [categoryId]);

  // Helper function to check if a field should be visible
  const isFieldVisible = useCallback((fieldName: string) => {
    console.log(`🔍 Checking field '${fieldName}' - useCustomFields: ${useCustomFields}, fieldConfig:`, fieldConfig);
    
    if (!useCustomFields || !fieldConfig || fieldConfig.length === 0) {
      // No custom configuration, show all fields
      console.log(`Field '${fieldName}': visible (no custom config) - useCustomFields: ${useCustomFields}, fieldConfig: ${fieldConfig ? `array[${fieldConfig.length}]` : 'null/undefined'}`);
      return true;
    }
    
    // Map UI field names to API field names
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
  }, [useCustomFields, fieldConfig]);

  // Group items by itemprompt (type)
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: Item[] } = {};
    
    items.forEach(item => {
      const itemId = String(item.id);
      const type = editItems[itemId]?.type ?? (item.type || '');
      const groupKey = type || 'Unknown Items';
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  }, [items, editItems]);

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
          style={styles.predefinedList}
          contentContainerStyle={styles.predefinedListContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {Object.entries(groupedItems).map(([groupKey, groupItems], groupIndex) => {
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
                  <Text style={styles.groupTitle} numberOfLines={1} ellipsizeMode="tail">
                    {groupKey}
                  </Text>
                  
                  {/* Group indicators */}
                  <View style={styles.groupIndicators}>
                    {groupItemCount > 1 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{groupItemCount}</Text>
                      </View>
                    )}
                    
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
            const price = editItems[itemId]?.price ?? String(item.price || '0');
            const description = editItems[itemId]?.description ?? (item.description || 'Not specified');
            const model = editItems[itemId]?.model ?? (item.model || 'Not specified');
            const room = editItems[itemId]?.room ?? (item.room || 'Not specified');
            const notes = editItems[itemId]?.notes ?? (item.notes || '');
            
            // Check if this is a new custom item (starts with 'custom-new-' or 'duplicate-')
            const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');
            
            // Check if item has meaningful data captured
            const hasData = hasDataCaptured(item);
            
            // Create a summary for the item (description, model, or "Item #X")
            const itemSummary = description !== 'Not specified' ? description 
                              : model !== 'Not specified' ? model
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
                      {/* Editable Item Details Grid */}
                      <View style={styles.detailsGrid}>
                        {/* Show type field for new custom items (not duplicates) */}
                        {item.id.startsWith('custom-new-') && (
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
          
          {Object.keys(groupedItems).length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No predefined items found</Text>
              <Text style={styles.emptyStateSubtext}>Try refreshing or add custom items</Text>
            </View>
          )}
        </ScrollView>
        {Object.keys(groupedItems).length > 3 && (
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
}); 