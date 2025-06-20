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

interface SectionSummary {
  id: string;
  name: string;
  categories: CategorySummary[];
  totalItems: number;
  totalValue: number;
}

interface AssessmentTypeSummary {
  id: string;
  name: string;
  sections: SectionSummary[];
  totalItems: number;
  totalValue: number;
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
  assessmentTypes: AssessmentTypeSummary[];
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

        // 1. Fetch appointment details using the same API as survey screen
        console.log(`🔍 Fetching appointment data for ID: ${surveyId}`);
        
        // @ts-ignore - this method exists in the API
        const response = await api.getAppointmentsByListView({
          status: 'In-Progress', // Try In-Progress first
          page: 1,
          pageSize: 50,
          surveyor: null
        });
        
        let appointment = null;
        
        if (response && response.success && response.data) {
          // Find the specific appointment by ID
          appointment = response.data.find((appt: any) => {
            const apptId = String(appt.appointmentID || appt.appointmentId || appt.id);
            return apptId === surveyId;
          });
        }
        
        // If not found in In-Progress, try Completed status
        if (!appointment) {
          console.log('🔍 Not found in In-Progress, trying Completed status...');
          // @ts-ignore
          const completedResponse = await api.getAppointmentsByListView({
            status: 'Completed',
            page: 1,
            pageSize: 50,
            surveyor: null
          });
          
          if (completedResponse && completedResponse.success && completedResponse.data) {
            appointment = completedResponse.data.find((appt: any) => {
              const apptId = String(appt.appointmentID || appt.appointmentId || appt.id);
              return apptId === surveyId;
            });
          }
        }
        
        if (!appointment) {
          throw new Error('Appointment not found in any status.');
        }
        
        console.log('✅ Found appointment data:', appointment);
        appointmentData = appointment;
        orderNumber = appointmentData.orderNumber || appointmentData.orderID;

        if (!orderNumber) {
          throw new Error('Order number could not be determined for this appointment.');
        }

        // 2. Fetch survey summary data using the same API pattern as survey screens
        let assessmentTypeSummaries: AssessmentTypeSummary[] = [];
        let totalValue = 0;

