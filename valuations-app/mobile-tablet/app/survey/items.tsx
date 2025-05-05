import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, TextInput, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { Button, Card, IconButton, Divider, DataTable, Switch } from 'react-native-paper';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import categoryItemsApi from '../../services/categoryItemsApi';
import api from '../../api';
// Use require instead of import to avoid type declaration issues
const ImagePicker = require('expo-image-picker');
import { logNavigation } from '../../utils/logger';
import ConnectionStatus from '../../components/ConnectionStatus';
import connectionUtils from '../../utils/connectionUtils';

// Categories with rooms for furniture
const roomsForCategory: Record<string, string[]> = {
  'cat-2': [
    'Lounge', 'Kitchen', 'Entrance', 'Family', 'Main Bedroom', 'Bedroom 2', 
    'Bedroom 3', 'Dining', 'Study', 'Bathroom 1', 'Bathroom 2', 'Laundry'
  ]
};

// Define the item type to prevent type errors
interface Item {
  id: string;
  type: string;
  description: string;
  room: string;
  quantity: string;
  price: string;
  notes: string;
  photo?: string;
  model?: string;
  selection?: string;
}

// Define the API response type
interface ApiResponse {
  success: boolean;
  data: any[];
  message?: string;
  status?: number;
  fromCache?: boolean;
}

interface CategoryIdMapping {
  [key: string]: string;
}

