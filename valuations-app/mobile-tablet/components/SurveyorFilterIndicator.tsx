import React from 'react';
import { View, Text } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface SurveyorFilterIndicatorProps {
  appointmentCount?: number;
  showEmptyState?: boolean;
  /** Banner copy: `tasks` on the Tasks tab; default `appointments` for appointment screens. */
  resource?: 'appointments' | 'tasks';
}

export const SurveyorFilterIndicator: React.FC<SurveyorFilterIndicatorProps> = ({ 
  appointmentCount = 0, 
  showEmptyState = false,
  resource = 'appointments'
}) => {
  const { user } = useAuth();
  
  // Don't show indicator if no user or if user is admin
  if (!user || !user.email) {
    return null;
  }
  
  // Check if user appears to be a surveyor (not admin)
  const isSurveyor = user.email && !user.email.includes('admin') && !user.email.includes('manager');
  
  // Log user role for debugging
  const email = user.email.toLowerCase();
  let userRole = 'Surveyor'; // Default role
  
  if (email.includes('admin') || email.includes('administrator')) {
    userRole = 'Admin';
  } else if (email.includes('manager') || email.includes('supervisor')) {
    userRole = 'Manager';
  } else if (email.includes('office') || email.includes('backoffice')) {
    userRole = 'Office Staff';
  }
  
  console.log(`👤 SurveyorFilterIndicator - User role: ${userRole}, Email: ${user.email}, IsSurveyor: ${isSurveyor}`);
  
  if (!isSurveyor) {
    console.log(`👤 Not showing filter indicator for ${userRole} user`);
    return null;
  }
  
  if (showEmptyState && appointmentCount === 0) {
    return (
      <Card style={{ margin: 16, backgroundColor: '#f8f9fa' }}>
        <Card.Content style={{ alignItems: 'center', padding: 16 }}>
          <MaterialCommunityIcons 
            name="account-filter" 
            size={32} 
            color="#6c757d" 
            style={{ marginBottom: 8 }}
          />
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: '#495057',
            textAlign: 'center',
            marginBottom: 4
          }}>
            No appointments assigned to you
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#6c757d',
            textAlign: 'center'
          }}>
            You'll see appointments here once they're assigned to {user.email}
          </Text>
        </Card.Content>
      </Card>
    );
  }
  
  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginHorizontal: 16, 
      marginVertical: 8,
      backgroundColor: '#e3f2fd',
      padding: 12,
      borderRadius: 8
    }}>
      <MaterialCommunityIcons name="account-filter" size={20} color="#1976d2" />
      <Text style={{ 
        marginLeft: 8, 
        fontSize: 14, 
        color: '#1976d2',
        flex: 1
      }}>
        Showing your assigned {resource} ({appointmentCount} found)
      </Text>
      <Chip 
        mode="outlined" 
        compact
        textStyle={{ fontSize: 12 }}
        style={{ backgroundColor: 'white' }}
      >
        Filtered
      </Chip>
    </View>
  );
};
