import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Text } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
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
}

// Mock appointment data - would come from API in a real app
const appointmentData: Appointment[] = [
  { id: '1001', address: '123 Main St', client: 'M.R. Gumede', date: '2024-04-30 09:00', policyNo: 'K 82 mil', orderNumber: 'ORD-2024-1001' },
  { id: '1002', address: '456 Oak Ave', client: 'T. Mbatha', date: '2024-05-02 14:00', policyNo: 'P 56 mil', orderNumber: 'ORD-2024-1002' },
  { id: '1003', address: '789 Pine Rd', client: 'S. Naidoo', date: '2024-05-04 10:00', policyNo: 'J 12 mil', orderNumber: 'ORD-2024-1003' },
  { id: '1004', address: '29 Killarney Avenue', client: 'J. Smith', date: '2024-05-06 11:30', policyNo: 'L 94 mil', orderNumber: 'ORD-2024-1004' },
  { id: '1005', address: '12 Beach Road', client: 'L. Johnson', date: '2024-05-08 15:00', policyNo: 'M 17 mil', orderNumber: 'ORD-2024-1005' },
];

export default function ScheduledAppointmentsScreen() {
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

  const navigateToAppointment = (id: string) => {
    router.push({
      pathname: '/appointment/[id]',
      params: { id }
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <Card 
      style={styles.appointmentCard}
      onPress={() => navigateToAppointment(item.id)}
    >
      <Card.Content>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#4a90e2" style={styles.icon} />
          <Text style={styles.appointmentAddress}>{item.address}</Text>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.client}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#7f8c8d" style={styles.detailIcon} />
            <Text style={styles.detailText}>Order: {item.orderNumber}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scheduled Appointments',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      
      <View style={styles.container}>
        <Searchbar
          placeholder="Search by client, address or order no."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#4a90e2"
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
            <MaterialCommunityIcons name="calendar-search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
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
  appointmentDetails: {
    marginTop: 8,
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