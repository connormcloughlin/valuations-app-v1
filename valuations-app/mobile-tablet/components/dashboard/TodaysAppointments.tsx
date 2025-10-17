import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appointmentsApi from '../../api/appointments';
import { storeDataForKey, getDataForKey, removeDataForKey } from '../../utils/offlineStorage';
import { todaysAppointmentsStyles } from '../../app/GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import connectionUtils from '../../utils/connectionUtils';

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
  shouldFetchData?: boolean; // Add prop to control when to fetch data
  forceReload?: boolean; // Add prop to force reload from API
}

export const TodaysAppointments: React.FC<TodaysAppointmentsProps> = ({ onAppointmentPress, shouldFetchData = true, forceReload = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a ref to track if appointments have been fetched to prevent duplicate calls
  const appointmentsFetchedRef = useRef(false);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (isLoading) {
      console.log('⏳ Auth still loading, waiting...');
      setLoading(false);
      return;
    }

    // Only fetch appointments if user is authenticated, auth loading is complete, appointments haven't been fetched yet, and shouldFetchData is true
    if (isAuthenticated && user && !isLoading && !appointmentsFetchedRef.current && shouldFetchData) {
      console.log('🔐 User authenticated, fetching today\'s appointments...');
      appointmentsFetchedRef.current = true;
      fetchTodaysAppointments();
    } else if (!isAuthenticated || !user) {
      console.log('⏳ Waiting for authentication before fetching today\'s appointments...');
      setLoading(false);
      appointmentsFetchedRef.current = false; // Reset when user logs out
    } else if (!shouldFetchData) {
      console.log('⏸️ Data fetching disabled for TodaysAppointments component');
      setLoading(false);
    }
  }, [isAuthenticated, user, isLoading]);

  // Handle force reload when forceReload prop changes
  useEffect(() => {
    if (forceReload && isAuthenticated && user && !isLoading && shouldFetchData) {
      console.log('🔄 Force reload triggered for TodaysAppointments');
      appointmentsFetchedRef.current = false; // Allow fetching again
      fetchTodaysAppointments();
    }
  }, [forceReload, isAuthenticated, user, isLoading, shouldFetchData]);

  // Don't render anything if auth is still loading, not authenticated, or data fetching is disabled
  if (isLoading || !isAuthenticated || !user || !shouldFetchData) {
    return null;
  }

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
      
      // Check if we're online and if force reload is requested
      const isOnline = await connectionUtils.getStatus();
      
      // If force reload is requested and we're online, clear cache
      if (forceReload && isOnline) {
        console.log('🔄 Force reload requested and online - clearing cache for today\'s appointments');
        await removeDataForKey(cacheKey);
      }
      
      // Check cache first (only if not force reloading or offline)
      if (!forceReload) {
        console.log('📦 Checking cache for today\'s appointments...');
        const cachedData = await getDataForKey(cacheKey);
        if (cachedData && cachedData.data) {
          console.log('✅ Using cached today\'s appointments data');
          setAppointments(cachedData.data);
          setLoading(false);
          return; // Exit early if we have valid cached data
        }
      }
      
      // If offline and no cache, show error
      if (!isOnline && !forceReload) {
        console.log('📱 Offline - no cached data available for today\'s appointments');
        setError('No internet connection. Please check your network and try again.');
        setLoading(false);
        return;
      }
      
      const requestParams = {
        page: 1,
        pageSize: 50, // Get more appointments to ensure we don't miss any
        status: 'Booked', // Default to booked appointments
        surveyor: '', // Add empty surveyor parameter
        startDateFrom,
        startDateTo
      };
      
      console.log('🏠 TodaysAppointments calling getAppointmentsByListView with:', requestParams);
      
      // Fetch appointments using the list-view endpoint with date filtering
      const response = await appointmentsApi.getAppointmentsByListView(requestParams);
      
      if ((response as any).success && Array.isArray((response as any).data)) {
        // Map the response data to our interface
        const todaysAppointments: Appointment[] = (response as any).data.map((appointment: any, index: number) => ({
          id: appointment.id || appointment.appointmentId || `appointment_${index}`,
          address: appointment.address || appointment.fullAddress || appointment.location || 'No address provided',
          client: appointment.client || appointment.Client || 'Unknown client',
          date: appointment.date || appointment.Start_Time || new Date().toISOString(),
          policyNo: appointment.policyNo || appointment.policyNumber || appointment.Policy || 'No policy',
          status: appointment.status || appointment.Invite_Status,
          Invite_Status: appointment.Invite_Status
        }));
        
        console.log(`Found ${todaysAppointments.length} appointments for today`);
        setAppointments(todaysAppointments);
        
        // Cache the fresh data only when online
        if (isOnline) {
          console.log('💾 Caching today\'s appointments data...');
          await storeDataForKey(cacheKey, todaysAppointments);
        } else {
          console.log('📱 Offline - not caching today\'s appointments data');
        }
      } else {
        console.warn('No appointments found for today or API call failed:', response);
        // Don't clear appointments on API failure - keep existing data
        if (appointments.length === 0) {
          setAppointments([]);
        }
      }
    } catch (err: any) {
      setError('Failed to load today\'s appointments');
      console.error('Error fetching today\'s appointments:', err);
      // Don't clear appointments on error - keep existing data
      if (appointments.length === 0) {
        setAppointments([]);
      }
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
      <View style={todaysAppointmentsStyles.section}>
        <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
        <Text style={todaysAppointmentsStyles.loadingMessage}>Loading appointments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={todaysAppointmentsStyles.section}>
        <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
        <Text style={todaysAppointmentsStyles.errorMessage}>{error}</Text>
        <Card style={todaysAppointmentsStyles.retryCard} onPress={handleRefresh}>
          <Card.Content>
            <Text style={todaysAppointmentsStyles.retryText}>Tap to retry</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={todaysAppointmentsStyles.section}>
      <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
      {appointments.length > 0 ? (
        appointments.map(appointment => (
          <Card 
            key={appointment.id} 
            style={todaysAppointmentsStyles.appointmentCard}
            onPress={() => onAppointmentPress(appointment.id)}
          >
            <Card.Content>
              <View style={todaysAppointmentsStyles.appointmentItem}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#4a90e2" />
                <View style={todaysAppointmentsStyles.appointmentContent}>
                  <Text style={todaysAppointmentsStyles.appointmentAddress}>{appointment.address}</Text>
                  <Text style={todaysAppointmentsStyles.appointmentDetails}>
                    {appointment.client} • {formatTime(appointment.date)}
                  </Text>
                  <Text style={todaysAppointmentsStyles.policyText}>Policy: {appointment.policyNo}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={todaysAppointmentsStyles.emptyMessage}>No appointments scheduled for today</Text>
      )}
    </View>
  );
}; 