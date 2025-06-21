import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { TodaysAppointments } from '../../components/dashboard/TodaysAppointments';
import { SurveysInProgress } from '../../components/dashboard/SurveysInProgress';
import { DevelopmentTools } from '../../components/dashboard/DevelopmentTools';



export default function Dashboard() {
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
    router.push({
      pathname: '/(tabs)/appointments/[id]' as any,
      params: { id }
    });
  };

  const handleCardPress = (cardType: 'scheduled' | 'inProgress' | 'completed' | 'sync') => {
    switch (cardType) {
      case 'scheduled':
        router.push('/(tabs)/appointments/scheduled');
        break;
      case 'inProgress':
        router.push('/appointments/in-progress');
        break;
      case 'completed':
        router.push('/appointments/completed');
        break;
      case 'sync':
        router.push('/sync');
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <DashboardHeader />
      
      <StatsCards onCardPress={handleCardPress} />
      
      <TodaysAppointments 
        onAppointmentPress={navigateToAppointmentDetails} 
      />

      <SurveysInProgress 
        onSurveyPress={(id) => navigateToAppointment(id, 'inProgress')} 
      />

      <DevelopmentTools />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});
