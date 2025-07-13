import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../Themed';
import { dashboardHeaderStyles } from '../../app/GlobalStyles';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title = "Welcome Back!",
  subtitle = "Your valuation dashboard"
}) => {
  return (
    <View style={dashboardHeaderStyles.header}>
      <Text style={dashboardHeaderStyles.title}>{title}</Text>
      <Text style={dashboardHeaderStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}; 