import React, { useState } from 'react';
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
  Dimensions
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
  items: Item[];
  onDeleteItem: (id: string) => void;
  showRoom?: boolean;
  showMakeModel?: boolean;
  editable?: boolean;
}> = ({ items, onDeleteItem, showRoom = false, showMakeModel = false, editable = true }) => {
  // Local state for editing quantity/price
  const [editItems, setEditItems] = useState<{ [id: string]: { quantity: string; price: string; make?: string; model?: string; serialNumber?: string } }>({});

  const handleEdit = (id: string, field: 'quantity' | 'price' | 'make' | 'model' | 'serialNumber', value: string) => {
    setEditItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="Added Items" />
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
                const quantity = editItems[String(item.riskassessmentitemid)]?.quantity ?? item.qty;
                const price = editItems[String(item.riskassessmentitemid)]?.price ?? item.price;
                const make = editItems[String(item.riskassessmentitemid)]?.make ?? item.description ?? '';
                const model = editItems[String(item.riskassessmentitemid)]?.model ?? item.model ?? '';
                const serialNumber = editItems[String(item.riskassessmentitemid)]?.serialNumber ?? item.assessmentregisterid ?? '';
                const total = (parseInt(quantity || '1', 10) || 1) * (parseFloat(price || '0') || 0);
                return (
                  <DataTable.Row key={item.riskassessmentitemid}>
                    <DataTable.Cell style={{ width: 180 }}>
                      <View style={styles.itemDescriptionCell}>
                        <View>
                          {/* Description is always read-only, now using itemprompt */}
                          <Text numberOfLines={2} ellipsizeMode="tail" style={{ flexWrap: 'wrap', width: 180 }}>{item.itemprompt}</Text>
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
                          onChangeText={v => handleEdit(String(item.riskassessmentitemid), 'make', v)}
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
                          onChangeText={v => handleEdit(String(item.riskassessmentitemid), 'model', v)}
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
                          onChangeText={v => handleEdit(String(item.riskassessmentitemid), 'serialNumber', v)}
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
                          onChangeText={v => handleEdit(String(item.riskassessmentitemid), 'quantity', v)}
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
                          onChangeText={v => handleEdit(String(item.riskassessmentitemid), 'price', v)}
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
                          onPress={() => onDeleteItem(String(item.riskassessmentitemid))}
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
                    {formatCurrency(itemUtils.calculateTotalValue(items))}
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