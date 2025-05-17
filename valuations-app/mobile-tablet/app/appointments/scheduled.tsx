import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../utils/logger';
import api from '../../api';

// Define the appointment type
interface Appointment {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  orderNumber: string;
  status?: string;
  // Add any other fields from the API response
}

// Fallback mock data in case API fails
const fallbackData: Appointment[] = [
  { id: '1001', address: '123 Main St', client: 'M.R. Gumede', date: '2024-04-30 09:00', policyNo: 'K 82 mil', orderNumber: 'ORD-2024-1001' },
  { id: '1002', address: '456 Oak Ave', client: 'T. Mbatha', date: '2024-05-02 14:00', policyNo: 'P 56 mil', orderNumber: 'ORD-2024-1002' },
];

export default function ScheduledAppointmentsScreen() {
  logNavigation('Scheduled Appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments from API
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use our API client to get appointments with 'scheduled' status
      const response = await api.getAppointmentsByStatus('scheduled');
      
      if (response.success && response.data) {
        console.log(`Loaded ${Array.isArray(response.data) ? response.data.length : 0} scheduled appointments`);
        
        // Ensure response.data is an array
        const appointmentsArray = Array.isArray(response.data) ? response.data : [];
        
        // Map API response to our Appointment interface if needed
        const mappedData: Appointment[] = appointmentsArray.map((item: any) => ({
          id: item.id || item.appointmentId || '',
          address: item.address || '',
          client: item.clientName || item.client || '',
          date: item.appointmentDate || item.date || '',
          policyNo: item.policyNumber || item.policyNo || '',
          orderNumber: item.orderNumber || '',
          status: item.status || 'scheduled'
        }));
        
        setAppointments(mappedData);
        setFilteredAppointments(mappedData);
      } else {
        console.error('Failed to load appointments:', response.message);
        setError('Failed to load appointments. Using fallback data.');
        setAppointments(fallbackData);
        setFilteredAppointments(fallbackData);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Error loading appointments. Using fallback data.');
      setAppointments(fallbackData);
      setFilteredAppointments(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAppointments(appointments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = appointments.filter(
        appointment => 
          appointment.client.toLowerCase().includes(query) ||
          appointment.address.toLowerCase().includes(query) ||
          appointment.orderNumber.toLowerCase().includes(query)
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery, appointments]);

  const navigateToAppointment = (id: string) => {
    // In API, IDs might start at 1, but in our navigation we might use 0-based
    // Make sure to adjust the ID when needed
    const navigationId = id === '1' ? '1' : id; // Preserve the ID as-is for now
    console.log(`Navigating to appointment details for ID: ${navigationId}`);
    
    router.push({
      pathname: '/appointment/[id]',
      params: { id: navigationId }
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <Card 
      style={styles.appointmentCard}
      onPress={() => navigateToAppointment(item.id)}
    >
      <Card.Content>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#4a90e2" style={styles.icon} />
          <Text style={styles.appointmentAddress}>{item.address}</Text>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.client}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Order: {item.orderNumber}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scheduled Appointments',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#4a90e2"
        />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={fetchAppointments} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item, index) => item.id ? String(item.id) : `appointment-${index}`}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchAppointments}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  appointmentAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  appointmentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 