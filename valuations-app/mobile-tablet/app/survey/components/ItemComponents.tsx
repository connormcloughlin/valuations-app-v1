import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  GestureResponderEvent,
  PanResponder,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { 
  Button, 
  Card, 
  DataTable, 
  TextInput as PaperTextInput, 
  Divider, 
  Chip,
  IconButton,
  Avatar
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { getCategoryConfig, CategoryConfig, CategoryField } from '../../../config/categories';
import i18n, { t, formatCurrency } from '../../../utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../constants/apiConfig';
import api from '../../../api';
import riskAssessmentSyncService from '../../../services/riskAssessmentSyncService';
import {
  getAllRiskAssessmentItems,
  insertRiskAssessmentItem,
  updateRiskAssessmentItem,
  deleteRiskAssessmentItem,
  RiskAssessmentItem,
} from '../../../utils/db';

// Types for API response
interface ApiItem {
  riskassessmentitemid: string | number;
  riskassessmentcategoryid: string | number;
  itemprompt?: string;
  itemtype?: number;
  rank?: number;
  commaseparatedlist?: string;
  selectedanswer?: string;
  qty?: number;
  price?: number;
  description?: string;
  model?: string;
  location?: string;
  assessmentregisterid?: number;
  assessmentregistertypeid?: number;
  datecreated?: string;
  createdbyid?: string;
  dateupdated?: string;
  updatedbyid?: string;
  issynced?: number;
  syncversion?: number;
  deviceid?: string;
  syncstatus?: string;
  synctimestamp?: string;
  hasphoto?: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface ApiResponse {
  success: boolean;
  data?: ApiItem[];
  status?: number;
  message?: string;
}

// Types
export interface Item {
  riskassessmentitemid: string | number;
  riskassessmentcategoryid: string;
  itemprompt: string;
  itemtype: string;
  rank: string;
  commaseparatedlist: string;
  selectedanswer: string;
  qty: string;
  price: string;
  description: string;
  model: string;
  location: string;
  assessmentregisterid: string;
  assessmentregistertypeid: string;
  isactive: string;
  createdby: string;
  createddate: string;
  modifiedby: string;
  modifieddate: string;
}

// Room data for categories
export const roomsForCategory: Record<string, string[]> = {
  'antiques': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
  'valuable-artworks': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
  'valuable-carpets': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
  'collections-coins-stamps': ['Study', 'Bedroom', 'Other'],
  'valuable-ornaments': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
  'firearms': ['Study', 'Bedroom', 'Safe', 'Other'],
  'bows': ['Study', 'Bedroom', 'Garage', 'Other'],
  'outdoor-equipment': ['Garage', 'Garden', 'Shed', 'Other'],
  'clothing-gents-boys': ['Bedroom', 'Closet', 'Other'],
  'clothing-ladies-girls': ['Bedroom', 'Closet', 'Other'],
  'clothing-children-babies': ['Bedroom', 'Closet', 'Other'],
  'jewellery': ['Bedroom', 'Safe', 'Other'],
  'domestic-appliances': ['Kitchen', 'Laundry Room', 'Living Room', 'Bedroom', 'Other'],
  'high-risk-items': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
};

// Item utilities
export const itemUtils = {
  // Generate a random ID for new items
  generateItemId: (): string => {
    return Math.random().toString(36).substring(2, 15);
  },

  // Load items from AsyncStorage
  loadUserItems: async (categoryId: string): Promise<Item[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(`@items_${categoryId}`);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error loading items:', e);
      return [];
    }
  },

  // Save items to AsyncStorage
  saveUserItems: async (items: Item[], categoryId: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(`@items_${categoryId}`, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving items:', e);
    }
  },

  // Calculate total value of items
  calculateTotalValue: (items: Item[]): number => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.qty) || 1;
      return total + (price * quantity);
    }, 0);
  },
  
  // Get field configuration from category config
  getFieldsConfig: (categoryId: string): CategoryField[] => {
    const config = getCategoryConfig(categoryId);
    return config ? config.fields : [];
  },
  
  // Check if category requires a specific field
  requiresField: (categoryId: string, fieldKey: string): boolean => {
    const fields = itemUtils.getFieldsConfig(categoryId);
    return fields.some(field => field.key === fieldKey);
  }
};

