import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, Card, Divider, Checkbox, Switch } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../utils/logger';
import api from '../../api';
import { API_BASE_URL } from '../../constants/apiConfig';

// Define types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
}

interface RiskTemplate {
  riskassessmentid?: string;
  assessmentid?: number;
  assessmenttypeid?: number;
  assessmenttypename?: string;
  comments?: string;
  // ... other fields from the API response ...
}

type SurveyData = {
  surveyor: string;
  date: string;
  clientName: string;
  sumInsured: string;
  policyNo: string;
  address: string;
  email: string;
  broker: string;
  orderNumber: string;
  appointmentId: string;
  useHandwriting: boolean;
  consultant: string;
};

// Custom header component
const CustomHeader = () => {
  return (
    <View style={{backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center'}}>
      <Button onPress={() => router.back()} mode="text">Cancel</Button>
      <Text style={{flex: 1, textAlign: 'center', fontSize: 18}}>New Survey</Text>
      <View style={{width: 80}} />
    </View>
  );
};

// Helper function to fetch templates by order ID
const fetchTemplatesByOrderId = async (orderId: string): Promise<ApiResponse<RiskTemplate[]>> => {
  try {
    // Direct access to axios instance or fetch
    const baseUrl = API_BASE_URL;
    const endpoint = `${baseUrl}/risk-assessment-master/by-order/${orderId}`;
    
    console.log(`Direct API call to: ${endpoint}`);
    
    // Using fetch for direct API call
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Ensure we return an array, even if API returns different structure
    const templatesArray = Array.isArray(responseData) ? responseData : 
                          responseData.data && Array.isArray(responseData.data) ? responseData.data :
                          responseData.templates && Array.isArray(responseData.templates) ? responseData.templates : [];
    
    return {
      success: true,
      data: templatesArray,
      status: response.status
    };
  } catch (error) {
    console.error(`Error in direct API call: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch templates',
      status: 0
    };
  }
};

export default function NewSurveyScreen() {
  logNavigation('New Survey');
  const params = useLocalSearchParams();
  const initialLoad = useRef(true);
  
  // State for template data
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  // Initialize with params or empty values
  const [surveyData, setSurveyData] = useState<SurveyData>({
    surveyor: 'Nicole Ellis', // Current surveyor (would get from auth)
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    sumInsured: '',
    policyNo: '',
    address: '',
    email: '',
    broker: '',
    orderNumber: '',
    appointmentId: '',
    useHandwriting: false,
    consultant: '',
  });

  // Update survey data from URL params (appointment data)
  useEffect(() => {
    if (params && initialLoad.current) {
      initialLoad.current = false;
      
      const newData: Partial<SurveyData> = {};
      if (params.clientName) newData.clientName = params.clientName as string;
      if (params.address) newData.address = params.address as string;
      if (params.policyNo) newData.policyNo = params.policyNo as string;
      if (params.sumInsured) newData.sumInsured = params.sumInsured as string;
      if (params.broker) newData.broker = params.broker as string;
      if (params.orderNumber) newData.orderNumber = params.orderNumber as string;
      if (params.appointmentId) newData.appointmentId = params.appointmentId as string;
      
      if (Object.keys(newData).length > 0) {
        setSurveyData(prev => ({
          ...prev,
          ...newData
        }));
        
        // Check if we have an order number and fetch templates immediately
        if (newData.orderNumber) {
          console.log(`Order number ${newData.orderNumber} found in params, fetching templates now`);
          fetchTemplates(newData.orderNumber);
        }
      }
    }
  }, []);

  // Fetch templates on mount - only if we don't have an order number from params
  useEffect(() => {
    // Don't fetch templates here if we're getting them from params
    if (!params.orderNumber) {
      fetchTemplates();
    }
  }, []);

  // Fetch all available templates
  const fetchTemplates = async (orderNumberParam?: string) => {
    try {
      setLoading(true);
      setTemplateError(null);
      
      let response;
      
      const orderNumber = orderNumberParam || surveyData.orderNumber;
      
      if (orderNumber) {
        console.log(`Fetching templates for order: ${orderNumber}`);
        
        // Add detailed logging
        response = await fetchTemplatesByOrderId(orderNumber);
        console.log('Order-specific template response:', JSON.stringify(response, null, 2));
        
        if (!response.success || !response.data || response.data.length === 0) {
          console.log('Order-specific template fetch failed, falling back to general templates');
          response = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
          console.log('General template response:', JSON.stringify(response, null, 2));
        }
      } else {
        console.log('No order number available, fetching general templates');
        response = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
        console.log('General template response:', JSON.stringify(response, null, 2));
      }
      
      if (!response.success || !response.data || response.data.length === 0) {
        setTemplateError('Failed to load risk templates');
        return;
      }
      
      // Log the first template to see its structure
      if (response.data.length > 0) {
        console.log('First template structure:', JSON.stringify(response.data[0], null, 2));
      }
      
      const templatesArray = Array.isArray(response.data) ? response.data : [];
      console.log(`Loaded ${templatesArray.length} templates`);
      
      setTemplates(templatesArray);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplateError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof SurveyData, value: string | boolean) => {
    setSurveyData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Start survey with the selected template
  const startSurveyWithTemplate = (template: RiskTemplate) => {
    // Get the assessment ID using the correct field names
    const assessmentId = template.riskassessmentid || String(template.assessmentid);
    
    if (!assessmentId) {
      console.error('Invalid template: No assessmentId found', template);
      return;
    }
    
    console.log(`Starting survey with assessmentId: ${assessmentId} - ${template.assessmenttypename}`);
    
    // In a real app, save the survey data to local storage or API
    console.log('Starting survey:', { 
      assessmentId, 
      ...surveyData, 
      templateId: assessmentId,
      templateName: template.assessmenttypename
    });
    
    // Navigate to categories screen with the assessmentId
    router.push({
      pathname: '/survey/SectionsCategories',
      params: { riskassessmentid: assessmentId }
    });
  };

  // Render a template card with its own continue button
  const renderTemplateCard = (template: RiskTemplate, index: number) => {
    // Log the template object to see what we're getting
    console.log(`Rendering template ${index}:`, JSON.stringify(template, null, 2));
    
    // Get the template ID using the correct field names
    const templateId = template.riskassessmentid || String(template.assessmentid);
    if (!templateId) {
      console.error('Template missing ID:', template);
      return null;
    }
    
    // Get the template name using the correct field name
    const templateName = template.assessmenttypename;
    if (!templateName) {
      console.error('Template missing name:', template);
      return null;
    }
    
    return (
      <Card key={`template-card-${templateId}-${index}`} style={styles.templateCard}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={styles.templateTitle}>{templateName}</Text>
            <Button
              mode="contained"
              compact
              style={{ marginLeft: 12, paddingVertical: 0, paddingHorizontal: 10, minWidth: 0, height: 37, backgroundColor: '#4a90e2' }}
              labelStyle={{ fontSize: 18, color: '#fff' }}
              onPress={() => startSurveyWithTemplate(template)}
            >
              Continue
            </Button>
          </View>
          {template.comments && (
            <Text style={styles.templateDescription}>{template.comments}</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <CustomHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <Card style={styles.card}>
            <Card.Title 
              title="Survey Details" 
              left={(props) => <MaterialCommunityIcons name="clipboard-text" {...props} size={24} color="#4a90e2" />}
            />
            <Card.Content>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Surveyor</Text>
                <Text style={styles.prefilledText}>{surveyData.surveyor}</Text>
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Date</Text>
                <Text style={styles.prefilledText}>{surveyData.date}</Text>
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Order Number</Text>
                <Text style={styles.prefilledText}>{surveyData.orderNumber || 'Not specified'}</Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Client Information</Text>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Client Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter client name"
                  value={surveyData.clientName}
                  onChangeText={(text) => updateField('clientName', text)}
                  editable={!surveyData.clientName} // Disable if pre-filled
                />
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Sum Insured</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter sum insured"
                  keyboardType="default"
                  value={surveyData.sumInsured}
                  onChangeText={(text) => updateField('sumInsured', text)}
                  editable={!surveyData.sumInsured}
                />
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Policy No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter policy number"
                  value={surveyData.policyNo}
                  onChangeText={(text) => updateField('policyNo', text)}
                  editable={!surveyData.policyNo}
                />
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter address"
                  value={surveyData.address}
                  onChangeText={(text) => updateField('address', text)}
                  editable={!surveyData.address}
                  multiline
                />
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  value={surveyData.email}
                  onChangeText={(text) => updateField('email', text)}
                />
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Broker</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter broker name"
                  value={surveyData.broker}
                  onChangeText={(text) => updateField('broker', text)}
                  editable={!surveyData.broker}
                />
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Consultant</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter consultant name"
                  value={surveyData.consultant}
                  onChangeText={(text) => updateField('consultant', text)}
                />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Use Handwriting Recognition</Text>
                <Switch
                  value={surveyData.useHandwriting}
                  onValueChange={(value) => updateField('useHandwriting', value)}
                />
              </View>
            </Card.Content>
          </Card>
          
          {/* Risk Template Selection Section */}
          <Card style={styles.card}>
            <Card.Title 
              title="Risk Assessment Templates" 
              left={(props) => <MaterialCommunityIcons name="file-document-outline" {...props} size={24} color="#4a90e2" />}
            />
            <Card.Content>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4a90e2" />
                  <Text style={styles.loadingText}>Loading templates...</Text>
                </View>
              ) : templateError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{templateError}</Text>
                  <Button 
                    mode="outlined" 
                    onPress={() => fetchTemplates()}
                    style={styles.retryButton}
                  >
                    Retry
                  </Button>
                </View>
              ) : templates.length === 0 ? (
                <Text style={styles.noTemplatesText}>No templates available</Text>
              ) : (
                <View style={styles.templatesContainer}>
                  <Text style={styles.templatesInstructions}>
                    Select a template to continue aaa with:
                  </Text>
                  {templates.map(renderTemplateCard)}
                </View>
              )}
            </Card.Content>
          </Card>
          
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  prefilledText: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    color: '#555',
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#555',
  },
  spacer: {
    height: 100,
  },
  // Templates styles
  templatesContainer: {
    marginTop: 8,
  },
  templatesInstructions: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  templateCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  templateButton: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  noTemplatesText: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
}); 