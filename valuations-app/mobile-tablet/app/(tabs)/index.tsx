import { StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { TodaysAppointments } from '../../components/dashboard/TodaysAppointments';
import { SurveysInProgress } from '../../components/dashboard/SurveysInProgress';
import { DevelopmentTools } from '../../components/dashboard/DevelopmentTools';
import { dashboardStyles } from '../GlobalStyles';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const navigateToAppointment = (id: string, status: 'scheduled' | 'inProgress' | 'completed') => {
    // Route to different screens based on appointment status
    if (status === 'scheduled') {
      router.push({
        pathname: '/survey/[id]',
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

  const navigateToAppointmentDetails = (id: string) => {
    // Navigate to survey view for appointment details
    router.push({
      pathname: '/survey/[id]',
      params: { id }
    });
  };

  const handleCardPress = (cardType: 'scheduled' | 'inProgress' | 'completed' | 'finalise' | 'sync') => {
    switch (cardType) {
      case 'scheduled':
        router.push('/(tabs)/appointments/scheduled');
        break;
      case 'inProgress':
        router.push('/(tabs)/appointments/in-progress');
        break;
      case 'completed':
        router.push('/(tabs)/appointments/completed');
        break;
      case 'finalise':
        router.push('/(tabs)/appointments/finalise');
        break;
      case 'sync':
        router.push('/sync');
        break;
    }
  };

  // Show loading while auth is checking
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <DashboardHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center', color: '#666' }}>
            Please sign in to access the dashboard
          </Text>
          <Button mode="contained" onPress={() => router.push('/login')}>
            Sign In
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={dashboardStyles.container}>
      <DashboardHeader />
      <StatsCards onCardPress={handleCardPress} />
      <TodaysAppointments onAppointmentPress={navigateToAppointmentDetails} />
      <SurveysInProgress onSurveyPress={(id) => navigateToAppointment(id, 'inProgress')} />
      <DevelopmentTools />
    </ScrollView>
  );
}
