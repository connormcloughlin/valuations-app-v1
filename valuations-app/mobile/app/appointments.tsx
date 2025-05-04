import React from 'react';
import { Button } from 'react-native';
import { useRouter } from 'expo-router';

const Appointments = () => {
  const router = useRouter();

  return (
    <Button 
      mode="contained" 
      onPress={() => router.push(`/survey/selector?appointmentId=${appointment.id}&orderId=${appointment.orderId}`)}
      style={styles.surveyButton}
    >
      Begin Survey
    </Button>
  );
};

export default Appointments; 