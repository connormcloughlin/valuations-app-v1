import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Button, Card, List, Divider } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define types for our category structure
interface Subcategory {
  name: string;
}

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
      { id: 'cat-11', title: 'SPORT EQUIPMENT' },
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

export default function CategoriesScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['section-a', 'section-b']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
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
  
  const navigateToItems = (categoryId: string, categoryTitle: string) => {
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId,
        categoryTitle
      }
    });
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Survey Categories',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Select a category to add items to your inventory
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
                <View style={styles.categoryList}>
                  {section.categories.map(category => (
                    <View key={category.id}>
                      {category.subcategories ? (
                        <List.Accordion
                          title={category.title}
                          expanded={expandedCategories.includes(category.id)}
                          onPress={() => toggleCategory(category.id)}
                          style={styles.accordion}
                          titleStyle={styles.categoryTitle}
                        >
                          {category.subcategories.map((subcat, index) => (
                            <List.Item
                              key={`${category.id}-sub-${index}`}
                              title={subcat}
                              onPress={() => navigateToItems(`${category.id}-sub-${index}`, `${category.title} - ${subcat}`)}
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
                          title={category.title}
                          onPress={() => navigateToItems(category.id, category.title)}
                          titleStyle={styles.categoryTitle}
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
}); 