// Component Styles
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  quantityField: {
    flex: 1,
  },
  priceField: {
    flex: 2,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  doneButton: {
    marginTop: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  photoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomSelector: {
    marginBottom: 16,
  },
  roomChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: '#555',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 16,
  },
  predefinedList: {
    marginBottom: 16,
  },
  predefinedHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  predefinedItem: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  predefinedItemText: {
    fontSize: 15,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableColumnDescription: { flex: 3 },
  tableColumnRoom: { flex: 2 },
  tableColumnQuantity: { flex: 1.5 },
  tableColumnPrice: { flex: 2 },
  tableColumnActions: { flex: 1.5 },
  tableMakeModel: { fontSize: 12, color: '#666', marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  canvasContainer: {
    width: '100%',
    height: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
  },
  recognizedTextContainer: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  recognizedText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  cameraPreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
    borderRadius: 50,
  },
  viewFullImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewFullImageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullImageModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  fullImageCloseBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullImageContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cameraModalContent: {
    padding: 20,
  },
  cameraInstructions: {
    marginBottom: 20,
  },
  cameraInstructionsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cameraOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  cameraOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cameraOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cameraOptionSubtext: {
    fontSize: 14,
    color: '#757575',
  },
  cameraNote: {
    alignItems: 'center',
  },
  cameraNoteText: {
    fontSize: 14,
    color: '#757575',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotal: {
    fontSize: 14,
    color: '#757575',
  },
  addButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  itemDescriptionCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
    marginRight: 8,
  },
  itemDetail: {
    fontSize: 12,
    color: '#757575',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Shared Components
export const AddItemButton: React.FC<{
  onPress: () => void;
  itemCount: number;
  totalValue: number;
}> = ({ onPress, itemCount, totalValue }) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryHeader}>
      <Text style={styles.summaryTitle}>Items ({itemCount})</Text>
      <Text style={styles.summaryTotal}>Total: {formatCurrency(totalValue)}</Text>
    </View>
    
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
    >
      <MaterialCommunityIcons name="plus" size={20} color="#fff" />
      <Text style={styles.addButtonText}>Add Item</Text>
    </TouchableOpacity>
  </View>
);

export const PredefinedItemsList: React.FC<{
  items: Item[];
  categoryTitle: string;
  onSelectItem: (item: Item) => void;
}> = ({ items, categoryTitle, onSelectItem }) => {
  if (items.length === 0) return null;
  
  return (
    <View style={styles.predefinedList}>
      <Text style={styles.predefinedHeader}>Common {categoryTitle} Items</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.predefinedItem}
          onPress={() => onSelectItem(item)}
        >
          <Text style={styles.predefinedItemText}>{item.description || item.itemtype}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <Avatar.Icon 
      size={60} 
      icon="information-outline" 
      color="#757575" 
      style={{ backgroundColor: '#f0f0f0' }} 
    />
    <Text style={styles.emptyStateText}>
      No items added yet. Tap "Add New Item" to start.
    </Text>
  </View>
);

export const ItemsTable: React.FC<{
  categoryId: string;
  showRoom?: boolean;
  showMakeModel?: boolean;
  editable?: boolean;
  onRefresh?: () => void;
}> = ({ categoryId, showRoom = false, showMakeModel = false, editable = true, onRefresh }) => {
  const [items, setItems] = useState<RiskAssessmentItem[]>([]);
  const [editItems, setEditItems] = useState<{ [key: string]: any }>({});
  const [autoSavedItems, setAutoSavedItems] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  useEffect(() => {
    refreshItems();
  }, [categoryId]);

  // Load pending changes count
  useEffect(() => {
    const loadPendingChangesCount = async () => {
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingChangesCount(count.total);
    };
    
    loadPendingChangesCount();
  }, [items]); // Reload when items change

  const refreshItems = async () => {
    console.log('Refreshing items for category:', categoryId);
    try {
      // Get items from SQLite
      const localItems = await getAllRiskAssessmentItems();
      const categoryItems = localItems.filter(item => 
        String(item.riskassessmentcategoryid) === String(categoryId)
      );
      
      // If no items found in SQLite for this category, fetch from API
      if (categoryItems.length === 0) {
        console.log('No items in SQLite for category, fetching from API:', categoryId);
        const apiResponse = await api.getRiskAssessmentItems(categoryId);
        
        if (apiResponse?.success && Array.isArray(apiResponse.data)) {
          console.log('Got items from API, storing in SQLite:', apiResponse.data.length);
          
          // Store each item in SQLite
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
            
            await insertRiskAssessmentItem(sqliteItem);
          }
          
          // Get updated items from SQLite
          const updatedLocalItems = await getAllRiskAssessmentItems();
          const updatedCategoryItems = updatedLocalItems.filter(item => 
            String(item.riskassessmentcategoryid) === String(categoryId)
          );
          setItems(updatedCategoryItems);
        } else {
          console.log('No items found in API for category:', categoryId);
          setItems([]);
        }
      } else {
        console.log('Using existing SQLite items for category:', categoryItems.length);
        setItems(categoryItems);
      }
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error refreshing items:', error);
      setItems([]);
    }
  };

  const handleEdit = (id: string, field: 'quantity' | 'price' | 'make' | 'model' | 'serialNumber' | 'description', value: string) => {
    setEditItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Auto-save function that saves changes to SQLite without refreshing UI
  const autoSaveItem = async (id: string) => {
    const changes = editItems[id];
    if (!changes) return; // No changes to save

    try {
      const item = items.find(i => String(i.riskassessmentitemid) === id);
      if (!item) return;

      console.log('Auto-saving item:', id, changes);

      const updated: RiskAssessmentItem = {
        ...item,
        qty: Number(changes.quantity ?? item.qty) || 0,
        price: Number(changes.price ?? item.price) || 0,
        description: changes.make ?? item.description ?? '',
        model: changes.model ?? item.model ?? '',
        itemprompt: changes.description ?? item.itemprompt ?? '',
        assessmentregisterid: Number(changes.serialNumber ?? item.assessmentregisterid) || 0,
        pending_sync: 1,
        dateupdated: new Date().toISOString(),
      };

      await updateRiskAssessmentItem(updated);
      
      // Mark as auto-saved but keep the changes visible
      setAutoSavedItems(prev => ({ ...prev, [id]: true }));
      
      // Update the items array in state to reflect the saved changes without calling refreshItems
      setItems(prevItems => 
        prevItems.map(prevItem => 
          String(prevItem.riskassessmentitemid) === id ? updated : prevItem
        )
      );

      console.log('Auto-saved item successfully:', id);
    } catch (error) {
      console.error('Auto-save failed for item:', id, error);
    }
  };

  const hasUnsavedChanges = Object.keys(editItems).some(id => !autoSavedItems[id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');
    try {
      const updates = Object.entries(editItems);
      for (const [id, changes] of updates) {
        await autoSaveItem(id);
      }
      setSaveStatus('success');
      setSaveMessage('Changes saved locally.');
      setEditItems({});
      setAutoSavedItems({});
    } catch (e) {
      setSaveStatus('error');
      setSaveMessage('Failed to save changes.');
      console.error('Failed to save changes:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRiskAssessmentItem(Number(id));
    await refreshItems();
  };

  const handleAddNewItem = async () => {
    console.log('Creating new item for category:', categoryId);
    const newItem: RiskAssessmentItem = {
      riskassessmentitemid: Date.now(),
      riskassessmentcategoryid: Number(categoryId),
      itemprompt: '',
      itemtype: 0,
      rank: items.length + 1,
      commaseparatedlist: '',
      selectedanswer: '',
      qty: 1,
      price: 0,
      description: '',
      model: '',
      location: '',
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
      notes: '',
      pending_sync: 1,
    };
    console.log('About to insert new item:', newItem);
    try {
      await insertRiskAssessmentItem(newItem);
      console.log('Successfully inserted new item');
      
      // Add the new item to the items array directly without refreshing
      setItems(prevItems => [...prevItems, newItem]);
      
    } catch (error) {
      console.error('Failed to insert new item:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');
    
    try {
      console.log('=== ITEMSTABLE: STARTING SYNC PROCESS ===');
      console.log('Current items in table:', items.length);
      console.log('Current edit state:', editItems);
      console.log('Auto-saved items:', autoSavedItems);
      
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

  // Debug function to inspect current sync payload (accessible from console)
  (window as any).inspectSyncPayload = async () => {
    console.log('=== SYNC PAYLOAD INSPECTOR ===');
    try {
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      console.log('Pending changes count:', count);
      
      // This will trigger all the logging without actually syncing
      console.log('This is what would be sent to sync...');
      // Note: To see the actual payload, you would need to call the sync service
      // but we don't want to actually sync, just inspect
    } catch (error) {
      console.error('Error inspecting sync payload:', error);
    }
  };

  return (
  <Card style={styles.card}>
    <Card.Title title="Added Items" />
      {/* Buttons row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Button
          mode="outlined"
          onPress={handleAddNewItem}
          style={{ flex: 1, borderColor: '#1976d2' }}
          labelStyle={{ color: '#1976d2', fontWeight: 'bold', fontSize: 14 }}
          contentStyle={{ height: 40 }}
        >
          + Add Item
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!hasUnsavedChanges || saving}
          loading={saving}
          style={{ flex: 1, backgroundColor: '#1976d2' }}
          contentStyle={{ height: 40 }}
          labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleSync}
          disabled={syncing || pendingChangesCount === 0}
          loading={syncing}
          style={{ 
            flex: 1,
            borderColor: pendingChangesCount > 0 ? '#4CAF50' : '#ccc'
          }}
          contentStyle={{ height: 40 }}
          labelStyle={{ 
            color: pendingChangesCount > 0 ? '#4CAF50' : '#ccc', 
            fontWeight: 'bold',
            fontSize: 14
          }}
          icon="cloud-upload"
        >
          {syncing ? 'Syncing...' : `Sync (${pendingChangesCount})`}
        </Button>
      </View>
      
      {/* Status messages */}
      {saveStatus === 'success' && <Text style={{ color: 'green', marginBottom: 8, fontSize: 12 }}>{saveMessage}</Text>}
      {saveStatus === 'error' && <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>{saveMessage}</Text>}
      {syncStatus === 'success' && <Text style={{ color: 'green', marginBottom: 8, fontSize: 12 }}>{syncMessage}</Text>}
      {syncStatus === 'error' && <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>{syncMessage}</Text>}
      
      <ScrollView horizontal>
        <View style={{ flexDirection: 'row' }}>
          <ScrollView style={{ maxHeight: 400 }}>
    <DataTable>
      <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={{ width: 180 }}>Description</DataTable.Title>
                <DataTable.Title style={{ width: 180 }}>Make</DataTable.Title>
                <DataTable.Title style={{ width: 180 }}>Model</DataTable.Title>
                <DataTable.Title style={{ width: 180 }}>Serial Number</DataTable.Title>
                <DataTable.Title numeric style={{ width: 100 }}>Qty</DataTable.Title>
                <DataTable.Title numeric style={{ width: 120 }}>Price</DataTable.Title>
                <DataTable.Title numeric style={{ width: 120 }}>Total</DataTable.Title>
                <DataTable.Title style={{ width: 60, justifyContent: 'flex-end' }}>
          <Text>{''}</Text>
        </DataTable.Title>
      </DataTable.Header>
              {items.map((item) => {
                const quantity = editItems[String(item.riskassessmentitemid)]?.quantity ?? String(item.qty);
                const price = editItems[String(item.riskassessmentitemid)]?.price ?? String(item.price);
                const make = editItems[String(item.riskassessmentitemid)]?.make ?? item.description ?? '';
                const model = editItems[String(item.riskassessmentitemid)]?.model ?? item.model ?? '';
                const serialNumber = editItems[String(item.riskassessmentitemid)]?.serialNumber ?? String(item.assessmentregisterid ?? '');
                const description = editItems[String(item.riskassessmentitemid)]?.description ?? item.itemprompt ?? '';
                const total = (parseInt(quantity || '1', 10) || 1) * (parseFloat(price || '0') || 0);
                const isAutoSaved = autoSavedItems[String(item.riskassessmentitemid)];
                const itemId = String(item.riskassessmentitemid);
        return (
                  <DataTable.Row key={item.riskassessmentitemid} style={isAutoSaved ? { backgroundColor: '#f0f8f0' } : undefined}>
                    <DataTable.Cell style={{ width: 180 }}>
              <View style={styles.itemDescriptionCell}>
                <View>
                  {editable ? (
                    <PaperTextInput
                      value={description}
                      onChangeText={v => handleEdit(itemId, 'description', v)}
                      onBlur={() => autoSaveItem(itemId)}
                      style={{ width: 180, height: 36, backgroundColor: '#f7fafd', fontSize: 15, borderColor: '#b0b0b0', borderWidth: 1, borderRadius: 6, marginHorizontal: 4 }}
                      theme={{ colors: { text: '#222' } }}
                      placeholder="Enter description"
                    />
                  ) : (
                    <Text numberOfLines={2} ellipsizeMode="tail" style={{ flexWrap: 'wrap', width: 180 }}>{description}</Text>
                  )}
                          {showRoom && item.location && (
                            <Text style={styles.itemDetail}>Room: {item.location}</Text>
                  )}
                </View>
              </View>
            </DataTable.Cell>
                    <DataTable.Cell style={{ width: 180 }}>
                      {editable ? (
                        <PaperTextInput
                          value={make}
                          onChangeText={v => handleEdit(itemId, 'make', v)}
                          onBlur={() => autoSaveItem(itemId)}
                          style={{ width: 180, height: 36, backgroundColor: '#f7fafd', fontSize: 15, borderColor: '#b0b0b0', borderWidth: 1, borderRadius: 6, marginHorizontal: 4 }}
                          theme={{ colors: { text: '#222' } }}
                        />
                      ) : (
                        <Text>{make}</Text>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: 180 }}>
                      {editable ? (
                        <PaperTextInput
                          value={model}
                          onChangeText={v => handleEdit(itemId, 'model', v)}
                          onBlur={() => autoSaveItem(itemId)}
                          style={{ width: 180, height: 36, backgroundColor: '#f7fafd', fontSize: 15, borderColor: '#b0b0b0', borderWidth: 1, borderRadius: 6, marginHorizontal: 4 }}
                          theme={{ colors: { text: '#222' } }}
                        />
                      ) : (
                        <Text>{model}</Text>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: 180 }}>
                      {editable ? (
                        <PaperTextInput
                          value={serialNumber}
                          onChangeText={v => handleEdit(itemId, 'serialNumber', v)}
                          onBlur={() => autoSaveItem(itemId)}
                          style={{ width: 180, height: 36, backgroundColor: '#f7fafd', fontSize: 15, borderColor: '#b0b0b0', borderWidth: 1, borderRadius: 6, marginHorizontal: 4 }}
                          theme={{ colors: { text: '#222' } }}
                        />
                      ) : (
                        <Text>{serialNumber}</Text>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ width: 100 }}>
                      {editable ? (
                        <PaperTextInput
                          value={quantity}
                          onChangeText={v => handleEdit(itemId, 'quantity', v)}
                          onBlur={() => autoSaveItem(itemId)}
                          keyboardType="numeric"
                          style={{ width: 100, height: 36, backgroundColor: '#f7fafd', fontSize: 15, borderColor: '#b0b0b0', borderWidth: 1, borderRadius: 6, marginHorizontal: 4 }}
                          theme={{ colors: { text: '#222' } }}
                        />
                      ) : (
                        <Text>{quantity}</Text>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ width: 120 }}>
                      {editable ? (
                        <PaperTextInput
                          value={price}
                          onChangeText={v => handleEdit(itemId, 'price', v)}
                          onBlur={() => autoSaveItem(itemId)}
                          keyboardType="numeric"
                          style={{ width: 120, height: 36, backgroundColor: '#f7fafd', fontSize: 15, borderColor: '#b0b0b0', borderWidth: 1, borderRadius: 6, marginHorizontal: 4 }}
                          theme={{ colors: { text: '#222' } }}
                        />
                      ) : (
                        <Text>{price}</Text>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ width: 120 }}>
                      <Text>{formatCurrency(total)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: 60 }}>
                      {editable && (
              <IconButton
                icon="delete"
                size={20}
                          onPress={() => handleDelete(itemId)}
                iconColor="#e74c3c"
              />
                      )}
            </DataTable.Cell>
          </DataTable.Row>
        );
      })}
      <DataTable.Row style={styles.totalRow}>
                <DataTable.Cell style={{ width: 180 }}><Text style={styles.totalLabel}>Total</Text></DataTable.Cell>
                <DataTable.Cell style={{ width: 180 }}><Text>{''}</Text></DataTable.Cell>
                <DataTable.Cell style={{ width: 180 }}><Text>{''}</Text></DataTable.Cell>
                <DataTable.Cell style={{ width: 180 }}><Text>{''}</Text></DataTable.Cell>
                <DataTable.Cell style={{ width: 100 }}><Text>{''}</Text></DataTable.Cell>
                <DataTable.Cell style={{ width: 120 }}><Text>{''}</Text></DataTable.Cell>
                <DataTable.Cell numeric style={{ width: 120 }}>
          <Text style={styles.totalValue}>
                    {formatCurrency(items.reduce((total, item) => total + (item.price * item.qty), 0))}
          </Text>
        </DataTable.Cell>
                <DataTable.Cell style={{ width: 60 }}><Text>{''}</Text></DataTable.Cell>
      </DataTable.Row>
    </DataTable>
          </ScrollView>
        </View>
      </ScrollView>
  </Card>
);
};

/**
 * Dynamic form component that generates fields based on category configuration
 */
export const DynamicForm: React.FC<{
  item: Item;
  onChangeItem: (item: Item) => void;
  categoryId: string;
  handwritingEnabled?: boolean;
  onHandwriting?: (field: keyof Item) => void;
}> = ({ item, onChangeItem, categoryId, handwritingEnabled = false, onHandwriting }) => {
  const categoryConfig = getCategoryConfig(categoryId);
  
  if (!categoryConfig) {
    return <Text>Invalid category configuration</Text>;
  }
  
  // Handle changing a field value
  const handleFieldChange = (field: string, value: string) => {
    onChangeItem({ ...item, [field]: value });
  };
  
  // Group quantity and price together
  const hasQuantity = categoryConfig.fields.some(field => field.key === 'quantity');
  const hasPrice = categoryConfig.fields.some(field => field.key === 'price');
  const quantityPrice: string[] = [];
  
  if (hasQuantity) {
    quantityPrice.push('quantity');
  }
  
  if (hasPrice) {
    quantityPrice.push('price');
  }
  
  // Get fields that aren't quantity or price (to render separately)
  const otherFields = categoryConfig.fields
    .filter(field => !quantityPrice.includes(field.key))
    .map(field => field.key);
  
  return (
    <View>
      {/* Render other fields */}
      {otherFields.map(fieldKey => {
        const field = categoryConfig.fields.find(f => f.key === fieldKey);
        if (!field) return null;
        
        return (
          <FormInputField
            key={field.key}
            label={field.label}
            value={(item as any)[field.key] || ''}
            onChangeText={(value) => handleFieldChange(field.key, value)}
            placeholder={field.placeholder}
            multiline={field.type === 'multiline'}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            handwritingEnabled={handwritingEnabled}
            onHandwriting={onHandwriting ? () => onHandwriting(field.key as keyof Item) : undefined}
          />
        );
      })}
      
      {/* Render quantity and price in a row */}
      {quantityPrice.length > 0 && (
        <View style={styles.formRow}>
          {hasQuantity && (
            <View style={styles.quantityField}>
              <FormInputField
                label="Quantity"
                value={item.qty}
                onChangeText={(value) => handleFieldChange('qty', value)}
                keyboardType="numeric"
                placeholder="1"
                handwritingEnabled={handwritingEnabled}
                onHandwriting={onHandwriting ? () => onHandwriting('qty') : undefined}
              />
            </View>
          )}
          
          {hasPrice && (
            <View style={styles.priceField}>
              <FormInputField
                label="Price (R)"
                value={item.price}
                onChangeText={(value) => handleFieldChange('price', value)}
                keyboardType="numeric"
                placeholder="0.00"
                handwritingEnabled={handwritingEnabled}
                onHandwriting={onHandwriting ? () => onHandwriting('price') : undefined}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export const FormInputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  handwritingEnabled?: boolean;
  onHandwriting?: () => void;
}> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  handwritingEnabled = false,
  onHandwriting,
}) => (
  <View style={styles.formGroup}>
    <Text style={styles.formLabel}>{label}</Text>
    <View style={{ flexDirection: 'row' }}>
      <PaperTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        mode="outlined"
        keyboardType={keyboardType}
        style={{ flex: 1 }}
      />
      {handwritingEnabled && onHandwriting && (
        <IconButton
          icon="draw"
          size={24}
          style={{ marginLeft: 8 }}
          onPress={onHandwriting}
        />
      )}
    </View>
  </View>
);

export const RoomSelector: React.FC<{
  rooms: string[];
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
}> = ({ rooms, selectedRoom, onSelectRoom }) => (
  <View style={styles.roomSelector}>
    <Text style={styles.formLabel}>Room</Text>
    <View style={styles.roomChips}>
      {rooms.map((room) => (
        <Chip
          key={room}
          selected={selectedRoom === room}
          onPress={() => onSelectRoom(room)}
          style={{ marginBottom: 8 }}
        >
          {room}
        </Chip>
      ))}
    </View>
  </View>
);

export const FormButtons: React.FC<{
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}> = ({ onCancel, onSave, saveDisabled = false }) => (
  <View style={styles.formButtons}>
    <Button mode="outlined" onPress={onCancel}>
      Cancel
    </Button>
    <Button mode="contained" onPress={onSave} disabled={saveDisabled}>
      Save Item
    </Button>
  </View>
);

export const PhotoPreview: React.FC<{
  photoUri: string | null;
}> = ({ photoUri }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  
  if (!photoUri) return null;
  
  return (
    <View style={styles.photoContainer}>
      <TouchableOpacity onPress={() => setShowFullImage(true)}>
        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        <View style={styles.viewFullImageOverlay}>
          <Text style={styles.viewFullImageText}>Click to view</Text>
        </View>
      </TouchableOpacity>
      
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.fullImageModal}>
          <TouchableOpacity 
            style={styles.fullImageCloseBtn}
            onPress={() => setShowFullImage(false)}
          >
            <Text style={styles.fullImageCloseBtnText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.fullImageContainer}>
            <Image
              source={{ uri: photoUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const ItemFormHeader: React.FC<{
  title: string;
  onPhoto: () => void;
}> = ({ title, onPhoto }) => (
  <View style={styles.formHeader}>
    <Text style={styles.formTitle}>{title}</Text>
    <IconButton icon="camera" size={24} onPress={onPhoto} />
  </View>
);

export const HandwritingModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onClear: () => void;
  onRecognize: () => void;
  onConfirm: () => void;
  paths: {path: string; color: string}[];
  currentPath: string;
  strokeColor: string;
  recognizedText: string;
  onTouchStart: (event: GestureResponderEvent) => void;
  onTouchMove: (event: GestureResponderEvent) => void;
  onTouchEnd: () => void;
}> = ({
  visible,
  onClose,
  onClear,
  onRecognize,
  onConfirm,
  paths,
  currentPath,
  strokeColor,
  recognizedText,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modal}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Handwriting Input</Text>
          <IconButton icon="close" size={24} onPress={onClose} />
        </View>
        
        <View
          style={styles.canvasContainer}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Svg width="100%" height="100%">
            {paths.map((path, index) => (
              <Path
                key={index}
                d={path.path}
                stroke={path.color}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke={strokeColor}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            ) : null}
          </Svg>
        </View>
        
        <Button mode="outlined" onPress={onClear} style={{ marginBottom: 12 }}>
          Clear Canvas
        </Button>
        
        <Button mode="contained" onPress={onRecognize}>
          Recognize Text
        </Button>
        
        {recognizedText ? (
          <View style={styles.recognizedTextContainer}>
            <Text style={styles.recognizedText}>{recognizedText}</Text>
          </View>
        ) : null}
        
        <View style={styles.modalButtons}>
          <Button mode="outlined" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={onConfirm}
            disabled={!recognizedText}
          >
            Confirm
          </Button>
        </View>
      </View>
    </View>
  </Modal>
);

export const CameraModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onSelectFromGallery: () => void;
}> = ({ visible, onClose, onTakePhoto, onSelectFromGallery }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modal}>
      <View style={[styles.modalContent, styles.cameraModalContent]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('camera.title')}</Text>
          <IconButton icon="close" size={24} onPress={onClose} />
        </View>
        
        <View style={styles.cameraInstructions}>
          <Text style={styles.cameraInstructionsText}>
            Choose a method to add a photo:
          </Text>
        </View>
        
        <View style={styles.cameraOptions}>
          <TouchableOpacity 
            style={styles.cameraOption} 
            onPress={onTakePhoto}
          >
            <View style={styles.cameraIconContainer}>
              <IconButton icon="camera" size={32} />
            </View>
            <Text style={styles.cameraOptionText}>{t('camera.take')}</Text>
            <Text style={styles.cameraOptionSubtext}>
              Take a photo with your camera
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cameraOption} 
            onPress={onSelectFromGallery}
          >
            <View style={styles.cameraIconContainer}>
              <IconButton icon="image" size={32} />
            </View>
            <Text style={styles.cameraOptionText}>{t('camera.select')}</Text>
            <Text style={styles.cameraOptionSubtext}>
              Choose from your photo gallery
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.cameraNote}>
          <Text style={styles.cameraNoteText}>
            * Photos will be stored locally on your device only
          </Text>
        </View>
      </View>
    </View>
  </Modal>
);

// Default export with all components
export default {
  AddItemButton,
  PredefinedItemsList,
  EmptyState,
  ItemsTable,
  DynamicForm,
  FormInputField,
  RoomSelector,
  FormButtons,
  PhotoPreview,
  ItemFormHeader,
  HandwritingModal,
  CameraModal,
  itemUtils,
  styles
}; 