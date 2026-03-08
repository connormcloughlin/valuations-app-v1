import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import type { Appointment as ApiAppointment } from '../../../api/index.d';
import { completedAppointmentsStyles, colors } from '../../GlobalStyles';
import { useAuth } from '../../../context/AuthContext';
import { SurveyorFilterIndicator } from '../../../components/SurveyorFilterIndicator';
import { SlaStatusBadge } from '../../../components/sla/SlaStatusBadge';
import { formatDateForSA } from '../../../utils/dateUtils';

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
  const { isAuthenticated, user } = useAuth();
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
    // Only fetch appointments if user is authenticated
    if (isAuthenticated && user) {
      console.log('🔐 User authenticated, fetching completed appointments...');
      fetchAppointments(page);
    } else {
      console.log('⏳ Waiting for authentication before fetching completed appointments...');
      setLoading(false);
    }
  }, [page, isAuthenticated, user]);

  const fetchAppointments = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the list-view API method (no fallback)
      console.log(`Fetching completed appointments page ${pageNum}...`);
      // @ts-ignore - this method exists in the API
      const response = await api.getAppointmentsByListView({
        status: 'Completed', // Use 'Completed' status for completed appointments
        page: pageNum,
        pageSize: paginationInfo.pageSize
        // surveyor filtering handled automatically by backend based on user context
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
      style={completedAppointmentsStyles.appointmentCard}
      onPress={() => navigateToSummary(item.id)}
    >
      <Card.Content>
        <View style={completedAppointmentsStyles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.success} style={completedAppointmentsStyles.icon} />
          <Text style={completedAppointmentsStyles.appointmentAddress}>{item.address || 'No address'}</Text>
          <Chip 
            style={completedAppointmentsStyles.statusChip} 
            textStyle={completedAppointmentsStyles.statusChipText}
            icon="check-circle"
          >
            Completed
          </Chip>
        </View>
        
        <View style={completedAppointmentsStyles.appointmentDetails}>
          <View style={completedAppointmentsStyles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color={colors.gray[500]} style={completedAppointmentsStyles.detailIcon} />
            <Text style={completedAppointmentsStyles.detailText}>{item.client || 'No client name'}</Text>
          </View>
          
          <View style={completedAppointmentsStyles.detailRow}>
            <MaterialCommunityIcons name="calendar-check" size={16} color={colors.gray[500]} style={completedAppointmentsStyles.detailIcon} />
            <Text style={completedAppointmentsStyles.detailText}>Submitted: {formatDateForSA(item.submitted) || 'Unknown'}</Text>
          </View>
          
          <View style={completedAppointmentsStyles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.gray[500]} style={completedAppointmentsStyles.detailIcon} />
            <Text style={completedAppointmentsStyles.detailText}>Order: {item.orderNumber || 'Unknown'}</Text>
          </View>

          <View style={completedAppointmentsStyles.detailRow}>
            <SlaStatusBadge
              surveyorStatus={item.surveyor_status ?? item.surveyorStatus}
              surveyorDueDate={item.surveyor_due_date ?? item.surveyorDueDate}
              compact={false}
            />
          </View>
        </View>

        <Button
          mode="outlined" 
          onPress={() => navigateToSummary(item.id)} 
          style={completedAppointmentsStyles.viewButton}
          labelStyle={completedAppointmentsStyles.buttonLabel}
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
      
      <View style={completedAppointmentsStyles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={completedAppointmentsStyles.searchBar}
          iconColor={colors.success}
        />
        
        {loading ? (
          <View style={completedAppointmentsStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.success} />
            <Text style={completedAppointmentsStyles.emptyText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={completedAppointmentsStyles.errorContainer}>
            <Text style={completedAppointmentsStyles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={() => fetchAppointments(page)} 
              style={completedAppointmentsStyles.viewButton}
              buttonColor={colors.success}
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
              contentContainerStyle={completedAppointmentsStyles.listContainer}
              refreshing={loading}
              onRefresh={() => fetchAppointments(page)}
            />
            <View style={completedAppointmentsStyles.paginationContainer}>
              <Button 
                mode="outlined" 
                onPress={goToPreviousPage} 
                disabled={page <= 1 || loading}
                style={completedAppointmentsStyles.paginationButton}
              >
                <MaterialCommunityIcons name="chevron-left" size={16} />
                Previous
              </Button>
              
              <Text style={completedAppointmentsStyles.paginationInfo}>
                Page {page} of {paginationInfo.totalPages || 1}
              </Text>
              
              <Button 
                mode="outlined" 
                onPress={goToNextPage} 
                disabled={page >= paginationInfo.totalPages || !paginationInfo.hasMore || loading}
                style={completedAppointmentsStyles.paginationButton}
              >
                Next
                <MaterialCommunityIcons name="chevron-right" size={16} />
              </Button>
            </View>
          </>
        ) : (
          <View style={completedAppointmentsStyles.emptyContainer}>
            <SurveyorFilterIndicator 
              appointmentCount={0}
              showEmptyState={true}
            />
            <MaterialCommunityIcons name="clipboard-check" size={64} color="#ccc" />
            <Text style={completedAppointmentsStyles.emptyText}>No completed appointments found</Text>
            <Text style={completedAppointmentsStyles.emptyText}>Try a different search term or page</Text>
          </View>
        )}
      </View>
    </>
  );
} 