        try {
          console.log('🔍 Fetching risk assessment data using API pattern...');
          
          // First, try to get the risk assessment ID from appointment data
          const riskAssessmentId = appointmentData.riskassessmentid || appointmentData.riskAssessmentId || surveyId;
          
          if (!riskAssessmentId) {
            console.warn('⚠️ No risk assessment ID found, using SQLite data only');
            throw new Error('No risk assessment ID available');
          }
          
          console.log('🔍 Using risk assessment ID:', riskAssessmentId);
          
          // Get sections for this risk assessment (same as SectionsCategories.tsx)
          const sectionsResponse = await api.getRiskAssessmentSections(riskAssessmentId);
          console.log('✅ getRiskAssessmentSections response:', sectionsResponse);
          
          if (!sectionsResponse.success || !sectionsResponse.data) {
            throw new Error('Failed to load sections');
          }
          
          const sections = sectionsResponse.data.map((s: any) => ({
            id: s.id || s.sectionid || s.riskassessmentsectionid,
            title: s.sectionname || s.name || 'Unnamed Section',
          }));
          
          console.log('📋 Found sections:', sections);
          
          // For each section, get categories and their items
          const sectionSummaries: SectionSummary[] = [];
          
          for (const section of sections) {
            console.log('🔍 Processing section:', section.title);
            
            try {
              // Get categories for this section (same as SectionsCategories.tsx)
              const categoriesResponse = await api.getRiskAssessmentCategories(section.id);
              console.log('✅ getRiskAssessmentCategories response for section', section.id, ':', categoriesResponse);
              
              if (!categoriesResponse.success || !categoriesResponse.data) {
                console.warn('⚠️ Failed to load categories for section:', section.id);
                continue;
              }
              
              const categories = categoriesResponse.data.map((c: any) => ({
                id: c.id || c.categoryid || c.riskassessmentcategoryid,
                name: c.name || c.categoryname || 'Unnamed Category',
              }));
              
              console.log('📂 Found categories for section', section.title, ':', categories);
              
              // For each category, get items from SQLite (same as survey screen pattern)
              const categorySummaries: CategorySummary[] = [];
              
              for (const category of categories) {
                console.log('🔍 Processing category:', category.name);
                
                try {
                  // Check SQLite for items in this category
                  const { getAllRiskAssessmentItems } = await import('../../../utils/db');
                  const localItems = await getAllRiskAssessmentItems();
                  const categoryItems = localItems.filter(item => 
                    String(item.riskassessmentcategoryid) === String(category.id)
                  );
                  
                  let itemCount = categoryItems.length;
                  let categoryValue = 0;
                  
                  if (categoryItems.length > 0) {
                    // Calculate value from SQLite items
                    categoryValue = categoryItems.reduce((sum, item) => {
                      const price = Number(item.price) || 0;
                      const qty = Number(item.qty) || 1;
                      return sum + (price * qty);
                    }, 0);
                    
                    console.log(`📊 Category ${category.name}: ${itemCount} items, value: ${categoryValue}`);
                  } else {
                    // Try to get items from API if none in SQLite
                    console.log('🔍 No SQLite items, trying API for category:', category.id);
                    
                    try {
                      const itemsResponse = await api.getRiskAssessmentItems(category.id);
                      if (itemsResponse?.success && Array.isArray(itemsResponse.data)) {
                        itemCount = itemsResponse.data.length;
                        categoryValue = itemsResponse.data.reduce((sum: number, item: any) => {
                          const price = Number(item.price) || 0;
                          const qty = Number(item.qty) || 1;
                          return sum + (price * qty);
                        }, 0);
                        
                        console.log(`📊 Category ${category.name} (from API): ${itemCount} items, value: ${categoryValue}`);
                      }
                    } catch (apiError) {
                      console.warn('⚠️ Failed to fetch items from API for category:', category.id, apiError);
                    }
                  }
                  
                  categorySummaries.push({
                    id: category.id,
                    name: category.name,
                    items: itemCount,
                    value: categoryValue
                  });
                  
                } catch (categoryError) {
                  console.warn('⚠️ Error processing category:', category.name, categoryError);
                }
              }
              
              // Calculate section totals
              const sectionTotalItems = categorySummaries.reduce((sum, cat) => sum + cat.items, 0);
              const sectionTotalValue = categorySummaries.reduce((sum, cat) => sum + cat.value, 0);
              
              sectionSummaries.push({
                id: section.id,
                name: section.title,
                categories: categorySummaries,
                totalItems: sectionTotalItems,
                totalValue: sectionTotalValue
              });
              
            } catch (sectionError) {
              console.warn('⚠️ Error processing section:', section.title, sectionError);
            }
          }
          
          // Create assessment type summary (get the real assessment type name)
          let assessmentTypeName = 'Property Assessment'; // fallback
          
          try {
            // Try to get the assessment type name from risk assessment templates
            // This follows the same pattern as RiskAssessmentTemplates.tsx
            console.log('🔍 Fetching assessment type name for order:', orderNumber);
            
            if (orderNumber) {
              // Try order-specific templates first (same as RiskAssessmentTemplates.tsx)
              const templatesResponse = await api.getRiskTemplates();
              console.log('✅ getRiskTemplates response:', templatesResponse);
              
              if (templatesResponse.success && templatesResponse.data && templatesResponse.data.length > 0) {
                // Use the first template's assessment type name
                const firstTemplate = templatesResponse.data[0];
                assessmentTypeName = firstTemplate.assessmenttypename || firstTemplate.templatename || 'Property Assessment';
                console.log('📋 Using assessment type name from template:', assessmentTypeName);
              }
            }
            
            // Also try to get it from appointment data if available
            if (appointmentData.assessmenttypename) {
              assessmentTypeName = appointmentData.assessmenttypename;
              console.log('📋 Using assessment type name from appointment data:', assessmentTypeName);
            }
            
            // Try to get it from SQLite masters as another option
            const { getAllRiskAssessmentMasters } = await import('../../../utils/db');
            const localMasters = await getAllRiskAssessmentMasters();
            
            if (localMasters.length > 0) {
              const masterWithTypeName = localMasters.find(master => 
                master.assessmenttypename && master.assessmenttypename.trim() !== ''
              );
              
              if (masterWithTypeName) {
                assessmentTypeName = masterWithTypeName.assessmenttypename;
                console.log('📋 Using assessment type name from SQLite masters:', assessmentTypeName);
              }
            }
            
          } catch (typeNameError) {
            console.warn('⚠️ Could not fetch assessment type name, using fallback:', typeNameError);
          }
          
          const assessmentTypeTotalItems = sectionSummaries.reduce((sum, section) => sum + section.totalItems, 0);
          const assessmentTypeTotalValue = sectionSummaries.reduce((sum, section) => sum + section.totalValue, 0);
          
          assessmentTypeSummaries = [{
            id: riskAssessmentId,
            name: assessmentTypeName,
            sections: sectionSummaries,
            totalItems: assessmentTypeTotalItems,
            totalValue: assessmentTypeTotalValue
          }];
          
          totalValue = assessmentTypeTotalValue;
          
          console.log(`✅ Final summary: ${assessmentTypeSummaries.length} assessment types, total value: ${totalValue}`);
          
        } catch (dbError) {
          console.warn('⚠️ Could not fetch survey data using API pattern:', dbError);
          // Fallback to SQLite-only approach if API fails
          console.log('🔄 Falling back to SQLite-only data...');
          
          try {
            const { getAllRiskAssessmentItems } = await import('../../../utils/db');
            const localItems = await getAllRiskAssessmentItems();
            
            if (localItems.length > 0) {
              // Group items by category only as fallback
              const categoryMap = new Map<string, { name: string; items: any[]; value: number }>();
              
              for (const item of localItems) {
                const categoryId = String(item.riskassessmentcategoryid);
                const price = Number(item.price) || 0;
                const qty = Number(item.qty) || 1;
                const itemValue = price * qty;
                
                if (!categoryMap.has(categoryId)) {
                  categoryMap.set(categoryId, {
                    name: `Category ${categoryId}`,
                    items: [],
                    value: 0
                  });
                }
                
                const category = categoryMap.get(categoryId)!;
                category.items.push(item);
                category.value += itemValue;
              }
              
              const fallbackCategories: CategorySummary[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
                id,
                name: data.name,
                items: data.items.length,
                value: data.value
              }));
              
              const fallbackSectionTotalItems = fallbackCategories.reduce((sum, cat) => sum + cat.items, 0);
              const fallbackSectionTotalValue = fallbackCategories.reduce((sum, cat) => sum + cat.value, 0);
              
              assessmentTypeSummaries = [{
                id: 'fallback',
                name: 'Property Assessment',
                sections: [{
                  id: 'fallback-section',
                  name: 'Assessment Items',
                  categories: fallbackCategories,
                  totalItems: fallbackSectionTotalItems,
                  totalValue: fallbackSectionTotalValue
                }],
                totalItems: fallbackSectionTotalItems,
                totalValue: fallbackSectionTotalValue
              }];
              
              totalValue = fallbackSectionTotalValue;
              console.log('✅ Using fallback SQLite data with total value:', totalValue);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback SQLite approach also failed:', fallbackError);
          }
        }

        // 3. Map data to CompletedSurvey interface
        const completedSurvey: CompletedSurvey = {
          id: surveyId,
          address: appointmentData.address || 'No address provided',
          client: appointmentData.client || 'Unknown Client',
          date: appointmentData.startTime || appointmentData.date || new Date().toISOString(),
          policyNo: appointmentData.policyNo || 'N/A',
          sumInsured: String(appointmentData.sumInsured || 'N/A'),
          orderNumber: String(orderNumber),
          submitted: appointmentData.dateModified || new Date().toISOString(),
          broker: appointmentData.broker || 'N/A',
          completionDate: new Date().toISOString().split('T')[0],
          assessmentTypes: assessmentTypeSummaries,
          totalValue: totalValue,
          notes: appointmentData.notes || '',
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
                {survey.assessmentTypes.map((assessmentType, typeIndex) => (
                  <React.Fragment key={assessmentType.id}>
                    <View style={styles.assessmentTypeSummary}>
                      <View style={styles.assessmentTypeHeader}>
                        <Text style={styles.assessmentTypeName}>{assessmentType.name}</Text>
                        <Text style={styles.assessmentTypeValue}>R{assessmentType.totalValue.toLocaleString()}</Text>
                      </View>
                      <Text style={styles.assessmentTypeItemCount}>{assessmentType.totalItems} items</Text>
                      
                      {/* Render sections within this assessment type */}
                      {assessmentType.sections.map((section, sectionIndex) => (
                        <View key={section.id} style={styles.sectionContainer}>
                          <View style={styles.sectionHeader}>
                            <Text style={styles.sectionName}>{section.name}</Text>
                            <Text style={styles.sectionValue}>R{section.totalValue.toLocaleString()}</Text>
                          </View>
                          <Text style={styles.sectionItemCount}>{section.totalItems} items</Text>
                          
                          {/* Render categories within this section */}
                          {section.categories.map((category, categoryIndex) => (
                            <View key={category.id} style={styles.categoryContainer}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryValue}>R{category.value.toLocaleString()}</Text>
                      </View>
                              <Text style={styles.categoryItemCount}>{category.items} items</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                    {typeIndex < survey.assessmentTypes.length - 1 && <Divider style={styles.divider} />}
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
    marginLeft: 16,
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e8f6ef',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  assessmentTypeSummary: {
    paddingVertical: 12,
  },
  assessmentTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  assessmentTypeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27ae60',
  },
  assessmentTypeItemCount: {
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
  sectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27ae60',
  },
  sectionItemCount: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  categoryContainer: {
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#ecf0f1',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7f8c8d',
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27ae60',
  },
  categoryItemCount: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 2,
  },
}); 