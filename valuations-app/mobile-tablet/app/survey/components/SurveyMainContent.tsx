import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { useSurveyData } from './SurveyDataProvider';
import { useSurveyNavigation } from './SurveyNavigationHandlers';

// Import existing components
import SurveyHeader from './SurveyHeader';
import SurveyDetails from './SurveyDetails';
import RiskAssessmentTemplates from './RiskAssessmentTemplates';
import CategoriesList from './CategoriesList';
import SurveyActions from './SurveyActions';

interface SurveyMainContentProps {
  surveyId: string;
}

export const SurveyMainContent: React.FC<SurveyMainContentProps> = ({ surveyId }) => {
  const {
    survey,
    categories,
    categoriesLoading,
    categoriesError,
    selectedSectionTitle,
    fetchCategories,
  } = useSurveyData();

  const {
    navigateToCategory,
    handleTemplateSelection,
    continueSurvey,
    finishSurvey,
  } = useSurveyNavigation({ survey, surveyId });

  const handleSectionSelection = (sectionId: string, sectionTitle: string) => {
    console.log('🚀 Section selected:', sectionId, sectionTitle);
    fetchCategories(sectionId, sectionTitle);
  };

  if (!survey) {
    return null;
  }

  // Calculate progress based on available categories
  const totalCategories = categories.length > 0 ? categories.length : survey.categories.length;
  const completedCategories = categories.length > 0 ? 
    categories.filter(cat => cat.items > 0).length : survey.completedCategories;
  
  const progress = totalCategories > 0 ? 
    Math.floor((completedCategories / totalCategories) * 100) : 
    // If no categories loaded yet, allow completion (user can still finish survey)
    100;

  return (
    <>
      <ScrollView style={styles.scrollView}>
        <SurveyHeader 
          address={survey.address}
          completedCategories={survey.completedCategories}
          totalCategories={survey.categories.length || 1} // Avoid division by zero
        />
        
        <SurveyDetails
          client={survey.client}
          orderNumber={survey.orderNumber}
          policyNo={survey.policyNo}
          sumInsured={survey.sumInsured}
          broker={survey.broker}
          lastEdited={survey.lastEdited}
        />
        
        <RiskAssessmentTemplates
          orderNumber={survey.orderNumber}
          onTemplatePress={handleTemplateSelection}
          onSectionPress={handleSectionSelection}
        />
        
        {/* Show categories status when a section is selected */}
        {selectedSectionTitle && (
          <View style={styles.categoriesStatus}>
            <Text style={styles.selectedSectionTitle}>
              Categories from: {selectedSectionTitle}
            </Text>
            {categoriesLoading && (
              <Text style={styles.loadingText}>Loading categories...</Text>
            )}
            {categoriesError && (
              <Text style={styles.errorText}>{categoriesError}</Text>
            )}
          </View>
        )}
        
        <CategoriesList
          categories={categories.length > 0 ? categories : survey.categories}
          totalValue={categories.length > 0 ? categories.reduce((sum, cat) => sum + cat.value, 0) : survey.totalValue}
          onCategoryPress={navigateToCategory}
        />
      </ScrollView>
      
      <SurveyActions
        progress={progress}
        onContinueSurvey={continueSurvey}
        onFinishSurvey={finishSurvey}
      />
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },
  categoriesStatus: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  selectedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
}); 