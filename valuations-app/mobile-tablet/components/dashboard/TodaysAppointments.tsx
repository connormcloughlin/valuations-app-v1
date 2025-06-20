import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appointmentsApi from '../../api/appointments';
import { storeDataForKey, getDataForKey } from '../../utils/offlineStorage';

interface Appointment {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  status?: string;
  Invite_Status?: string;
}

interface TodaysAppointmentsProps {
  onAppointmentPress: (id: string) => void;
}

export const TodaysAppointments: React.FC<TodaysAppointmentsProps> = ({ onAppointmentPress }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  const fetchTodaysAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create today's date range
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Format dates to ISO string format
      const startDateFrom = startOfDay.toISOString();
      const startDateTo = endOfDay.toISOString();
      
      // Create cache key for today's appointments
      const cacheKey = `todays_appointments_${today.toDateString()}`;
      
      // Check cache first
      console.log('📦 Checking cache for today\'s appointments...');
      const cachedData = await getDataForKey(cacheKey);
      if (cachedData && cachedData.data) {
        console.log('✅ Using cached today\'s appointments data');
        setAppointments(cachedData.data);
        setLoading(false);
        // Continue to fetch fresh data in background
      }
      
      console.log('Fetching today\'s appointments:', { startDateFrom, startDateTo });
      
      // Fetch appointments using the list-view endpoint with date filtering
      const response = await appointmentsApi.getAppointmentsByListView({
        page: 1,
        pageSize: 50, // Get more appointments to ensure we don't miss any
        status: 'Booked', // Default to booked appointments
        surveyor: '', // Add empty surveyor parameter
        startDateFrom,
        startDateTo
      });
      
      if ((response as any).success && Array.isArray((response as any).data)) {
        // Map the response data to our interface
        const todaysAppointments: Appointment[] = (response as any).data.map((appointment: any) => ({
          id: appointment.id || appointment.appointmentId,
          address: appointment.address || appointment.fullAddress || 'No address provided',
          client: appointment.client || 'Unknown client',
          date: appointment.date || new Date().toISOString(),
          policyNo: appointment.policyNo || appointment.policyNumber || 'No policy',
          status: appointment.status,
          Invite_Status: appointment.Invite_Status
        }));
        
        console.log(`Found ${todaysAppointments.length} appointments for today`);
        setAppointments(todaysAppointments);
        
        // Cache the fresh data
        console.log('💾 Caching today\'s appointments data...');
        await storeDataForKey(cacheKey, todaysAppointments);
      } else {
        console.warn('No appointments found for today or API call failed:', response);
        setAppointments([]);
      }
    } catch (err: any) {
      setError('Failed to load today\'s appointments');
      console.error('Error fetching today\'s appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTodaysAppointments();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return 'Time TBD';
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        <Text style={styles.loadingMessage}>Loading appointments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Card style={styles.retryCard} onPress={handleRefresh}>
          <Card.Content>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Today's Appointments</Text>
      {appointments.length > 0 ? (
        appointments.map(appointment => (
          <Card 
            key={appointment.id} 
            style={styles.appointmentCard}
            onPress={() => onAppointmentPress(appointment.id)}
          >
            <Card.Content>
              <View style={styles.appointmentItem}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#4a90e2" />
                <View style={styles.appointmentContent}>
                  <Text style={styles.appointmentAddress}>{appointment.address}</Text>
                  <Text style={styles.appointmentDetails}>
                    {appointment.client} • {formatTime(appointment.date)}
                  </Text>
                  <Text style={styles.policyText}>Policy: {appointment.policyNo}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyMessage}>No appointments scheduled for today</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  appointmentCard: {
    borderRadius: 12,
    marginBottom: 10,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  appointmentContent: {
    marginLeft: 15,
    flex: 1,
    backgroundColor: 'transparent',
  },
  appointmentAddress: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  policyText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 1,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 15,
  },
  loadingMessage: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    padding: 15,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 14,
    padding: 15,
  },
  retryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
  },
}); 