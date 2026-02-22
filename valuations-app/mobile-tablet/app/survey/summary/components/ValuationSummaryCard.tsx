import React from 'react';
import { View, Text } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { valuationSummaryCardStyles } from '../../../GlobalStyles';

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
    <View style={valuationSummaryCardStyles.sectionContainer}>
      <View style={valuationSummaryCardStyles.sectionHeader}>
        <Text style={valuationSummaryCardStyles.sectionTitle}>Valuation Summary</Text>
        <Text style={valuationSummaryCardStyles.totalValue}>Total: R{totalValue.toLocaleString()}</Text>
      </View>
      
      <Card style={valuationSummaryCardStyles.summaryCard}>
        <Card.Content>
          {assessmentTypes.map((assessmentType, typeIndex) => (
            <React.Fragment key={assessmentType.id || `assessment-type-${typeIndex}`}>
              <View style={valuationSummaryCardStyles.assessmentTypeSummary}>
                <View style={valuationSummaryCardStyles.assessmentTypeHeader}>
                  <Text style={valuationSummaryCardStyles.assessmentTypeName}>{assessmentType.name}</Text>
                  <Text style={valuationSummaryCardStyles.assessmentTypeValue}>R{assessmentType.totalValue.toLocaleString()}</Text>
                </View>
                <Text style={valuationSummaryCardStyles.assessmentTypeItemCount}>{assessmentType.totalItems} items</Text>
                
                {/* Render sections within this assessment type */}
                {assessmentType.sections.map((section, sectionIndex) => (
                  <View key={section.id || `section-${typeIndex}-${sectionIndex}`} style={valuationSummaryCardStyles.sectionContainer}>
                    <View style={valuationSummaryCardStyles.sectionHeader}>
                      <Text style={valuationSummaryCardStyles.sectionName}>{section.name}</Text>
                      <Text style={valuationSummaryCardStyles.sectionValue}>R{section.totalValue.toLocaleString()}</Text>
                    </View>
                    <Text style={valuationSummaryCardStyles.sectionItemCount}>{section.totalItems} items</Text>
                    
                    {/* Render categories within this section */}
                    {section.categories.map((category, categoryIndex) => (
                      <View key={category.id || `category-${typeIndex}-${sectionIndex}-${categoryIndex}`} style={valuationSummaryCardStyles.categoryContainer}>
                        <View style={valuationSummaryCardStyles.categoryHeader}>
                          <Text style={valuationSummaryCardStyles.categoryName}>{category.name}</Text>
                          <Text style={valuationSummaryCardStyles.categoryValue}>R{category.value.toLocaleString()}</Text>
                        </View>
                        <Text style={valuationSummaryCardStyles.categoryItemCount}>{category.items} items</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              {typeIndex < assessmentTypes.length - 1 && <Divider style={valuationSummaryCardStyles.divider} />}
            </React.Fragment>
          ))}
          
          <Divider style={[valuationSummaryCardStyles.divider, valuationSummaryCardStyles.totalDivider]} />
          
          <View style={valuationSummaryCardStyles.totalRow}>
            <Text style={valuationSummaryCardStyles.totalLabel}>TOTAL VALUATION</Text>
            <Text style={valuationSummaryCardStyles.totalValueBold}>R{totalValue.toLocaleString()}</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

