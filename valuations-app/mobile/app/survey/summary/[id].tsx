import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Share } from 'react-native';
import { Card, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';

// Define the types for our data
interface CategorySummary {
  id: string;
  name: string;
  items: number;
  value: number;
}

interface CompletedSurvey {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  sumInsured: string;
  orderNumber: string;
  submitted: string;
  broker: string;
  completionDate: string;
  categories: CategorySummary[];
  totalValue: number;
  notes?: string;
}

type SurveysDataType = {
  [key: string]: CompletedSurvey;
};

// Mock completed survey data
const surveysData: SurveysDataType = {
  '1004': { 
    id: '1004',
    address: '29 Killarney Avenue',
    client: 'J. Smith',
    date: '2024-04-20 11:30',
    policyNo: 'L 94 mil',
    sumInsured: 'R 4.2 mil',
    orderNumber: 'ORD-2024-1004',
    submitted: '2024-04-20',
    broker: 'Sanlam',
    completionDate: '2024-04-20',
    categories: [
      { id: 'cat-1', name: 'CLOTHING (GENTS / BOYS)', items: 10, value: 28500 },
      { id: 'cat-2', name: 'FURNITURE', items: 15, value: 92000 },
      { id: 'cat-3', name: 'KITCHENWARE', items: 20, value: 34500 },
      { id: 'cat-4', name: 'ELECTRONICS', items: 8, value: 45000 },
    ],
    totalValue: 200000,
    notes: 'Client has valuable antique furniture that requires special attention.'
  },
  '1005': { 
    id: '1005',
    address: '12 Beach Road',
    client: 'L. Johnson',
    date: '2024-04-18 15:00',
    policyNo: 'M 17 mil',
    sumInsured: 'R 2.1 mil',
    orderNumber: 'ORD-2024-1005',
    submitted: '2024-04-18',
    broker: 'Old Mutual',
    completionDate: '2024-04-18',
    categories: [
      { id: 'cat-1', name: 'CLOTHING (GENTS / BOYS)', items: 6, value: 15000 },
      { id: 'cat-2', name: 'FURNITURE', items: 10, value: 58000 },
      { id: 'cat-4', name: 'ELECTRONICS', items: 12, value: 62000 },
    ],
    totalValue: 135000
  },
  '1006': { 
    id: '1006',
    address: '45 Mountain View',
    client: 'P. Williams',
    date: '2024-04-15 09:30',
    policyNo: 'N 63 mil',
    sumInsured: 'R 3.2 mil',
    orderNumber: 'ORD-2024-1006',
    submitted: '2024-04-15',
    broker: 'Discovery',
    completionDate: '2024-04-15',
    categories: [
      { id: 'cat-1', name: 'CLOTHING (GENTS / BOYS)', items: 7, value: 19500 },
      { id: 'cat-2', name: 'FURNITURE', items: 12, value: 78000 },
      { id: 'cat-3', name: 'KITCHENWARE', items: 18, value: 32000 },
      { id: 'cat-4', name: 'ELECTRONICS', items: 6, value: 38000 },
    ],
    totalValue: 167500
  }
};

export default function SurveySummaryScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const surveyId = id as string;
  
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<CompletedSurvey | null>(null);
  
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      if (surveysData[surveyId]) {
        setSurvey(surveysData[surveyId]);
      }
      setLoading(false);
    }, 600);
  }, [surveyId]);
  
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
      <>
        <Stack.Screen
          options={{
            title: 'Survey Summary',
            headerTitleStyle: { fontWeight: '600' }
          }}
        />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading survey summary...</Text>
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Survey Summary',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <View style={styles.statusRow}>
                <Chip 
                  style={styles.statusChip} 
                  textStyle={styles.statusChipText}
                  icon="check-circle"
                >
                  Completed
                </Chip>
                <Text style={styles.completionDate}>Submitted: {survey.completionDate}</Text>
              </View>
              
              <Text style={styles.clientName}>{survey.client}</Text>
              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#2ecc71" />
                <Text style={styles.addressText}>{survey.address}</Text>
              </View>
            </Card.Content>
          </Card>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Survey Details</Text>
            <Card style={styles.detailsCard}>
              <Card.Content>
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
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{survey.date}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Valuation Summary</Text>
              <Text style={styles.totalValue}>Total: R{survey.totalValue.toLocaleString()}</Text>
            </View>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                {survey.categories.map((category, index) => (
                  <React.Fragment key={category.id}>
                    <View style={styles.categorySummary}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryValue}>R{category.value.toLocaleString()}</Text>
                      </View>
                      <Text style={styles.itemCount}>{category.items} items</Text>
                    </View>
                    {index < survey.categories.length - 1 && <Divider style={styles.divider} />}
                  </React.Fragment>
                ))}
                
                <Divider style={[styles.divider, styles.totalDivider]} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL VALUATION</Text>
                  <Text style={styles.totalValueBold}>R{survey.totalValue.toLocaleString()}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
          
          {survey.notes && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Card style={styles.notesCard}>
                <Card.Content>
                  <Text style={styles.notesText}>{survey.notes}</Text>
                </Card.Content>
              </Card>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={shareSummary}
            style={styles.shareButton}
            icon="share-variant"
          >
            Share Summary
          </Button>
          <Button
            mode="contained"
            onPress={downloadPdf}
            style={styles.pdfButton}
            icon="file-pdf-box"
          >
            Download PDF
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    backgroundColor: '#e8f6ef',
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    color: '#27ae60',
  },
  completionDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
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
  summaryCard: {
    borderRadius: 8,
  },
  categorySummary: {
    paddingVertical: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27ae60',
  },
  itemCount: {
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
  notesCard: {
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  shareButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#2ecc71',
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
  },
}); 