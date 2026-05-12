import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { Card, Button, Divider, List, Chip } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import prefetchService from '../../../services/prefetchService';
import { PrefetchProgressIndicator } from '../../../components/PrefetchProgressIndicator';
import { appointmentDetailsStyles } from '../../GlobalStyles';
import { useAuth } from '../../../context/AuthContext';
import { formatDateTimeForSA } from '../../../utils/dateUtils';
import { formatZarCurrency } from '../../../utils/currencyFormat';
import { AppointmentSlaCompact } from '../../../components/sla/AppointmentSlaCompact';

// Import types for TypeScript support
import { ApiClient, ApiResponse, AppointmentData } from '../../../types/api';

// Cast the API client to the ApiClient interface to fix TypeScript errors
const typedApi = api as unknown as ApiClient;

function extractRiskTemplateNames(data: Record<string, unknown>): string[] {
  const raw = data.templates;
  if (!Array.isArray(raw)) return [];
  const names: string[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const n = o.TemplateName ?? o.templateName;
    const s = n != null ? String(n).trim() : '';
    if (s) names.push(s);
  }
  return names;
}

// Interface for appointment data
interface Appointment {
  id: string;
  appointmentId?: string;
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
  order_id?: string;
  location?: string;
  appointmentID?: number;
  orderID?: number | string;
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
  // SLA fields (Epic 2)
  sla_status?: string | null;
  sla_start_date?: string | null;
  sla_due_date?: string | null;
  surveyor_start_date?: string | null;
  surveyor_due_date?: string | null;
  surveyor_status?: string | null;
  completed_at?: string | null;
  riskTemplateNames?: string[];
}

