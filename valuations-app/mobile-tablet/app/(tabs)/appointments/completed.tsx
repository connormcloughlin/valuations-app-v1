import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import type { Appointment as ApiAppointment } from '../../../api/index.d';

// Extend the API's Appointment type with any additional fields we need
interface Appointment extends ApiAppointment {
  submitted: string;
}

// Define pagination interface
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export default function CompletedAppointmentsScreen() {
  logNavigation('Completed Appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasMore: false
  });

  // Fetch appointments from API
  useEffect(() => {
    fetchAppointments(page);
  }, [page]);

  const fetchAppointments = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new list-view API method
      console.log(`Fetching completed appointments page ${pageNum}...`);
      try {
        // @ts-ignore - this method exists in the API
        const response = await api.getAppointmentsByListView({
          status: 'Completed', // Use 'Completed' status for completed appointments
          page: pageNum,
          pageSize: paginationInfo.pageSize,
          surveyor: null // No surveyor filter by default
        });
        
        if (response.success && response.data) {
          const appointmentsArray = Array.isArray(response.data) ? response.data : [];
          console.log(`Loaded ${appointmentsArray.length} completed appointments for page ${pageNum}`);
          
          // Get pagination info from response
          const pageInfo: PaginationInfo = response.pagination || {
            page: pageNum,
            pageSize: paginationInfo.pageSize,
            totalItems: appointmentsArray.length,
            totalPages: 1,
            hasMore: false
          };
          
          // Update pagination info
          setPaginationInfo(pageInfo);
          
          // Set appointments
          setAppointments(appointmentsArray);
          setFilteredAppointments(appointmentsArray);
        } else {
          console.error('Failed to load appointments:', response.message);
          setError('Failed to load appointments. Please try again.');
          setAppointments([]);
          setFilteredAppointments([]);
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        
        // Fall back to regular getAppointmentsByStatus
        console.log('Trying fallback to regular appointment API...');
        try {
          // @ts-ignore - This method exists in API
          const fallbackResponse = await api.getAppointmentsByStatus('completed');
          
          if (fallbackResponse.success && fallbackResponse.data) {
            setAppointments(fallbackResponse.data);
            setFilteredAppointments(fallbackResponse.data);
          } else {
            throw new Error('Both API methods failed');
          }
        } catch (fallbackErr) {
          console.error('Error with fallback API method:', fallbackErr);
          setError('Error loading appointments. Please try again.');
          setAppointments([]);
          setFilteredAppointments([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination controls
  const goToNextPage = () => {
    if (page < paginationInfo.totalPages) {
      setPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
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
          (appointment.orderNumber && appointment.orderNumber.toLowerCase().includes(query))
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery, appointments]);

  const navigateToSummary = (id: string) => {
    router.push({
      pathname: '/survey/summary/[id]',
      params: { id }
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <Card 
      style={styles.appointmentCard}
      onPress={() => navigateToSummary(item.id)}
    >
      <Card.Content>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#2ecc71" style={styles.icon} />
          <Text style={styles.appointmentAddress}>{item.address || 'No address'}</Text>
          <Chip 
            style={styles.statusChip} 
            textStyle={styles.statusChipText}
            icon="check-circle"
          >
            Completed
          </Chip>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.client || 'No client name'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-check" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Submitted: {item.submitted || 'Unknown'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Order: {item.orderNumber || 'Unknown'}</Text>
          </View>
        </View>
        
        <Button 
          mode="outlined" 
          onPress={() => navigateToSummary(item.id)} 
          style={styles.viewButton}
          labelStyle={styles.buttonLabel}
        >
          View Summary
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Completed Appointments',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#2ecc71"
        />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2ecc71" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={() => fetchAppointments(page)} 
              style={styles.retryButton}
              buttonColor="#2ecc71"
            >
              <Text style={{ color: 'white' }}>Retry</Text>
            </Button>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <>
            <FlatList
              data={filteredAppointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item, index) => item.id ? `appointment-${item.id}-${index}` : `appointment-index-${index}`}
              contentContainerStyle={styles.listContainer}
              refreshing={loading}
              onRefresh={() => fetchAppointments(page)}
            />
            <View style={styles.paginationContainer}>
              <Button 
                mode="outlined" 
                onPress={goToPreviousPage} 
                disabled={page <= 1 || loading}
                style={styles.paginationButton}
              >
                <MaterialCommunityIcons name="chevron-left" size={16} />
                Previous
              </Button>
              
              <Text style={styles.paginationText}>
                Page {page} of {paginationInfo.totalPages || 1}
              </Text>
              
              <Button 
                mode="outlined" 
                onPress={goToNextPage} 
                disabled={page >= paginationInfo.totalPages || !paginationInfo.hasMore || loading}
                style={styles.paginationButton}
              >
                Next
                <MaterialCommunityIcons name="chevron-right" size={16} />
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No completed appointments found</Text>
            <Text style={styles.emptySubtext}>Try a different search term or page</Text>
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
    paddingBottom: 80, // Add extra space at the bottom for pagination controls
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
  statusChip: {
    backgroundColor: '#e8f6ef',
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    color: '#27ae60',
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
  viewButton: {
    marginTop: 4,
    borderColor: '#2ecc71',
    borderRadius: 4,
    height: 36,
  },
  buttonLabel: {
    fontSize: 12,
    marginVertical: 0,
    color: '#2ecc71',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationButton: {
    minWidth: 100,
  },
  paginationText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
}); 