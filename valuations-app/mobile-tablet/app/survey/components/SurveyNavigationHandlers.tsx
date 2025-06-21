import { router } from 'expo-router';
import { RiskTemplate, Survey } from './SurveyDataProvider';

interface NavigationHandlersProps {
  survey: Survey | null;
  surveyId: string;
}

export const useSurveyNavigation = ({ survey, surveyId }: NavigationHandlersProps) => {
  const navigateToCategory = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId, 
        categoryTitle: categoryName,
        surveyId,
        appointmentId: survey?.appointmentId
      }
    });
  };

  const handleTemplateSelection = (template: RiskTemplate) => {
    console.log('🚀 Template selected for accordion view:', template);
    // Template is now handled by the accordion in RiskAssessmentTemplates component
    // No navigation needed as sections will be shown inline
  };

  const continueSurvey = () => {
    // Navigate to survey items for survey completion
    if (survey?.appointmentId) {
      router.push({
        pathname: '/survey/items',
        params: {
          appointmentId: survey.appointmentId,
          status: survey.status || 'in-progress',
          orderNumber: survey.orderNumber,
          clientName: survey.client,
          address: survey.address,
          policyNo: survey.policyNo,
          sumInsured: survey.sumInsured,
          broker: survey.broker,
          surveyId: surveyId,
          // Default to first category if no specific category is selected
          categoryId: 'default',
          categoryTitle: 'Survey Items'
        }
      });
    } else {
      // Fallback to survey items
      router.push({
        pathname: '/survey/items',
        params: { 
          surveyId,
          categoryId: 'default',
          categoryTitle: 'Survey Items'
        }
      });
    }
  };

  const finishSurvey = () => {
    router.push({
      pathname: '/survey/summary/[id]',
      params: { id: surveyId }
    });
  };

  return {
    navigateToCategory,
    handleTemplateSelection,
    continueSurvey,
    finishSurvey,
  };
}; 