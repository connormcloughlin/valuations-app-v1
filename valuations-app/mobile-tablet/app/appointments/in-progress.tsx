import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../utils/logger';
import api from '../../api';
// Import the API response type to fix TypeScript errors
import { ApiResponse, Appointment as ApiAppointment } from '../../api/index.d';

// Define the appointment type with order fields
interface Appointment {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  orderNumber: string;
  lastEdited: string;
  status?: string;
  Invite_Status?: string;
  sumInsured?: number;
  broker?: string;
  // New fields from the API
  orderID?: number | string;
  dateModified?: string | null;
  originalOrder?: any;
  originalAppointment?: any;
}

// Fallback mock data in case API fails
const fallbackData: Appointment[] = [
  { 
    id: '1003', 
    address: '789 Pine Rd', 
    client: 'S. Naidoo', 
    date: '2024-04-25 10:00', 
    policyNo: 'J 12 mil', 
    orderNumber: 'ORD-2024-1003',
    lastEdited: '2024-04-25'
  },
  { 
    id: '1006', 
    address: '45 Mountain View', 
    client: 'P. Williams', 
    date: '2024-04-26 09:30', 
    policyNo: 'N 63 mil', 
    orderNumber: 'ORD-2024-1006',
    lastEdited: '2024-04-26'
  },
];

export default function InProgressAppointmentsScreen() {
  logNavigation('In-Progress Appointments');
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
      
      // Use the new list-view API endpoint with 'In-Progress' status
      // @ts-ignore - this method exists but TypeScript might not recognize it
      const response = await api.getAppointmentsByListView({
        status: 'In-Progress',
        page: 1,
        pageSize: 50, // Load more per page since we're not implementing pagination here yet
        surveyor: null // No surveyor filter by default
      });
      
      if (response.success && response.data) {
        console.log(`Loaded ${Array.isArray(response.data) ? response.data.length : 0} in-progress appointments`);
        
        // Ensure response.data is an array
        const appointmentsArray = Array.isArray(response.data) ? response.data : [];
        
        // Process appointments to ensure they have lastEdited field
        const processedData = appointmentsArray.map((appointment: ApiAppointment) => {
          // lastEdited should now be directly available from the API response
          // Use the mapped field directly without needing to check multiple sources
          const lastEdited = appointment.lastEdited || 
                            appointment.dateModified || 
                            new Date().toISOString().split('T')[0];
          
          return {
            ...appointment,
            lastEdited
          };
        });
        
        setAppointments(processedData);
        setFilteredAppointments(processedData);
      } else {
        console.error('Failed to load in-progress appointments:', response.message);
        setError('Failed to load appointments. Using fallback data.');
        setAppointments(fallbackData);
        setFilteredAppointments(fallbackData);
      }
    } catch (err) {
      console.error('Error fetching in-progress appointments:', err);
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
          (appointment.client && appointment.client.toLowerCase().includes(query)) ||
          (appointment.address && appointment.address.toLowerCase().includes(query)) ||
          (appointment.orderNumber && appointment.orderNumber.toLowerCase().includes(query)) ||
          (appointment.policyNo && appointment.policyNo.toLowerCase().includes(query))
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery, appointments]);

  const navigateToSurvey = (id: string) => {
    // Make sure the ID is properly formatted for navigation
    const navigationId = id === '1' ? '1' : id;
    console.log(`Navigating to survey for ID: ${navigationId}`);
    
    router.push({
      pathname: '/survey/[id]',
      params: { id: navigationId }
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <Card 
      style={styles.appointmentCard}
      onPress={() => navigateToSurvey(item.id)}
    >
      <Card.Content>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#f39c12" style={styles.icon} />
          <Text style={styles.appointmentAddress}>{item.address || 'No address'}</Text>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.client || 'No client name'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-edit" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Last edited: {formatDate(item.lastEdited) || 'Unknown'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Order: {item.orderNumber || 'Unknown'}</Text>
          </View>

          {item.policyNo && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="shield" size={16} color="#7f8c8d" style={styles.detailIcon} />
              <Text style={styles.detailText}>Policy: {item.policyNo}</Text>
            </View>
          )}
          
          {item.sumInsured && item.sumInsured > 0 && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color="#7f8c8d" style={styles.detailIcon} />
              <Text style={styles.detailText}>Sum Insured: {formatCurrency(item.sumInsured)}</Text>
            </View>
          )}
        </View>
        
        <Button 
          mode="contained" 
          onPress={() => navigateToSurvey(item.id)} 
          style={styles.continueButton}
          labelStyle={styles.buttonLabel}
        >
          <Text style={styles.buttonText}>Continue Survey</Text>
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'In Progress Surveys',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <Searchbar
          placeholder="Search by client, address, policy or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#f39c12"
        />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f39c12" />
            <Text style={styles.loadingText}>Loading in-progress surveys...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={fetchAppointments} 
              style={styles.retryButton}
              buttonColor="#f39c12"
            >
              <Text style={styles.buttonText}>Retry</Text>
            </Button>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item, index) => item.id ? `in-progress-${item.id}-${index}` : `in-progress-${index}`}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchAppointments}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-edit-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No surveys in progress</Text>
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
    marginBottom: 16,
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
  continueButton: {
    marginTop: 4,
    backgroundColor: '#f39c12',
    borderRadius: 4,
    height: 36,
  },
  buttonLabel: {
    fontSize: 12,
    marginVertical: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
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