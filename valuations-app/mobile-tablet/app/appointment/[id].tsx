import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Card, Button, Divider, List } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../utils/logger';
import api from '../../api';
import prefetchService from '../../services/prefetchService';
import { PrefetchProgressIndicator, PrefetchStatusBadge } from '../../components/PrefetchProgressIndicator';

// Import types for TypeScript support
import { ApiClient, ApiResponse, AppointmentData } from '../../types/api';

// Cast the API client to the ApiClient interface to fix TypeScript errors
const typedApi = api as unknown as ApiClient;

// Interface for appointment data
interface Appointment {
  id: string;
  address: string;
  client: string;
  phone: string;
  email: string;
  date: string;
  policyNo: string;
  sumInsured: string;
  broker: string;
  notes: string;
  orderNumber: string;
  [key: string]: any; // For any additional properties from API
}

// Fallback mock data in case API fails
const fallbackData: Record<string, Appointment> = {
  '1001': { 
    id: '1001',
    address: '123 Main St', 
    client: 'M.R. Gumede',
    phone: '(011) 555-1234',
    email: 'mr.gumede@example.com',
    date: '2024-04-30 09:00',
    policyNo: 'K 82 mil',
    sumInsured: 'R 3 mil',
    broker: 'Discovery',
    notes: 'Client has valuable artwork and antiques that need special attention.',
    orderNumber: 'ORD-2024-1001'
  },
  '1002': { 
    id: '1002',
    address: '456 Oak Ave',
    client: 'T. Mbatha',
    phone: '(011) 555-5678',
    email: 't.mbatha@example.com',
    date: '2024-05-02 14:00',
    policyNo: 'P 56 mil',
    sumInsured: 'R 2.5 mil',
    broker: 'Liberty',
    notes: 'Recent renovation, new kitchen appliances.',
    orderNumber: 'ORD-2024-1002'
  }
};

