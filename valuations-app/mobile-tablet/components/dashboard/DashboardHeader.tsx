import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { dashboardHeaderStyles } from '../../app/GlobalStyles';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title = "Welcome Back!",
  subtitle = "Your valuation dashboard "
}) => {
  const { user } = useAuth();
  
  // Extract first name from user's full name
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <View style={dashboardHeaderStyles.header}>
      <Text style={dashboardHeaderStyles.title}>{title} {firstName}!</Text>
      <Text style={dashboardHeaderStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}; 