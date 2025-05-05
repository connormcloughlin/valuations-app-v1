import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, Card, Divider, Checkbox, Switch } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../utils/logger';
import api from '../../api';

// Define types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
}

interface RiskTemplate {
  id?: string;
  risktemplateid?: string;
  templateid?: string;
  name?: string;
  templatename?: string;
  description?: string;
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
  selectedTemplate?: RiskTemplate | null;
};

export default function NewSurveyScreen() {
  logNavigation('New Survey');
  const params = useLocalSearchParams();
  const initialLoad = useRef(true);
  
  // State for template data
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
    selectedTemplate: null,
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
      }
    }
  }, []);

  // Fetch default template on mount
  useEffect(() => {
    fetchDefaultTemplate();
  }, []);

  // Fetch default template (first one)
  const fetchDefaultTemplate = async () => {
    try {
      setLoading(true);
      setTemplateError(null);
      
      const response = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
      
      if (!response.success || !response.data || response.data.length === 0) {
        setTemplateError('Failed to load default template');
        return;
      }
      
      // Use the first template as default
      const defaultTemplate = response.data[0];
      console.log('Using default template:', defaultTemplate.templatename || defaultTemplate.name);
      
      setSurveyData(prev => ({
        ...prev,
        selectedTemplate: defaultTemplate
      }));
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplateError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof SurveyData, value: string | boolean | RiskTemplate | null) => {
    setSurveyData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Navigate to template selection screen
  const navigateToTemplates = () => {
    // Just navigate to templates screen
    router.push('/survey/templates');
  };

  const handleSave = () => {
    // Redirect to templates selection screen with survey ID
    const surveyId = 'SRV-' + Date.now();
    
    // In a real app, save the survey data to local storage or API
    console.log('Saving survey:', { id: surveyId, ...surveyData });
    
    // If we already have a selected template, skip the template selection screen
    if (surveyData.selectedTemplate) {
      const templateId = surveyData.selectedTemplate.risktemplateid || 
                         surveyData.selectedTemplate.templateid || 
                         surveyData.selectedTemplate.id;
      
      if (templateId) {
        router.push({
          pathname: '/survey/categories',
          params: { 
            surveyId,
            useHandwriting: surveyData.useHandwriting ? '1' : '0',
            templateId: templateId.toString()
          }
        });
        return;
      }
    }
    
    // If no template is selected, go to template selection
    router.push({
      pathname: '/survey/templates',
      params: { 
        surveyId,
        useHandwriting: surveyData.useHandwriting ? '1' : '0'
      }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Survey',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <Button
              onPress={() => router.back()}
              mode="text"
            >
              Cancel
            </Button>
          ),
        }}
      />

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
                <Text style={styles.fieldLabel}>Risk Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter property address"
                  value={surveyData.address}
                  onChangeText={(text) => updateField('address', text)}
                  multiline
                  editable={!surveyData.address}
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
              
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Risk Assessment Template</Text>
              
              {loading ? (
                <View style={styles.templateLoading}>
                  <Text style={styles.templateLoadingText}>Loading templates...</Text>
                </View>
              ) : templateError ? (
                <View style={styles.templateError}>
                  <Text style={styles.errorText}>{templateError}</Text>
                  <Button mode="text" onPress={fetchDefaultTemplate}>Retry</Button>
                </View>
              ) : (
                <View style={styles.templateContainer}>
                  <View style={styles.selectedTemplateCard}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color="#4a90e2" />
                    <Text style={styles.selectedTemplateName}>
                      {surveyData.selectedTemplate 
                        ? (surveyData.selectedTemplate.templatename || surveyData.selectedTemplate.name) 
                        : 'No template selected'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.changeTemplateButton}
                    onPress={navigateToTemplates}
                  >
                    <Text style={styles.changeTemplateText}>Change Template</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Survey Preferences</Text>
              
              <View style={styles.optionRow}>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Use Handwriting Input</Text>
                  <Text style={styles.optionDescription}>
                    Use stylus to write item descriptions and convert to text
                  </Text>
                </View>
                <Switch
                  value={surveyData.useHandwriting}
                  onValueChange={(value) => updateField('useHandwriting', value)}
                  color="#4a90e2"
                />
              </View>
            </Card.Content>
          </Card>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!surveyData.clientName || !surveyData.address}
            >
              {surveyData.selectedTemplate 
                ? 'Continue to Inventory' 
                : 'Select Template'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    color: '#2c3e50',
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  prefilledText: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f6fa',
    color: '#34495e',
    paddingTop: 12,
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  templateContainer: {
    marginBottom: 16,
  },
  selectedTemplateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedTemplateName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#34495e',
    flex: 1,
  },
  changeTemplateButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  changeTemplateText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '500',
  },
  templateLoading: {
    padding: 12,
    alignItems: 'center',
  },
  templateLoadingText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  templateError: {
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  saveButton: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
  },
}); 