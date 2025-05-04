import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import api from '../../api';

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

// Define a type for the API response
interface ApiResponse {
  success: boolean;
  data: any;
  status?: number;
  message?: string;
}

export default function CategoriesScreen() {
  const { appointmentId, orderId, templateId, templateName } = useLocalSearchParams<{ 
    appointmentId: string; 
    orderId: string;
    templateId: string;
    templateName: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveySections, setSurveySections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Load sections and categories from the selected template
  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        setLoading(true);
        // Cast the response to our ApiResponse type
        const response = await api.getTemplateSections(templateId) as ApiResponse;
        
        if (response.success && response.data) {
          // Transform API data to our section/category structure
          const sections: Section[] = response.data.map((section: any) => ({
            id: section.id,
            title: section.name,
            categories: section.categories.map((category: any) => ({
              id: category.id,
              title: category.name,
              subcategories: category.subcategories?.map((sub: any) => sub.name) || []
            }))
          }));
          
          setSurveySections(sections);
          
          // Initially expand all sections
          setExpandedSections(sections.map(section => section.id));
        } else {
          setError('Failed to load assessment sections');
        }
      } catch (err) {
        console.error('Error loading template sections:', err);
        setError('An error occurred while loading assessment data');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplateData();
    }
  }, [templateId]);
  
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
  
  const navigateToItems = (categoryId: string, categoryTitle: string, sectionId: string) => {
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId,
        categoryTitle,
        templateId,
        sectionId,
        appointmentId,
        orderId
      }
    });
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading assessment sections...</Text>
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
  
  return (
    <>
      <Stack.Screen
        options={{
          title: templateName || 'Survey Categories',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Select a category to add items to your assessment
            </Text>
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
                <View style={styles.categoriesContainer}>
                  {section.categories.map(category => (
                    <View key={category.id}>
                      {category.subcategories && category.subcategories.length > 0 ? (
                        <>
                          <TouchableOpacity
                            style={styles.categoryHeader}
                            onPress={() => toggleCategory(category.id)}
                          >
                            <Text style={styles.categoryTitle}>{category.title}</Text>
                            <MaterialCommunityIcons
                              name={expandedCategories.includes(category.id) ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color="#777"
                            />
                          </TouchableOpacity>
                          
                          {expandedCategories.includes(category.id) && (
                            <View style={styles.subcategoriesContainer}>
                              {category.subcategories.map((subcategory, index) => (
                                <TouchableOpacity
                                  key={`${category.id}-sub-${index}`}
                                  style={styles.subcategoryItem}
                                  onPress={() => navigateToItems(
                                    `${category.id}-sub-${index}`,
                                    `${category.title} - ${subcategory}`,
                                    section.id
                                  )}
                                >
                                  <Text style={styles.subcategoryTitle}>{subcategory}</Text>
                                  <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={20}
                                    color="#999"
                                  />
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.categoryItem}
                          onPress={() => navigateToItems(category.id, category.title, section.id)}
                        >
                          <Text style={styles.categoryTitle}>{category.title}</Text>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color="#777"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  instructionsText: {
    fontSize: 16,
    color: '#444',
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
  sectionCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoriesContainer: {
    padding: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTitle: {
    fontSize: 15,
    color: '#444',
  },
  subcategoriesContainer: {
    paddingLeft: 16,
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subcategoryTitle: {
    fontSize: 14,
    color: '#666',
  },
}); 