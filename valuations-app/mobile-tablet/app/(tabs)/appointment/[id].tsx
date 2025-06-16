import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Card, Button, Divider, List } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import prefetchService from '../../../services/prefetchService';
import { PrefetchProgressIndicator, PrefetchStatusBadge } from '../../../components/PrefetchProgressIndicator';

// Import types for TypeScript support
import { ApiClient, ApiResponse, AppointmentData } from '../../../types/api';

// Cast the API client to the ApiClient interface to fix TypeScript errors
const typedApi = api as unknown as ApiClient;

// Interface for appointment data
interface Appointment {
  id: string | number;
  appointmentId?: string | number;
  address: string;
  client?: string;
  clientName?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  emailAddress?: string;
  date?: string;
  appointmentDate?: string;
  policyNo?: string;
  policyNumber?: string;
  sumInsured?: string;
  broker?: string;
  notes?: string;
  orderNumber?: string;
  status?: string;
  Invite_Status?: string;
  lastEdited?: string;
  lastModified?: string;
  submitted?: string;
  property_address?: string;
  customer_name?: string;
  appointment_date?: string;
  order_id?: string | number;
  location?: string;
  appointmentID?: number;
  orderID?: string | number;
  startTime?: string;
  endTime?: string;
  followUpDate?: string | null;
  arrivalTime?: string | null;
  departureTime?: string | null;
  inviteStatus?: string | null;
  meetingStatus?: string | null;
  comments?: string;
  category?: string;
  outoftown?: string;
  surveyorComments?: string | null;
  eventId?: string | null;
  surveyorEmail?: string | null;
  dateModified?: string | null;
  ordersList?: any;
  originalAppointment?: any;
  originalOrder?: any;
}

export default function AppointmentDetails() {
  logNavigation('Appointment Details');
  const params = useLocalSearchParams();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await typedApi.getAppointmentById(id.toString());
      if (response.success && response.data) {
        // Map API response to our Appointment interface
        const appointmentData: Appointment = {
          id: typeof response.data.id === 'string' ? response.data.id : String(response.data.id || id),
          appointmentId: typeof response.data.appointmentId === 'string' ? response.data.appointmentId : String(response.data.appointmentId),
          address: response.data.address || response.data.location || response.data.property_address || 'No address provided',
          client: response.data.client || response.data.clientName || 'Unknown client',
          phone: response.data.phone || response.data.phoneNumber || 'N/A',
          email: response.data.email || response.data.emailAddress || 'N/A',
          date: response.data.date || response.data.appointmentDate || response.data.startTime || new Date().toISOString(),
          policyNo: response.data.policyNo || response.data.policyNumber || 'N/A',
          sumInsured: response.data.sumInsured || 'N/A',
          broker: response.data.broker || 'N/A',
          notes: response.data.notes || response.data.comments || 'No notes available',
          orderNumber: response.data.orderNumber || String(response.data.orderID || 'N/A'),
          status: response.data.status,
          Invite_Status: response.data.Invite_Status,
          lastEdited: response.data.lastEdited,
          lastModified: response.data.lastModified,
          submitted: response.data.submitted,
          property_address: response.data.property_address,
          customer_name: response.data.customer_name,
          appointment_date: response.data.appointment_date,
          order_id: response.data.order_id ? (typeof response.data.order_id === 'string' ? response.data.order_id : String(response.data.order_id)) : undefined,
          location: response.data.location,
          appointmentID: typeof response.data.appointmentID === 'number' ? response.data.appointmentID : undefined,
          orderID: response.data.orderID ? (typeof response.data.orderID === 'number' ? response.data.orderID : String(response.data.orderID)) : undefined,
          startTime: response.data.startTime,
          endTime: response.data.endTime,
          followUpDate: response.data.followUpDate,
          arrivalTime: response.data.arrivalTime,
          departureTime: response.data.departureTime,
          inviteStatus: response.data.inviteStatus,
          meetingStatus: response.data.meetingStatus,
          comments: response.data.comments,
          category: response.data.category,
          outoftown: response.data.outoftown,
          surveyorComments: response.data.surveyorComments,
          eventId: response.data.eventId,
          surveyorEmail: response.data.surveyorEmail,
          dateModified: response.data.dateModified,
          ordersList: response.data.ordersList,
          originalAppointment: response.data.originalAppointment,
          originalOrder: response.data.originalOrder
        };
        setAppointment(appointmentData);
      } else {
        setError('Failed to fetch appointment details');
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Failed to fetch appointment details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);
  
  const startSurvey = () => {
    if (!appointment) return;
    
    // Navigate to survey with pre-populated client data
    router.push({
      pathname: '/(tabs)/new-survey',
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
  
  const formattedDate = appointment.date?.split(' ')[0] || '';
  const formattedTime = appointment.date?.split(' ')[1] || '';
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Appointment Details',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Client Information */}
          <Card style={styles.card}>
            <Card.Title 
              title="Client Information" 
              left={(props) => <MaterialCommunityIcons name="account" {...props} size={24} color="#4a90e2" />}
            />
            <Card.Content>
              <List.Item
                title="Client Name"
                description={appointment.client}
                left={props => <List.Icon {...props} icon="account" />}
              />
              <Divider />
              <List.Item
                title="Phone"
                description={appointment.phone}
                left={props => <List.Icon {...props} icon="phone" />}
              />
              <Divider />
              <List.Item
                title="Email"
                description={appointment.email}
                left={props => <List.Icon {...props} icon="email" />}
              />
            </Card.Content>
          </Card>
          
          {/* Appointment Details */}
          <Card style={styles.card}>
            <Card.Title 
              title="Appointment Details" 
              left={(props) => <MaterialCommunityIcons name="calendar-clock" {...props} size={24} color="#4a90e2" />}
            />
            <Card.Content>
              <List.Item
                title="Date"
                description={formattedDate}
                left={props => <List.Icon {...props} icon="calendar" />}
              />
              <Divider />
              <List.Item
                title="Time"
                description={formattedTime}
                left={props => <List.Icon {...props} icon="clock-outline" />}
              />
              <Divider />
              <List.Item
                title="Policy Number"
                description={appointment.policyNo}
                left={props => <List.Icon {...props} icon="file-document-outline" />}
              />
              <Divider />
              <List.Item
                title="Sum Insured"
                description={appointment.sumInsured}
                left={props => <List.Icon {...props} icon="currency-usd" />}
              />
              <Divider />
              <List.Item
                title="Broker"
                description={appointment.broker}
                left={props => <List.Icon {...props} icon="account-tie" />}
              />
            </Card.Content>
          </Card>
          
          {/* Location */}
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
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  mapContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  mapCard: {
    borderRadius: 8,
    overflow: 'hidden',
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