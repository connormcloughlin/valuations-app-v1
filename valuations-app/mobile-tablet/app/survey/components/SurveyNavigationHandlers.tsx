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
    // Navigate to new-survey with appointment data for proper template selection
    if (survey?.appointmentId) {
      router.push({
        pathname: '/(tabs)/new-survey',
        params: {
          appointmentId: survey.appointmentId,
          status: survey.status || 'in-progress',
          orderNumber: survey.orderNumber,
          clientName: survey.client,
          address: survey.address,
          policyNo: survey.policyNo,
          sumInsured: survey.sumInsured,
          broker: survey.broker
        }
      });
    } else {
      // Fallback to old categories screen
      router.push({
        pathname: '/survey/categories_old',
        params: { surveyId }
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