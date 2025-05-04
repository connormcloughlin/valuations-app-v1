import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Button, Card, List, Divider, TextInput } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

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

// Define types for our category structure
interface Category {
  id: string;
  title: string;
  subcategories?: string[];
}

interface Section {
  id: string;
  title: string;
  categories: Category[];
}

// Define item interface
interface Item {
  id: string;
  rank: number;
  type: string;
  description: string;
  model: string;
  selection: string;
  quantity: number;
  price: number;
}

// Survey categories based on the form images
const surveySections: Section[] = [
  {
    id: 'section-a',
    title: 'SECTION A - AGREED VALUE ITEMS',
    categories: [
      { id: 'cat-1', title: 'CLOTHING', subcategories: ['GENTS/BOYS', 'LADIES/GIRLS', 'CHILDREN/BABIES'] },
      { id: 'cat-2', title: 'FURNITURE' },
      { id: 'cat-3', title: 'LINEN' },
      { id: 'cat-4', title: 'LUGGAGE/CONTAINERS' },
      { id: 'cat-5', title: 'JEWELLERY' },
      { id: 'cat-6', title: 'ANTIQUES' },
      { id: 'cat-7', title: 'VALUABLE ARTWORKS' },
      { id: 'cat-8', title: 'VALUABLE CARPETS' },
      { id: 'cat-9', title: 'COLLECTIONS (COINS/STAMPS)' },
      { id: 'cat-10', title: 'VALUABLE ORNAMENTS' },
      { id: 'cat-11', title: 'SPORTS EQUIPMENT' },
      { id: 'cat-12', title: 'OUTDOOR EQUIPMENT' },
    ]
  },
  {
    id: 'section-b',
    title: 'SECTION B - REPLACEMENT VALUE ITEMS',
    categories: [
      { id: 'cat-13', title: 'DOMESTIC APPLIANCES' },
      { id: 'cat-14', title: 'VISUAL, SOUND, COMPUTERS' },
      { id: 'cat-15', title: 'PHOTOGRAPHIC EQUIPMENT' },
      { id: 'cat-16', title: 'HIGH RISK ITEMS' },
      { id: 'cat-17', title: 'POWER TOOLS' },
    ]
  }
];

// Sample items for clothing category
const clothingItems: Item[] = [
  { id: '1', rank: 1, type: 'Belts', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '2', rank: 2, type: 'Hats / Gloves / Scarves', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '3', rank: 3, type: 'Jackets / Blazers', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '4', rank: 4, type: 'Leather / Suede Jackets', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '5', rank: 5, type: 'Long Trousers / Jeans', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '6', rank: 6, type: 'Pullovers / Cardigans', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '7', rank: 7, type: 'Raincoats / Overcoats', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '8', rank: 8, type: 'Shirts / T-Shirts', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '9', rank: 9, type: 'Shoes / Boots', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '10', rank: 10, type: 'Shorts / Swimming Trunks', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '11', rank: 11, type: 'Socks / Underwear / Sleepwear', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '12', rank: 12, type: 'Sports Wear', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '13', rank: 13, type: 'Suits', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '14', rank: 14, type: 'Ties', description: '', model: '', selection: '', quantity: 0, price: 0 },
  { id: '15', rank: 15, type: 'Tracksuits', description: '', model: '', selection: '', quantity: 0, price: 0 },
];

// Map to store items for each category
const categoryItemsMap: Record<string, Item[]> = {
  'CLOTHING (GENTS / BOYS)': clothingItems,
};

export default function CombinedView() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['section-a', 'section-b']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['cat-1']); // Default expand clothing category
  const [selectedCategory, setSelectedCategory] = useState<string>('CLOTHING (GENTS / BOYS)');
  const [selectedItems, setSelectedItems] = useState<Item[]>(clothingItems);
  const [items, setItems] = useState<Record<string, Item[]>>(categoryItemsMap);
  const { isLandscape } = useOrientation();
  const params = useLocalSearchParams();
  
  // Create a dummy survey if needed
  const createDummySurvey = () => {
    console.log("Creating dummy survey...");
    // Expand the clothing category
    if (!expandedCategories.includes('cat-1')) {
      setExpandedCategories(prev => [...prev, 'cat-1']);
    }
    // Default to showing clothing items
    setSelectedCategory('CLOTHING (GENTS / BOYS)');
    setSelectedItems(clothingItems);
  };

  useEffect(() => {
    // If a category was passed in params, select it
    if (params.categoryTitle) {
      const categoryTitle = params.categoryTitle as string;
      setSelectedCategory(categoryTitle);
      
      // Load items for this category if available
      if (items[categoryTitle]) {
        setSelectedItems(items[categoryTitle]);
      } else {
        // Default to empty array if no items for this category
        setSelectedItems([]);
      }
    } else {
      // No category specified, use default survey
      createDummySurvey();
    }
    
    // If survey ID was passed and not found, use default survey
    if (params.id && params.error === 'not-found') {
      createDummySurvey();
    }
  }, [params]);

  // ... rest of your component remains the same
} 