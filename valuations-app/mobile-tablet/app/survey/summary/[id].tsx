import React from 'react';
import { StyleSheet, View, ScrollView, Text, Share } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import { AppLayout, TabConfig } from '../../../components/layout';

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
    name: 'new-survey',
    title: 'New Survey',
    icon: 'plus-circle',
    path: '/(tabs)/new-survey'
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
  
  if (loading) {
    return (
      <AppLayout
        title="Survey Summary"
        tabs={surveyTabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading survey summary...</Text>
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
        <View style={[styles.container, styles.centeredContainer]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Survey Not Found</Text>
          <Text style={styles.errorMessage}>
            {error || "The survey you're looking for doesn't exist or has been deleted."}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={styles.errorButton}
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
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
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
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{survey.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        <SurveySummaryActions
          onShare={shareSummary}
          onDownloadPdf={downloadPdf}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3498db',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  notesCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
}); 