export default function AppointmentDetails() {
  logNavigation('Appointment Detail');
  const params = useLocalSearchParams();
  const { id } = params;
  
  // Convert ID string to handle potential index offset (0 -> 1)
  const rawAppointmentId = id as string;
  const appointmentId = rawAppointmentId === '0' ? '1' : rawAppointmentId;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefetchStarted, setPrefetchStarted] = useState(false);
  
  useEffect(() => {
    console.log(`Loading appointment details for ID: ${appointmentId} (original ID: ${rawAppointmentId})`);
    fetchAppointmentDetails();
  }, [appointmentId]);
  
  // Start prefetching when appointment is successfully loaded
  useEffect(() => {
    if (appointment && !prefetchStarted) {
      startPrefetching();
    }
  }, [appointment, prefetchStarted]);
  
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use API client to get appointment by ID
      const response = await typedApi.getAppointmentById(appointmentId);
      
      if (response && response.success && response.data) {
        console.log(`Successfully fetched details for appointment ${appointmentId}`);
        
        // Extract client name from either top-level properties or ordersList
        let clientName = 'Unknown client';
        if (response.data.client) {
          clientName = response.data.client;
        } else if (response.data.clientsName) {
          clientName = response.data.clientsName;
        } else if (response.data.Client) {
          clientName = response.data.Client;
        } else if (response.data.ordersList && response.data.ordersList.client) {
          clientName = response.data.ordersList.client;
        } else if (response.data.ordersList && response.data.ordersList.clientsName) {
          clientName = response.data.ordersList.clientsName;
        }
        
        // Map API response to our Appointment interface
        const appointmentData: Appointment = {
          id: response.data.id || response.data.appointmentId || appointmentId,
          address: response.data.address || response.data.location || response.data.FullAddress || 'Unknown address',
          client: clientName,
          phone: response.data.phoneNumber || response.data.phone || response.data.Phone || 'N/A',
          email: response.data.emailAddress || response.data.email || response.data.Email || 'N/A',
          date: response.data.date || response.data.appointmentDate || response.data.startTime || response.data.Start_Time || new Date().toISOString().split('T')[0] + ' 09:00',
          policyNo: response.data.policyNumber || response.data.policyNo || (response.data.ordersList?.policy ? String(response.data.ordersList.policy) : 'N/A'),
          sumInsured: response.data.sumInsured ? String(response.data.sumInsured) : response.data['Sum Insured'] ? String(response.data['Sum Insured']) : (response.data.ordersList?.sumInsured ? String(response.data.ordersList.sumInsured) : 'N/A'),
          broker: response.data.broker || response.data.Broker || (response.data.ordersList?.broker) || 'N/A',
          notes: response.data.notes || response.data.Comments || response.data.comments || 'No notes available',
          orderNumber: response.data.orderNumber ? String(response.data.orderNumber) : response.data.OrderID ? String(response.data.OrderID) : response.data.orderID ? String(response.data.orderID) : (response.data.ordersList?.orderid ? String(response.data.ordersList.orderid) : 'N/A'),
        };
        
        setAppointment(appointmentData);
      } else {
        console.error(`Failed to load appointment ${appointmentId}:`, response?.message || 'Unknown error');
        setError('Failed to load appointment. Using fallback data.');
        
        // Check if fallback data is available for this ID
        if (fallbackData[appointmentId]) {
          setAppointment(fallbackData[appointmentId]);
        } else {
          // No fallback data for this specific ID
          setError('Appointment not found. Please check the appointment ID.');
          setAppointment(null);
        }
      }
    } catch (err) {
      console.error(`Error fetching appointment ${appointmentId}:`, err);
      setError('Error loading appointment. Using fallback data.');
      
      // Check if fallback data is available for this ID
      if (fallbackData[appointmentId]) {
        setAppointment(fallbackData[appointmentId]);
      } else {
        // No fallback data for this specific ID
        setError('Appointment not found. Please check the appointment ID.');
        setAppointment(null);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const startPrefetching = async () => {
    setPrefetchStarted(true);
    console.log('🚀 Starting prefetch for appointment:', appointment?.id);
    
    try {
      const success = await prefetchService.startAppointmentPrefetch(
        appointment!.id,
        appointment!.orderNumber !== 'N/A' ? appointment!.orderNumber : undefined
      );
      
      if (success) {
        console.log('✅ Prefetch started successfully');
      } else {
        console.log('❌ Failed to start prefetch');
      }
    } catch (error) {
      console.error('❌ Error starting prefetch:', error);
    }
  };
  
  const startSurvey = () => {
    if (!appointment) return;
    
    // Navigate to survey with pre-populated client data
    router.push({
      pathname: '/survey/new',
      params: { 
        clientName: appointment.client,
        address: appointment.address,
        policyNo: appointment.policyNo,
        sumInsured: appointment.sumInsured,
        broker: appointment.broker,
        appointmentId: appointment.id,
        orderNumber: appointment.orderNumber
      }
    });
  };
  
  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Appointment Details',
            headerTitleStyle: { fontWeight: '600' }
          }}
        />
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading appointment details...</Text>
        </View>
      </>
    );
  }
  
  if (error || !appointment) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Appointment Details',
            headerTitleStyle: { fontWeight: '600' }
          }}
        />
        <View style={[styles.container, styles.centered]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>{error || 'Appointment not found'}</Text>
          <Button mode="contained" style={styles.actionButton} onPress={() => router.back()}>
            Go Back
          </Button>
          {error && (
            <Button 
              mode="outlined" 
              style={styles.retryButton} 
              onPress={fetchAppointmentDetails}
            >
              Retry
            </Button>
          )}
        </View>
      </>
    );
  }
  
  const formattedDate = appointment.date.split(' ')[0];
  const formattedTime = appointment.date.split(' ')[1];
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Appointment Details',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Card style={styles.mainCard}>
            <Card.Content>
              <View style={styles.headerRow}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#4a90e2" />
                <Text style={styles.addressText}>{appointment.address}</Text>
              </View>
              
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateBox}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#7f8c8d" />
                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>
                <View style={styles.dateBox}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#7f8c8d" />
                  <Text style={styles.dateText}>{formattedTime}</Text>
                </View>
              </View>
              
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Client Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Client Name:</Text>
                <Text style={styles.infoValue}>{appointment.client}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{appointment.phone}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{appointment.email}</Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Policy Details</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Policy No:</Text>
                <Text style={styles.infoValue}>{appointment.policyNo}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sum Insured:</Text>
                <Text style={styles.infoValue}>{appointment.sumInsured}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Broker:</Text>
                <Text style={styles.infoValue}>{appointment.broker}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order No:</Text>
                <Text style={styles.infoValue}>{appointment.orderNumber}</Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.notesContainer}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{appointment.notes}</Text>
              </View>
            </Card.Content>
          </Card>
          
          {/* Prefetch Progress Indicator */}
          <PrefetchProgressIndicator />
          
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Card style={styles.mapCard}>
              <Card.Content style={styles.mapContent}>
                <Image 
                  source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=' + 
                    encodeURIComponent(appointment.address) + 
                    '&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C' + 
                    encodeURIComponent(appointment.address) + 
                    '&key=YOUR_API_KEY' }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.mapButton}>
                  <MaterialCommunityIcons name="directions" size={20} color="#fff" />
                  <Text style={styles.mapButtonText}>Get Directions</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <PrefetchStatusBadge style={styles.prefetchBadge} />
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              style={styles.rescheduleButton}
              icon="calendar-clock"
              onPress={() => router.back()}
            >
              Reschedule
            </Button>
            <Button
              mode="contained"
              style={styles.startButton}
              icon="clipboard-edit-outline"
              onPress={startSurvey}
            >
              Start Survey
            </Button>
          </View>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    borderRadius: 10,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
    flex: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
    borderColor: '#3498db',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  notesContainer: {
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  mapContainer: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  mapCard: {
    overflow: 'hidden',
    borderRadius: 10,
    padding: 0,
  },
  mapContent: {
    padding: 0,
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  mapButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mapButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rescheduleButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#3498db',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: '#4a90e2',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  prefetchBadge: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
}); 