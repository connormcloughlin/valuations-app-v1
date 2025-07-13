import React, { useState } from 'react';
import { View, ScrollView, Text, Share, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import { AppLayout, TabConfig } from '../../../components/layout';
import { surveySummaryStyles } from '../../GlobalStyles';

// Import components
import SurveySummaryHeader from './components/SurveySummaryHeader';
import SurveyDetailsCard from './components/SurveyDetailsCard';
import ValuationSummaryCard from './components/ValuationSummaryCard';
import SurveySummaryActions from './components/SurveySummaryActions';

// Import custom hook
import { useSurveySummaryData } from './hooks/useSurveySummaryData';

// Define tabs for survey summary navigation
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

export default function SurveySummaryScreen() {
  logNavigation('Survey Summary Detail');
  const params = useLocalSearchParams();
  const { id, orderNumber: orderNumberFromParams } = params;
  const surveyId = id as string;
  
  // Use custom hook for data fetching
  const { loading, survey, error } = useSurveySummaryData(surveyId, orderNumberFromParams as string);
  
  // State for completion action
  const [completing, setCompleting] = useState(false);
  
  const shareSummary = async () => {
    if (!survey) return;
    
    try {
      const message = `
Survey Summary for ${survey.client}
Address: ${survey.address}
Order Number: ${survey.orderNumber}
Total Value: R${survey.totalValue.toLocaleString()}

Completed on ${survey.completionDate}
      `;
      
      await Share.share({
        message,
        title: `Valuation Survey - ${survey.client}`,
      });
    } catch (error) {
      console.error('Error sharing survey summary:', error);
    }
  };
  
  const downloadPdf = () => {
    // In a real app, this would generate and download a PDF
    console.log('Downloading PDF for survey:', surveyId);
  };
  
  const completeSurvey = async () => {
    if (!survey) return;
    
    Alert.alert(
      'Complete Survey',
      'Are you sure you want to complete this survey? This action will finalize the survey and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              setCompleting(true);
              
              console.log('🔄 Completing survey for appointment ID:', surveyId);
              
              // Import the API
              const api = await import('../../../api');
              
              // Update the appointment status to "Finalise"
              // @ts-ignore - this method exists in the API
              const response = await api.default.updateAppointment(surveyId, {
                inviteStatus: 'Finalise'
              });
              
              if (response && response.success) {
                console.log('✅ Survey completed successfully');
                
                Alert.alert(
                  'Survey Completed',
                  'The survey has been successfully completed and finalized.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to dashboard or surveys list
                        router.push('/(tabs)');
                      },
                    },
                  ]
                );
              } else {
                console.error('❌ Failed to complete survey:', response);
                Alert.alert(
                  'Error',
                  'Failed to complete the survey. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('❌ Error completing survey:', error);
              Alert.alert(
                'Error',
                'An error occurred while completing the survey. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <AppLayout
        title="Survey Summary"
        tabs={surveyTabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <View style={[surveySummaryStyles.container, surveySummaryStyles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={surveySummaryStyles.loadingText}>Loading survey summary...</Text>
        </View>
      </AppLayout>
    );
  }
  
  if (error || !survey) {
    return (
      <AppLayout
        title="Survey Not Found"
        tabs={surveyTabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <View style={[surveySummaryStyles.container, surveySummaryStyles.centeredContainer]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={surveySummaryStyles.errorTitle}>Survey Not Found</Text>
          <Text style={surveySummaryStyles.errorMessage}>
            {error || "The survey you're looking for doesn't exist or has been deleted."}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={surveySummaryStyles.errorButton}
          >
            Go Back
          </Button>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Survey Summary"
      tabs={surveyTabs}
      showHeader={true}
      showBottomNav={true}
      showLogout={true}
    >
      <View style={surveySummaryStyles.container}>
        <ScrollView style={surveySummaryStyles.scrollView}>
          <SurveySummaryHeader
            client={survey.client}
            address={survey.address}
            completionDate={survey.completionDate}
          />
          
          <SurveyDetailsCard
            orderNumber={survey.orderNumber}
            policyNo={survey.policyNo}
            sumInsured={survey.sumInsured}
            broker={survey.broker}
            date={survey.date}
          />
          
          <ValuationSummaryCard
            assessmentTypes={survey.assessmentTypes}
            totalValue={survey.totalValue}
          />
          
          {survey.notes && (
            <View style={surveySummaryStyles.sectionContainer}>
              <Text style={surveySummaryStyles.sectionTitle}>Notes</Text>
              <View style={surveySummaryStyles.notesCard}>
                <Text style={surveySummaryStyles.notesText}>{survey.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        <SurveySummaryActions
          onShare={shareSummary}
          onDownloadPdf={downloadPdf}
          onComplete={completeSurvey}
          completing={completing}
        />
      </View>
    </AppLayout>
  );
}

