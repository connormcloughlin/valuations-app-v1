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
// Dynamic import to prevent bundling at startup
const getRequestDeduplication = () => import('../../core/requestDeduplication');
import { LoadingState, SkeletonLoader } from '../LoadingStates';

interface Appointment {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  status?: string;
  Invite_Status?: string;
}

interface OptimizedTodaysAppointmentsProps {
  onAppointmentPress: (id: string) => void;
  shouldFetchData?: boolean;
  forceReload?: boolean;
}

export const OptimizedTodaysAppointments: React.FC<OptimizedTodaysAppointmentsProps> = ({ 
  onAppointmentPress, 
  shouldFetchData = true, 
  forceReload = false 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a ref to track if appointments have been fetched to prevent duplicate calls
  const appointmentsFetchedRef = useRef(false);
  const lastFetchAtRef = useRef<number>(0);

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
      console.log('⏸️ Data fetching disabled for OptimizedTodaysAppointments component');
      setLoading(false);
    }
  }, [isAuthenticated, user, isLoading]);

  // Handle force reload when forceReload prop changes
  useEffect(() => {
    if (forceReload && isAuthenticated && user && !isLoading && shouldFetchData) {
      console.log('🔄 Force reload triggered for OptimizedTodaysAppointments');
      appointmentsFetchedRef.current = false; // Allow fetching again
      fetchTodaysAppointments();
    }
  }, [forceReload, isAuthenticated, user, isLoading, shouldFetchData]);

  // Don't render anything if auth is still loading, not authenticated, or data fetching is disabled
  if (isLoading || !isAuthenticated || !user || !shouldFetchData) {
    return null;
  }

  const fetchTodaysAppointments = async () => {
    // Throttle frequent fetches (e.g., double focus) within 5 seconds
    const now = Date.now();
    if (now - lastFetchAtRef.current < 5000) {
      console.log('⏱️ Skipping todays appointments fetch (within 5s throttle window)');
      return;
    }
    lastFetchAtRef.current = now;
    
    const cacheKey = 'todays-appointments';
    
    try {
      setLoading(true);
      setError(null);
      
      const { requestDeduplication } = await getRequestDeduplication();
      const appointmentsData = await requestDeduplication.deduplicateRequest(
        cacheKey,
        async () => {
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
          
          // Check cache first if we're offline or not forcing reload
          if (!forceReload) {
            const cachedData = await getDataForKey(cacheKey);
            if (cachedData) {
              // Support both raw array and wrapped object shapes
              if (Array.isArray(cachedData)) {
                console.log(`✅ Cache hit for todays_appointments_${today.toDateString()}: ${(JSON.stringify(cachedData).length / 1024).toFixed(1)}KB`);
                console.log('✅ Using cached today\'s appointments data');
                return cachedData;
              }
              if (cachedData && Array.isArray((cachedData as any).data)) {
                const arr = (cachedData as any).data;
                console.log(`✅ Cache hit for todays_appointments_${today.toDateString()}: ${(JSON.stringify(arr).length / 1024).toFixed(1)}KB`);
                console.log('✅ Using cached today\'s appointments data (wrapped)');
                return arr;
              }
            }
          }
          
          // If we're offline and no cache, return empty array
          if (!isOnline) {
            console.log('📱 Offline - no cached data available for today\'s appointments');
            return [];
          }
          
          console.log('🏠 TodaysAppointments calling getAppointmentsByListView with:', {
            page: 1,
            pageSize: 50,
            startDateFrom,
            startDateTo,
            status: 'Booked',
            surveyor: ''
          });
          
          console.log('Connection status before fetching appointments by list-view:', isOnline ? 'Online' : 'Offline');
          
          const response = await appointmentsApi.getAppointmentsByListView({
            page: 1,
            pageSize: 50,
            startDateFrom,
            startDateTo,
            status: 'Booked',
            surveyor: ''
          });
          
          if (response && response.data) {
            console.log('Found appointments in response.data.data array');
            console.log(`📋 Successfully processed ${response.data.length} appointments for list-view`);
            
            // Cache the data
            await storeDataForKey(cacheKey, response.data, 1440); // Cache for 24 hours
            console.log(`📦 Stored appointmentsByListView: ${(JSON.stringify(response.data).length / 1024).toFixed(1)}KB, TTL: 1440min`);
            
            return response.data;
          } else {
            console.log('No appointments found in response');
            return [];
          }
        }
      );

      const foundCount = Array.isArray(appointmentsData) ? appointmentsData.length : 0;
      console.log(`Found ${foundCount} appointments for today`);
      
      // Cache the data for display
      const today = new Date();
      const displayCacheKey = `todays_appointments_${today.toDateString()}`;
      await storeDataForKey(displayCacheKey, appointmentsData, 1440); // Cache for 24 hours
      console.log('💾 Caching today\'s appointments data...');
      console.log(`📦 Stored ${displayCacheKey}: ${(JSON.stringify(appointmentsData).length / 1024).toFixed(1)}KB, TTL: 1440min`);
      
      const safeAppointments = Array.isArray(appointmentsData) ? appointmentsData : [];
      setAppointments(safeAppointments);
    } catch (error) {
      console.error('❌ Error fetching today\'s appointments:', error);
      setError('Failed to load today\'s appointments');
      
      // Try to load from cache as fallback
      try {
        const today = new Date();
        const cacheKey = `todays_appointments_${today.toDateString()}`;
        const cachedData = await getDataForKey(cacheKey);
        if (cachedData) {
          console.log('📦 Using cached data as fallback');
          setAppointments(cachedData);
        }
      } catch (cacheError) {
        console.error('❌ Error loading from cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton loading while data is loading
  if (loading) {
    return (
      <View style={todaysAppointmentsStyles.section}>
        <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
        {[1, 2, 3].map((index) => (
          <Card key={index} style={todaysAppointmentsStyles.appointmentCard}>
            <Card.Content>
              <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="60%" height={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={12} />
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={todaysAppointmentsStyles.section}>
        <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
        <Card style={todaysAppointmentsStyles.retryCard}>
          <Card.Content>
            <Text style={todaysAppointmentsStyles.retryText}>
              {error}. Please check your connection and try again.
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Show empty state
  if (!Array.isArray(appointments) || appointments.length === 0) {
    return (
      <View style={todaysAppointmentsStyles.section}>
        <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
        <Text style={todaysAppointmentsStyles.emptyMessage}>
          No appointments scheduled for today
        </Text>
      </View>
    );
  }

  return (
    <View style={todaysAppointmentsStyles.section}>
      <Text style={todaysAppointmentsStyles.sectionTitle}>Today's Appointments</Text>
      {Array.isArray(appointments) && appointments.map((appointment) => (
        <Card 
          key={appointment.id} 
          style={todaysAppointmentsStyles.appointmentCard}
          onPress={() => onAppointmentPress(appointment.id)}
        >
          <Card.Content>
            <View style={todaysAppointmentsStyles.appointmentItem}>
              <MaterialCommunityIcons 
                name="calendar-clock" 
                size={24} 
                color="#4a90e2" 
                style={todaysAppointmentsStyles.icon}
              />
              <View style={todaysAppointmentsStyles.appointmentContent}>
                <Text style={todaysAppointmentsStyles.appointmentAddress}>
                  {appointment.address}
                </Text>
                <Text style={todaysAppointmentsStyles.appointmentDetails}>
                  {appointment.client} • {appointment.date}
                </Text>
                {appointment.policyNo && (
                  <Text style={todaysAppointmentsStyles.policyText}>
                    Policy: {appointment.policyNo}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};
