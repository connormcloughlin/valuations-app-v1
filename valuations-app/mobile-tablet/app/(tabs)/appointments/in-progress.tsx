import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import type { Appointment as ApiAppointment } from '../../../api/index.d';

// Extend the API's Appointment type with any additional fields we need
interface Appointment extends ApiAppointment {
  lastEdited: string;
}

// Define pagination interface
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export default function InProgressAppointmentsScreen() {
  logNavigation('In Progress Appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    page: 1,
    pageSize: 50,
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
      console.log(`Fetching in-progress appointments page ${pageNum}...`);
      try {
        // @ts-ignore - this method exists in the API
        const response = await api.getAppointmentsByListView({
          status: 'In-Progress', // Use 'In-Progress' status for in-progress appointments
          page: pageNum,
          pageSize: paginationInfo.pageSize,
          surveyor: null // No surveyor filter by default
        });
        
        if (response.success && response.data) {
          const appointmentsArray = Array.isArray(response.data) ? response.data : [];
          console.log(`Loaded ${appointmentsArray.length} in-progress appointments for page ${pageNum}`);
          
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
          const fallbackResponse = await api.getAppointmentsByStatus('in-progress');
          
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
          (appointment.orderNumber && appointment.orderNumber.toLowerCase().includes(query)) ||
          (appointment.policyNo && appointment.policyNo.toLowerCase().includes(query))
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery, appointments]);

  const navigateToSurvey = (appointment: Appointment) => {
    // 🔍 DEBUG: Log all available appointment fields
    console.log('🔍 AVAILABLE APPOINTMENT FIELDS FOR NAVIGATION:');
    console.log('Full appointment object:', JSON.stringify(appointment, null, 2));
    console.log('appointmentID:', appointment.appointmentID);
    console.log('appointmentId:', appointment.appointmentId);
    console.log('id:', appointment.id);
    console.log('status:', appointment.status);
    console.log('inviteStatus:', appointment.inviteStatus);
    console.log('Invite_Status:', appointment.Invite_Status);
    console.log('orderNumber:', appointment.orderNumber);
    console.log('orderID:', appointment.orderID);
    
    router.push({
      pathname: '/(tabs)/new-survey',
      params: { 
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
  };

  const formatCurrency = (value?: string | number) => {
    if (value === undefined || value === null || value === '') return 'Not specified';
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) return 'Invalid amount';
    // Handle 0.00 values properly
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString || 'Invalid date';
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    // Debug logging for problematic data
    if (process.env.NODE_ENV === 'development') {
      const problematicFields = [];
      if (item.address === null || item.address === undefined) problematicFields.push('address');
      if (item.client === null || item.client === undefined) problematicFields.push('client');
      if (item.orderNumber === null || item.orderNumber === undefined) problematicFields.push('orderNumber');
      if (item.policyNo === null || item.policyNo === undefined) problematicFields.push('policyNo');
      if (item.sumInsured === null || item.sumInsured === undefined) problematicFields.push('sumInsured');
      
      // Special logging for sumInsured 0.00 values
      if (Number(item.sumInsured) === 0 || item.sumInsured === '0.00' || item.sumInsured === '0') {
        console.log(`Order ${item.orderNumber}: sumInsured is 0.00, type:`, typeof item.sumInsured, 'value:', item.sumInsured);
      }
      
      if (problematicFields.length > 0) {
        console.warn(`Appointment ${item.appointmentID} has problematic fields:`, problematicFields, item);
      }
    }
    
    return (
    <Card 
      style={styles.appointmentCard}
      onPress={() => navigateToSurvey(item)}
    >
      <Card.Content>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#f39c12" style={styles.icon} />
          <Text style={styles.appointmentAddress}>{String(item.address || 'No address')}</Text>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{String(item.client || 'No client name')}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-edit" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Last edited: {formatDate(item.lastEdited)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Order: {String(item.orderNumber || 'Unknown')}</Text>
          </View>

          {item.policyNo && String(item.policyNo).trim() !== '' && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="shield" size={16} color="#7f8c8d" style={styles.detailIcon} />
              <Text style={styles.detailText}>Policy: {String(item.policyNo)}</Text>
            </View>
          )}
          
          {(item.sumInsured !== null && item.sumInsured !== undefined && item.sumInsured !== '') && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color="#7f8c8d" style={styles.detailIcon} />
              <Text style={styles.detailText}>Sum Insured: {formatCurrency(item.sumInsured)}</Text>
            </View>
          )}
        </View>
        
        <Button 
          mode="contained" 
          onPress={() => navigateToSurvey(item)} 
          style={styles.continueButton}
          labelStyle={styles.buttonLabel}
        >
          Continue Survey
        </Button>
      </Card.Content>
    </Card>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'In Progress Appointments',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Searchbar
            placeholder="Search by client, address or order no."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#4a90e2"
          />
          <Button
            mode="contained"
            onPress={() => fetchAppointments(page)}
            style={styles.refreshButton}
            buttonColor="#4a90e2"
            icon="refresh"
          >
            Refresh
          </Button>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={() => fetchAppointments(page)} 
              style={styles.retryButton}
              buttonColor="#4a90e2"
              textColor="white"
            >
              Retry
            </Button>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <>
            <FlatList
              data={filteredAppointments || []}
              renderItem={renderAppointmentItem}
              keyExtractor={(item, index) => `appointment-${item.appointmentID || 'no-id'}-${index}`}
              contentContainerStyle={styles.listContainer}
              refreshing={loading}
              onRefresh={() => fetchAppointments(page)}
              removeClippedSubviews={false}
            />
            <View style={styles.paginationContainer}>
              <Button 
                mode="outlined" 
                onPress={goToPreviousPage} 
                disabled={page <= 1 || loading}
                style={styles.paginationButton}
                icon="chevron-left"
              >
                Previous
              </Button>
              
              <Text style={styles.paginationText}>
                Page {String(page)} of {String(paginationInfo.totalPages || 1)}
              </Text>
              
              <Button 
                mode="outlined" 
                onPress={goToNextPage} 
                disabled={page >= paginationInfo.totalPages || !paginationInfo.hasMore || loading}
                style={styles.paginationButton}
                icon="chevron-right"
                contentStyle={{ flexDirection: 'row-reverse' }}
              >
                Next
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
    borderRadius: 8,
  },
  refreshButton: {
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