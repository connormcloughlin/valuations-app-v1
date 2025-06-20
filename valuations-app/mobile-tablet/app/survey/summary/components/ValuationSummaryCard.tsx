import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Divider } from 'react-native-paper';

interface CategorySummary {
  id: string;
  name: string;
  items: number;
  value: number;
}

interface SectionSummary {
  id: string;
  name: string;
  categories: CategorySummary[];
  totalItems: number;
  totalValue: number;
}

interface AssessmentTypeSummary {
  id: string;
  name: string;
  sections: SectionSummary[];
  totalItems: number;
  totalValue: number;
}

interface ValuationSummaryCardProps {
  assessmentTypes: AssessmentTypeSummary[];
  totalValue: number;
}

export default function ValuationSummaryCard({ assessmentTypes, totalValue }: ValuationSummaryCardProps) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Valuation Summary</Text>
        <Text style={styles.totalValue}>Total: R{totalValue.toLocaleString()}</Text>
      </View>
      
      <Card style={styles.summaryCard}>
        <Card.Content>
          {assessmentTypes.map((assessmentType, typeIndex) => (
            <React.Fragment key={assessmentType.id}>
              <View style={styles.assessmentTypeSummary}>
                <View style={styles.assessmentTypeHeader}>
                  <Text style={styles.assessmentTypeName}>{assessmentType.name}</Text>
                  <Text style={styles.assessmentTypeValue}>R{assessmentType.totalValue.toLocaleString()}</Text>
                </View>
                <Text style={styles.assessmentTypeItemCount}>{assessmentType.totalItems} items</Text>
                
                {/* Render sections within this assessment type */}
                {assessmentType.sections.map((section, sectionIndex) => (
                  <View key={section.id} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionName}>{section.name}</Text>
                      <Text style={styles.sectionValue}>R{section.totalValue.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.sectionItemCount}>{section.totalItems} items</Text>
                    
                    {/* Render categories within this section */}
                    {section.categories.map((category, categoryIndex) => (
                      <View key={category.id} style={styles.categoryContainer}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryValue}>R{category.value.toLocaleString()}</Text>
                        </View>
                        <Text style={styles.categoryItemCount}>{category.items} items</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              {typeIndex < assessmentTypes.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
          
          <Divider style={[styles.divider, styles.totalDivider]} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL VALUATION</Text>
            <Text style={styles.totalValueBold}>R{totalValue.toLocaleString()}</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginLeft: 16,
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e8f6ef',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  summaryCard: {
    borderRadius: 8,
  },
  assessmentTypeSummary: {
    paddingVertical: 12,
  },
  assessmentTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  assessmentTypeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27ae60',
  },
  assessmentTypeItemCount: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: '#27ae60',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27ae60',
  },
  sectionItemCount: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  categoryContainer: {
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#ecf0f1',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7f8c8d',
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27ae60',
  },
  categoryItemCount: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 2,
  },
}); 