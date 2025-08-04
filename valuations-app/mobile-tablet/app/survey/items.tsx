import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api';
// Use require instead of import to avoid type declaration issues
const ImagePicker = require('expo-image-picker');
import { logNavigation } from '../../utils/logger';
import ConnectionStatus from '../../components/ConnectionStatus';
import connectionUtils from '../../utils/connectionUtils';
import { AppLayout, TabConfig } from '../../components/layout';
import { FieldConfiguration, GroupingStrategy } from '../../types/dynamicUI';
import { surveyItemsStyles } from '../GlobalStyles';

// Import components
import {
  ItemsSummary,
  PredefinedItemsList,
  HandwritingModal,
  CameraModal,
  ItemStates,
  Item,
  ApiResponse,
  roomsForCategory
} from './items/components';

export default function ItemsScreen() {
  logNavigation('Survey Items');
  
  // Get router instance
  const router = useRouter();
  
  const params = useLocalSearchParams();
  const { categoryId, categoryTitle, sectionId, assessmentId, useHandwriting, riskTemplateCategoryId } = params;
  
  console.log('Route params:', { categoryId, categoryTitle, sectionId, assessmentId, riskTemplateCategoryId });
  
  const handwritingEnabled = useHandwriting === '1';
  
  // State for offline and cache status
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [fromCache, setFromCache] = useState<boolean>(false);
  
  // Update offline status
  useEffect(() => {
    const checkIsOffline = async () => {
      const online = await connectionUtils.getStatus();
      setIsOffline(!online);
    };
    
    checkIsOffline();
    
    // Check again if it's offline every 30 seconds
    const intervalId = setInterval(checkIsOffline, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // This useEffect will be moved after fetchCategoryItems is declared


  const [predefinedItems, setPredefinedItems] = useState<Item[]>([]); // For storing category items from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Field visibility configuration
  const [fieldConfig, setFieldConfig] = useState<any[]>([]);
  const [dynamicFieldConfig, setDynamicFieldConfig] = useState<FieldConfiguration[]>([]);
  const [useCustomFields, setUseCustomFields] = useState(false);
  const [groupingStrategy, setGroupingStrategy] = useState<GroupingStrategy | undefined>(undefined);
  
  // Category totals (calculated from predefined items)
  const [categoryItemCount, setCategoryItemCount] = useState(0);
  const [categoryTotalValue, setCategoryTotalValue] = useState(0);
  
  // Handwriting recognition states
  const [showHandwritingModal, setShowHandwritingModal] = useState(false);
  const [currentField, setCurrentField] = useState<keyof Item>('description');
  const [paths, setPaths] = useState<{path: string; color: string}[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  
  const includeRooms = roomsForCategory[categoryId as string] || [];
  const hasRooms = includeRooms.length > 0;
  
  // Store the add function from PredefinedItemsList using ref
  const addNewItemFunctionRef = useRef<(() => void) | null>(null);

  // Sync-related state
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncFunctionRef = useRef<(() => void) | null>(null);
  
  // Ref to access current predefined items without causing re-renders
  const predefinedItemsRef = useRef<Item[]>([]);
  
  // Keep ref in sync with predefined items
  useEffect(() => {
    predefinedItemsRef.current = predefinedItems;
  }, [predefinedItems]);

  // Define navigation tabs - using standard app navigation
  const surveyTabs: TabConfig[] = [
    {
      name: 'dashboard',
      title: 'Dashboard',
      icon: 'view-dashboard',
      path: '/(tabs)'
    },
    {
      name: 'valuations',
      title: 'Valuations',
      icon: 'clipboard-list',
      path: '/(tabs)/valuations'
    },
    {
      name: 'survey',
      title: 'Survey',
      icon: 'note-text',
      path: '/(tabs)/survey'
    },
    {
      name: 'profile',
      title: 'Profile',
      icon: 'account',
      path: '/(tabs)/profile'
    }
  ];

  // Fetch field configuration for the category using new Configuration Service
  const fetchFieldConfiguration = async (categoryId: string) => {
    console.log('🚀 fetchFieldConfiguration called with categoryId:', categoryId);
    
    try {
      // Import the new configuration service
      const configurationService = await import('../../services/configurationService');
      
      console.log('🔄 Using new ConfigurationService to fetch configuration...');
      
      // Get complete category configuration
      const riskTemplateId = riskTemplateCategoryId ? Number(riskTemplateCategoryId) : undefined;
      console.log('🔧 Calling getCategoryConfiguration with:', { categoryId: Number(categoryId), riskTemplateId });
      const categoryConfig = await configurationService.default.getCategoryConfiguration(Number(categoryId), riskTemplateId);
      
      if (categoryConfig && categoryConfig.fields.length > 0) {
              console.log('✅ Category configuration found:', {
        categoryId: categoryConfig.categoryId,
        categoryName: categoryConfig.categoryName,
        fieldsCount: categoryConfig.fields.length,
        hasGroupingStrategy: !!categoryConfig.groupingStrategy,
        hasLocationTemplate: !!categoryConfig.locationTemplate
      });
      
      // Filter visible fields and set configuration
      const visibleFields = categoryConfig.fields.filter(field => field.display_on_ui === 1);
      
      console.log('🔧 Setting fieldConfig state with visible fields:', visibleFields.length);
      setFieldConfig(visibleFields); // Legacy support
      setDynamicFieldConfig(visibleFields); // New dynamic field configuration
      setUseCustomFields(true); // Use dynamic fields with legacy UI layout
      
      // Store grouping strategy
      if (categoryConfig.groupingStrategy) {
        console.log('📊 Grouping strategy available:', categoryConfig.groupingStrategy.strategy_type);
        setGroupingStrategy(categoryConfig.groupingStrategy);
      } else {
        console.log('📊 No grouping strategy configured, defaulting to by_type (itemprompt)');
        setGroupingStrategy(undefined);
      }
      
      if (categoryConfig.parsedLocations) {
        console.log('📍 Location template available with', categoryConfig.parsedLocations.length, 'locations');
      }
        
      } else {
        console.log('❌ No field configuration found, using default configuration');
        
        // Get default configuration as fallback
        const defaultConfig = configurationService.default.getDefaultConfiguration(
          Number(categoryId), 
          `Category ${categoryId}`
        );
        
        setFieldConfig(defaultConfig.fields); // Legacy support
        setDynamicFieldConfig(defaultConfig.fields); // New dynamic field configuration
        setUseCustomFields(false); // Force legacy interface
      }
      
    } catch (error: any) {
      console.log('=== CONFIGURATION SERVICE ERROR ===');
      console.log('Error message:', error?.message || 'No message');
      console.log('Will use default fields');
      
      // Import and use default configuration as fallback
      try {
        const configurationService = await import('../../services/configurationService');
        const defaultConfig = configurationService.default.getDefaultConfiguration(
          Number(categoryId), 
          `Category ${categoryId}`
        );
        
        setFieldConfig(defaultConfig.fields); // Legacy support
        setDynamicFieldConfig(defaultConfig.fields); // New dynamic field configuration
        setUseCustomFields(false);
      } catch (fallbackError) {
        console.error('Error loading default configuration:', fallbackError);
        setFieldConfig([]);
        setDynamicFieldConfig([]);
        setUseCustomFields(false);
      }
    }
  };

  // Fetch items from SQLite first, then API (following ItemComponents.tsx pattern)
  const fetchCategoryItems = useCallback(async () => {
    // Make sure we have a category ID
    const currentCategoryId = typeof categoryId === 'string' ? categoryId : Array.isArray(categoryId) ? categoryId[0] : '';
    setFromCache(false);
    
    if (!currentCategoryId) {
      console.error('No valid category ID available for API call');
      setError('Missing category ID. Please try again.');
      setPredefinedItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Preserve any new items that haven't been saved to SQLite yet
    const currentItems = predefinedItemsRef.current;
    const newItemsInProgress = currentItems.filter(item => 
      item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-')
    );
    
    try {
      console.log(`🔄 FETCH: Starting fetchCategoryItems for category: ${currentCategoryId}`);
      console.log(`🔄 FETCH: Preserving ${newItemsInProgress.length} items in progress`);
      
      // Check SQLite first, then API (same pattern as ItemComponents.tsx)
      const { getAllRiskAssessmentItems } = await import('../../utils/db');
      const localItems = await getAllRiskAssessmentItems();
      
      const categoryItems = localItems.filter(item => 
        String(item.riskassessmentcategoryid) === String(currentCategoryId)
      );
      
      console.log(`📂 FETCH: Found ${categoryItems.length} items for category ${currentCategoryId}`);
      
      if (categoryItems.length === 0) {
        // No items in SQLite, fetch from API
        console.log('No items in SQLite for category, fetching from API:', currentCategoryId);
        const apiResponse = await api.getRiskAssessmentItems(currentCategoryId as string) as ApiResponse;
        
        // Check if the data is from cache
        if (apiResponse.fromCache) {
          setFromCache(true);
        }
        
        if (apiResponse?.success && Array.isArray(apiResponse.data)) {
          console.log('Got items from API, storing in SQLite:', apiResponse.data.length);
          
          // Debug: Check for commaseparatedlist in API response
          const itemsWithCommaList = apiResponse.data.filter((item: any) => item.commaseparatedlist);
          if (itemsWithCommaList.length > 0) {
            console.log('🔍 API items with commaseparatedlist:', itemsWithCommaList.length);
            console.log('🔍 Sample commaseparatedlist values:', itemsWithCommaList.slice(0, 3).map((item: any) => ({
              id: item.riskassessmentitemid,
              commaseparatedlist: item.commaseparatedlist,
              type: typeof item.commaseparatedlist
            })));
          }
          
          // Store each item in SQLite (same as ItemComponents)
          const { insertRiskAssessmentItem } = await import('../../utils/db');
          for (const item of apiResponse.data) {
            const sqliteItem = {
              riskassessmentitemid: Number(item.riskassessmentitemid),
              riskassessmentcategoryid: Number(item.riskassessmentcategoryid),
              itemprompt: item.itemprompt || '',
              itemtype: Number(item.itemtype) || 0,
              rank: Number(item.rank) || 0,
              commaseparatedlist: item.commaseparatedlist || '',
              selectedanswer: item.selectedanswer || '',
              qty: Number(item.qty) || 1,
              price: Number(item.price) || 0,
              description: item.description || '',
              model: item.model || '',
              location: item.location || '',
              assessmentregisterid: Number(item.assessmentregisterid) || 0,
              assessmentregistertypeid: Number(item.assessmentregistertypeid) || 0,
              datecreated: item.datecreated || new Date().toISOString(),
              createdbyid: item.createdbyid || '',
              dateupdated: item.dateupdated || new Date().toISOString(),
              updatedbyid: item.updatedbyid || '',
              issynced: Number(item.issynced) || 0,
              syncversion: Number(item.syncversion) || 0,
              deviceid: item.deviceid || '',
              syncstatus: item.syncstatus || '',
              synctimestamp: item.synctimestamp || new Date().toISOString(),
              hasphoto: Number(item.hasphoto) || 0,
              latitude: Number(item.latitude) || 0,
              longitude: Number(item.longitude) || 0,
              notes: item.notes || '',
              pending_sync: 0
            };
            
            try {
              await insertRiskAssessmentItem(sqliteItem);
            } catch (insertError) {
              console.warn('Failed to insert item to SQLite:', insertError);
            }
          }
          
          // Get updated items from SQLite after insertion
          const updatedLocalItems = await getAllRiskAssessmentItems();
          const updatedCategoryItems = updatedLocalItems.filter(item => 
            String(item.riskassessmentcategoryid) === String(currentCategoryId)
          );
          
          // Transform SQLite items to match interface
          const formattedItems = updatedCategoryItems.map((item: any) => ({
            id: String(item.riskassessmentitemid) || '',
            categoryId: String(currentCategoryId), // Set the categoryId for new items
            type: item.itemprompt || '',
            description: item.description || '',
            model: item.model || '',
            selection: '',
            quantity: String(item.qty) || '1',
            price: String(item.price) || '',
            room: item.location || '',
            notes: item.notes || '',
            photo: undefined,
            commaseparatedlist: item.commaseparatedlist || '',
            selectedanswer: item.selectedanswer || '',
            rank: item.rank || 0, // Include rank field from database
            itemtype: item.itemtype || 0, // Include itemtype field from database
          }));
          
          console.log(`Using newly stored SQLite items: ${formattedItems.length}`);
          // Combine with preserved new items
          setPredefinedItems([...formattedItems, ...newItemsInProgress]);
        } else {
          console.log(`No items found in API for category: ${currentCategoryId}`);
          // Only set new items in progress if no API items found
          setPredefinedItems(newItemsInProgress);
          // Don't set error for empty categories - this is a normal state
          setError(null);
        }
      } else {
        // Use existing SQLite items
        console.log('Using existing SQLite items for category:', categoryItems.length);
        setFromCache(true);
        
                  // Transform SQLite items to match interface with data validation
          const formattedItems = categoryItems.map((item: any) => {
            // 🔧 FIX: Ensure consistent data mapping
            const mappedItem = {
              id: String(item.riskassessmentitemid) || '',
              categoryId: String(currentCategoryId),
              type: item.itemprompt || '', // This is the critical mapping
              description: item.description || '',
              model: item.model || '',
              selection: '',
              quantity: String(item.qty) || '1',
              price: String(item.price) || '',
              room: item.location || '',
              notes: item.notes || '',
              photo: undefined,
              commaseparatedlist: item.commaseparatedlist || '',
              selectedanswer: item.selectedanswer || '',
              rank: item.rank || 0, // Include rank field from database
              itemtype: item.itemtype || 0, // Include itemtype field from database
            };
          
          // Debug logging for ALL items to see what's being loaded
          console.log(`🔍 [fetchCategoryItems] Item ${mappedItem.id} mapping:`, {
            sqliteSelectedAnswer: item.selectedanswer,
            mappedSelectedAnswer: mappedItem.selectedanswer,
            itemId: mappedItem.id,
            hasSelectedAnswer: !!item.selectedanswer
          });
          
          // Log any items with empty types for debugging
          if (!mappedItem.type && item.riskassessmentitemid > 1000000000000) {
            console.warn(`⚠️ Item ${mappedItem.id} has empty type - itemprompt was: "${item.itemprompt}"`);
          }
          
          return mappedItem;
        });
        
        console.log(`✅ FETCH: Mapped ${formattedItems.length} items for UI`);
        
        // Debug: Log the final items being set in state
        const finalItems = [...formattedItems, ...newItemsInProgress];
        console.log(`🔍 [fetchCategoryItems] Final items being set in state:`, 
          finalItems.map(item => ({
            id: item.id,
            selectedanswer: item.selectedanswer,
            hasSelectedAnswer: !!item.selectedanswer
          }))
        );
        
        // Combine with preserved new items
        setPredefinedItems(finalItems);
      }
    } catch (err) {
      console.error('Error fetching category items:', err);
      setError('Failed to load items. Please try again later.');
      // Preserve new items even on error
      setPredefinedItems(newItemsInProgress);
    } finally {
      setLoading(false);
    }
  }, [categoryId]); // Dependencies for useCallback
  
  // Fetch predefined items and field configuration when component loads or categoryId changes
  useEffect(() => {
    console.log('🔄 useEffect triggered with categoryId:', categoryId);
    if (categoryId) {
      console.log('🔄 CategoryId exists, calling fetchCategoryItems and fetchFieldConfiguration');
      fetchCategoryItems();
      fetchFieldConfiguration(categoryId as string);
    } else {
      console.log('🔄 No categoryId, skipping API calls');
    }
  }, [categoryId]); // Remove fetchCategoryItems from dependencies to prevent unnecessary refreshes
  
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
      // Handwriting functionality would need to be integrated with the new inline editing system
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
        
        // Photo captured successfully
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
        
        // Photo selected successfully
      }
      
      // Close camera modal
      setShowCamera(false);
    } catch (err) {
      console.error('Error selecting photo:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };
  
  // This function is no longer needed since we add items directly through PredefinedItemsList
  // const addItem = () => {
  //   // Functionality moved to inline editing in PredefinedItemsList
  // };
  
  const [predefinedListKey, setPredefinedListKey] = useState(0);
  
  return (
    <AppLayout
      title={categoryTitle as string || 'Survey Items'}
      tabs={surveyTabs}
    >
      <View style={surveyItemsStyles.container}>
        <ConnectionStatus showOffline={true} showOnline={false} />
        
        <ScrollView style={surveyItemsStyles.scrollView}>
          <PredefinedItemsList
            key={predefinedListKey}
            items={predefinedItems}
            loading={loading}
            error={error}
            categoryTitle={categoryTitle as string}
            categoryId={categoryId as string}
            isOffline={isOffline}
            fromCache={fromCache}
            fieldConfig={fieldConfig} // Legacy support
            dynamicFieldConfig={dynamicFieldConfig} // New dynamic field configuration
            useCustomFields={useCustomFields}
            groupingStrategy={groupingStrategy} // Pass grouping strategy configuration
            onSelectItem={() => {}} // No longer needed since items are edited inline
            onAddNewItem={(func) => {
              console.log('Setting addNewItemFunction via ref:', func);
              addNewItemFunctionRef.current = func;
            }}
            onSyncStatusChange={(pendingCount, syncingStatus) => {
              setPendingChangesCount(pendingCount);
              setSyncing(syncingStatus);
            }}
            onSyncRequest={(syncFunc) => {
              syncFunctionRef.current = syncFunc;
            }}
            onTotalsChange={(itemCount, totalValue) => {
              setCategoryItemCount(itemCount);
              setCategoryTotalValue(totalValue);
            }}
            onRefresh={fetchCategoryItems}
            onForceRemount={() => setPredefinedListKey(k => k + 1)}
          />
          
          {/* {userItems.length === 0 && (
            <ItemStates isEmpty={true} />
          )} */}
        </ScrollView>

        {/* ItemsSummary moved to bottom with combined buttons */}
        <ItemsSummary
          userItemsCount={categoryItemCount}
          totalValue={categoryTotalValue}
          onAddItem={() => {
            console.log('Add Item button pressed, addNewItemFunction:', addNewItemFunctionRef.current);
            if (addNewItemFunctionRef.current) {
              console.log('Calling addNewItemFunction');
              addNewItemFunctionRef.current();
            } else {
              console.log('addNewItemFunction is null - function not set yet');
            }
          }}
          onDone={() => router.back()}
          pendingChangesCount={pendingChangesCount}
          syncing={syncing}
          onSync={() => {
            console.log('Sync button pressed, syncFunction:', syncFunctionRef.current);
            if (syncFunctionRef.current) {
              console.log('Calling syncFunction');
              syncFunctionRef.current();
            } else {
              console.log('syncFunction is null - function not set yet');
            }
          }}
        />
      </View>

      <HandwritingModal
        visible={showHandwritingModal}
        currentField={currentField}
        paths={paths}
        currentPath={currentPath}
        strokeColor={strokeColor}
        recognizedText={recognizedText}
        onClose={() => setShowHandwritingModal(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClearCanvas={clearCanvas}
        onRecognizeHandwriting={recognizeHandwriting}
        onConfirmHandwriting={confirmHandwriting}
      />

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onTakePhoto={takePhoto}
        onSelectFromGallery={selectFromGallery}
      />
    </AppLayout>
  );
}

