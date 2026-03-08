import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import type { Appointment as ApiAppointment } from '../../../api/index.d';
import { scheduledAppointmentsStyles, colors } from '../../GlobalStyles';
import { useAuth } from '../../../context/AuthContext';
import { SurveyorFilterIndicator } from '../../../components/SurveyorFilterIndicator';
import { SlaStatusBadge } from '../../../components/sla/SlaStatusBadge';
import { formatDateForSA, formatTimeForSA } from '../../../utils/dateUtils';

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

export default function ScheduledAppointmentsScreen() {
  const { isAuthenticated, user } = useAuth();
  logNavigation('Scheduled Appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    hasMore: false
  });
  const pageSize = 10; // Number of items per page

  // Fetch appointments from API
  useEffect(() => {
    // Only fetch appointments if user is authenticated
    if (isAuthenticated && user) {
      console.log('🔐 User authenticated, fetching scheduled appointments...');
      fetchAppointments(page);
    } else {
      console.log('⏳ Waiting for authentication before fetching scheduled appointments...');
      setLoading(false);
    }
  }, [page, isAuthenticated, user]);

  const fetchAppointments = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the list-view API method (no fallback)
      console.log(`Fetching scheduled appointments page ${pageNum}...`);
      // @ts-ignore - this method exists in the API
      const response = await api.getAppointmentsByListView({
        status: 'Booked', // Use 'Booked' status for scheduled appointments
        page: pageNum,
        pageSize: pageSize
        // surveyor filtering handled automatically by backend based on user context
      });
      
      if (response.success && response.data) {
        const appointmentsArray = Array.isArray(response.data) ? response.data : [];
        console.log(`Loaded ${appointmentsArray.length} scheduled appointments for page ${pageNum}`);
        
        // Get pagination info from response
        const pageInfo: PaginationInfo = response.pagination || {
          page: pageNum,
          pageSize: pageSize,
          totalItems: appointmentsArray.length,
          totalPages: 1,
          hasMore: false
        };
        
        // Update pagination info
        setPaginationInfo(pageInfo);
        
        // Map appointments with proper ID handling (same as TodaysAppointments)
        const mappedAppointments = appointmentsArray.map((appointment: any) => ({
          ...appointment,
          id: String(appointment.id || appointment.appointmentId || appointment.appointmentID || appointment.AppointmentID)
        }));
        
        // Set appointments
        setAppointments(mappedAppointments);
        setFilteredAppointments(mappedAppointments);
      } else {
        console.error('Failed to load appointments:', response.message);
        setError('Failed to load appointments. Please try again.');
        setAppointments([]);
        setFilteredAppointments([]);
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

  const navigateToAppointment = (id: string) => {
    // In API, IDs might start at 1, but in our navigation we might use 0-based
    // Make sure to adjust the ID when needed
    const navigationId = id === '1' ? '1' : id; // Preserve the ID as-is for now
    console.log(`Navigating to appointment details for ID: ${navigationId}`);
    
    router.push({
      pathname: '/(tabs)/appointments/[id]',
      params: { id: navigationId }
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    // Get the date from various possible fields (date, startTime, Start_Time)
    const dateString = item.date || (item as any).startTime || (item as any).Start_Time;
    
    // Format date and time for SA timezone
    const formattedDate = dateString ? formatDateForSA(dateString) : 'No date';
    const formattedTime = dateString ? formatTimeForSA(dateString) : '';
    const formattedDateTime = dateString 
      ? `${formattedDate} • ${formattedTime}`
      : 'No date';
    
    return (
      <Card 
        style={scheduledAppointmentsStyles.appointmentCard}
        onPress={() => navigateToAppointment(item.id)}
      >
        <Card.Content>
          <View style={scheduledAppointmentsStyles.appointmentHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} style={scheduledAppointmentsStyles.icon} />
            <Text style={scheduledAppointmentsStyles.appointmentAddress}>{item.address || 'No address'}</Text>
          </View>
          
          <View style={scheduledAppointmentsStyles.appointmentDetails}>
            <View style={scheduledAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="account" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
              <Text style={scheduledAppointmentsStyles.detailText}>{item.client || 'No client name'}</Text>
            </View>
            
            <View style={scheduledAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
              <Text style={scheduledAppointmentsStyles.detailText}>{formattedDateTime}</Text>
            </View>
            
            <View style={scheduledAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
              <Text style={scheduledAppointmentsStyles.detailText}>Order: {item.orderNumber || 'Unknown'}</Text>
            </View>
            <View style={scheduledAppointmentsStyles.detailRow}>
              <SlaStatusBadge
                surveyorStatus={item.surveyor_status ?? item.surveyorStatus}
                surveyorDueDate={item.surveyor_due_date ?? item.surveyorDueDate}
                compact={false}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scheduled Appointments',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={scheduledAppointmentsStyles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={scheduledAppointmentsStyles.searchBar}
          iconColor={colors.primary}
        />
        
        {loading ? (
          <View style={scheduledAppointmentsStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={scheduledAppointmentsStyles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={scheduledAppointmentsStyles.errorContainer}>
            <Text style={scheduledAppointmentsStyles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={() => fetchAppointments(page)} 
              style={scheduledAppointmentsStyles.retryButton}
              buttonColor={colors.primary}
            >
              <Text style={{ color: 'white' }}>Retry</Text>
            </Button>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <>
            <SurveyorFilterIndicator 
              appointmentCount={filteredAppointments.length}
              showEmptyState={false}
            />
            <FlatList
              data={filteredAppointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item, index) => item.id ? `appointment-${item.id}-${index}` : `appointment-index-${index}`}
              contentContainerStyle={scheduledAppointmentsStyles.listContainer}
              refreshing={loading}
              onRefresh={() => fetchAppointments(page)}
            />
            <View style={scheduledAppointmentsStyles.paginationContainer}>
              <Button 
                mode="outlined" 
                onPress={goToPreviousPage} 
                disabled={page <= 1 || loading}
                style={scheduledAppointmentsStyles.paginationButton}
              >
                <MaterialCommunityIcons name="chevron-left" size={16} />
                Previous
              </Button>
              
              <Text style={scheduledAppointmentsStyles.paginationText}>
                Page {page} of {paginationInfo.totalPages || 1}
              </Text>
              
              <Button 
                mode="outlined" 
                onPress={goToNextPage} 
                disabled={page >= paginationInfo.totalPages || !paginationInfo.hasMore || loading}
                style={scheduledAppointmentsStyles.paginationButton}
              >
                Next
                <MaterialCommunityIcons name="chevron-right" size={16} />
              </Button>
            </View>
          </>
        ) : (
          <View style={scheduledAppointmentsStyles.emptyContainer}>
            <SurveyorFilterIndicator 
              appointmentCount={0}
              showEmptyState={true}
            />
            <MaterialCommunityIcons name="calendar-search" size={64} color="#ccc" />
            <Text style={scheduledAppointmentsStyles.emptyText}>No appointments found</Text>
            <Text style={scheduledAppointmentsStyles.emptySubtext}>Try a different search term or page</Text>
          </View>
        )}
      </View>
    </>
  );
} 