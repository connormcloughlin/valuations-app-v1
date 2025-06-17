import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
}

interface CategoriesListProps {
  categories: Category[];
  totalValue: number;
  onCategoryPress: (categoryId: string, categoryName: string) => void;
}

export default function CategoriesList({ categories, totalValue, onCategoryPress }: CategoriesListProps) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Text style={styles.totalValue}>Total: R{totalValue.toLocaleString()}</Text>
      </View>
      
      {categories.map((category: Category) => (
        <Card 
          key={category.id} 
          style={styles.categoryCard}
          onPress={() => onCategoryPress(category.id, category.name)}
        >
          <Card.Content style={styles.categoryContent}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDetails}>
                {category.items} items • R{category.value.toLocaleString()}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#95a5a6" />
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  categoryCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryDetails: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 