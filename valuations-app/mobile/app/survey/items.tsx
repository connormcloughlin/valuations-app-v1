import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, TextInput, Modal, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Button, Card, IconButton, Divider, DataTable, Switch } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import categoryItemsApi from '../../services/categoryItemsApi';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api';

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
  name: string;
  description?: string;
  defaultValue?: number;
}

interface ApiResponse {
  success: boolean;
  data: any;
  status?: number;
  message?: string;
}

interface ItemDetails {
  quantity: number;
  value: number;
  notes: string;
}

export default function ItemsScreen() {
  const { 
    categoryId, 
    categoryTitle,
    templateId,
    sectionId,
    appointmentId,
    orderId 
  } = useLocalSearchParams<{ 
    categoryId: string; 
    categoryTitle: string;
    templateId: string;
    sectionId: string;
    appointmentId: string;
    orderId: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, any>>({});
  
  // Load template items for this category
  useEffect(() => {
    const loadTemplateItems = async () => {
      try {
    setLoading(true);
        // Get items for the selected template category
        const response = await api.getTemplateItems(templateId, sectionId, categoryId) as ApiResponse;
        
        if (response.success && response.data) {
          // Transform API data to our item structure
          const templateItems: Item[] = response.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            defaultValue: item.defaultValue || 0
          }));
          
          setItems(templateItems);
          setFilteredItems(templateItems);
      } else {
          setError('Failed to load items');
      }
    } catch (err) {
        console.error('Error loading template items:', err);
        setError('An error occurred while loading items');
    } finally {
      setLoading(false);
    }
  };
  
    if (templateId && sectionId && categoryId) {
      loadTemplateItems();
    }
  }, [templateId, sectionId, categoryId]);
  
  // Handle filtering items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);
  
  const handleSelectItem = (item: Item) => {
    // Check if item is already selected
    if (selectedItems[item.id]) {
      // Item already selected, edit it
      showItemDetailsPrompt(item, selectedItems[item.id]);
    } else {
      // New item, add it
      showItemDetailsPrompt(item);
    }
  };
  
  const showItemDetailsPrompt = (item: Item, existingDetails?: any) => {
    // Show a form to capture item details like quantity, value, etc.
    // For this example, we'll just toggle the selection with a default value
    setSelectedItems(prev => {
      if (prev[item.id]) {
        // Remove the item if already selected
        const newSelected = { ...prev };
        delete newSelected[item.id];
        return newSelected;
      } else {
        // Add the item with default values
        return {
          ...prev,
          [item.id]: { 
            quantity: 1, 
            value: item.defaultValue || 0,
            notes: ''
          }
        };
      }
    });
  };
  
  const saveItemsToSurvey = async () => {
    try {
      // Logic to save selected items to the current survey
      const surveyData = {
        appointmentId,
        orderId,
        templateId,
        sectionId,
        categoryId,
        items: Object.entries(selectedItems).map(([itemId, details]) => ({
          itemId,
          ...details
        }))
      };
      
      const response = await api.submitSurveyItems(surveyData) as ApiResponse;
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Items saved successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to save items');
      }
    } catch (error) {
      console.error('Error saving items:', error);
      Alert.alert('Error', 'An error occurred while saving items');
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity 
      style={[
        styles.itemCard,
        selectedItems[item.id] && styles.selectedItemCard
      ]}
      onPress={() => handleSelectItem(item)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
        </View>
        
        {selectedItems[item.id] ? (
          <View style={styles.selectedIndicator}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#27ae60" />
            <Text style={styles.quantityText}>
              Qty: {selectedItems[item.id].quantity}
            </Text>
          </View>
        ) : (
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#7f8c8d" />
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          title: categoryTitle || 'Items',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color="#999" />
                            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={filteredItems}
          keyExtractor={(item: Item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 
                  ? 'No matching items found. Try a different search term.'
                  : 'No items available for this category.'}
              </Text>
            </View>
          }
        />
            
        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {Object.keys(selectedItems).length} items selected
          </Text>
              <TouchableOpacity
            style={[
              styles.saveButton,
              Object.keys(selectedItems).length === 0 && styles.disabledButton
            ]}
            onPress={saveItemsToSurvey}
            disabled={Object.keys(selectedItems).length === 0}
          >
            <Text style={styles.saveButtonText}>Save Items</Text>
              </TouchableOpacity>
            </View>
          </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedItemCard: {
    borderWidth: 1,
    borderColor: '#27ae60',
    backgroundColor: '#f0fff4',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#27ae60',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  selectedCount: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});