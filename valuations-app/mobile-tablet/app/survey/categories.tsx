import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, SafeAreaView, FlatList, Alert, TextInput } from 'react-native';
import { List, Card, Button, Divider, IconButton, Chip, Menu } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';
import ConnectionStatus from '../../components/ConnectionStatus';
import connectionUtils from '../../utils/connectionUtils';
import { logNavigation } from '../../utils/logger';
import { API_BASE_URL } from '../../constants/apiConfig';

// Type definitions
interface Category {
  id: string;
  rawId?: string;
  title: string;
  subcategories?: string[];
}

interface Section {
  id: string;
  title: string;
  categories: Category[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
  fromCache?: boolean;
}

interface RiskTemplate {
  id?: string;
  risktemplateid?: string;
  templateid?: string;
  name?: string;
  templatename?: string;
  description?: string;
}

interface TemplateSectionAPI {
  id?: string;
  sectionid?: string;
  risktemplatesectionid?: string;
  templateSectionId?: string;
  name?: string;
  sectionname?: string;
}

interface TemplateCategoryAPI {
  id?: string;
  categoryid?: string;
  templateCategoryId?: string;
  risktemplatecategoryid?: string;
  name?: string;
  categoryname?: string;
  subcategories?: string[];
}

// Item data structure
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

// Type options for dropdowns per category
const typeOptions: Record<string, string[]> = {
  'CLOTHING (GENTS / BOYS)': ['Belts', 'Hats / Gloves / Scarves', 'Jackets / Blazers', 'Leather / Suede Jackets', 'Long Trousers / Jeans', 'Pullovers / Cardigans', 'Raincoats / Overcoats', 'Shirts / T-Shirts', 'Shoes / Boots', 'Shorts / Swimming Trunks', 'Socks / Underwear / Sleepwear', 'Sports Wear', 'Suits', 'Ties', 'Tracksuits'],
  'CLOTHING (LADIES / GIRLS)': ['Blouses', 'Dresses', 'Skirts', 'Pants', 'Sweaters', 'Coats', 'Shoes', 'Accessories'],
  'FURNITURE': ['Sofa', 'Dining Table', 'Chairs', 'Bed', 'Wardrobe', 'Desk', 'Bookshelf', 'Coffee Table'],
  'JEWELLERY': ['Necklace', 'Rings', 'Watch', 'Bracelet', 'Earrings', 'Brooch', 'Cufflinks', 'Pendant'],
  // Add more categories and their types as needed
};

// Sample items for each category
const SAMPLE_ITEMS: Record<string, Item[]> = {
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
  ],
  'LINEN': [
    { id: '1', rank: 1, type: 'Bedding', description: 'Queen set', model: 'n/a', selection: 'Cotton', quantity: 2, price: 2500 },
    { id: '2', rank: 2, type: 'Towels', description: 'Bath towels', model: 'n/a', selection: 'Egyptian cotton', quantity: 6, price: 1200 },
  ],
  'LUGGAGE CONTAINERS': [
    { id: '1', rank: 1, type: 'Suitcase', description: 'Large roller', model: 'Samsonite', selection: 'Black', quantity: 2, price: 3500 },
    { id: '2', rank: 2, type: 'Backpack', description: 'Travel backpack', model: 'North Face', selection: 'Blue', quantity: 1, price: 1800 },
  ],
};

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

