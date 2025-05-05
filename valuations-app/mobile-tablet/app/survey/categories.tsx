import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, Card, List, Divider } from 'react-native-paper';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { logNavigation } from '../../utils/logger';
import api from '../../api';
import ConnectionStatus from '../../components/ConnectionStatus';
import connectionUtils from '../../utils/connectionUtils';

// Define types for our data structures
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

// Define types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
  fromCache: boolean;
}

interface RiskTemplate {
  id?: string;
  risktemplateid?: string;
  templateid?: string;
  name?: string;
  templatename?: string;
  description?: string;
}

interface TemplateSection {
  id?: string;
  sectionid?: string;
  risktemplatesectionid?: string;
  templateSectionId?: string;
  name?: string;
  sectionname?: string;
}

interface TemplateCategory {
  id?: string;
  categoryid?: string;
  templateCategoryId?: string;
  risktemplatecategoryid?: string;
  name?: string;
  categoryname?: string;
  subcategories?: string[];
}

export default function CategoriesScreen() {
  logNavigation('Survey Categories');
  
  // Get router instance
  const router = useRouter();
  
  // Get template ID from route params
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  
  // State for API data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [surveySections, setSurveySections] = useState<Section[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RiskTemplate | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [fromCache, setFromCache] = useState<boolean>(false);
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<string[]>(['section-a', 'section-b']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [apiInfo, setApiInfo] = useState<string | null>(null);
  
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
  
  // Fetch data from API
  useEffect(() => {
    async function fetchCategoriesData() {
      try {
        setLoading(true);
        setError(null);
        setFromCache(false);
        
        // Add info about what API we're using
        setApiInfo('Connecting to API at 192.168.0.102:5000...');
        
        // Check if we have a template ID from params
        if (!templateId) {
          console.log('No template ID provided, fetching all templates');
          
          // First, get all risk templates
          const templatesResponse = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
          
          // Check if we got data from cache
          if (templatesResponse.fromCache) {
            setFromCache(true);
            setApiInfo('Using cached data (offline mode)');
          }
          
          if (!templatesResponse.success || !templatesResponse.data) {
            setError('Failed to load templates: ' + templatesResponse.message);
            setLoading(false);
            return;
          }
          
          console.log('Templates retrieved:', templatesResponse.data.length);
          if (!templatesResponse.fromCache) {
            setApiInfo(`Connected to API: Found ${templatesResponse.data.length} templates`);
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
          await loadTemplateSections(firstTemplateId);
        } else {
          // Use the provided template ID from params
          console.log('Using provided template ID:', templateId);
          await loadTemplateSections(templateId);
          
          // Optionally, load template details
          try {
            const templatesResponse = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
            
            // Check if we got data from cache
            if (templatesResponse.fromCache) {
              setFromCache(true);
              setApiInfo('Using cached data (offline mode)');
            }
            
            if (templatesResponse.success && templatesResponse.data) {
              const template = templatesResponse.data.find(t => 
                (t.risktemplateid?.toString() === templateId) || 
                (t.templateid?.toString() === templateId) || 
                (t.id?.toString() === templateId)
              );
              
              if (template) {
                setSelectedTemplate(template);
                console.log('Found template details:', template);
              }
            }
          } catch (e) {
            console.warn('Failed to load template details:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setApiInfo(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategoriesData();
  }, [templateId]);
  
  // Function to load sections for a template
  const loadTemplateSections = async (id: string) => {
    console.log(`Fetching sections for template ID: ${id}`);
    
    // Get sections for this template using the updated API path
    const sectionsResponse = await api.getRiskTemplateSections(id) as ApiResponse<TemplateSection[]>;
    
    // Check if we got data from cache
    if (sectionsResponse.fromCache) {
      setFromCache(true);
      setApiInfo('Using cached data (offline mode)');
    }
    
    if (!sectionsResponse.success || !sectionsResponse.data) {
      setError('Failed to load sections: ' + sectionsResponse.message);
      console.error('Section error:', sectionsResponse);
      return;
    }
    
    console.log(`Retrieved ${sectionsResponse.data.length} sections`);
    
    // Build sections data with categories
    const sections: Section[] = [];
    
    // For each section, get categories
    for (const section of sectionsResponse.data) {
      // Use the correct property name based on API response
      const sectionId = section.risktemplatesectionid || 
                       section.sectionid ||
                       section.templateSectionId || 
                       section.id || '';
                       
      if (!sectionId) {
        console.warn('Skipping section with no ID:', section);
        continue;
      }

      console.log(`Fetching categories for section ${sectionId}`);
      console.log(`Section name: ${section.sectionname || section.name || 'Unnamed'}`);
      
      // Get categories for this section using the updated API path
      const categoriesResponse = await api.getRiskTemplateCategories(
        id,
        sectionId
      ) as ApiResponse<TemplateCategory[]>;
      
      // Check if we got data from cache
      if (categoriesResponse.fromCache) {
        setFromCache(true);
        setApiInfo('Using cached data (offline mode)');
      }
      
      let categories: Category[] = [];
      
      if (categoriesResponse.success && categoriesResponse.data) {
        console.log(`Found ${categoriesResponse.data.length} categories for section ${sectionId}`);
        
        // Map the category data using the correct property names
        categories = categoriesResponse.data.map(cat => {
          // Get the raw categoryid for display purposes - prioritize risktemplatecategoryid
          const rawCategoryId = cat.risktemplatecategoryid || cat.categoryid || cat.templateCategoryId || '';
          
          const mappedCategory = {
            id: cat.categoryid || cat.templateCategoryId || cat.id || `cat-${Math.random().toString(36).substring(2, 9)}`,
            rawId: rawCategoryId, // Store the original ID for display
            title: cat.categoryname || cat.name || 'Unnamed Category',
            // If the category has subcategories, add them
            ...(cat.subcategories ? { subcategories: cat.subcategories } : {})
          };
          
          return mappedCategory;
        });
      } else {
        console.warn(`No categories found for section ${sectionId}:`, categoriesResponse.message);
      }
      
      // Use the correct property names for section data
      sections.push({
        id: sectionId,
        title: section.sectionname || section.name || 'Unnamed Section',
        categories
      });
    }
    
    // Update state with the fetched data
    setSurveySections(sections);
    console.log('Sections data prepared:', sections.length);
  };
  
  // Fallback to static data if API fails (for development)
  useEffect(() => {
    if (error && surveySections.length === 0) {
      console.log('Using fallback static data');
      // Static data as fallback
      const staticSections = [
  {
    id: 'section-a',
    title: 'SECTION A - AGREED VALUE ITEMS',
    categories: [
      { id: 'cat-1', title: 'CLOTHING', subcategories: ['GENTS/BOYS', 'LADIES/GIRLS', 'CHILDREN/BABIES'] },
      { id: 'cat-2', title: 'FURNITURE' },
      { id: 'cat-3', title: 'LINEN' },
            // ... other categories
    ]
  },
  {
    id: 'section-b',
    title: 'SECTION B - REPLACEMENT VALUE ITEMS',
    categories: [
      { id: 'cat-13', title: 'DOMESTIC APPLIANCES' },
      { id: 'cat-14', title: 'VISUAL, SOUND, COMPUTERS' },
            // ... other categories
          ]
        }
      ];
      
      setSurveySections(staticSections);
      setExpandedSections(['section-a', 'section-b']);
    }
  }, [error, surveySections]);
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const navigateToItems = (categoryId: string, categoryTitle: string, rawCategoryId?: string) => {
    // For categories with subcategories, we need to extract the rawId from the original category
    let effectiveRawId = rawCategoryId;
    
    // If this is a subcategory format (cat-X-sub-Y), extract the rawId from the parent category
    if (!effectiveRawId && categoryId.includes('-sub-')) {
      const parentCategoryId = categoryId.split('-sub-')[0];
      // Find the parent category to get its rawId
      for (const section of surveySections) {
        const parentCategory = section.categories.find(cat => cat.id === parentCategoryId);
        if (parentCategory && parentCategory.rawId) {
          effectiveRawId = parentCategory.rawId;
          break;
        }
      }
    }
    
    // Handle normal categories
    if (!effectiveRawId) {
      // Find the category to get its rawId
      for (const section of surveySections) {
        const category = section.categories.find(cat => cat.id === categoryId);
        if (category && category.rawId) {
          effectiveRawId = category.rawId;
          break;
        }
      }
    }
    
    // Simplified logging now that functionality is working
    console.log(`Navigating to items for category: ${categoryTitle}, using ID: ${effectiveRawId || categoryId}`);
    
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId: effectiveRawId || categoryId, // Use the raw ID if available, otherwise the regular ID
        categoryTitle,
        originalCategoryId: categoryId // Keep the original ID for reference
      }
    });
  };
  
  // Show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Loading assessment categories...</Text>
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: selectedTemplate ? 
            `${selectedTemplate.templatename || selectedTemplate.name}` : 
            'Risk Assessment Categories',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        <ConnectionStatus showOffline={true} showOnline={false} />
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Select a category from the risk assessment template to add items
            </Text>
            
            {apiInfo && (
              <View style={styles.apiInfoContainer}>
                <MaterialCommunityIcons 
                  name={isOffline || fromCache ? "server-network-off" : "server-network"} 
                  size={16} 
                  color={isOffline || fromCache ? "#e74c3c" : "#3498db"} 
                />
                <Text style={[
                  styles.apiInfoText, 
                  (isOffline || fromCache) && { color: "#e74c3c" }
                ]}>
                  {isOffline || fromCache ? "Offline Mode - Using Cached Data" : apiInfo}
                </Text>
              </View>
            )}
            
            {selectedTemplate && (
              <View style={styles.templateInfoContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color="#27ae60" />
                <Text style={styles.templateInfoText}>
                  Using template: {selectedTemplate.templatename || selectedTemplate.name}
                </Text>
              </View>
            )}
            
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
          
          {surveySections.map(section => (
            <Card key={section.id} style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <MaterialCommunityIcons
                  name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#555"
                />
              </TouchableOpacity>
              
              {expandedSections.includes(section.id) && (
                <View style={styles.categoryList}>
                  {section.categories.map((category, index) => (
                    <View key={category.id}>
                      {category.subcategories ? (
                        <List.Accordion
                          title={
                            <View style={styles.categoryTitleContainer}>
                              <Text style={styles.categoryTitle}>{category.title}</Text>
                              {category.rawId && (
                                <Text style={styles.categoryIdBadge}>ID: {category.rawId}</Text>
                              )}
                            </View>
                          }
                          expanded={expandedCategories.includes(category.id)}
                          onPress={() => toggleCategory(category.id)}
                          style={styles.accordion}
                          titleStyle={styles.categoryTitle}
                        >
                          {category.subcategories.map((subcat, subIndex) => (
                            <List.Item
                              key={`${category.id}-sub-${subIndex}`}
                              title={
                                <View style={styles.categoryTitleContainer}>
                                  <Text style={styles.subcategoryTitle}>{subcat}</Text>
                                  {category.rawId && (
                                    <Text style={styles.categoryIdBadge}>ID: {category.rawId}</Text>
                                  )}
                                </View>
                              }
                              onPress={() => navigateToItems(`${category.id}-sub-${subIndex}`, `${category.title} - ${subcat}`, category.rawId)}
                              titleStyle={styles.subcategoryTitle}
                              style={styles.subcategoryItem}
                              right={props => (
                                <MaterialCommunityIcons
                                  name="chevron-right"
                                  size={20}
                                  color="#999"
                                />
                              )}
                            />
                          ))}
                        </List.Accordion>
                      ) : (
                        <List.Item
                          title={
                            <View style={styles.categoryTitleContainer}>
                              <Text style={styles.categoryTitle}>{category.title}</Text>
                              {category.rawId && (
                                <Text style={styles.categoryIdBadge}>ID: {category.rawId}</Text>
                              )}
                            </View>
                          }
                          onPress={() => navigateToItems(category.id, category.title, category.rawId)}
                          style={styles.categoryItem}
                          right={props => (
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={20}
                              color="#999"
                            />
                          )}
                        />
                      )}
                      <Divider />
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.completeButton}
            onPress={() => router.push('/survey/summary')}
          >
            Complete & View Summary
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  instructionsText: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 8,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f4f7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  categoryList: {
    backgroundColor: '#fff',
  },
  accordion: {
    backgroundColor: '#fff',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    color: '#34495e',
  },
  categoryItem: {
    paddingVertical: 12,
  },
  subcategoryTitle: {
    fontSize: 14,
    color: '#34495e',
  },
  subcategoryItem: {
    paddingLeft: 36,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  completeButton: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#27ae60',
  },
  apiInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  apiInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3498db',
  },
  templateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  templateInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#27ae60',
  },
  categoryIdBadge: {
    fontSize: 12,
    color: '#777',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
}); 