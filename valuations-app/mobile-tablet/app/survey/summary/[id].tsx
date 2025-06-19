import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Share } from 'react-native';
import { Card, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';

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

export default function SurveySummaryScreen() {
  logNavigation('Survey Summary Detail');
  const params = useLocalSearchParams();
  const { id, orderNumber: orderNumberFromParams } = params;
  const surveyId = id as string;
  
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<CompletedSurvey | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSurveySummary = async () => {
      if (!surveyId) {
        setError('No survey ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        let appointmentData: any = {};
        let orderNumber: string | undefined = orderNumberFromParams as string;

        // 1. Fetch appointment details ONLY if we don't have an order number
        if (!orderNumber) {
          console.log('Order number not found in params, fetching appointment details...');
          // @ts-ignore
          const appointmentResponse = await api.getAppointmentById(surveyId);

          if (!appointmentResponse.success || !appointmentResponse.data) {
            throw new Error('Failed to fetch appointment details.');
          }
          appointmentData = appointmentResponse.data;
          orderNumber = appointmentData.orderNumber || appointmentData.orderID;
        } else {
          // If we have an order number, we can use the params that were likely passed in
          appointmentData = params;
          console.log('Using appointment data from navigation params');
        }

        if (!orderNumber) {
          throw new Error('Order number could not be determined for this appointment.');
        }

        // 2. Fetch survey summary (risk assessment master) using order number
        // @ts-ignore
        const summaryResponse = await api.getRiskAssessmentMasterByOrder(orderNumber.toString());
        
        let summaryData: any = {};
        let categorySummary: CategorySummary[] = [];
        let totalValue = 0;

        if (summaryResponse.success && summaryResponse.data) {
          console.log('Successfully fetched survey summary data.');
          summaryData = summaryResponse.data;
          
          // Map categories if they exist
          categorySummary = (summaryData.categories || []).map((cat: any) => ({
            id: cat.id?.toString() || Math.random().toString(),
            name: cat.name || 'Unnamed Category',
            items: cat.itemCount || cat.items || 0,
            value: cat.totalValue || cat.value || 0,
          }));

          totalValue = summaryData.totalValue || categorySummary.reduce((total, cat) => total + cat.value, 0);
        } else {
          console.warn('Could not fetch survey summary data. Displaying partial info.');
          // Don't throw an error, just proceed with empty summary data
        }

        // 3. Map data to CompletedSurvey interface
        const completedSurvey: CompletedSurvey = {
          id: surveyId,
          address: appointmentData.address || 'No address provided',
          client: appointmentData.clientName || appointmentData.client || 'Unknown Client',
          date: appointmentData.date || new Date().toISOString(),
          policyNo: appointmentData.policyNo || 'N/A',
          sumInsured: String(appointmentData.sumInsured || 'N/A'),
          orderNumber: String(orderNumber),
          submitted: summaryData.dateCompleted || appointmentData.dateModified || new Date().toISOString(),
          broker: appointmentData.broker || 'N/A',
          completionDate: summaryData.dateCompleted || new Date().toISOString().split('T')[0],
          categories: categorySummary,
          totalValue: totalValue,
          notes: summaryData.notes || appointmentData.notes || '',
        };

        setSurvey(completedSurvey);

      } catch (err: any) {
        console.error('Error fetching survey summary:', err);
        setError(err.message || 'An unexpected error occurred while loading the summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveySummary();
  }, [surveyId, orderNumberFromParams]);
  
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