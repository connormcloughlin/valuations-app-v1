import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';

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
}

export const SurveysInProgress: React.FC<SurveysInProgressProps> = ({ onSurveyPress }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInProgressSurveys();
  }, []);

  const fetchInProgressSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching in-progress surveys from API...');
      // @ts-ignore - this method exists in the API
      const response = await api.getAppointmentsByListView({
        status: 'In-Progress', // Use exact status from the working component
        page: 1,
        pageSize: 10,
        surveyor: null
      });
      
      if (response && response.success) {
        const appointmentsArray = Array.isArray(response.data) ? response.data : [];
        console.log('Found in-progress appointments:', appointmentsArray.length);
        
        // Map API response to Survey interface
        const surveysData: Survey[] = appointmentsArray.map((appointment: any) => ({
          id: String(appointment.appointmentID || appointment.appointmentId || appointment.id),
          address: String(appointment.address || 'No address provided'),
          client: String(appointment.client || 'Unknown client'),
          date: appointment.startTime || appointment.date || '',
          policyNo: String(appointment.policyNo || appointment.orderNumber || appointment.orderID || 'N/A'),
          lastEdited: appointment.lastEdited || appointment.dateModified || new Date().toISOString().split('T')[0]
        }));
        
        setSurveys(surveysData);
      } else {
        console.warn('Invalid API response:', response);
        setSurveys([]);
      }
    } catch (err) {
      setError('Failed to load surveys in progress');
      console.error('Error fetching in-progress surveys:', err);
      // Set empty array on error instead of keeping old data
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInProgressSurveys();
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Surveys In Progress</Text>
        <Text style={styles.loadingMessage}>Loading surveys...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Surveys In Progress</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Card style={styles.retryCard} onPress={handleRefresh}>
          <Card.Content>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Surveys In Progress</Text>
      {surveys.length > 0 ? (
        surveys.map(survey => (
          <Card 
            key={survey.id} 
            style={styles.appointmentCard}
            onPress={() => onSurveyPress(survey.id)}
          >
            <Card.Content>
              <View style={styles.appointmentItem}>
                <MaterialCommunityIcons name="clipboard-edit" size={24} color="#f39c12" />
                <View style={styles.appointmentContent}>
                  <Text style={styles.appointmentAddress}>{survey.address}</Text>
                  <Text style={styles.appointmentDetails}>
                    {survey.client} • Last edited: {survey.lastEdited}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyMessage}>No surveys in progress</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  appointmentCard: {
    borderRadius: 12,
    marginBottom: 10,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  appointmentContent: {
    marginLeft: 15,
    flex: 1,
    backgroundColor: 'transparent',
  },
  appointmentAddress: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 15,
  },
  loadingMessage: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    padding: 15,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 14,
    padding: 15,
  },
  retryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
  },
}); 