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


  // Function to fetch assessment type from database
  const fetchAssessmentType = useCallback(async () => {
    try {
      const { getAllRiskAssessmentMasters } = await import('../../utils/db');
      const masters = await getAllRiskAssessmentMasters();
      
      if (masters.length > 0) {
        // Get the first master's assessment type name
        const assessmentTypeName = masters[0].assessmenttypename;
        if (assessmentTypeName) {
          console.log('📋 Found assessment type:', assessmentTypeName);
          setAssessmentType(assessmentTypeName);
        } else {
          console.log('📋 No assessment type found in masters');
          setAssessmentType(undefined);
        }
      } else {
        console.log('📋 No risk assessment masters found');
        setAssessmentType(undefined);
      }
    } catch (error) {
      console.error('Error fetching assessment type:', error);
      setAssessmentType(undefined);
    }
  }, []);

  // Fetch assessment type on component mount
  useEffect(() => {
    fetchAssessmentType();
  }, [fetchAssessmentType]);

  // This useEffect will be moved after fetchCategoryItems is declared


  const [predefinedItems, setPredefinedItems] = useState<Item[]>([]); // For storing category items from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Field visibility configuration
  const [fieldConfig, setFieldConfig] = useState<any[]>([]);
  const [dynamicFieldConfig, setDynamicFieldConfig] = useState<FieldConfiguration[]>([]);
  const [useCustomFields, setUseCustomFields] = useState(false);
  const [groupingStrategy, setGroupingStrategy] = useState<GroupingStrategy | undefined>(undefined);
  const [fieldConfigLoading, setFieldConfigLoading] = useState(false);
  
  // Assessment type for determining default quantity behavior
  const [assessmentType, setAssessmentType] = useState<string | undefined>(undefined);
  
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
    
    setFieldConfigLoading(true);
    
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
    } finally {
      setFieldConfigLoading(false);
    }
  };

  // Helper function to check if quantity field is visible
  const isQuantityFieldVisible = useCallback(() => {
    // Check dynamic field configuration first
    if (dynamicFieldConfig && dynamicFieldConfig.length > 0) {
      const quantityField = dynamicFieldConfig.find(f => f.item_fields === 'quantity');
      return quantityField && quantityField.display_on_ui === 1;
    }
    
    // Fall back to legacy field configuration
    if (!useCustomFields || !fieldConfig || fieldConfig.length === 0) {
      // No custom configuration, show all fields
      return true;
    }
    
    // Check legacy field configuration for 'Qty' field
    const qtyField = fieldConfig.find(f => f.fieldName === 'Qty');
    return qtyField && qtyField.visible !== false;
  }, [dynamicFieldConfig, useCustomFields, fieldConfig]);

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
      
      console.log(`📊 FETCH: Total items in SQLite: ${localItems.length}`);
      
      
      const categoryItems = localItems.filter(item => 
        String(item.riskassessmentcategoryid) === String(currentCategoryId)
      );
      
      console.log(`📂 FETCH: Found ${categoryItems.length} items for category ${currentCategoryId}`);
      
      if (categoryItems.length === 0) {
        // No items in SQLite - this means complete-hierarchy prefetch hasn't run yet
        console.log('No items in SQLite for category - waiting for complete-hierarchy prefetch:', currentCategoryId);
        console.log('ℹ️ Items will be loaded when user selects an appointment and prefetch completes');
        
        // Show loading state while waiting for prefetch
        setLoading(true);
        setError(null); // Clear any previous errors
        
        // Set empty items for now - they will be populated when prefetch completes
        setPredefinedItems(newItemsInProgress);
        return; // Exit early to show loading state
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
              quantity: ((item.qty === 0 || item.qty === null) && isQuantityFieldVisible()) ? '1' : String(item.qty || 0),
              price: String(item.price) || '',
              room: item.location || '',
              notes: item.notes || '',
              photo: undefined,
              commaseparatedlist: item.commaseparatedlist || '',
              // Add original database values for hasDataCaptured function
              qty: item.qty === null ? 0 : (item.qty || 0),
              selectedanswer: item.selectedanswer || '',
              rank: item.rank || 0, // Include rank field from database
              itemtype: item.itemtype || 0, // Include itemtype field from database
              excludefromreport: item.excludefromreport ?? 0, // 0 = not excluded, 1 = excluded (for checkbox)
            };
          
          // Only log items with issues for debugging
          if (!mappedItem.type && item.riskassessmentitemid > 1000000000000) {
            console.warn(`⚠️ Item ${mappedItem.id} has empty type - itemprompt was: "${item.itemprompt}"`);
          }
          
          return mappedItem;
        });
        
        console.log(`✅ FETCH: Mapped ${formattedItems.length} items for UI`);
        
        // Set final items in state
        const finalItems = [...formattedItems, ...newItemsInProgress];
        
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
  }, [categoryId, isQuantityFieldVisible]); // Dependencies for useCallback

  // Listen for prefetch completion to refresh items
  useEffect(() => {
    const setupPrefetchListener = async () => {
      try {
        const prefetchService = await import('../../services/prefetchService');
        
        // Listen for category completion events
        const unsubscribe = prefetchService.default.onCategoryCompleted((completedCategoryId: string) => {
          console.log(`🔄 Prefetch completed for category ${completedCategoryId}, checking if refresh needed...`);
          if (String(completedCategoryId) === String(categoryId)) {
            // Refresh items for this category
            console.log(`🔄 Refreshing items for category ${categoryId} after prefetch completion`);
            fetchCategoryItems();
          }
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up prefetch listener:', error);
        return () => {};
      }
    };
    
    const unsubscribe = setupPrefetchListener();
    
    return () => {
      unsubscribe.then(unsub => unsub());
    };
  }, [categoryId, fetchCategoryItems]);
  
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
        // Keep modal open so user can take another photo
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
        quality: 1.0,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true
      });
      
      if (!result.canceled && result.assets?.length) {
        // Use the first selected image when multiple are chosen
        const photoUri = result.assets[0].uri;
        setPhoto(photoUri);
        // Keep modal open so user can select or take another
      }
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
            loading={loading || fieldConfigLoading}
            error={error}
            categoryTitle={categoryTitle as string}
            categoryId={categoryId as string}
            isOffline={isOffline}
            fromCache={fromCache}
            fieldConfig={fieldConfig} // Legacy support
            dynamicFieldConfig={dynamicFieldConfig} // New dynamic field configuration
            useCustomFields={useCustomFields}
            groupingStrategy={groupingStrategy} // Pass grouping strategy configuration
            assessmentType={assessmentType} // Pass assessment type for quantity defaulting
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

