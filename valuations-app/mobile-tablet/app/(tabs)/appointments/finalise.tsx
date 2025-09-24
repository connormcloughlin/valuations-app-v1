import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import api from '../../../api';
import type { Appointment as ApiAppointment } from '../../../api/index.d';
import { finaliseAppointmentsStyles, colors } from '../../GlobalStyles';
import { useAuth } from '../../../context/AuthContext';
import { SurveyorFilterIndicator } from '../../../components/SurveyorFilterIndicator';

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

export default function FinaliseAppointmentsScreen() {
  const { isAuthenticated, user } = useAuth();
  logNavigation('Finalise Appointments');
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
    // Only fetch appointments if user is authenticated
    if (isAuthenticated && user) {
      console.log('🔐 User authenticated, fetching finalise appointments...');
      fetchAppointments(page);
    } else {
      console.log('⏳ Waiting for authentication before fetching finalise appointments...');
      setLoading(false);
    }
  }, [page, isAuthenticated, user]);

  const fetchAppointments = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the list-view API method (no fallback)
      console.log(`Fetching finalise appointments page ${pageNum}...`);
      // @ts-ignore - this method exists in the API
      const response = await api.getAppointmentsByListView({
        status: 'Finalise', // Use 'Finalise' status for finalise appointments
        page: pageNum,
        pageSize: paginationInfo.pageSize
        // surveyor filtering handled automatically by backend based on user context
      });
      
      if (response.success && response.data) {
        const appointmentsArray = Array.isArray(response.data) ? response.data : [];
        console.log(`Loaded ${appointmentsArray.length} finalise appointments for page ${pageNum}`);
        
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
          (appointment.orderNumber && appointment.orderNumber.toLowerCase().includes(query)) ||
          (appointment.policyNo && appointment.policyNo.toLowerCase().includes(query))
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery, appointments]);

  const navigateToSurvey = (appointment: Appointment) => {
    // Get the appointment ID for navigation
    const appointmentId = appointment.appointmentID?.toString() || appointment.appointmentId?.toString() || appointment.id?.toString();
    
    console.log('🔍 Navigating to survey detail for finalise appointment:', appointmentId);
    
    router.push({
      pathname: '/survey/[id]',
      params: { id: appointmentId }
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
      style={finaliseAppointmentsStyles.appointmentCard}
      onPress={() => navigateToSurvey(item)}
    >
      <Card.Content>
        <View style={finaliseAppointmentsStyles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.secondary} style={finaliseAppointmentsStyles.icon} />
          <Text style={finaliseAppointmentsStyles.appointmentAddress}>{String(item.address || 'No address')}</Text>
        </View>
        
        <View style={finaliseAppointmentsStyles.appointmentDetails}>
          <View style={finaliseAppointmentsStyles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color={colors.gray[500]} style={finaliseAppointmentsStyles.detailIcon} />
            <Text style={finaliseAppointmentsStyles.detailText}>{String(item.client || 'No client name')}</Text>
          </View>
          
          <View style={finaliseAppointmentsStyles.detailRow}>
            <MaterialCommunityIcons name="calendar-edit" size={16} color={colors.gray[500]} style={finaliseAppointmentsStyles.detailIcon} />
            <Text style={finaliseAppointmentsStyles.detailText}>Last edited: {formatDate(item.lastEdited)}</Text>
          </View>
          
          <View style={finaliseAppointmentsStyles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.gray[500]} style={finaliseAppointmentsStyles.detailIcon} />
            <Text style={finaliseAppointmentsStyles.detailText}>Order: {String(item.orderNumber || 'Unknown')}</Text>
          </View>

          {item.policyNo && String(item.policyNo).trim() !== '' && (
            <View style={finaliseAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="shield" size={16} color={colors.gray[500]} style={finaliseAppointmentsStyles.detailIcon} />
              <Text style={finaliseAppointmentsStyles.detailText}>Policy: {String(item.policyNo)}</Text>
            </View>
          )}
          
          {(item.sumInsured !== null && item.sumInsured !== undefined && item.sumInsured !== '') && (
            <View style={finaliseAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color={colors.gray[500]} style={finaliseAppointmentsStyles.detailIcon} />
              <Text style={finaliseAppointmentsStyles.detailText}>Sum Insured: {formatCurrency(item.sumInsured)}</Text>
            </View>
          )}
        </View>
        
        <Button 
          mode="contained" 
          onPress={() => navigateToSurvey(item)} 
          style={finaliseAppointmentsStyles.viewButton}
          labelStyle={finaliseAppointmentsStyles.buttonLabel}
        >
          View Survey
        </Button>
      </Card.Content>
    </Card>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Finalise Appointments',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={finaliseAppointmentsStyles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={finaliseAppointmentsStyles.searchBar}
          iconColor={colors.secondary}
        />
        <Button
          mode="contained"
          onPress={() => fetchAppointments(page)}
          style={finaliseAppointmentsStyles.viewButton}
          buttonColor={colors.secondary}
          icon="refresh"
        >
          Refresh
        </Button>
      </View>
      
      {loading ? (
        <View style={finaliseAppointmentsStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={finaliseAppointmentsStyles.emptyText}>Loading appointments...</Text>
        </View>
      ) : error ? (
        <View style={finaliseAppointmentsStyles.errorContainer}>
          <Text style={finaliseAppointmentsStyles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => fetchAppointments(page)} 
            style={finaliseAppointmentsStyles.viewButton}
            buttonColor={colors.secondary}
            textColor="white"
          >
            Retry
          </Button>
        </View>
      ) : filteredAppointments.length > 0 ? (
        <>
          <SurveyorFilterIndicator 
            appointmentCount={filteredAppointments.length}
            showEmptyState={false}
          />
          <FlatList
            data={filteredAppointments || []}
            renderItem={renderAppointmentItem}
            keyExtractor={(item, index) => `appointment-${item.appointmentID || 'no-id'}-${index}`}
            contentContainerStyle={finaliseAppointmentsStyles.listContainer}
            refreshing={loading}
            onRefresh={() => fetchAppointments(page)}
            removeClippedSubviews={false}
          />
          <View style={finaliseAppointmentsStyles.paginationContainer}>
            <Button 
              mode="outlined" 
              onPress={goToPreviousPage} 
              disabled={page <= 1 || loading}
              style={finaliseAppointmentsStyles.paginationButton}
              icon="chevron-left"
            >
              Previous
            </Button>
            
            <Text style={finaliseAppointmentsStyles.paginationInfo}>
              Page {String(page)} of {String(paginationInfo.totalPages || 1)}
            </Text>
            
            <Button 
              mode="outlined" 
              onPress={goToNextPage} 
              disabled={page >= paginationInfo.totalPages || !paginationInfo.hasMore || loading}
              style={finaliseAppointmentsStyles.paginationButton}
              icon="chevron-right"
              contentStyle={{ flexDirection: 'row-reverse' }}
            >
              Next
            </Button>
          </View>
        </>
      ) : (
        <View style={finaliseAppointmentsStyles.emptyContainer}>
          <SurveyorFilterIndicator 
            appointmentCount={0}
            showEmptyState={true}
          />
          <MaterialCommunityIcons name="clipboard-check-outline" size={64} color="#ccc" />
          <Text style={finaliseAppointmentsStyles.emptyText}>No appointments found</Text>
          <Text style={finaliseAppointmentsStyles.emptyText}>Try a different search term or page</Text>
        </View>
      )}
    </>
  );
} 