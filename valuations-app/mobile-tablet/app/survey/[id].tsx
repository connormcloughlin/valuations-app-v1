import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { logNavigation } from '../../utils/logger';
import { AppLayout, TabConfig } from '../../components/layout';

// Import refactored components
import { SurveyDataProvider, useSurveyData } from './components/SurveyDataProvider';
import { SurveyMainContent } from './components/SurveyMainContent';
import { SurveyLoading, SurveyError } from './components/SurveyStates';

// Define tabs for survey navigation
const surveyTabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  {
    name: 'survey',
    title: 'Survey',
    icon: 'note-text',
    path: '/(tabs)/survey'
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'account',
    path: '/(tabs)/profile'
  }
];

// Wrapper component for loading and error states
const SurveyScreenWrapper: React.FC<{ surveyId: string }> = ({ surveyId }) => {
  const { survey, loading, error } = useSurveyData();
  
  if (loading) {
    return (
      <AppLayout
        title="Loading Survey"
        tabs={surveyTabs}
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
        tabs={surveyTabs}
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
      tabs={surveyTabs}
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

 