import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api';
// Use require instead of import to avoid type declaration issues
const ImagePicker = require('expo-image-picker');
import { logNavigation } from '../../utils/logger';
import ConnectionStatus from '../../components/ConnectionStatus';
import connectionUtils from '../../utils/connectionUtils';
import { AppLayout, TabConfig } from '../../components/layout';

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
  const { categoryId, categoryTitle, sectionId, assessmentId, useHandwriting } = params;
  
  console.log('Route params:', { categoryId, categoryTitle, sectionId, assessmentId });
  
  const handwritingEnabled = useHandwriting === '1';
  
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

  // Fetch predefined items when component loads or categoryId changes
  useEffect(() => {
    if (categoryId) {
      fetchCategoryItems();
    }
  }, [categoryId]);


  const [predefinedItems, setPredefinedItems] = useState<Item[]>([]); // For storing category items from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      name: 'new-survey',
      title: 'New Survey',
      icon: 'plus-circle',
      path: '/(tabs)/new-survey'
    },
    {
      name: 'profile',
      title: 'Profile',
      icon: 'account',
      path: '/(tabs)/profile'
    }
  ];

  // Fetch items from SQLite first, then API (following ItemComponents.tsx pattern)
  const fetchCategoryItems = async () => {
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
    
    try {
      console.log(`Fetching items for category ID: ${currentCategoryId}`);
      
      // Check SQLite first, then API (same pattern as ItemComponents.tsx)
      const { getAllRiskAssessmentItems } = await import('../../utils/db');
      const localItems = await getAllRiskAssessmentItems();
      const categoryItems = localItems.filter(item => 
        String(item.riskassessmentcategoryid) === String(currentCategoryId)
      );
      
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
              qty: Number(item.qty) || 0,
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
            type: item.itemprompt || '',
            description: item.description || '',
            model: item.model || '',
            selection: '',
            quantity: String(item.qty) || '1',
            price: String(item.price) || '0',
            room: item.location || '',
            notes: item.notes || '',
            photo: undefined,
          }));
          
          console.log(`Using newly stored SQLite items: ${formattedItems.length}`);
          setPredefinedItems(formattedItems);
        } else {
          console.log(`No items found in API for category: ${currentCategoryId}`);
          setPredefinedItems([]);
          setError('No items found for this category');
        }
      } else {
        // Use existing SQLite items
        console.log('Using existing SQLite items for category:', categoryItems.length);
        setFromCache(true);
        
        // Transform SQLite items to match interface
        const formattedItems = categoryItems.map((item: any) => ({
          id: String(item.riskassessmentitemid) || '',
          type: item.itemprompt || '',
          description: item.description || '',
          model: item.model || '',
          selection: '',
          quantity: String(item.qty) || '1',
          price: String(item.price) || '0',
          room: item.location || '',
          notes: item.notes || '',
          photo: undefined,
        }));
        
        setPredefinedItems(formattedItems);
      }
    } catch (err) {
      console.error('Error fetching category items:', err);
      setError('Failed to load items. Please try again later.');
      setPredefinedItems([]);
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
  
  return (
    <AppLayout
      title={categoryTitle as string || 'Survey Items'}
      tabs={surveyTabs}
    >
      <View style={styles.container}>
        <ConnectionStatus showOffline={true} showOnline={false} />
        
        <ScrollView style={styles.scrollView}>
          <PredefinedItemsList
            items={predefinedItems}
            loading={loading}
            error={error}
            categoryTitle={categoryTitle as string}
            isOffline={isOffline}
            fromCache={fromCache}
            onRefresh={fetchCategoryItems}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
});