import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { Button, Card, List, Divider, TextInput, Menu, IconButton, Chip } from 'react-native-paper';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../utils/logger';

// Simple orientation hook
const useOrientation = () => {
  const [dimensions, setDimensions] = useState({ 
    window: Dimensions.get('window') 
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ window });
    });
    
    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions.window;
  const isLandscape = width > height;

  return { isLandscape, width, height };
};

// Add types
interface Item {
  id: string;
  rank: number;
  type: string;
  description: string;
  model: string;
  selection: string;
  quantity: number;
  price: number;
  [key: string]: any;
}
interface Category {
  id: string;
  name: string;
  items: Item[];
  value: number;
  [key: string]: any;
}

// Category data with sample items
const categoryData: { [key: string]: Item[] } = {
  'CLOTHING (GENTS / BOYS)': [
    { id: '1', rank: 1, type: 'Belts', description: 'Leather belts', model: 'Designer', selection: 'Brown, Black', quantity: 2, price: 1200 },
    { id: '2', rank: 2, type: 'Hats / Gloves / Scarves', description: 'Winter accessories', model: 'Various', selection: 'Wool, Cotton', quantity: 4, price: 800 },
    { id: '3', rank: 3, type: 'Jackets / Blazers', description: 'Formal blazers', model: 'Hugo Boss', selection: 'Navy, Grey', quantity: 2, price: 6500 },
    { id: '4', rank: 4, type: 'Leather / Suede Jackets', description: 'Leather jacket', model: 'Wilson', selection: 'Black', quantity: 1, price: 8000 },
    { id: '5', rank: 5, type: 'Long Trousers / Jeans', description: 'Jeans & formal pants', model: 'Levi\'s, Dockers', selection: 'Various', quantity: 5, price: 1800 },
  ],
  'CLOTHING (LADIES / GIRLS)': [
    { id: '1', rank: 1, type: 'Blouses', description: 'Silk blouses', model: 'Zara', selection: 'Various colors', quantity: 5, price: 950 },
    { id: '2', rank: 2, type: 'Dresses', description: 'Cocktail dresses', model: 'H&M', selection: 'Black, Red', quantity: 3, price: 1800 },
    { id: '3', rank: 3, type: 'Skirts', description: 'Various styles', model: 'Various', selection: 'Assorted', quantity: 4, price: 1200 },
  ],
  'FURNITURE': [
    { id: '1', rank: 1, type: 'Sofa', description: 'Leather 3-seater', model: 'La-Z-Boy', selection: 'Brown', quantity: 1, price: 12000 },
    { id: '2', rank: 2, type: 'Dining Table', description: 'Solid oak', model: 'Ashley', selection: 'Natural wood', quantity: 1, price: 8500 },
    { id: '3', rank: 3, type: 'Chairs', description: 'Dining chairs', model: 'Ashley', selection: 'Natural wood', quantity: 6, price: 1200 },
  ],
  'JEWELLERY': [
    { id: '1', rank: 1, type: 'Necklace', description: 'Gold chain', model: 'n/a', selection: '18k gold', quantity: 1, price: 15000 },
    { id: '2', rank: 2, type: 'Rings', description: 'Wedding set', model: 'n/a', selection: 'Platinum', quantity: 2, price: 20000 },
    { id: '3', rank: 3, type: 'Watch', description: 'Luxury timepiece', model: 'Rolex', selection: 'Steel', quantity: 1, price: 85000 },
  ]
};

