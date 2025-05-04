import { StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Mock appointment data
const appointmentData = {
  scheduled: [
    { id: '1001', address: '123 Main St', client: 'M.R. Gumede', date: '2024-04-30 09:00', policyNo: 'K 82 mil' },
    { id: '1002', address: '456 Oak Ave', client: 'T. Mbatha', date: '2024-05-02 14:00', policyNo: 'P 56 mil' },
  ],
  inProgress: [
    { id: '1003', address: '789 Pine Rd', client: 'S. Naidoo', date: '2024-04-25 10:00', policyNo: 'J 12 mil', lastEdited: '2024-04-25' },
  ],
  completed: [
    { id: '1004', address: '29 Killarney Avenue', client: 'J. Smith', date: '2024-04-20 11:30', policyNo: 'L 94 mil', submitted: '2024-04-20' },
    { id: '1005', address: '12 Beach Road', client: 'L. Johnson', date: '2024-04-18 15:00', policyNo: 'M 17 mil', submitted: '2024-04-18' },
    { id: '1006', address: '45 Mountain View', client: 'P. Williams', date: '2024-04-15 09:30', policyNo: 'N 63 mil', submitted: '2024-04-15' },
  ]
};

export default function Dashboard() {
  const navigateToAppointment = (id: string, status: 'scheduled' | 'inProgress' | 'completed') => {
    // Route to different screens based on appointment status
    if (status === 'scheduled') {
      router.push({
        pathname: '/appointment/[id]',
        params: { id }
      });
    } else if (status === 'inProgress') {
      router.push({
        pathname: '/survey/[id]',
        params: { id }
      });
    } else {
      router.push({
        pathname: '/survey/summary/[id]',
        params: { id }
      });
    }
  };
  
  const totalScheduled = appointmentData.scheduled.length;
  const totalInProgress = appointmentData.inProgress.length;
  const totalCompleted = appointmentData.completed.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Your valuation dashboard</Text>
      </View>

      <View style={styles.cardsContainer}>
        <Card style={styles.card} onPress={() => router.push('/appointments/scheduled')}>
          <Card.Content>
            <MaterialCommunityIcons name="calendar-clock" size={32} color="#4a90e2" />
            <Text style={styles.cardTitle}>Scheduled</Text>
            <Text style={styles.cardCount}>{totalScheduled}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => router.push('/appointments/in-progress')}>
          <Card.Content>
            <MaterialCommunityIcons name="clipboard-edit-outline" size={32} color="#f39c12" />
            <Text style={styles.cardTitle}>In Progress</Text>
            <Text style={styles.cardCount}>{totalInProgress}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => router.push('/appointments/completed')}>
          <Card.Content>
            <MaterialCommunityIcons name="clipboard-check" size={32} color="#2ecc71" />
            <Text style={styles.cardTitle}>Completed</Text>
            <Text style={styles.cardCount}>{totalCompleted}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => router.push('/sync')}>
          <Card.Content>
            <MaterialCommunityIcons name="cloud-sync" size={32} color="#95a5a6" />
            <Text style={styles.cardTitle}>Sync</Text>
            <Text style={styles.syncStatus}>Last: Today 11:45</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        {appointmentData.scheduled.length > 0 ? (
          appointmentData.scheduled.map(appointment => (
            <Card 
              key={appointment.id} 
              style={styles.appointmentCard}
              onPress={() => navigateToAppointment(appointment.id, 'scheduled')}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Surveys In Progress</Text>
        {appointmentData.inProgress.length > 0 ? (
          appointmentData.inProgress.map(appointment => (
            <Card 
              key={appointment.id} 
              style={styles.appointmentCard}
              onPress={() => navigateToAppointment(appointment.id, 'inProgress')}
            >
              <Card.Content>
                <View style={styles.appointmentItem}>
                  <MaterialCommunityIcons name="clipboard-edit" size={24} color="#f39c12" />
                  <View style={styles.appointmentContent}>
                    <Text style={styles.appointmentAddress}>{appointment.address}</Text>
                    <Text style={styles.appointmentDetails}>
                      {appointment.client} • Last edited: {appointment.lastEdited}
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

      <Button 
        mode="contained" 
        onPress={() => {
          console.log('NAVIGATION: Button pressed, navigating to test-page');
          router.push('/test-page');
        }}
        style={{ backgroundColor: '#4a90e2' }}
      >
        Combined View
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: 'transparent',
  },
  card: {
    width: '45%',
    margin: '2.5%',
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 10,
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  syncStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
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
});
