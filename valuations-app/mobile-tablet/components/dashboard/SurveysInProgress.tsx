import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';
import { storeDataForKey, getDataForKey, removeDataForKey } from '../../utils/offlineStorage';
import { surveysInProgressStyles } from '../../app/GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import connectionUtils from '../../utils/connectionUtils';

interface Survey {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  lastEdited: string;
}

interface SurveysInProgressProps {
  onSurveyPress: (id: string) => void;
  shouldFetchData?: boolean; // Add prop to control when to fetch data
  forceReload?: boolean; // Add prop to force reload from API
}

export const SurveysInProgress: React.FC<SurveysInProgressProps> = ({ onSurveyPress, shouldFetchData = true, forceReload = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a ref to track if surveys have been fetched to prevent duplicate calls
  const surveysFetchedRef = useRef(false);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (isLoading) {
      console.log('⏳ Auth still loading, waiting...');
      setLoading(false);
      return;
    }

    // Only fetch surveys if user is authenticated, auth loading is complete, surveys haven't been fetched yet, and shouldFetchData is true
    if (isAuthenticated && user && !isLoading && !surveysFetchedRef.current && shouldFetchData) {
      console.log('🔐 User authenticated, fetching in-progress surveys...');
      surveysFetchedRef.current = true;
      fetchInProgressSurveys();
    } else if (!isAuthenticated || !user) {
      console.log('⏳ Waiting for authentication before fetching in-progress surveys...');
      setLoading(false);
      surveysFetchedRef.current = false; // Reset when user logs out
    } else if (!shouldFetchData) {
      console.log('⏸️ Data fetching disabled for SurveysInProgress component');
      setLoading(false);
    }
  }, [isAuthenticated, user, isLoading]);

  // Handle force reload when forceReload prop changes
  useEffect(() => {
    if (forceReload && isAuthenticated && user && !isLoading && shouldFetchData) {
      console.log('🔄 Force reload triggered for SurveysInProgress');
      surveysFetchedRef.current = false; // Allow fetching again
      fetchInProgressSurveys();
    }
  }, [forceReload, isAuthenticated, user, isLoading, shouldFetchData]);

  // Don't render anything if auth is still loading, not authenticated, or data fetching is disabled
  if (isLoading || !isAuthenticated || !user || !shouldFetchData) {
    return null;
  }

  const fetchInProgressSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = 'surveys_in_progress';
      
      // Check if we're online and if force reload is requested
      const isOnline = await connectionUtils.getStatus();
      
      // If force reload is requested and we're online, clear cache
      if (forceReload && isOnline) {
        console.log('🔄 Force reload requested and online - clearing cache for in-progress surveys');
        await removeDataForKey(cacheKey);
      }
      
      // Check cache when not forcing reload, or when offline (never skip cache offline)
      if (!forceReload || !isOnline) {
        console.log('📦 Checking cache for in-progress surveys...');
        const cachedData = await getDataForKey(cacheKey);
        if (cachedData && cachedData.data) {
          console.log('✅ Using cached in-progress surveys data');
          setSurveys(cachedData.data);
          setLoading(false);
          setError(null);
          return; // Exit early if we have valid cached data
        }
      }
      
      // Offline with no cached blob — keep existing surveys, do not call API
      if (!isOnline) {
        console.log('📱 Offline - no cached in-progress surveys; keeping previous list');
        setError(null);
        setLoading(false);
        return;
      }
      
      const requestParams = {
        status: 'In-Progress', // Use exact status from the working component
        page: 1,
        pageSize: 5,
        surveyor: null
      };
      
      console.log('📊 SurveysInProgress calling getAppointmentsByListView with:', requestParams);
      // @ts-ignore - this method exists in the API
      const response = await api.getAppointmentsByListView(requestParams);
      
      if (response && response.success) {
        const appointmentsArray = Array.isArray(response.data) ? response.data : [];
        console.log('Found in-progress appointments:', appointmentsArray.length);
        
        // Map API response to Survey interface
        const surveysData: Survey[] = appointmentsArray.map((appointment: any, index: number) => ({
          id: String(appointment.id || appointment.appointmentId || appointment.AppointmentID || `survey_${index}`),
          address: String(appointment.address || appointment.location || appointment.Location || 'No address provided'),
          client: String(appointment.client || appointment.Client || 'Unknown client'),
          date: appointment.date || appointment.Start_Time || appointment.startTime || '',
          policyNo: String(appointment.policyNo || appointment.Policy || appointment.orderNumber || appointment.OrderID || 'N/A'),
          lastEdited: appointment.lastEdited || appointment.dateModified || new Date().toISOString().split('T')[0]
        }));
        
        setSurveys(surveysData);
        
        // Cache the fresh data only when online
        if (isOnline) {
          console.log('💾 Caching in-progress surveys data...');
          await storeDataForKey(cacheKey, surveysData);
        } else {
          console.log('📱 Offline - not caching in-progress surveys data');
        }
      } else {
        console.warn('Invalid API response:', response);
        // Keep existing surveys on API failure — never blank the list here
      }
    } catch (err) {
      setError('Failed to load surveys in progress');
      console.error('Error fetching in-progress surveys:', err);
      // Keep existing surveys on error — never blank the list here
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInProgressSurveys();
  };

  if (loading) {
    return (
      <View style={surveysInProgressStyles.section}>
        <Text style={surveysInProgressStyles.sectionTitle}>Surveys In Progress</Text>
        <Text style={surveysInProgressStyles.loadingMessage}>Loading surveys...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={surveysInProgressStyles.section}>
        <Text style={surveysInProgressStyles.sectionTitle}>Surveys In Progress</Text>
        <Text style={surveysInProgressStyles.errorMessage}>{error}</Text>
        <Card style={surveysInProgressStyles.retryCard} onPress={handleRefresh}>
          <Card.Content>
            <Text style={surveysInProgressStyles.retryText}>Tap to retry</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={surveysInProgressStyles.section}>
      <Text style={surveysInProgressStyles.sectionTitle}>Surveys In Progress</Text>
      {surveys.length > 0 ? (
        surveys.map(survey => (
          <Card 
            key={survey.id} 
            style={surveysInProgressStyles.appointmentCard}
            onPress={() => onSurveyPress(survey.id)}
          >
            <Card.Content>
              <View style={surveysInProgressStyles.appointmentItem}>
                <MaterialCommunityIcons name="clipboard-edit" size={24} color="#f39c12" />
                <View style={surveysInProgressStyles.appointmentContent}>
                  <Text style={surveysInProgressStyles.appointmentAddress}>{survey.address}</Text>
                  <Text style={surveysInProgressStyles.appointmentDetails}>
                    {survey.client} • Last edited: {survey.lastEdited}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={surveysInProgressStyles.emptyMessage}>No surveys in progress</Text>
      )}
    </View>
  );
}; 