// Type options for dropdowns per category
const typeOptions: { [key: string]: string[] } = {
  'CLOTHING (GENTS / BOYS)': ['Belts', 'Hats / Gloves / Scarves', 'Jackets / Blazers', 'Leather / Suede Jackets', 'Long Trousers / Jeans', 'Pullovers / Cardigans', 'Raincoats / Overcoats', 'Shirts / T-Shirts', 'Shoes / Boots', 'Shorts / Swimming Trunks', 'Socks / Underwear / Sleepwear', 'Sports Wear', 'Suits', 'Ties', 'Tracksuits'],
  'CLOTHING (LADIES / GIRLS)': ['Blouses', 'Dresses', 'Skirts', 'Pants', 'Sweaters', 'Coats', 'Shoes', 'Accessories'],
  'FURNITURE': ['Sofa', 'Dining Table', 'Chairs', 'Bed', 'Wardrobe', 'Desk', 'Bookshelf', 'Coffee Table'],
  'JEWELLERY': ['Necklace', 'Rings', 'Watch', 'Bracelet', 'Earrings', 'Brooch', 'Cufflinks', 'Pendant']
};

export default function CombinedView() {
  logNavigation('test-page CombinedView');
  
  const { isLandscape } = useOrientation();
  const [selectedCategory, setSelectedCategory] = useState('CLOTHING (GENTS / BOYS)');
  const [items, setItems] = useState(categoryData['CLOTHING (GENTS / BOYS)']);
  const [sortBy, setSortBy] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState(typeOptions['CLOTHING (GENTS / BOYS)']);
  const [totalValue, setTotalValue] = useState(0);

  // Update items when category changes
  useEffect(() => {
    setItems(categoryData[selectedCategory] || []);
    setDropdownOptions(typeOptions[selectedCategory] || []);
  }, [selectedCategory]);

  // Calculate total value whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    setTotalValue(total);
  }, [items]);

  // Add a new item
  const addNewItem = () => {
    const newId = (Math.max(0, ...items.map(i => parseInt(i.id))) + 1).toString();
    const newRank = items.length > 0 ? Math.max(...items.map(i => i.rank)) + 1 : 1;
    
    const newItem = {
      id: newId,
      rank: newRank,
      type: dropdownOptions.length > 0 ? dropdownOptions[0] : 'New Item',
      description: '',
      model: '',
      selection: '',
      quantity: 1,
      price: 0
    };
    
    setItems([...items, newItem]);
  };

  // Update an item field
  const updateItemField = (itemId: string, field: string, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    
    setItems(updatedItems);
  };

  // Delete an item
  const deleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            const updatedItems = items.filter(item => item.id !== itemId);
            setItems(updatedItems);
          },
          style: 'destructive'
        },
      ]
    );
  };

  // Sort items
  const sortItems = (by: string, direction: string) => {
    const sortedItems = [...items].sort((a, b) => {
      if (by === 'rank') {
        return direction === 'asc' ? a.rank - b.rank : b.rank - a.rank;
      } else if (by === 'price') {
        return direction === 'asc' ? a.price - b.price : b.price - a.price;
      } else if (by === 'type') {
        return direction === 'asc' 
          ? a.type.localeCompare(b.type) 
          : b.type.localeCompare(a.type);
      }
      return 0;
    });
    
    setItems(sortedItems);
    setSortBy(by);
    setSortDirection(direction);
    setShowSortMenu(false);
  };

  // Get cell width based on orientation
  const getCellWidth = (field: string) => {
    const baseWidths: { [key: string]: number } = {
      rank: 50,
      type: isLandscape ? 150 : 130,
      description: isLandscape ? 150 : 120,
      model: isLandscape ? 150 : 100,
      selection: isLandscape ? 150 : 100,
      quantity: isLandscape ? 100 : 80,
      price: isLandscape ? 120 : 100,
      value: isLandscape ? 120 : 100,
      actions: 80
    };
    
    return baseWidths[field];
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Combined View', headerShown: true }} />
      
      <SafeAreaView style={styles.container}>
        <View style={[styles.contentContainer, { flexDirection: isLandscape ? 'row' : 'column' }]}>
          {/* Categories Panel */}
          <View style={[
            styles.categoriesPanel, 
            { 
              width: isLandscape ? '30%' : '100%', 
              height: isLandscape ? '100%' : Math.min(200, Dimensions.get('window').height * 0.3) 
            }
          ]}>
            <Text style={styles.panelTitle}>Categories</Text>
            <ScrollView style={styles.categoriesScroll}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SECTION A - AGREED VALUE ITEMS</Text>
                <MaterialCommunityIcons name="chevron-up" size={24} color="#555" />
              </View>
              
              <View>
                <TouchableOpacity
                  style={[
                    styles.categoryItem, 
                    selectedCategory === 'CLOTHING (GENTS / BOYS)' && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory('CLOTHING (GENTS / BOYS)')}
                >
                  <Text style={styles.categoryTitle}>CLOTHING (GENTS / BOYS)</Text>
                </TouchableOpacity>
                <Divider />
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory === 'CLOTHING (LADIES / GIRLS)' && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory('CLOTHING (LADIES / GIRLS)')}
                >
                  <Text style={styles.categoryTitle}>CLOTHING (LADIES / GIRLS)</Text>
                </TouchableOpacity>
                <Divider />
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory === 'FURNITURE' && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory('FURNITURE')}
                >
                  <Text style={styles.categoryTitle}>FURNITURE</Text>
                </TouchableOpacity>
                <Divider />
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory === 'JEWELLERY' && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory('JEWELLERY')}
                >
                  <Text style={styles.categoryTitle}>JEWELLERY</Text>
                </TouchableOpacity>
                <Divider />
              </View>
            </ScrollView>
          </View>

          {/* Items Panel */}
          <View style={[styles.itemsPanel, { width: isLandscape ? '70%' : '100%' }]}>
            <View style={styles.itemsHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.panelTitle}>{selectedCategory}</Text>
                <Chip style={styles.totalValueChip}>
                  Total: R {totalValue.toLocaleString()}
                </Chip>
              </View>
              
              <View style={styles.headerRight}>
                {/* Sort button */}
                <IconButton
                  icon="sort"
                  mode="contained-tonal"
                  size={20}
                  onPress={(e) => {
                    setMenuAnchor({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
                    setShowSortMenu(true);
                  }}
                  style={styles.sortButton}
                />
                
                {/* Add button */}
                <Button 
                  mode="contained" 
                  onPress={addNewItem}
                  style={styles.addButton}
                  icon="plus"
                >
                  Add Item
                </Button>
              </View>
            </View>
            
            {/* Sort menu */}
            <Menu
              visible={showSortMenu}
              onDismiss={() => setShowSortMenu(false)}
              anchor={menuAnchor}
            >
              <Menu.Item 
                leadingIcon={sortBy === 'rank' && sortDirection === 'asc' ? 'check' : undefined}
                onPress={() => sortItems('rank', 'asc')} 
                title="Rank (A-Z)" 
              />
              <Menu.Item 
                leadingIcon={sortBy === 'rank' && sortDirection === 'desc' ? 'check' : undefined}
                onPress={() => sortItems('rank', 'desc')} 
                title="Rank (Z-A)" 
              />
              <Menu.Item 
                leadingIcon={sortBy === 'type' && sortDirection === 'asc' ? 'check' : undefined}
                onPress={() => sortItems('type', 'asc')} 
                title="Type (A-Z)" 
              />
              <Menu.Item 
                leadingIcon={sortBy === 'type' && sortDirection === 'desc' ? 'check' : undefined}
                onPress={() => sortItems('type', 'desc')} 
                title="Type (Z-A)" 
              />
              <Menu.Item 
                leadingIcon={sortBy === 'price' && sortDirection === 'asc' ? 'check' : undefined}
                onPress={() => sortItems('price', 'asc')} 
                title="Price (Low-High)" 
              />
              <Menu.Item 
                leadingIcon={sortBy === 'price' && sortDirection === 'desc' ? 'check' : undefined}
                onPress={() => sortItems('price', 'desc')} 
                title="Price (High-Low)" 
              />
            </Menu>
            
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: getCellWidth('rank') }]}>Rank</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('type') }]}>Type</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('description') }]}>Description</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('model') }]}>Model</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('selection') }]}>Selection</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('quantity') }]}>Quantity</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('price') }]}>Price (R)</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('value') }]}>Value (R)</Text>
                  <Text style={[styles.headerCell, { width: getCellWidth('actions') }]}>Actions</Text>
                </View>
                
                {/* Table Content */}
                <ScrollView style={styles.tableContent}>
                  {items.map((item, index) => (
                    <View key={item.id} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                      <Text style={[styles.cell, { width: getCellWidth('rank') }]}>{item.rank}</Text>
                      
                      <View style={[styles.cell, { width: getCellWidth('type') }]}>
                        <Menu
                          visible={editingItem === `${item.id}-type`}
                          onDismiss={() => setEditingItem(null)}
                          anchor={<TouchableOpacity onPress={() => setEditingItem(`${item.id}-type`)}>
                            <Text style={styles.selectableText}>{item.type || 'Select type'}</Text>
                          </TouchableOpacity>}
                        >
                          {dropdownOptions.map((option) => (
                            <Menu.Item
                              key={option}
                              onPress={() => {
                                updateItemField(item.id, 'type', option);
                                setEditingItem(null);
                              }}
                              title={option}
                              leadingIcon={item.type === option ? 'check' : undefined}
                            />
                          ))}
                        </Menu>
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('description') }]}>
                        <TextInput
                          value={item.description}
                          onChangeText={(text) => updateItemField(item.id, 'description', text)}
                          style={styles.input}
                          dense
                        />
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('model') }]}>
                        <TextInput
                          value={item.model}
                          onChangeText={(text) => updateItemField(item.id, 'model', text)}
                          style={styles.input}
                          dense
                        />
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('selection') }]}>
                        <TextInput
                          value={item.selection}
                          onChangeText={(text) => updateItemField(item.id, 'selection', text)}
                          style={styles.input}
                          dense
                        />
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('quantity') }]}>
                        <TextInput
                          value={item.quantity?.toString()}
                          onChangeText={(text) => {
                            const qty = parseInt(text) || 0;
                            updateItemField(item.id, 'quantity', qty);
                          }}
                          keyboardType="numeric"
                          style={styles.input}
                          dense
                        />
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('price') }]}>
                        <TextInput
                          value={item.price?.toString()}
                          onChangeText={(text) => {
                            const price = parseFloat(text) || 0;
                            updateItemField(item.id, 'price', price);
                          }}
                          keyboardType="numeric"
                          style={styles.input}
                          dense
                        />
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('value') }]}>
                        <Text style={styles.valueText}>
                          {(item.quantity * item.price).toLocaleString()}
                        </Text>
                      </View>
                      
                      <View style={[styles.cell, { width: getCellWidth('actions') }]}>
                        <View style={styles.actionButtons}>
                          <IconButton
                            icon="delete"
                            size={20}
                            onPress={() => deleteItem(item.id)}
                            iconColor="#e74c3c"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                style={styles.completeButton}
                icon="check"
              >
                Complete & View Summary
              </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  categoriesPanel: {
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    padding: 10,
  },
  categoriesScroll: {
    flex: 1,
  },
  itemsPanel: {
    flex: 1,
    padding: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    padding: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 5,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  categoryTitle: {
    fontSize: 14,
  },
  categoryItem: {
    padding: 12,
    paddingLeft: 16,
  },
  selectedCategory: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValueChip: {
    marginLeft: 10,
    backgroundColor: '#e6f7ff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#1890ff',
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 10,
  },
  headerCell: {
    fontWeight: 'bold',
    padding: 5,
  },
  tableContent: {
    flexGrow: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    padding: 5,
    justifyContent: 'center',
  },
  selectableText: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  input: {
    backgroundColor: 'transparent',
    height: 40,
  },
  valueText: {
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonContainer: {
    padding: 10,
    marginTop: 10,
  },
  completeButton: {
    backgroundColor: '#389e0d',
    paddingVertical: 5,
  },
}); 