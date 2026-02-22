import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import mediaService from '../../../services/mediaService';

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
  /** Increment to refresh category photo counts (e.g. after adding a category photo) */
  photoCountRefreshKey?: number;
  onAddCategoryPhoto?: (categoryId: string, categoryName: string) => void;
  onViewCategoryPhotos?: (categoryId: string, categoryName: string) => void;
}

export default function CategoriesList({ categories, totalValue, onCategoryPress, photoCountRefreshKey = 0, onAddCategoryPhoto, onViewCategoryPhotos }: CategoriesListProps) {
  const [categoryPhotoCounts, setCategoryPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (categories.length === 0 || !onViewCategoryPhotos) return;
    let cancelled = false;
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        categories.map(async (category: Category) => {
          const categoryId = category.id;
          if (!categoryId) return;
          try {
            const entityId = parseInt(categoryId, 10);
            if (isNaN(entityId)) return;
            const photos = await mediaService.getPhotosForEntity('riskAssessmentCategory', entityId);
            if (!cancelled) counts[categoryId] = photos.length;
          } catch {
            if (!cancelled) counts[categoryId] = 0;
          }
        })
      );
      if (!cancelled) setCategoryPhotoCounts(counts);
    };
    loadCounts();
    return () => { cancelled = true; };
  }, [categories, onViewCategoryPhotos, photoCountRefreshKey]);

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
            <View style={styles.categoryRightRow}>
              {onAddCategoryPhoto && (
                <TouchableOpacity
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onAddCategoryPhoto(category.id, category.name);
                  }}
                  style={styles.photoIcon}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              {onViewCategoryPhotos && (
                <TouchableOpacity
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    if ((categoryPhotoCounts[category.id] ?? 0) > 0) {
                      onViewCategoryPhotos(category.id, category.name);
                    }
                  }}
                  style={styles.photoIcon}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  disabled={(categoryPhotoCounts[category.id] ?? 0) === 0}
                >
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={20}
                    color={(categoryPhotoCounts[category.id] ?? 0) > 0 ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons name="chevron-right" size={24} color="#95a5a6" />
            </View>
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
  categoryRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoIcon: {
    padding: 4,
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