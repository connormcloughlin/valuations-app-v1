import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { List, Card, Button, Divider } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';
import ConnectionStatus from '../../components/ConnectionStatus';
import connectionUtils from '../../utils/connectionUtils';
import { logNavigation } from '../../utils/logger';

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
  const params = useLocalSearchParams<{ templateId: string, surveyId: string, useHandwriting: string }>();
  const templateId = params.templateId;
  
  // Log all params for debugging
  console.log('Categories Screen Params:', JSON.stringify(params));
  
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
    console.log('Effect triggered with templateId:', templateId);
    
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
            setError('Failed to load templates: ' + (templatesResponse.message || 'Unknown error'));
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
          await loadTemplateSections(String(firstTemplateId));
        } else {
          // Use the provided template ID from params
          console.log('Using provided template ID from navigation params:', templateId);
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
              // Log all template IDs for debugging
              console.log('Available templates:');
              templatesResponse.data.forEach(t => {
                console.log(`- Template: ${t.templatename || t.name} - IDs: risktemplateid=${t.risktemplateid}, templateid=${t.templateid}, id=${t.id}`);
              });
              
              const template = templatesResponse.data.find(t => 
                (String(t.risktemplateid) === templateId) || 
                (String(t.templateid) === templateId) || 
                (String(t.id) === templateId)
              );
              
              if (template) {
                setSelectedTemplate(template);
                console.log('Found template details:', template);
              } else {
                console.warn('Could not find matching template for ID:', templateId);
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
  
  // Function to retry loading data
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    if (templateId) {
      console.log('Retrying with templateId:', templateId);
      fetchCategoriesData();
    } else {
      console.warn('No templateId available for retry');
      setError('No template ID available. Please go back and try again.');
      setLoading(false);
    }
  };
  
  // Function to fetch categories data
  const fetchCategoriesData = async () => {
    try {
      await loadTemplateSections(templateId || '');
    } catch (err) {
      console.error('Error in fetchCategoriesData:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Function to load sections for a template
  const loadTemplateSections = async (id: string) => {
    console.log(`Fetching sections for template ID: ${id}`);
    
    if (!id) {
      console.error('Cannot load template sections: No template ID provided');
      setError('No template ID available. Please select a template first.');
      setLoading(false);
      return;
    }
    
    // Get sections for this template using the updated API path
    const sectionsResponse = await api.getRiskTemplateSections(id) as ApiResponse<TemplateSection[]>;
    
    // Debug the API request
    console.log(`API Request for sections - endpoint: /risk-templates/${id}/sections`);
    
    // Check if we got data from cache
    if (sectionsResponse.fromCache) {
      setFromCache(true);
      setApiInfo('Using cached data (offline mode)');
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
      
      // Debug the API request
      console.log(`API Request for categories - endpoint: /risk-templates/${id}/sections/${sectionId}/categories`);
      
      // Check if we got data from cache
      if (categoriesResponse.fromCache) {
        setFromCache(true);
        setApiInfo('Using cached data (offline mode)');
      }
      
      let categories: Category[] = [];
      
      if (categoriesResponse.success && categoriesResponse.data) {
        console.log(`Got ${categoriesResponse.data.length} categories`);
        
        // Map the categories from API response to our Category type
        categories = categoriesResponse.data.map(cat => {
          // Use the correct property based on API response
          const categoryId = cat.risktemplatecategoryid || 
                            cat.categoryid || 
                            cat.templateCategoryId || 
                            cat.id || '';
                          
          const categoryName = cat.categoryname || cat.name || 'Unnamed Category';
          
          return {
            id: categoryId,
            title: categoryName,
            rawId: categoryId,
            subcategories: cat.subcategories
          };
        });
        
        console.log(`Mapped ${categories.length} categories for UI`);
      } else {
        console.warn('Failed to load categories for section:', sectionId);
        console.warn('Categories response:', categoriesResponse);
      }
      
      // Add the section with its categories
      sections.push({
        id: sectionId,
        title: section.sectionname || section.name || 'Unnamed Section',
        categories
      });
    }
    
    // Update state with the sections
    console.log(`Setting ${sections.length} sections in state`);
    setSurveySections(sections);
  };
  
  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prevExpanded => 
      prevExpanded.includes(sectionId)
        ? prevExpanded.filter(id => id !== sectionId)
        : [...prevExpanded, sectionId]
    );
  };
  
  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prevExpanded => 
      prevExpanded.includes(categoryId)
        ? prevExpanded.filter(id => id !== categoryId)
        : [...prevExpanded, categoryId]
    );
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
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading categories...</Text>
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
            
            {fromCache && (
              <View style={styles.offlineInfoCard}>
                <View style={styles.offlineInfoHeader}>
                  <MaterialCommunityIcons name="information-outline" size={20} color="#fff" />
                  <Text style={styles.offlineInfoTitle}>
                    {isOffline ? "Offline Mode" : "Using Cached Data"}
                  </Text>
                </View>
                <Text style={styles.offlineInfoText}>
                  {isOffline 
                    ? "You are currently offline. Showing cached data that was previously downloaded." 
                    : "Using data from your last successful connection."}
                </Text>
              </View>
            )}
            
            {apiInfo && !fromCache && (
              <View style={styles.apiInfoContainer}>
                <MaterialCommunityIcons 
                  name="server-network" 
                  size={16} 
                  color="#3498db" 
                />
                <Text style={styles.apiInfoText}>{apiInfo}</Text>
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
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Button 
                  mode="contained" 
                  onPress={handleRetry}
                  style={styles.retryButton}
                >
                  Retry
                </Button>
              </View>
            )}
          </View>
          
          {surveySections.length > 0 ? (
            surveySections.map(section => (
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
            ))
          ) : !error && !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="folder-open-outline" size={48} color="#95a5a6" />
              <Text style={styles.emptyText}>No categories found</Text>
              <Text style={styles.emptySubtext}>
                {isOffline 
                  ? "You're offline and no cached categories are available"
                  : "Try selecting a different template or check your connection"}
              </Text>
              <Button 
                mode="outlined" 
                onPress={handleRetry}
                style={styles.retryButton}
              >
                Retry
              </Button>
            </View>
          ) : null}
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
  errorContainer: {
    backgroundColor: '#ffeded',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryList: {
    backgroundColor: '#fff',
  },
  categoryItem: {
    backgroundColor: '#fff',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    color: '#2c3e50',
  },
  categoryIdBadge: {
    fontSize: 12,
    color: '#7f8c8d',
    backgroundColor: '#f0f4f7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  accordion: {
    backgroundColor: '#fff',
  },
  subcategoryTitle: {
    fontSize: 14,
    color: '#34495e',
  },
  subcategoryItem: {
    paddingLeft: 20,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  completeButton: {
    borderRadius: 4,
    backgroundColor: '#2ecc71',
  },
  apiInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  apiInfoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#3498db',
  },
  templateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  templateInfoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#27ae60',
  },
  offlineInfoCard: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 8,
  },
  offlineInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
  },
  offlineInfoTitle: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  offlineInfoText: {
    color: '#fff',
    fontSize: 13,
    padding: 12,
    paddingTop: 8,
  }
}); 