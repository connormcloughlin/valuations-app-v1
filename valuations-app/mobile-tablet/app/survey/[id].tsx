import React, { useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { logNavigation } from '../../utils/logger';
import { AppLayout } from '../../components/layout';
import { useMainTabTabs } from '../../hooks/useMainTabTabs';

// Import refactored components
import { SurveyDataProvider, useSurveyData } from './components/SurveyDataProvider';
import { SurveyMainContent } from './components/SurveyMainContent';
import { SurveyLoading, SurveyError } from './components/SurveyStates';

// Wrapper component for loading and error states
const SurveyScreenWrapper: React.FC<{ surveyId: string }> = ({ surveyId }) => {
  const tabs = useMainTabTabs();
  const { survey, loading, error, refreshCategoryValues } = useSurveyData();

  // Refresh category totals when returning from items screen so the total updates after edits
  useFocusEffect(
    useCallback(() => {
      refreshCategoryValues();
    }, [refreshCategoryValues])
  );
  
  if (loading) {
    return (
      <AppLayout
        title="Loading Survey"
        tabs={tabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <SurveyLoading />
      </AppLayout>
    );
  }
  
  if (error || !survey) {
    return (
      <AppLayout
        title="Survey Error"
        tabs={tabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <SurveyError 
          title="Survey Not Found"
          message={error || "The survey you're looking for doesn't exist or has been deleted."}
          onGoBack={() => router.back()} 
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={survey.client}
      tabs={tabs}
      showHeader={true}
      showBottomNav={true}
      showLogout={true}
    >
      <SurveyMainContent surveyId={surveyId} />
    </AppLayout>
  );
};

export default function SurveyScreen() {
  logNavigation('Survey Detail Screen');
  const params = useLocalSearchParams();
  const { id } = params;
  const surveyId = id as string;
  
  return (
    <SurveyDataProvider surveyId={surveyId}>
      <SurveyScreenWrapper surveyId={surveyId} />
    </SurveyDataProvider>
  );
}

 