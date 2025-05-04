import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert, Text } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import categoryItemsApi from '../../services/categoryItemsApi';
import {
  Item,
  itemUtils,
  roomsForCategory,
  styles as componentStyles,
  AddItemButton,
  PredefinedItemsList,
  EmptyState,
  ItemsTable,
  FormInputField,
  RoomSelector,
  FormButtons,
  PhotoPreview,
  ItemFormHeader,
  HandwritingModal,
  CameraModal,
  DynamicForm
} from './components/ItemComponents';
import { getCategoryConfig, getRoomsForCategory } from '../../config/categories';

export default function SectionAItemsScreen() {
  const params = useLocalSearchParams();
  const { categoryId, categoryTitle, surveyId, useHandwriting } = params;
  
  console.log('Section A Route params:', { categoryId, categoryTitle, surveyId, useHandwriting });
  
  const [showForm, setShowForm] = useState(false);
  const [predefinedItems, setPredefinedItems] = useState<Item[]>([]);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<Item>({
    id: '',
    type: '',
    description: '',
    room: '',
    quantity: '1',
    price: '',
    notes: '',
    model: '',
    selection: '',
    categoryId: categoryId as string
  });
  
  // Handwriting recognition states
  const [showHandwritingModal, setShowHandwritingModal] = useState(false);
  const [currentField, setCurrentField] = useState<keyof Item>('description');
  const [paths, setPaths] = useState<{path: string; color: string}[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  
  // Get category configuration
  const categoryConfig = getCategoryConfig(categoryId as string);
  
  // Check if the category has rooms
  const categoryRooms = getRoomsForCategory(categoryId as string);
  const hasRooms = categoryRooms.length > 0;
  
  // Check if handwriting mode is enabled
  const handwritingEnabled = useHandwriting === '1';

  // Load saved user items from storage when the screen loads
  useEffect(() => {
    const loadItems = async () => {
      const items = await itemUtils.loadUserItems(categoryId as string);
      setUserItems(items);
    };
    
    loadItems();
  }, [categoryId]);

  // Normalize category ID to match the format in categoryItemsApi
  const normalizeCategoryId = (id: string): string => {
    console.log('Normalizing category ID:', id);
    
    // Map from URL param IDs to API IDs
    const categoryIdMap: Record<string, string> = {
      'clothing-gents-boys': 'a7',
      'clothing-ladies-girls': 'a8',
      'antiques': 'a1',
      'cat1': 'cat-1',
    };

    // Check if we have a mapping for this ID
    if (categoryIdMap[id]) {
      return categoryIdMap[id];
    }

    // Try to match based on the category title
    const catTitle = (params.categoryTitle as string || '').toLowerCase();
    
    if (catTitle.includes('gents') || catTitle.includes('boys')) {
      return 'a7';
    } else if (catTitle.includes('ladies') || catTitle.includes('girls')) {
      return 'a8';
    } else if (catTitle.includes('antiques')) {
      return 'a1';
    } else if (catTitle.includes('clothing')) {
      return 'cat-1';
    }

    // If no mapping, return the original ID
    return id;
  };

  // Fetch items from API when screen loads
  useEffect(() => {
    fetchCategoryItems();
  }, [categoryId]);

  const fetchCategoryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Special case for cat1 which maps to "CLOTHING (GENTS / BOYS)"
      if (categoryId === 'cat1' || categoryId === 'cat-1') {
        const response = await categoryItemsApi.getCategoryItems('cat-1');
        if (response.success) {
          const formattedItems = response.data.map((item: any) => ({
            ...item,
            quantity: item.quantity?.toString() || '1',
            price: item.price?.toString() || '0',
            room: '',
            notes: '',
            categoryId: categoryId as string
          }));
          setPredefinedItems(formattedItems);
          setLoading(false);
          return;
        }
      }

      const normalizedCategoryId = normalizeCategoryId(categoryId as string);
      const response = await categoryItemsApi.getCategoryItems(normalizedCategoryId);
      if (response.success) {
        // Transform the API items to match our interface
        const formattedItems = response.data.map((item: any) => ({
          ...item,
          quantity: item.quantity?.toString() || '1',
          price: item.price?.toString() || '0',
          room: '',
          notes: '',
          categoryId: categoryId as string
        }));
        setPredefinedItems(formattedItems);
      } else {
        setError('Failed to load category items');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Touch handlers for drawing
  const onTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(`M${locationX},${locationY}`);
  };
  
  const onTouchMove = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
  };
  
  const onTouchEnd = () => {
    if (currentPath) {
      setPaths(prev => [...prev, { path: currentPath, color: strokeColor }]);
      setCurrentPath('');
    }
  };
  
  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
    setRecognizedText('');
  };
  
  const recognizeHandwriting = () => {
    // Simulate handwriting recognition with a mock response
    // In a real app, this would call an OCR service
    setTimeout(() => {
      setRecognizedText('Recognized text sample');
    }, 1000);
  };
  
  const confirmHandwriting = () => {
    if (recognizedText) {
      setCurrentItem(prev => ({ ...prev, [currentField]: recognizedText }));
      setShowHandwritingModal(false);
      clearCanvas();
    }
  };
  
  const openHandwritingModal = (field: keyof Item) => {
    setCurrentField(field);
    setShowHandwritingModal(true);
    clearCanvas();
  };
  
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1.0,
        allowsMultipleSelection: false,
        exif: true
      });
      
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        setCurrentItem(prev => ({ ...prev, photo: result.assets[0].uri }));
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1.0,
        allowsMultipleSelection: false,
        exif: true
      });
      
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        setCurrentItem(prev => ({ ...prev, photo: result.assets[0].uri }));
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };
  
  const addItem = async () => {
    // Only proceed if required fields are filled
    if (isFormValid()) {
      // Create a new item with only the necessary fields based on category config
      const newItemData: Partial<Item> = {
        id: itemUtils.generateItemId(),
        type: currentItem.type,
        description: currentItem.description,
        photo: currentItem.photo,
        categoryId: categoryId as string
      };
      
      // Add room if applicable
      if (hasRooms && currentItem.room) {
        newItemData.room = currentItem.room;
      }
      
      // Add fields based on category configuration
      if (categoryConfig) {
        categoryConfig.fields.forEach(field => {
          const key = field.key as keyof Item;
          if (currentItem[key]) {
            (newItemData as any)[key] = currentItem[key];
          }
        });
      } else {
        // Fallback if no config is available
        newItemData.quantity = currentItem.quantity || '1';
        newItemData.price = currentItem.price;
        newItemData.notes = currentItem.notes;
      }
      
      // Cast to Item and ensure all required properties are present
      const newItem: Item = {
        id: newItemData.id || itemUtils.generateItemId(),
        type: newItemData.type || '',
        description: newItemData.description || '',
        room: newItemData.room || '',
        quantity: newItemData.quantity || '',
        price: newItemData.price || '',
        notes: newItemData.notes || '',
        photo: newItemData.photo,
        make: newItemData.make || '',
        model: newItemData.model || '',
        selection: newItemData.selection || '',
        serialNumber: newItemData.serialNumber || '',
        categoryId: categoryId as string
      };
      
      // Update local state
      const updatedItems = [...userItems, newItem];
      setUserItems(updatedItems);
      
      // Persist to storage
      await itemUtils.saveUserItems(updatedItems, categoryId as string);
      
      // Reset form fields
      const resetItem: Partial<Item> = {
        id: '',
        type: currentItem.type ? currentItem.type : '',
        description: currentItem.type ? currentItem.description : '',
        categoryId: categoryId as string
      };
      
      // Keep default values based on category configuration
      if (categoryConfig) {
        categoryConfig.fields.forEach(field => {
          if (field.key === 'price') {
            resetItem.price = '';
          }
        });
      } else {
        resetItem.price = '';
      }
      
      // Ensure all required Item properties have defaults
      resetItem.quantity = resetItem.quantity || '';
      resetItem.price = resetItem.price || '';
      resetItem.notes = resetItem.notes || '';
      resetItem.room = resetItem.room || '';
      
      setCurrentItem(resetItem as Item);
      
      // Close form if not from predefined item
      if (!currentItem.type) {
        setShowForm(false);
      }
    }
  };
  
  const deleteItem = async (itemId: string) => {
    // Update local state
    const updatedItems = userItems.filter(item => item.id !== itemId);
    setUserItems(updatedItems);
    
    // Persist to storage
    await itemUtils.saveUserItems(updatedItems, categoryId as string);
  };
  
  const selectPredefinedItem = (item: Item) => {
    // Create a new item object with only the fields defined in category config
    const newItem: Partial<Item> = {
      id: '',
      type: item.type,
      description: item.description || item.type,
      room: '',
      // Only include fields that are in the category config
      categoryId: categoryId as string
    };
    
    // Add fields based on category configuration
    if (categoryConfig) {
      categoryConfig.fields.forEach(field => {
        // Set default values for required fields
        if (field.key === 'quantity' && field.required) {
          newItem.quantity = '1';
        } else if (field.key === 'price' && field.required) {
          newItem.price = item.price || '0';
        }
      });
    } else {
      // Fallback if no config available
      newItem.quantity = '1';
      newItem.price = item.price || '0';
    }
    
    // Ensure all required Item properties are initialized with defaults
    newItem.quantity = newItem.quantity || '';
    newItem.price = newItem.price || '';
    newItem.notes = newItem.notes || '';
    
    setCurrentItem(newItem as Item);
    setShowForm(true);
  };
  
  const totalValue = itemUtils.calculateTotalValue(userItems);

  // Determine which fields are required for form validation
  const isFormValid = () => {
    if (!currentItem.description) return false;
    
    if (categoryConfig) {
      // Check all required fields based on category config
      return categoryConfig.fields
        .filter(field => field.required)
        .every(field => !!(currentItem as any)[field.key]);
    }
    
    // Fallback: just require description and price
    return !!currentItem.description && !!currentItem.price;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: categoryTitle as string,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a90e2" />
              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button 
                mode="contained" 
                onPress={fetchCategoryItems}
                style={styles.retryButton}
              >
                Retry
              </Button>
            </View>
          ) : (
            <>
              {!showForm ? (
                <>
                  <AddItemButton 
                    onPress={() => {
                      // Reset current item when adding a new item
                      setCurrentItem({
                        id: '',
                        type: '',
                        description: '',
                        room: '',
                        quantity: '1',
                        price: '',
                        notes: '',
                        model: '',
                        selection: '',
                        categoryId: categoryId as string
                      });
                      setShowForm(true);
                    }}
                    itemCount={userItems.length}
                    totalValue={totalValue}
                  />
                  
                  <PredefinedItemsList 
                    items={predefinedItems}
                    categoryTitle={categoryTitle as string}
                    onSelectItem={selectPredefinedItem}
                  />
                </>
              ) : (
                <Card style={styles.card}>
                  <ItemFormHeader 
                    title="Add New Item"
                    onPhoto={() => setShowCamera(true)}
                  />
                  <Card.Content>
                    <PhotoPreview photoUri={photo} />
                    
                    {/* Dynamic form based on category configuration */}
                    <DynamicForm 
                      item={currentItem}
                      onChangeItem={setCurrentItem}
                      categoryId={categoryId as string}
                      handwritingEnabled={handwritingEnabled}
                      onHandwriting={openHandwritingModal}
                    />
                    
                    {/* Room selector - only if the category supports rooms */}
                    {hasRooms && (
                      <RoomSelector
                        rooms={categoryRooms}
                        selectedRoom={currentItem.room}
                        onSelectRoom={(room) => setCurrentItem({ ...currentItem, room })}
                      />
                    )}
              
                    <FormButtons
                      onCancel={() => setShowForm(false)}
                      onSave={addItem}
                      saveDisabled={!isFormValid()}
                    />
                  </Card.Content>
                </Card>
              )}

              {!showForm && userItems.length > 0 ? (
                <ItemsTable
                  items={userItems}
                  onDeleteItem={deleteItem}
                  showRoom={hasRooms}
                />
              ) : !showForm && (
                <EmptyState />
              )}
            </>
          )}
        </ScrollView>

        {!showForm && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              Done
            </Button>
          </View>
        )}
      </View>

      <HandwritingModal
        visible={showHandwritingModal}
        onClose={() => setShowHandwritingModal(false)}
        onClear={clearCanvas}
        onRecognize={recognizeHandwriting}
        onConfirm={confirmHandwriting}
        paths={paths}
        currentPath={currentPath}
        strokeColor={strokeColor}
        recognizedText={recognizedText}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onTakePhoto={takePhoto}
        onSelectFromGallery={selectFromGallery}
      />
    </>
  );
}

// Local styles to supplement component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 2,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  doneButton: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#2c3e50',
  },
}); 