export default function ItemsScreen() {
  logNavigation('Survey Items');
  
  // Get router instance
  const router = useRouter();
  
  const params = useLocalSearchParams();
  const { categoryId, categoryTitle, surveyId, useHandwriting, templateId } = params;
  
  console.log('Route params:', { categoryId, categoryTitle, surveyId, useHandwriting, templateId });
  
  // Add state for storing the actual category ID from the API
  const [actualApiCategoryId, setActualApiCategoryId] = useState<string | null>(() => {
    // Initial state computation
    if (typeof categoryId === 'string' && categoryId.match(/^\d+$/)) {
      console.log('Initializing with direct numeric categoryId:', categoryId);
      return categoryId as string;
    }
    return null;
  });
  
  // State for offline and cache status
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [fromCache, setFromCache] = useState<boolean>(false);
  
  // Update offline status
  useEffect(() => {
    const checkIsOffline = async () => {
      const online = await connectionUtils.updateConnectionStatus();
      setIsOffline(!online);
    };
    
    checkIsOffline();
    
    // Check again if it's offline every 30 seconds
    const intervalId = setInterval(checkIsOffline, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Process the categoryId to get the actual API ID to use
  useEffect(() => {
    // Simplified logging
    console.log('Category params:', { categoryId, categoryTitle });
    
    // Process the categoryId to get the actual API ID to use
    if (typeof categoryId === 'string') {
      // First check if it's a direct numeric ID (highest priority)
      if (categoryId.match(/^\d+$/)) {
        console.log('Setting category ID from direct numeric ID:', categoryId);
        setActualApiCategoryId(categoryId);
        return; // Exit early since we have our ID
      } else if (categoryId.length > 0 && !categoryId.includes('-')) {
        // This is already the raw ID (should be just a number)
        setActualApiCategoryId(categoryId);
      } else if (categoryId.startsWith('cat-')) {
        // For legacy/fallback support, extract from cat- format if needed
        const match = categoryId.match(/cat-([\d.]+)/);
        if (match && match[1]) {
          const rawId = match[1].split('.')[0]; // Extract the numeric part before any decimal
          if (rawId && !isNaN(parseInt(rawId))) {
            setActualApiCategoryId(rawId);
          }
        }
      }
    }
    
    // Ensure we always have a fallback value for categoryId (run this only if we don't have an ID yet)
    if (!actualApiCategoryId) {
      setTimeout(() => {
        setActualApiCategoryId(prevId => {
          if (!prevId) {
            // Default to "1" as a fallback to prevent errors
            if (typeof categoryId === 'string' && categoryId.includes('ladies') || 
                (typeof categoryTitle === 'string' && categoryTitle.toLowerCase().includes('ladies'))) {
              return '2';
            } else {
              return '1'; 
            }
          }
          return prevId;
        });
      }, 100);
    }
  }, [categoryId, categoryTitle, params.originalCategoryId]);

  // Add a second useEffect to trigger the fetch once actualApiCategoryId is available
  useEffect(() => {
    if (actualApiCategoryId) {
      console.log('Category ID is now available:', actualApiCategoryId);
      fetchCategoryItems();
    }
  }, [actualApiCategoryId]);

  // Create a better mapping for CategoryIDs to API IDs
  const categoryApiMapping: Record<string, string> = {
    // Clothing categories
    'clothing': '1', // Main clothing category ID on the API server
    'clothing-gents-boys': '1', // Assuming gents/boys is category 1
    'clothing-ladies-girls': '2', // Assuming ladies/girls is category 2
    'cat-1': '1', // Legacy mapping
    // More specific clothing subcategory mappings
    'clothing (gents / boys)': '1',
    'clothing (ladies / girls)': '2',
    // Furniture categories
    'furniture': '3',
    'cat-2': '3',
    // Add more mappings as you discover them
  };
  
  const [showForm, setShowForm] = useState(false);
  const [predefinedItems, setPredefinedItems] = useState<Item[]>([]); // For storing category items from API
  const [userItems, setUserItems] = useState<Item[]>([]); // For storing user-added items
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
    selection: ''
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
  
  // Determine if handwriting mode is enabled from URL params
  const handwritingEnabled = useHandwriting === '1';
  
  const includeRooms = roomsForCategory[categoryId as string] || [];
  const hasRooms = includeRooms.length > 0;

  // Normalize category ID to match the format in categoryItemsApi
  const normalizeCategoryId = (id: string): string => {
    console.log('Normalizing category ID:', id);
    
    // Map from URL param IDs to API IDs
    const categoryIdMap: Record<string, string> = {
      // Add any mappings needed
      'clothing-gents-boys': 'a7',
      'clothing-ladies-girls': 'a8',
      'antiques': 'a1',
      'domestic-appliances': 'b1',
      'furniture': 'cat-2',
      'cat1': 'cat-1', // Add fallback for cat1 -> cat-1
    };

    // Check if we have a mapping for this ID
    if (categoryIdMap[id]) {
      return categoryIdMap[id];
    }

    // Try to match based on the category title from params
    const catTitle = (params.categoryTitle as string || '').toLowerCase();
    console.log('Checking category title:', catTitle);
    
    if (catTitle.includes('gents') || catTitle.includes('boys')) {
      return 'a7';
    } else if (catTitle.includes('ladies') || catTitle.includes('girls')) {
      return 'a8';
    } else if (catTitle.includes('antiques')) {
      return 'a1';
    } else if (catTitle.includes('domestic') || catTitle.includes('appliances')) {
      return 'b1';
    } else if (catTitle.includes('furniture')) {
      // Default to cat-1 for any clothing category 
      return 'cat-1';
    }

    // If no mapping, return the original ID
    return id;
  };

  // Fetch items from API
  const fetchCategoryItems = async () => {
    // Make sure we have a category ID
    const currentCategoryId = actualApiCategoryId;
    setFromCache(false);
    
    if (!currentCategoryId) {
      console.error('No valid category ID available for API call');
      setError('Missing category ID. Please try again.');
      // Continue with fallback instead of returning
      try {
        const normalizedCategoryId = normalizeCategoryId(categoryId as string);
        console.log('Using normalized ID for fallback:', normalizedCategoryId);
        const fallbackResponse = await categoryItemsApi.getCategoryItems(normalizedCategoryId);
        if (fallbackResponse.success) {
          const formattedItems = fallbackResponse.data.map((item: any) => ({
            ...item,
            quantity: item.quantity?.toString() || '1',
            price: item.price?.toString() || '0',
            room: '',
            notes: ''
          }));
          setPredefinedItems(formattedItems);
          setError(null);
        } else {
          setError('Failed to load category items');
        }
        setLoading(false);
        return;
      } catch (err) {
        console.error('Fallback failed:', err);
        setError('Failed to load items. Please try again later.');
          setLoading(false);
          return;
        }
      }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching items for category ID: ${currentCategoryId}`);
      
      // Call the Risk Template Items API with the category ID
      const response = await api.getRiskTemplateItems(currentCategoryId) as ApiResponse;
      
      // Check if the data is from cache
      if (response.fromCache) {
        setFromCache(true);
      }
      
      if (response.success && response.data && response.data.length > 0) {
        // Transform the API items to match our interface
        const formattedItems = response.data.map((item: any) => {
          return {
            id: item.id || item.itemId || item.item_id || `item-${Math.random().toString(36).substring(2, 9)}`,
            type: item.itemprompt || item.type || item.itemName || item.item_name || item.name || item.title || '',
            description: item.description || item.desc || '',
            quantity: item.quantity?.toString() || '1',
            price: item.price?.toString() || item.estimatedValue?.toString() || item.estimated_value?.toString() || '0',
            room: item.room || '',
            notes: item.notes || '',
            model: item.model || '',
            selection: item.selection || ''
          };
        });
        
        console.log(`Found ${formattedItems.length} items for category ID ${currentCategoryId}`);
        setPredefinedItems(formattedItems);
      } else {
        console.log(`No items found for category ID ${currentCategoryId}, using fallback`);
        
        // Use fallback if API returns no items
        const normalizedCategoryId = normalizeCategoryId(categoryId as string);
        
        const fallbackResponse = await categoryItemsApi.getCategoryItems(normalizedCategoryId);
        
        if (fallbackResponse.success) {
          const formattedItems = fallbackResponse.data.map((item: any) => ({
          ...item,
          quantity: item.quantity?.toString() || '1',
          price: item.price?.toString() || '0',
          room: '',
          notes: ''
        }));
          console.log('Using fallback data:', formattedItems.length, 'items');
        setPredefinedItems(formattedItems);
      } else {
        setError('Failed to load category items');
          setPredefinedItems([]);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      
      try {
        // Always try fallback on any error
        console.log('Error occurred, trying fallback data');
        const normalizedCategoryId = normalizeCategoryId(categoryId as string);
        const fallbackResponse = await categoryItemsApi.getCategoryItems(normalizedCategoryId);
        
        if (fallbackResponse.success) {
          const formattedItems = fallbackResponse.data.map((item: any) => ({
            ...item,
            quantity: item.quantity?.toString() || '1',
            price: item.price?.toString() || '0',
            room: '',
            notes: ''
          }));
          setPredefinedItems(formattedItems);
          setError(null); // Clear any error
        } else {
          setError('Failed to load items. Please try again later.');
          setPredefinedItems([]);
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Failed to load items. Please try again later.');
        setPredefinedItems([]);
      }
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
    // In a real app, this would call a handwriting recognition API
    // For this demo, we'll simulate recognition with the field name
    const simulatedText = currentField === 'description' 
      ? 'Handwritten ' + (Math.floor(Math.random() * 100) + 1).toString()
      : currentField === 'price'
        ? (Math.floor(Math.random() * 10000) / 100).toString()
        : (Math.floor(Math.random() * 10) + 1).toString();
    
    setRecognizedText(simulatedText);
  };
  
  const confirmHandwriting = () => {
    if (recognizedText) {
      setCurrentItem(prev => ({
        ...prev,
        [currentField]: recognizedText
      }));
      setShowHandwritingModal(false);
      clearCanvas();
    }
  };
  
  const openHandwritingModal = (field: keyof Item) => {
    if (handwritingEnabled) {
      setCurrentField(field);
      setShowHandwritingModal(true);
      clearCanvas();
    }
  };
  
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

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: undefined,
        quality: 1.0,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        exif: true
      });
      
      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setPhoto(photoUri);
        
        // Update current item with photo
        setCurrentItem(prev => ({
          ...prev,
          photo: photoUri
        }));
      }
      
      // Close camera modal
      setShowCamera(false);
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
        quality: 1.0,
        mediaTypes: ImagePicker.MediaTypeOptions.Images
      });
      
      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setPhoto(photoUri);
        
        // Update current item with photo
        setCurrentItem(prev => ({
          ...prev,
          photo: photoUri
        }));
      }
      
      // Close camera modal
      setShowCamera(false);
    } catch (err) {
      console.error('Error selecting photo:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };
  
  const addItem = () => {
    if (currentItem.description && currentItem.price) {
      const newItem: Item = {
        id: `custom-${Date.now().toString()}`,
        type: currentItem.type,
        description: currentItem.description,
        room: currentItem.room,
        quantity: currentItem.quantity || '1',
        price: currentItem.price,
        notes: currentItem.notes,
        photo: currentItem.photo,
        model: currentItem.model,
        selection: currentItem.selection
      };
      
      setUserItems(prev => [...prev, newItem]);
      setCurrentItem({
        ...currentItem,
        description: '',
        price: '',
        notes: ''
      });
      
      // Close form after adding
      setShowForm(false);
    }
  };
  
  const deleteItem = (itemId: string) => {
    setUserItems(userItems.filter(item => item.id !== itemId));
  };
  
  const totalValue = userItems.reduce(
    (sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity || '1', 10) || 0), 
    0
  );

  const selectPredefinedItem = (item: Item) => {
    setCurrentItem({
      ...item,
      description: item.description || item.type, // Use type as default description
      quantity: '1',
      price: item.price || '0'
    });
    setShowForm(true);
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
        <ConnectionStatus showOffline={true} showOnline={false} />
      
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
              {isOffline && (
                <Text style={styles.offlineHint}>
                  You are currently offline. Showing cached data if available.
                </Text>
              )}
              {fromCache && !isOffline && (
                <Text style={styles.offlineHint}>
                  Using cached data. Items were loaded from local storage.
                </Text>
              )}
            </View>
          ) : (
            <>
              {!showForm ? (
                <>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                      <Text style={styles.summaryTitle}>Items ({userItems.length})</Text>
                      <Text style={styles.summaryTotal}>Total: R{totalValue.toLocaleString()}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setShowForm(true)}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                      <Text style={styles.addButtonText}>Add Item</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Predefined Items List */}
                  <Card style={styles.card}>
                    <Card.Title title="Predefined Items" subtitle={`Select from ${categoryTitle}`} />
                    <Divider />
                    <Card.Content style={styles.predefinedContent}>
                      <View style={styles.scrollIndicator}>
                        <MaterialCommunityIcons name="gesture-swipe-down" size={16} color="#7f8c8d" />
                        <Text style={styles.scrollHint}>Scroll for more items</Text>
                      </View>
                      <ScrollView 
                        style={styles.predefinedList}
                        contentContainerStyle={styles.predefinedListContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        persistentScrollbar={true}
                      >
                        {predefinedItems.map((item, index) => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={[
                              styles.predefinedItem,
                              index % 2 === 1 ? styles.predefinedItemAlt : null
                            ]}
                            onPress={() => selectPredefinedItem(item)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.predefinedItemType} numberOfLines={1} ellipsizeMode="tail">
                              {item.type}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#6c757d" />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      {predefinedItems.length > 6 && (
                        <View style={styles.scrollIndicator}>
                          <MaterialCommunityIcons name="gesture-swipe-up" size={16} color="#7f8c8d" />
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                </>
              ) : (
                <Card style={styles.card}>
                  <Card.Title 
                    title="Add New Item" 
                    right={(props) => (
                      <IconButton
                        {...props}
                        icon="camera"
                        onPress={() => setShowCamera(true)}
                        iconColor="#4a90e2"
                      />
                    )}
                  />
                  <Card.Content>
                    {photo && (
                      <View style={styles.photoPreview}>
                        <Image source={{ uri: photo }} style={styles.photoImage} />
                      </View>
                    )}
              
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Description</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={currentItem.description}
                          onChangeText={(text) => setCurrentItem({ ...currentItem, description: text })}
                          placeholder="Enter item description"
                        />
                        {handwritingEnabled && (
                          <TouchableOpacity
                            style={styles.handwritingButton}
                            onPress={() => openHandwritingModal('description')}
                          >
                            <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
              
                    {hasRooms && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Room</Text>
                        <View style={styles.roomButtons}>
                          {includeRooms.map((room) => (
                            <TouchableOpacity
                              key={room}
                              style={[
                                styles.roomButton,
                                currentItem.room === room && styles.roomButtonSelected
                              ]}
                              onPress={() => setCurrentItem({ ...currentItem, room: room })}
                            >
                              <Text
                                style={[
                                  styles.roomButtonText,
                                  currentItem.room === room && styles.roomButtonTextSelected
                                ]}
                              >
                                {room}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
              
                    <View style={styles.formRow}>
                      <View style={styles.quantityField}>
                        <Text style={styles.label}>Quantity</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            value={currentItem.quantity}
                            onChangeText={(text) => setCurrentItem({ ...currentItem, quantity: text })}
                            keyboardType="numeric"
                            placeholder="1"
                          />
                          {handwritingEnabled && (
                            <TouchableOpacity
                              style={styles.handwritingButton}
                              onPress={() => openHandwritingModal('quantity')}
                            >
                              <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View style={styles.priceField}>
                        <Text style={styles.label}>Price (R)</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            value={currentItem.price}
                            onChangeText={(text) => setCurrentItem({ ...currentItem, price: text })}
                            keyboardType="numeric"
                            placeholder="0.00"
                          />
                          {handwritingEnabled && (
                            <TouchableOpacity
                              style={styles.handwritingButton}
                              onPress={() => openHandwritingModal('price')}
                            >
                              <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
              
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Notes</Text>
                      <TextInput
                        style={[styles.input, styles.notesInput]}
                        value={currentItem.notes}
                        onChangeText={(text) => setCurrentItem({ ...currentItem, notes: text })}
                        placeholder="Enter any additional notes"
                        multiline
                      />
                    </View>
              
                    <View style={styles.formButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => setShowForm(false)}
                        style={styles.cancelButton}
                      >
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        onPress={addItem}
                        style={styles.saveButton}
                        disabled={!currentItem.description || !currentItem.price}
                      >
                        Add Item
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {!showForm && userItems.length > 0 && (
                <Card style={styles.card}>
                  <Card.Title title="Added Items" />
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Description</DataTable.Title>
                      <DataTable.Title numeric>Qty</DataTable.Title>
                      <DataTable.Title numeric>Price (R)</DataTable.Title>
                      <DataTable.Title numeric>Total (R)</DataTable.Title>
                      <DataTable.Title>{' '}</DataTable.Title>
                    </DataTable.Header>
                    
                    {userItems.filter(item => parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0).map((item) => {
                      const total = parseFloat(item.price) * parseInt(item.quantity || '1', 10);
                      return (
                        <DataTable.Row key={item.id}>
                          <DataTable.Cell>
                            <View style={styles.itemDescriptionCell}>
                              {item.photo && <View style={styles.photoIndicator} />}
                              <Text>{item.description || item.type}</Text>
                            </View>
                          </DataTable.Cell>
                          <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                          <DataTable.Cell numeric>{parseFloat(item.price).toLocaleString()}</DataTable.Cell>
                          <DataTable.Cell numeric>{total.toLocaleString()}</DataTable.Cell>
                          <DataTable.Cell>
                            <IconButton
                              icon="delete"
                              size={20}
                              onPress={() => deleteItem(item.id)}
                              iconColor="#e74c3c"
                            />
                          </DataTable.Cell>
                        </DataTable.Row>
                      );
                    })}
                    
                    <DataTable.Row style={styles.totalRow}>
                      <DataTable.Cell><Text style={styles.totalLabel}>Total</Text></DataTable.Cell>
                      <DataTable.Cell>{' '}</DataTable.Cell>
                      <DataTable.Cell>{' '}</DataTable.Cell>
                      <DataTable.Cell numeric><Text style={styles.totalValue}>R{totalValue.toLocaleString()}</Text></DataTable.Cell>
                      <DataTable.Cell>{' '}</DataTable.Cell>
                    </DataTable.Row>
                  </DataTable>
                </Card>
              )}
              
              {!showForm && userItems.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>No items added yet</Text>
                  <Text style={styles.emptyStateSubtext}>Tap the 'Add Item' button to get started</Text>
                </View>
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

      {/* Handwriting Recognition Modal */}
      <Modal
        visible={showHandwritingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHandwritingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Handwriting Recognition</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setShowHandwritingModal(false)}
              />
            </View>
            
            <View style={styles.canvasContainer}>
              <View
                style={styles.canvas}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <Svg height="100%" width="100%">
                  {paths.map((item, index) => (
                    <Path
                      key={index}
                      d={item.path}
                      stroke={item.color}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      fill="none"
                    />
                  ))}
                  {currentPath && (
                    <Path
                      d={currentPath}
                      stroke={strokeColor}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                </Svg>
              </View>
            </View>
            
            <View style={styles.canvasButtons}>
              <Button mode="outlined" onPress={clearCanvas}>Clear</Button>
              <Button mode="contained" onPress={recognizeHandwriting}>Recognize</Button>
            </View>
            
            {recognizedText && (
              <View style={styles.recognizedTextContainer}>
                <Text style={styles.recognizedTextLabel}>Recognized Text:</Text>
                <Text style={styles.recognizedText}>{recognizedText}</Text>
              </View>
            )}
            
            <Button
              mode="contained"
              onPress={confirmHandwriting}
              disabled={!recognizedText}
            >
              Confirm
            </Button>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Photo</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setShowCamera(false)}
              />
            </View>
            
            <View style={styles.photoOptionsContainer}>
              <TouchableOpacity
                style={styles.photoOption}
                onPress={takePhoto}
              >
                <MaterialCommunityIcons name="camera" size={48} color="#4a90e2" />
                <Text style={styles.photoOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.photoOption}
                onPress={selectFromGallery}
              >
                <MaterialCommunityIcons name="image" size={48} color="#4a90e2" />
                <Text style={styles.photoOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
  },
  card: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  addButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  photoPreview: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predefinedList: {
    maxHeight: 290,
    minHeight: 100,
  },
  predefinedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predefinedItemAlt: {
    backgroundColor: '#f9f9f9',
  },
  predefinedItemType: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
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
  handwritingButton: {
    padding: 10,
    marginLeft: -44,
    zIndex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityField: {
    flex: 1,
    marginRight: 8,
  },
  priceField: {
    flex: 2,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  roomButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginHorizontal: -4,
  },
  roomButton: {
    backgroundColor: '#f0f4f7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  roomButtonSelected: {
    backgroundColor: '#4a90e2',
  },
  roomButtonText: {
    fontSize: 12,
    color: '#34495e',
  },
  roomButtonTextSelected: {
    color: '#fff',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  totalRow: {
    backgroundColor: '#f0f4f7',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#27ae60',
  },
  itemDescriptionCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a90e2',
    marginRight: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
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
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  canvasContainer: {
    width: '100%',
    height: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  canvasButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recognizedTextContainer: {
    backgroundColor: '#f0f4f7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  recognizedTextLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  
  // Photo Options Styles
  photoOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 32,
  },
  photoOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f4f7',
    width: '45%',
  },
  photoOptionText: {
    marginTop: 12,
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
  },
  
  predefinedContent: {
    padding: 0,
    paddingVertical: 8,
  },
  predefinedListContent: {
    paddingHorizontal: 16,
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
  offlineHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});