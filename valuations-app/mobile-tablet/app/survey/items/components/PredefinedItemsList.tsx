import React, { useState, useEffect } from 'react';
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
  isOffline, 
  fromCache, 
  onRefresh, 
  onSelectItem 
}: PredefinedItemsListProps) {
  
  // Manage local items state like ItemsTable does
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
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
  const handleEdit = (id: string, field: 'quantity' | 'price' | 'description' | 'model' | 'room' | 'notes', value: string) => {
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

      // First, get the existing RiskAssessmentItem from SQLite to preserve all fields
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
      
      // Mark as auto-saved but keep the changes visible
      setAutoSavedItems(prev => ({ ...prev, [id]: true }));

      // Update local items state immediately after database update (following ItemsTable pattern)
      // This ensures UI shows the saved changes even after sync completes
      setItems(prevItems => 
        prevItems.map(prevItem => 
          String(prevItem.id) === id ? {
            ...prevItem,
            quantity: String(updated.qty),
            price: String(updated.price),
            description: updated.description || '',
            model: updated.model || '',
            room: updated.location || '',
            notes: updated.notes || ''
          } : prevItem
        )
      );

      // Update pending changes count immediately after database update
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingChangesCount(count.total);

      console.log('=== PREDEFINED ITEMS: Auto-save completed successfully ===');
      console.log('Item ID:', id);
      console.log('Updated record sent to database:', JSON.stringify(updated, null, 2));
    } catch (error) {
      console.error('Auto-save failed for predefined item:', id, error);
    }
  };

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

  const toggleExpansion = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const handleSelectItem = (item: Item) => {
    // Close accordion and pass to form
    setExpandedItem(null);
    onSelectItem(item);
  };

  return (
    <>
    <Card style={styles.card}>
      <Card.Title title="Predefined Items New" subtitle={`Select from ${categoryTitle}`} />
      <Divider />
      
      {/* Sync indicator and button */}
      <View style={styles.syncContainer}>
        <Button
          mode="outlined"
          onPress={handleSync}
          disabled={syncing || pendingChangesCount === 0}
          loading={syncing}
          style={{ 
            borderColor: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
          }}
          contentStyle={{ height: 35 }}
          labelStyle={{ 
            color: pendingChangesCount > 0 ? '#4CAF50' : '#ccc', 
            fontWeight: 'bold',
            fontSize: 12
          }}
          icon="cloud-upload"
        >
          {syncing ? 'Syncing...' : `Sync (${pendingChangesCount})`}
        </Button>
      </View>

      {/* Status messages */}
      {syncStatus === 'success' && <Text style={styles.successMessage}>{syncMessage}</Text>}
      {syncStatus === 'error' && <Text style={styles.errorMessage}>{syncMessage}</Text>}

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
          {items.map((item: Item, index: number) => {
            const isExpanded = expandedItem === item.id;
            const itemId = String(item.id);
            const isAutoSaved = autoSavedItems[itemId];
            
            // Get current field values (edited or original)
            const quantity = editItems[itemId]?.quantity ?? String(item.quantity || '1');
            const price = editItems[itemId]?.price ?? String(item.price || '0');
            const description = editItems[itemId]?.description ?? (item.description || 'Not specified');
            const model = editItems[itemId]?.model ?? (item.model || 'Not specified');
            const room = editItems[itemId]?.room ?? (item.room || 'Not specified');
            const notes = editItems[itemId]?.notes ?? (item.notes || '');
            
            return (
              <View key={item.id} style={styles.accordionContainer}>
                {/* Main item row */}
                <TouchableOpacity 
                  style={[
                    styles.predefinedItem,
                    index % 2 === 1 ? styles.predefinedItemAlt : null,
                    isExpanded ? styles.predefinedItemExpanded : null,
                    isAutoSaved ? styles.predefinedItemAutoSaved : null
                  ]}
                  onPress={() => toggleExpansion(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.predefinedItemType} numberOfLines={1} ellipsizeMode="tail">
                    {item.type}
                  </Text>
                  {isAutoSaved && (
                    <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" style={{ marginRight: 8 }} />
                  )}
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
                        <View style={styles.detailRow}>
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
                        </View>

                        <View style={styles.detailRow}>
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
                        </View>

                        <View style={styles.detailRow}>
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
                        </View>

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
                      </View>

                      {/* Action button */}
                      <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => handleSelectItem(item)}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                        <Text style={styles.selectButtonText}>Add to My Items</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          
          {items.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No predefined items found</Text>
              <Text style={styles.emptyStateSubtext}>Try refreshing or add custom items</Text>
            </View>
          )}
        </ScrollView>
        {items.length > 6 && (
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
  card: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  syncContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  successMessage: {
    color: '#4CAF50',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#f0f8f0',
  },
  errorMessage: {
    color: '#f44336',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#fef0f0',
  },
  predefinedContent: {
    padding: 0,
    paddingVertical: 8,
  },
  predefinedListContent: {
    paddingHorizontal: 16,
  },
  predefinedList: {
    maxHeight: 400, // Increased to accommodate expanded content
    minHeight: 100,
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
  selectButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
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
}); 