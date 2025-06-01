import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { logNavigation } from '../../utils/logger';

// Add Survey and Category types
interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
}
interface Survey {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  sumInsured: string;
  orderNumber: string;
  lastEdited: string;
  broker: string;
  categories: Category[];
  totalValue: number;
  completedCategories: number;
}

// Add index signature to surveysData
const surveysData: { [key: string]: Survey } = {
  '1003': {
    id: '1003',
    address: '789 Pine Rd',
    client: 'S. Naidoo',
    date: '2024-04-25 10:00',
    policyNo: 'J 12 mil',
    sumInsured: 'R 2.8 mil',
    orderNumber: 'ORD-2024-1003',
    lastEdited: '2024-04-25',
    broker: 'Old Mutual',
    categories: [
      { id: 'cat-1', name: 'CLOTHING (GENTS / BOYS)', items: 8, value: 24500 },
      { id: 'cat-2', name: 'FURNITURE', items: 12, value: 85000 },
      { id: 'cat-4', name: 'ELECTRONICS', items: 5, value: 32000 },
    ],
    totalValue: 141500,
    completedCategories: 2
  },
  '1006': {
    id: '1006',
    address: '45 Mountain View',
    client: 'P. Williams',
    date: '2024-04-26 09:30',
    policyNo: 'N 63 mil',
    sumInsured: 'R 3.2 mil',
    orderNumber: 'ORD-2024-1006',
    lastEdited: '2024-04-26',
    broker: 'Discovery',
    categories: [
      { id: 'cat-1', name: 'CLOTHING (GENTS / BOYS)', items: 6, value: 18500 },
      { id: 'cat-2', name: 'FURNITURE', items: 9, value: 64000 },
      { id: 'cat-3', name: 'KITCHENWARE', items: 14, value: 28000 },
    ],
    totalValue: 110500,
    completedCategories: 1
  }
};

export default function SurveyScreen() {
  logNavigation('Survey Detail Screen');
  const params = useLocalSearchParams();
  const { id } = params;
  const surveyId = id as string;
  
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      if (surveysData[surveyId]) {
        setSurvey(surveysData[surveyId]);
      }
      setLoading(false);
    }, 800);
  }, [surveyId]);
  
  const navigateToCategory = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId, 
        categoryTitle: categoryName,
        surveyId
      }
    });
  };
  
  const continueSurvey = () => {
    // router.push({
    //   pathname: '/survey/categories',
    //   params: { surveyId }
    // });
    // Use the new categories screen if needed
    router.push({
      pathname: '/survey/categories_old',
      params: { surveyId }
    });
  };
  
  const finishSurvey = () => {
    // In a real app, you would save the survey as completed
    router.push({
      pathname: '/survey/summary/[id]',
      params: { id: surveyId }
    });
  };
  
  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Loading Survey',
            headerTitleStyle: { fontWeight: '600' }
          }}
        />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading survey data...</Text>
        </View>
      </>
    );
  }
  
  if (!survey) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Survey Not Found',
            headerTitleStyle: { fontWeight: '600' }
          }}
        />
        <View style={[styles.container, styles.centeredContainer]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Survey Not Found</Text>
          <Text style={styles.errorMessage}>The survey you're looking for doesn't exist or has been deleted.</Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={styles.errorButton}
          >
            Go Back
          </Button>
        </View>
      </>
    );
  }
  
  const progress = Math.floor((survey.completedCategories / survey.categories.length) * 100);
  
  return (
    <>
      <Stack.Screen
        options={{
          title: survey.client,
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#f39c12" />
                <Text style={styles.addressText}>{survey.address}</Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressTitle}>Survey Progress</Text>
                  <Text style={styles.progressPercentage}>{progress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressDetails}>
                  {survey.completedCategories} of {survey.categories.length} categories completed
                </Text>
              </View>
            </Card.Content>
          </Card>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Survey Details</Text>
            <Card style={styles.detailsCard}>
              <Card.Content>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client:</Text>
                  <Text style={styles.detailValue}>{survey.client}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Number:</Text>
                  <Text style={styles.detailValue}>{survey.orderNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Policy Number:</Text>
                  <Text style={styles.detailValue}>{survey.policyNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sum Insured:</Text>
                  <Text style={styles.detailValue}>{survey.sumInsured}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Broker:</Text>
                  <Text style={styles.detailValue}>{survey.broker}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Edited:</Text>
                  <Text style={styles.detailValue}>{survey.lastEdited}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.totalValue}>Total: R{survey.totalValue.toLocaleString()}</Text>
            </View>
            
            {survey.categories.map((category: Category) => (
              <Card 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => navigateToCategory(category.id, category.name)}
              >
                <Card.Content style={styles.categoryContent}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDetails}>
                      {category.items} items • R{category.value.toLocaleString()}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#95a5a6" />
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={continueSurvey}
            style={styles.continueButton}
            icon="clipboard-list"
          >
            Edit Categories
          </Button>
          <Button
            mode="contained"
            onPress={finishSurvey}
            style={styles.finishButton}
            icon="check-circle"
            disabled={progress < 100}
          >
            Complete Survey
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
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
  headerCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f39c12',
  },
  progressDetails: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'right',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  detailsCard: {
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  categoryCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryDetails: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#f39c12',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#27ae60',
  },
}); 