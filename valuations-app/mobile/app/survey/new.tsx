import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, Card, Divider, Checkbox, Switch } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export default function NewSurveyScreen() {
  const params = useLocalSearchParams();
  const initialLoad = useRef(true);
  
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
      }
    }
  }, []);

  const updateField = (field: keyof SurveyData, value: string | boolean) => {
    setSurveyData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Redirect to category selection screen with survey ID
    const surveyId = 'SRV-' + Date.now();
    
    // In a real app, save the survey data to local storage or API
    console.log('Saving survey:', { id: surveyId, ...surveyData });
    
    router.push({
      pathname: '/survey/categories',
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
              Continue to Inventory
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