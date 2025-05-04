import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { Card, Button, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

// Define the appointment type
interface Appointment {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  orderNumber: string;
  submitted: string;
}

// Mock appointment data - would come from API in a real app
const appointmentData: Appointment[] = [
  { 
    id: '1004', 
    address: '29 Killarney Avenue', 
    client: 'J. Smith', 
    date: '2024-04-20 11:30', 
    policyNo: 'L 94 mil', 
    orderNumber: 'ORD-2024-1004',
    submitted: '2024-04-20'
  },
  { 
    id: '1005', 
    address: '12 Beach Road', 
    client: 'L. Johnson', 
    date: '2024-04-18 15:00', 
    policyNo: 'M 17 mil', 
    orderNumber: 'ORD-2024-1005',
    submitted: '2024-04-18'
  },
  { 
    id: '1006', 
    address: '45 Mountain View', 
    client: 'P. Williams', 
    date: '2024-04-15 09:30', 
    policyNo: 'N 63 mil', 
    orderNumber: 'ORD-2024-1006',
    submitted: '2024-04-15'
  },
];

export default function CompletedAppointmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState(appointmentData);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAppointments(appointmentData);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = appointmentData.filter(
        appointment => 
          appointment.client.toLowerCase().includes(query) ||
          appointment.address.toLowerCase().includes(query) ||
          appointment.orderNumber.toLowerCase().includes(query)
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery]);

  const navigateToSummary = (id: string) => {
    router.push({
      pathname: '/survey/summary/[id]',
      params: { id }
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <Card 
      style={styles.appointmentCard}
      onPress={() => navigateToSummary(item.id)}
    >
      <Card.Content>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#2ecc71" style={styles.icon} />
          <Text style={styles.appointmentAddress}>{item.address}</Text>
          <Chip 
            style={styles.statusChip} 
            textStyle={styles.statusChipText}
            icon="check-circle"
          >
            Completed
          </Chip>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.client}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-check" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Submitted: {item.submitted}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Order: {item.orderNumber}</Text>
          </View>
        </View>
        
        <Button 
          mode="outlined" 
          onPress={() => navigateToSummary(item.id)} 
          style={styles.viewButton}
          labelStyle={styles.buttonLabel}
        >
          View Summary
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Completed Surveys',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#2ecc71"
        />
        
        {filteredAppointments.length > 0 ? (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No completed surveys found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  appointmentAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusChip: {
    backgroundColor: '#e8f6ef',
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    color: '#27ae60',
  },
  appointmentDetails: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  viewButton: {
    marginTop: 4,
    borderColor: '#2ecc71',
    borderRadius: 4,
    height: 36,
  },
  buttonLabel: {
    fontSize: 12,
    marginVertical: 0,
    color: '#2ecc71',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 