export default function AppointmentDetails() {
  logNavigation('Appointment Details');
  const params = useLocalSearchParams();
  const { id } = params;
  const { isAuthenticated, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await typedApi.getAppointmentById(id.toString());
      if (response.success && response.data) {
        // Debug: Log the raw API response to see available fields
        console.log('🔍 Raw appointment API response size:', JSON.stringify(response.data).length, 'bytes');
        
        // Map API response to our Appointment interface
        const appointmentData: Appointment = {
          id: String(response.data.id || id),
          appointmentId: response.data.appointmentId ? String(response.data.appointmentId) : undefined,
          address: response.data.address || response.data.location || response.data.property_address || 'No address provided',
          client: response.data.client || response.data.clientName || 'Unknown client',
          phone: response.data.cell || response.data.phone || response.data.phoneNumber ||
                 response.data.Phone || response.data.PhoneNo || response.data.PhoneNumber ||
                 response.data.clientPhone || response.data.client_phone ||
                 response.data.ordersList?.clientCell || response.data.ordersList?.ClientCell ||
                 response.data.ordersList?.clientPhoneNo || response.data.ordersList?.ClientPhoneNo ||
                 response.data.ordersList?.clientPhone || response.data.ordersList?.Phone || 'N/A',
          email: response.data.email || response.data.emailAddress || response.data.Email || 
                 response.data.EmailAddress || response.data.clientEmail || response.data.client_email ||
                 response.data.ordersList?.clientEmail || response.data.ordersList?.Email || 'N/A',
          date: response.data.date || response.data.appointmentDate || response.data.startTime || new Date().toISOString(),
          policyNo: response.data.policyNo || response.data.policyNumber || 'N/A',
          sumInsured: String(response.data.sumInsured || 'N/A'),
          broker: response.data.broker || 'N/A',
          notes: response.data.notes || response.data.comments || 'No notes available',
          orderNumber: String(response.data.orderNumber || response.data.orderID || 'N/A'),
          riskTemplateNames: extractRiskTemplateNames(response.data as Record<string, unknown>),
          status: response.data.status,
          Invite_Status: response.data.Invite_Status,
          lastEdited: response.data.lastEdited,
          lastModified: response.data.lastModified,
          submitted: response.data.submitted,
          property_address: response.data.property_address,
          customer_name: response.data.customer_name,
          appointment_date: response.data.appointment_date,
          order_id: response.data.order_id ? String(response.data.order_id) : undefined,
          location: response.data.location,
          appointmentID: typeof response.data.appointmentID === 'number' ? response.data.appointmentID : undefined,
          orderID: response.data.orderID,
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
          originalOrder: response.data.originalOrder,
          // SLA fields: with-order returns them in ordersList when not at top level
          sla_status: response.data.sla_status ?? response.data.slaStatus ?? response.data.ordersList?.sla_status ?? response.data.ordersList?.slaStatus ?? null,
          sla_start_date: response.data.sla_start_date ?? response.data.slaStartDate ?? response.data.ordersList?.sla_start_date ?? response.data.ordersList?.slaStartDate ?? null,
          sla_due_date: response.data.sla_due_date ?? response.data.slaDueDate ?? response.data.ordersList?.sla_due_date ?? response.data.ordersList?.slaDueDate ?? null,
          surveyor_start_date: response.data.surveyor_start_date ?? response.data.surveyorStartDate ?? response.data.ordersList?.surveyor_start_date ?? response.data.ordersList?.surveyorStartDate ?? null,
          surveyor_due_date: response.data.surveyor_due_date ?? response.data.surveyorDueDate ?? response.data.ordersList?.surveyor_due_date ?? response.data.ordersList?.surveyorDueDate ?? null,
          surveyor_status: response.data.surveyor_status ?? response.data.surveyorStatus ?? response.data.ordersList?.surveyor_status ?? response.data.ordersList?.surveyorStatus ?? null,
          completed_at: response.data.completed_at ?? response.data.completedAt ?? response.data.ordersList?.completed_at ?? response.data.ordersList?.completedAt ?? null
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
  
  // Start prefetch when appointment data is loaded AND user is authenticated (never for Completed - do not load into SQLite)
  useEffect(() => {
    if (!appointment || !isAuthenticated || !user) {
      if (appointment && !isAuthenticated) {
        console.log(`⏳ Waiting for authentication before starting prefetch for appointment ${appointment.id}`);
      }
      return;
    }
    const status = (appointment.Invite_Status || appointment.inviteStatus || appointment.status || '').toString().toLowerCase();
    if (status === 'completed') {
      console.log(`⏭️ Skipping prefetch for completed appointment ${appointment.id} (completed appointments are not loaded into SQLite)`);
      return;
    }
    console.log(`🔐 User authenticated, starting prefetch for appointment ${appointment.id}, order ${appointment.orderNumber}`);
    const startPrefetch = async () => {
      try {
        const result = await prefetchService.startAppointmentPrefetch(appointment.id, appointment.orderNumber);
        console.log(`🔍 APPOINTMENT DETAILS - Prefetch result:`, result);
      } catch (error) {
        console.error(`❌ APPOINTMENT DETAILS - Prefetch error:`, error);
      }
    };
    startPrefetch();
  }, [appointment, isAuthenticated, user]);
  
  const startSurvey = () => {
    if (!appointment) return;
    
    // Navigate immediately
    router.push({
      pathname: '/survey/[id]',
      params: { 
        id: appointment.id?.toString(),
        appointmentId: appointment.appointmentID?.toString() || appointment.appointmentId?.toString() || appointment.id?.toString(),
        status: appointment.Invite_Status || appointment.inviteStatus || appointment.status || 'unknown',
        orderNumber: appointment.orderNumber || appointment.orderID?.toString(),
        clientName: appointment.client,
        address: appointment.address,
        policyNo: appointment.policyNo,
        sumInsured: appointment.sumInsured,
        broker: appointment.broker
      }
    });

    // Update status in the background
    // @ts-ignore - this method exists in the API
    api.updateAppointment(appointment.id, {
      inviteStatus: 'In-Progress'
    }).catch((error: Error) => {
      console.error('Error updating appointment status:', error);
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
        <View style={[appointmentDetailsStyles.container, appointmentDetailsStyles.centered]}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={appointmentDetailsStyles.loadingText}>Loading appointment details...</Text>
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
        <View style={[appointmentDetailsStyles.container, appointmentDetailsStyles.centered]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={appointmentDetailsStyles.errorText}>{error || 'Appointment not found'}</Text>
          <Button mode="contained" style={appointmentDetailsStyles.actionButton} onPress={() => router.back()}>
            Go Back
          </Button>
          {error && (
            <Button 
              mode="outlined" 
              style={appointmentDetailsStyles.retryButton} 
              onPress={fetchAppointmentDetails}
            >
              Retry
            </Button>
          )}
        </View>
      </>
    );
  }
  
  // Format date and time from UTC date string
  const { date: formattedDate, time: formattedTime } = formatDateTimeForSA(appointment.date);

  const openInMaps = async () => {
    const addr = (appointment.address || '').trim();
    if (!addr) {
      console.warn('[AppointmentDetails] No address to open in maps');
      return;
    }

    const openUrl = async (url: string) => {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Maps', 'That app may not be installed. Try another option.');
        }
      } catch (e) {
        console.warn('[AppointmentDetails] openURL failed', e, url);
        Alert.alert('Maps', 'Could not open maps.');
      }
    };

    // Android: geo intent shows the system chooser (Google Maps, Waze, etc.)
    if (Platform.OS === 'android') {
      const geo = `geo:0,0?q=${encodeURIComponent(addr)}`;
      try {
        await Linking.openURL(geo);
      } catch (e) {
        console.warn('[AppointmentDetails] geo intent failed', e);
        Alert.alert('Maps', 'Could not open maps.');
      }
      return;
    }

    if (Platform.OS === 'ios' && ActionSheetIOS) {
      const q = encodeURIComponent(addr);
      const appleMaps = `http://maps.apple.com/?q=${q}`;
      const googleMaps = `comgooglemaps://?q=${q}`;
      const waze = `waze://?q=${encodeURIComponent(addr)}`;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Apple Maps', 'Google Maps', 'Waze', 'Cancel'],
          cancelButtonIndex: 3
        },
        (buttonIndex) => {
          if (buttonIndex === 3) return;
          const urls = [appleMaps, googleMaps, waze];
          void openUrl(urls[buttonIndex]);
        }
      );
      return;
    }

    // Web / unknown: browser maps
    await openUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Appointment Details',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={appointmentDetailsStyles.container}>
        <ScrollView style={appointmentDetailsStyles.scrollView}>
          {/* Prefetch Progress Indicator */}
          <PrefetchProgressIndicator />

          {/* Client Information and Appointment Details in a row */}
          <View style={appointmentDetailsStyles.rowContainer}>
            {/* Client Information */}
            <Card style={[appointmentDetailsStyles.card, appointmentDetailsStyles.halfWidth]}>
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
            <Card style={[appointmentDetailsStyles.card, appointmentDetailsStyles.halfWidth]}>
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
                  description={formatZarCurrency(appointment.sumInsured)}
                  left={props => <List.Icon {...props} icon="cash-multiple" />}
                />
                <Divider />
                <List.Item
                  title="Broker"
                  description={appointment.broker}
                  left={props => <List.Icon {...props} icon="account-tie" />}
                />
              </Card.Content>
            </Card>
          </View>

          {appointment.riskTemplateNames && appointment.riskTemplateNames.length > 0 && (
            <View style={appointmentDetailsStyles.templatesSection}>
              <Card style={appointmentDetailsStyles.templatesCard}>
                <Card.Title
                  title="Assessment Types"
                  left={(props) => (
                    <MaterialCommunityIcons name="file-document-multiple-outline" {...props} size={22} color="#4a90e2" />
                  )}
                />
                <Card.Content style={appointmentDetailsStyles.templatesChipRow}>
                  {appointment.riskTemplateNames.map((name, idx) => (
                    <Chip
                      key={`${name}-${idx}`}
                      mode="outlined"
                      compact
                      style={appointmentDetailsStyles.templateChip}
                      textStyle={appointmentDetailsStyles.templateChipText}
                    >
                      {name}
                    </Chip>
                  ))}
                </Card.Content>
              </Card>
            </View>
          )}

          {/* Combined compact SLA summary (surveyor 5d + order 10d) */}
          <AppointmentSlaCompact
            surveyorStatus={appointment.surveyor_status}
            surveyorDueDate={appointment.surveyor_due_date}
            surveyorStartDate={appointment.surveyor_start_date}
            slaStatus={appointment.sla_status}
            slaDueDate={appointment.sla_due_date}
            slaStartDate={appointment.sla_start_date}
            completedAt={appointment.completed_at}
          />
          
          {/* Location — open in device maps (no API key) */}
          <View style={appointmentDetailsStyles.mapContainer}>
            <Text style={appointmentDetailsStyles.sectionTitle}>Location</Text>
            <Card style={appointmentDetailsStyles.mapCard}>
              <Card.Content style={appointmentDetailsStyles.locationCardContent}>
                <View style={appointmentDetailsStyles.locationAddressRow}>
                  <MaterialCommunityIcons name="map-marker" size={22} color="#4a90e2" />
                  <Text style={appointmentDetailsStyles.locationAddressText}>
                    {appointment.address || 'No address provided'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={appointmentDetailsStyles.openMapsButton}
                  onPress={openInMaps}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="directions" size={20} color="#fff" />
                  <Text style={appointmentDetailsStyles.openMapsButtonText}>Open in Maps</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
        
        <View style={appointmentDetailsStyles.buttonContainer}>
          <View style={appointmentDetailsStyles.buttonRow}>
            <Button
              mode="outlined"
              style={appointmentDetailsStyles.rescheduleButton}
              icon="calendar-clock"
              onPress={() => router.back()}
            >
              Reschedule
            </Button>
            <Button
              mode="contained"
              style={appointmentDetailsStyles.startButton}
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