export default function CategoriesScreen() {
  logNavigation('Survey Categories (Combined View)');
  
  // Get orientation
  const { isLandscape } = useOrientation();
  
  // Get router instance
  const router = useRouter();
  
  // Get assessment ID from route params
  const params = useLocalSearchParams<{ assessmentId: string }>();
  const assessmentIdParam = params.assessmentId;
  
  // Log all params for debugging
  console.log('Categories Screen Params:', JSON.stringify(params));
  console.log('Categories Screen Params Connor:', JSON.stringify(params));
  
  // State for API data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [surveySections, setSurveySections] = useState<Section[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RiskTemplate | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [fromCache, setFromCache] = useState<boolean>(false);
  
  // State for mimicking test-page.tsx
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [currentDropdownOptions, setCurrentDropdownOptions] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  
  // Track modified items to persist changes across category navigation
  const [modifiedItems, setModifiedItems] = useState<Record<string, Record<string, Item[]>>>({});
  
  // Item manipulation functions
  const updateItemField = (itemId: string, field: keyof Item, value: any) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      );
      
      // Store the updated items for this category for persistence
      if (activeCategory) {
        const categoryId = activeCategory.id;
        const templateId = assessmentIdParam || '';
        
        setModifiedItems(prev => ({
          ...prev,
          [templateId]: {
            ...(prev[templateId] || {}),
            [categoryId]: updatedItems
          }
        }));
      }
      
      return updatedItems;
    });
  };
  
  const deleteItem = (itemId: string) => {
    setItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== itemId);
      
      // Store the updated items for this category for persistence
      if (activeCategory) {
        const categoryId = activeCategory.id;
        const templateId = assessmentIdParam || '';
        
        setModifiedItems(prev => ({
          ...prev,
          [templateId]: {
            ...(prev[templateId] || {}),
            [categoryId]: updatedItems
          }
        }));
      }
      
      return updatedItems;
    });
  };

  const addItem = () => {
    const newItem: Item = {
      id: String(Date.now()), // Simple unique ID
      rank: items.length > 0 ? Math.max(...items.map(i => i.rank)) + 1 : 1,
      type: currentDropdownOptions.length > 0 ? currentDropdownOptions[0] : '',
      description: '',
      model: '',
      selection: '',
      quantity: 1,
      price: 0,
    };
    
    setItems(prevItems => {
      const updatedItems = [...prevItems, newItem];
      
      // Store the updated items for this category for persistence
      if (activeCategory) {
        const categoryId = activeCategory.id;
        const templateId = assessmentIdParam || '';
        
        setModifiedItems(prev => ({
          ...prev,
          [templateId]: {
            ...(prev[templateId] || {}),
            [categoryId]: updatedItems
          }
        }));
      }
      
      return updatedItems;
    });
  };
  
  // Helper function to get items for a category title (with fallback)
  const getItemsForCategoryTitle = (title: string): Item[] => {
    if (!title) return [];
    // Exact match first
    if (SAMPLE_ITEMS[title]) {
      console.log(`getItemsForCategoryTitle: Exact match found for "${title}". Items: ${SAMPLE_ITEMS[title].length}`);
      return SAMPLE_ITEMS[title];
    }
    // Fallback: case-insensitive and trim
    const normalizedTitle = title.toUpperCase().trim();
    for (const key in SAMPLE_ITEMS) {
      if (key.toUpperCase().trim() === normalizedTitle) {
        console.warn(`getItemsForCategoryTitle: Used fallback match for title "${title}" (normalized: "${normalizedTitle}"), found items under key "${key}". Items: ${SAMPLE_ITEMS[key].length}`);
        return SAMPLE_ITEMS[key];
      }
    }
    console.warn(`getItemsForCategoryTitle: No items found for title "${title}" (normalized: "${normalizedTitle}") even with fallback.`);
    return [];
  };

  // Helper function to get type options for a category title (with fallback)
  const getTypeOptionsForCategoryTitle = (title: string): string[] => {
    if (!title) return [];
    if (typeOptions[title]) {
      return typeOptions[title];
    }
    const normalizedTitle = title.toUpperCase().trim();
    for (const key in typeOptions) {
      if (key.toUpperCase().trim() === normalizedTitle) {
        console.warn(`getTypeOptionsForCategoryTitle: Used fallback match for title "${title}" (normalized: "${normalizedTitle}"), found options under key "${key}"`);
        return typeOptions[key];
      }
    }
    return [];
  };

  // Calculate total value
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
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

  // Effect for loading items based on activeCategory
  useEffect(() => {
    const fetchAndSetItems = async () => {
      if (!activeCategory || !assessmentIdParam) {
        setItems([]);
        setCurrentDropdownOptions([]);
        setLoadingItems(false);
        return;
      }

      // Check if we have modified items for this category
      const categoryId = activeCategory.id;
      const templateId = assessmentIdParam;
      const savedItems = modifiedItems[templateId]?.[categoryId];
      
      if (savedItems) {
        console.log(`Using saved items for category "${activeCategory.title}" (${savedItems.length} items)`);
        setItems(savedItems);
        setCurrentDropdownOptions(getTypeOptionsForCategoryTitle(activeCategory.title));
        setLoadingItems(false);
        return;
      }
      
      // No saved items, fetch from API
      setLoadingItems(true);
      setItemsError(null);
      setCurrentDropdownOptions(getTypeOptionsForCategoryTitle(activeCategory.title));

      try {
        // Get the appropriate category ID - prioritize rawId which should be the riskcategoryid
        const categoryRiskId = activeCategory.rawId || activeCategory.id;
        
        if (!categoryRiskId) {
          console.warn(`No valid risk category ID for selected category: "${activeCategory.title}". Loading default items.`);
          setItems(getItemsForCategoryTitle(activeCategory.title));
          setLoadingItems(false);
          return;
        }

        console.log(`Fetching captured items for Category - Risk ID: ${categoryRiskId}, Template ID: ${templateId}, Title: "${activeCategory.title}"`);
        
        // Make the actual API call to get items for this category
        try {
          // URL should be something like: /risk-templates/{templateId}/sections/{sectionId}/categories/{categoryId}/items
          const endpoint = `/risk-templates/${templateId}/categories/${categoryRiskId}/items`;
          console.log(`API Request: Fetching items from endpoint: ${endpoint}`);
          
          // Use the specific API method for items instead of a generic get
          const itemsResponse = await api.getRiskTemplateItems(categoryRiskId) as ApiResponse<Item[]>;
          console.log(`API Response for items: Status=${itemsResponse.success}, HasData=${!!itemsResponse.data}, ItemCount=${itemsResponse.data?.length || 0}`);
          
          if (itemsResponse.success && itemsResponse.data && itemsResponse.data.length > 0) {
            console.log(`SUCCESS: Found ${itemsResponse.data.length} real items for category "${activeCategory.title}" with ID ${categoryRiskId}`);
            
            // Log the first item to see its structure
            console.log('API ITEM EXAMPLE (first item):', JSON.stringify(itemsResponse.data[0], null, 2));
            
            // Map API response to our Item interface format, accounting for different field naming
            const mappedItems = itemsResponse.data.map((apiItem, index) => {
              // Use type assertion to treat apiItem as a record with string keys for flexible field access
              const item = apiItem as Record<string, any>;
              
              // Inspect apiItem keys to see what fields are available
              console.log(`Item ${item.risktemplateitemid || index}: Available fields: ${Object.keys(item).join(', ')}`);
              
              // Ensure we have a valid, unique ID
              const itemId = String(item.risktemplateitemid || `temp-${Date.now()}-${index}`);
              
              // Clear mapping: Use empty strings for fields that should be entered by the user
              return {
                id: itemId,
                rank: Number(item.rank || 0),
                type: String(item.itemprompt || ''), // Use itemprompt for the type field (as requested)
                description: '', // Leave description blank as requested
                model: '', // Empty model
                selection: '', // Empty selection
                quantity: 1, // Default quantity to 1
                price: 0 // Default price to 0
              };
            });
            
            console.log(`Mapped ${mappedItems.length} items with fields: ${Object.keys(mappedItems[0]).join(', ')}`);
            setItems(mappedItems);
          } else {
            console.log(`No items found in API for category "${activeCategory.title}" with ID ${categoryRiskId}. Using default items.`);
            setItems(getItemsForCategoryTitle(activeCategory.title));
          }
        } catch (apiError) {
          console.error(`API call failed for items in category "${activeCategory.title}":`, apiError);
          console.log(`Falling back to default items for "${activeCategory.title}"`);
          setItems(getItemsForCategoryTitle(activeCategory.title));
        }
      } catch (err) {
        console.error(`ERROR: Failed fetching items for category "${activeCategory.title}":`, err);
        setItemsError(err instanceof Error ? err.message : 'Unknown error fetching items');
        console.log(`ERROR FALLBACK: Loading default items for category "${activeCategory.title}".`);
        setItems(getItemsForCategoryTitle(activeCategory.title));
      } finally {
        setLoadingItems(false);
      }
    };

    fetchAndSetItems();
  }, [activeCategory, assessmentIdParam, retryCounter, modifiedItems]);
  
  // Fetch data from API
  useEffect(() => {
    console.log('Effect triggered with assessmentId:', assessmentIdParam);
    
    async function fetchCategoriesData() {
      try {
        setLoading(true);
        setError(null);
        setFromCache(false);
        
        // Add info about what API we're using
        // setApiInfo('Connecting to API at 192.168.0.102:5000...');
        console.log(`Connecting to API at ${API_BASE_URL}...`);
        
        // Check if we have a assessment ID from params
        if (!assessmentIdParam) {
          console.log('No assessment ID provided, fetching all assessments');
          
          // First, get all risk templates
          const templatesResponse = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
          
          // Check if we got data from cache
          if (templatesResponse.fromCache) {
            setFromCache(true);
            // setApiInfo('Using cached data (offline mode)');
            console.log('Using cached data (offline mode)');
          }
          
          if (!templatesResponse.success || !templatesResponse.data) {
            setError('Failed to load templates: ' + (templatesResponse.message || 'Unknown error'));
            setLoading(false);
            return;
          }
          
          console.log('Templates retrieved:', templatesResponse.data.length);
          if (!templatesResponse.fromCache) {
            // setApiInfo(`Connected to API: Found ${templatesResponse.data.length} templates`);
            console.log(`Connected to API: Found ${templatesResponse.data.length} templates`);
          }
          
          // We'll use the first template if no ID was provided
          // Use the correct property based on the API response
          const firstTemplateId = templatesResponse.data[0]?.risktemplateid || 
                              templatesResponse.data[0]?.templateid || 
                              templatesResponse.data[0]?.id;
          
          if (!firstTemplateId) {
            setError('No valid template found in API response');
            console.error('Template object:', templatesResponse.data[0]);
            setLoading(false);
            return;
          }
          
          setSelectedTemplate(templatesResponse.data[0]);
          console.log('Using first template ID:', firstTemplateId);
          await loadAssessmentSections(String(firstTemplateId));
        } else {
          // Use the provided assessment ID from params
          console.log('Using provided assessment ID from navigation params:', assessmentIdParam);
          await loadAssessmentSections(assessmentIdParam);
          
          // Optionally, load template details
          try {
            const templatesResponse = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
            
            // Check if we got data from cache
            if (templatesResponse.fromCache) {
              setFromCache(true);
              // setApiInfo('Using cached data (offline mode)');
              console.log('Using cached data (offline mode)');
            }
            
            if (templatesResponse.success && templatesResponse.data) {
              // Log all template IDs for debugging
              console.log('Available templates:');
              templatesResponse.data.forEach(t => {
                console.log(`- Template: ${t.templatename || t.name} - IDs: risktemplateid=${t.risktemplateid}, templateid=${t.templateid}, id=${t.id}`);
              });
              
              const template = templatesResponse.data.find(t => 
                (String(t.risktemplateid) === assessmentIdParam) || 
                (String(t.templateid) === assessmentIdParam) || 
                (String(t.id) === assessmentIdParam)
              );
              
              if (template) {
                setSelectedTemplate(template);
                console.log('Found template details:', template);
              } else {
                console.warn('Could not find matching template for ID:', assessmentIdParam);
              }
            }
          } catch (e) {
            console.warn('Failed to load template details:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        // setApiInfo(null);
        console.warn('API info reset due to error.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategoriesData();
  }, [assessmentIdParam]);
  
  // Function to retry loading data
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    if (assessmentIdParam) {
      console.log('Retrying with assessmentId:', assessmentIdParam);
      fetchCategoriesData();
    } else {
      console.warn('No assessmentId available for retry');
      setError('No assessment ID available. Please go back and try again.');
      setLoading(false);
    }
  };
  
  // Function to fetch categories data
  const fetchCategoriesData = async () => {
    try {
      await loadAssessmentSections(assessmentIdParam || '');
    } catch (err) {
      console.error('Error in fetchCategoriesData:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Function to load sections for a template
  const loadAssessmentSections = async (riskAssessmentId: string) => {
    console.log(`Fetching sections for assessment ID: ${riskAssessmentId}`);
    
    if (!riskAssessmentId) {
      console.error('Cannot load sections: No assessment ID provided');
      setError('No assessment ID available. Please select an assessment first.');
      setLoading(false);
      return;
    }
    console.log(`Before API call`);
    
    // Get sections for this assessment using the updated API path
    const sectionsResponse = await api.getRiskAssessmentSections(riskAssessmentId) as ApiResponse<TemplateSectionAPI[]>;
    
    // Debug the API request
    console.log(`API Request for sections - endpoint: /risk-assessment-sections/assessment/${riskAssessmentId}`);
    
    // Check if we got data from cache
    if (sectionsResponse.fromCache) {
      setFromCache(true);
      // setApiInfo('Using cached data (offline mode)');
      console.log('Using cached data for sections (offline mode)');
    }
    
    if (!sectionsResponse.success || !sectionsResponse.data) {
      setError('Failed to load sections: ' + (sectionsResponse.message || 'Unknown error'));
      console.error('Section error:', sectionsResponse);
      return;
    }
    
    console.log(`Retrieved ${sectionsResponse.data.length} sections`);
    
    // Build sections data with categories
    const sections: Section[] = [];
    
    // For each section, get categories
    for (const apiSection of sectionsResponse.data) {
      // Use the correct property name based on API response
      const sectionId = apiSection.id || apiSection.sectionid || apiSection.risktemplatesectionid || '';
      
      if (!sectionId) {
        console.warn('Skipping section with no ID:', apiSection);
        continue;
      }

      console.log(`Fetching categories for section ${sectionId}`);
      console.log(`Section name: ${apiSection.sectionname || apiSection.name || 'Unnamed'}`);
      
      // Get categories for this section using the updated API path
      const categoriesResponse = await api.getRiskAssessmentCategories(
        sectionId
      ) as ApiResponse<TemplateCategoryAPI[]>;
      
      // Debug the API request
      console.log(`API Request for categories - endpoint: /risk-assessment-categories/section/${sectionId}`);
      
      // Check if we got data from cache
      if (categoriesResponse.fromCache) {
        setFromCache(true);
        // setApiInfo('Using cached data (offline mode)');
        console.log('Using cached data for categories (offline mode)');
      }
      
      let categories: Category[] = [];
      
      if (categoriesResponse.success && categoriesResponse.data) {
        console.log(`Got ${categoriesResponse.data.length} categories`);
        
        // Map the categories from API response to our Category type
        categories = categoriesResponse.data.map(apiCat => ({
          id: apiCat.id || apiCat.categoryid || apiCat.risktemplatecategoryid || '',
          rawId: apiCat.id || apiCat.categoryid || apiCat.risktemplatecategoryid,
          title: apiCat.name || apiCat.categoryname || 'Unnamed Category',
          subcategories: apiCat.subcategories || []
        }));
        
        console.log(`Mapped ${categories.length} categories for UI`);
      } else {
        console.warn('Failed to load categories for section:', sectionId);
        console.warn('Categories response:', categoriesResponse);
      }
      
      // Add the section with its categories
      sections.push({
        id: sectionId,
        title: apiSection.sectionname || apiSection.name || 'Unnamed Section',
        categories
      });
    }
    
    // Update state with the sections
    console.log(`Setting ${sections.length} sections in state`);
    setSurveySections(sections);
  };
  
  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSectionIds(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };
  
  // Handle category selection
  const handleCategoryPress = (category: Category) => {
    console.log(`handleCategoryPress: Category "${category.title}" (ID: ${category.id}, RawID: ${category.rawId}) selected.`);
    setActiveCategory(category);
  };
  
  // Navigate to items screen for a specific category
  const navigateToItems = (categoryId: string, categoryTitle: string, rawCategoryId?: string) => {
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId,
        categoryTitle,
        rawCategoryId: rawCategoryId || ''
      }
    });
  };
  
  // Get cell width based on orientation and field
  const getCellWidth = (field: keyof Item | 'actions' | 'value') => {
    const baseWidths: Record<string, number> = {
      rank: 50,
      type: isLandscape ? 150 : 130,
      description: isLandscape ? 150 : 120,
      model: isLandscape ? 150 : 100,
      selection: isLandscape ? 150 : 100,
      quantity: isLandscape ? 100 : 80,
      price: isLandscape ? 120 : 100,
      value: isLandscape ? 100 : 80,
      actions: isLandscape ? 80 : 60,
    };
    
    if (!isLandscape) {
      baseWidths.type = 120;
      baseWidths.description = 150;
      baseWidths.model = 120;
      baseWidths.selection = 120;
    }
    
    return baseWidths[field] || 100;
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading categories...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {fromCache && <Text style={styles.cacheText}>Loading from cache...</Text>}
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Combined View',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <SafeAreaView style={styles.container}>
        <ConnectionStatus showOffline={true} showOnline={false} />
        
        {/* Main content with responsive layout */}
        <View style={[
          styles.contentContainer, 
          { flexDirection: isLandscape ? 'row' : 'column' }
        ]}>
          {/* Categories Panel */}
          <View style={[
            styles.categoriesPanel, 
            { 
              width: isLandscape ? '30%' : '100%', 
              height: isLandscape ? '100%' : Math.min(300, Dimensions.get('window').height * 0.35) 
            }
          ]}>
            <Text style={styles.panelTitle}>Sections & Categories</Text>
            <ScrollView style={styles.categoriesScroll}>
              {surveySections.length === 0 && !loading && (
                <Text style={styles.emptyText}>No sections found. Ensure the template has sections and categories configured.</Text>
              )}
              {surveySections.map(section => (
                <View key={section.id} style={styles.sectionContainer}>
                  <TouchableOpacity 
                    style={styles.sectionHeader} 
                    onPress={() => toggleSectionExpansion(section.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                    <MaterialCommunityIcons 
                      name={expandedSectionIds.includes(section.id) ? 'chevron-up' : 'chevron-down'} 
                      size={24} 
                      color="#555"
                    />
                  </TouchableOpacity>
                  
                  {expandedSectionIds.includes(section.id) && (
                    <View style={styles.categoriesList}>
                      {section.categories?.length > 0 ? (
                        section.categories.map(category => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.categoryItem, 
                              activeCategory?.id === category.id && styles.selectedCategory
                            ]}
                            onPress={() => handleCategoryPress(category)}
                            activeOpacity={0.6}
                          >
                            <Text style={styles.categoryText}>{category.title}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.emptySubText}>No categories in this section.</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
          
          {/* Items Panel */}
          <View style={[
            styles.itemsPanel, 
            { width: isLandscape ? '70%' : '100%' }
          ]}>
            {/* Header with title and total */}
            <View style={styles.itemsHeader}>
              <Text style={styles.categoryHeader}>{activeCategory?.title || 'Select a Category'}</Text>
              <View style={styles.headerActions}>
                <Text style={styles.totalValue}>Total: R {totalValue.toLocaleString()}</Text>
                <IconButton
                  icon="sort-variant"
                  size={20}
                  onPress={() => {}}
                  style={styles.sortButton}
                />
                <Button 
                  mode="contained" 
                  onPress={addItem} 
                  style={styles.addButton}
                  icon="plus"
                >
                  Add Item
                </Button>
              </View>
            </View>
            
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
            <ScrollView style={styles.tableContent} horizontal={false}>
              {loadingItems ? (
                <View style={styles.itemsLoadingContainer}>
                  <ActivityIndicator size="large" color="#4a90e2" />
                  <Text style={styles.loadingText}>Loading items...</Text>
                </View>
              ) : itemsError ? (
                <View style={styles.itemsErrorContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="red" />
                  <Text style={styles.errorText}>Error loading items: {itemsError}</Text>
                  <Button onPress={() => setRetryCounter(c => c + 1)}>Retry</Button>
                </View>
              ) : items.length === 0 ? (
                <View style={styles.itemsEmptyContainer}>
                  <Text style={styles.emptyText}>No items for {activeCategory?.title || 'this category'}. Add new items or check configuration.</Text>
                </View>
              ) : (
                <ScrollView horizontal={true}>
                  <View>
                    {items.map((item, index) => (
                      <View
                        key={item.id}
                        style={[
                          styles.tableRow,
                          index % 2 === 0 ? styles.evenRow : styles.oddRow
                        ]}
                      >
                        <TextInput value={String(item.rank)} onChangeText={text => updateItemField(item.id, 'rank', parseInt(text) || 0)} style={[styles.cell, styles.textInputCell, {width: getCellWidth('rank')}]} keyboardType="numeric" />
                        <View style={[styles.cell, {width: getCellWidth('type')}]}>
                          <Menu
                            visible={editingItem === `${item.id}-type`}
                            onDismiss={() => setEditingItem(null)}
                            anchor={
                              <TouchableOpacity onPress={() => setEditingItem(`${item.id}-type`)}>
                                <Text style={styles.selectableTextCell}>{item.type || 'Select type'}</Text>
                              </TouchableOpacity>
                            }
                          >
                            {(currentDropdownOptions || typeOptions[activeCategory?.title || ''] || []).map((option) => (
                              <Menu.Item
                                key={option}
                                onPress={() => { updateItemField(item.id, 'type', option); setEditingItem(null); }}
                                title={option}
                                leadingIcon={item.type === option ? 'check' : undefined}
                              />
                            ))}
                          </Menu>
                        </View>
                        <TextInput value={item.description} onChangeText={text => updateItemField(item.id, 'description', text)} style={[styles.cell, styles.textInputCell, {width: getCellWidth('description')}]} />
                        <TextInput value={item.model} onChangeText={text => updateItemField(item.id, 'model', text)} style={[styles.cell, styles.textInputCell, {width: getCellWidth('model')}]} />
                        <TextInput value={item.selection} onChangeText={text => updateItemField(item.id, 'selection', text)} style={[styles.cell, styles.textInputCell, {width: getCellWidth('selection')}]} />
                        <TextInput value={String(item.quantity)} onChangeText={text => updateItemField(item.id, 'quantity', parseInt(text) || 0)} style={[styles.cell, styles.textInputCell, {width: getCellWidth('quantity')}]} keyboardType="numeric" />
                        <TextInput value={String(item.price)} onChangeText={text => updateItemField(item.id, 'price', parseFloat(text) || 0)} style={[styles.cell, styles.textInputCell, {width: getCellWidth('price')}]} keyboardType="numeric" />
                        <Text style={[styles.cell, {width: getCellWidth('value'), textAlign: 'right'}]}>{(item.quantity * item.price).toLocaleString()}</Text>
                        <View style={[styles.cell, {width: getCellWidth('actions'), alignItems: 'center'}]}>
                          <IconButton icon="delete" iconColor="#e74c3c" size={20} onPress={() => deleteItem(item.id)} />
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </ScrollView>
          </View>
        </View>
        
        {/* Bottom action button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.completeButton}
            onPress={() => router.push('/survey/summary')}
            icon="check"
          >
            Complete & View Summary
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: 'red',
  },
  cacheText: {
    marginTop: 8,
    fontSize: 14,
    color: 'blue',
  },
  contentContainer: {
    flex: 1,
  },
  categoriesPanel: {
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  categoriesScroll: {
    flex: 1,
  },
  itemsPanel: {
    flex: 1,
    backgroundColor: '#fff',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f0f0f0',
  },
  sectionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  categoriesList: {
    paddingLeft: 16,
    backgroundColor: '#fff',
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
    paddingLeft: 12,
  },
  categoryText: {
    fontSize: 14,
    color: '#444',
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
  },
  emptySubText: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#888',
    fontStyle: 'italic',
    fontSize: 13,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    marginRight: 16,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f6f8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  headerCell: {
    fontWeight: 'bold',
    paddingHorizontal: 10,
    color: '#444',
  },
  tableContent: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    paddingHorizontal: 10,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
  },
  sortButton: {
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#1976D2',
  },
  textInputCell: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    marginVertical: 4,
    marginHorizontal: 2,
    backgroundColor: '#fff',
    height: 38,
    paddingTop: 0,
    paddingBottom: 0,
  },
  selectableTextCell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    color: '#0d6efd',
  },
  itemsLoadingContainer: { // For items loading
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200, // Ensure it takes some space
  },
  itemsErrorContainer: { // For items error
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  itemsEmptyContainer: { // For no items message
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
}); 