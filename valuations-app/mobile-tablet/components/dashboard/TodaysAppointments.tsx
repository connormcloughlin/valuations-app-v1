import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Appointment {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
}

interface TodaysAppointmentsProps {
  onAppointmentPress: (id: string) => void;
}

export const TodaysAppointments: React.FC<TodaysAppointmentsProps> = ({ onAppointmentPress }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  const fetchTodaysAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await api.getTodaysAppointments();
      // setAppointments(response.data);
      
      // For now, using mock data (simulate API delay)
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const mockData: Appointment[] = [
        { 
          id: '1001', 
          address: '123 Main St', 
          client: 'M.R. Gumede', 
          date: '2024-04-30 09:00', 
          policyNo: 'K 82 mil' 
        },
        { 
          id: '1002', 
          address: '456 Oak Ave', 
          client: 'T. Mbatha', 
          date: '2024-05-02 14:00', 
          policyNo: 'P 56 mil' 
        },
      ];
      
      setAppointments(mockData);
    } catch (err) {
      setError('Failed to load today\'s appointments');
      console.error('Error fetching today\'s appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTodaysAppointments();
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        <Text style={styles.loadingMessage}>Loading appointments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
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
      <Text style={styles.sectionTitle}>Today's Appointments</Text>
      {appointments.length > 0 ? (
        appointments.map(appointment => (
          <Card 
            key={appointment.id} 
            style={styles.appointmentCard}
            onPress={() => onAppointmentPress(appointment.id)}
          >
            <Card.Content>
              <View style={styles.appointmentItem}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#4a90e2" />
                <View style={styles.appointmentContent}>
                  <Text style={styles.appointmentAddress}>{appointment.address}</Text>
                  <Text style={styles.appointmentDetails}>
                    {appointment.client} • {appointment.date.split(' ')[1]}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyMessage}>No appointments scheduled for today</Text>
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