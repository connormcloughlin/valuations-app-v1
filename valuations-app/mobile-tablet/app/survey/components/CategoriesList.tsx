import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import GlobalStyles constants
import { colors, spacing, borderRadius, typography } from '../../GlobalStyles';

interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
  risktemplatecategoryid?: number;
}

interface CategoriesListProps {
  categories: Category[];
  totalValue: number;
  onCategoryPress: (categoryId: string, categoryName: string, riskTemplateCategoryId?: number) => void;
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
          onPress={() => onCategoryPress(category.id, category.name, category.risktemplatecategoryid)}
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
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  totalValue: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: colors.success,
  },
  categoryCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryDetails: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
}); 