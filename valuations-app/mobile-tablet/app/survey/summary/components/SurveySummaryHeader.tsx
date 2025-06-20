import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SurveySummaryHeaderProps {
  client: string;
  address: string;
  completionDate: string;
}

export default function SurveySummaryHeader({ client, address, completionDate }: SurveySummaryHeaderProps) {
  return (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.statusRow}>
          <Chip 
            style={styles.statusChip} 
            textStyle={styles.statusChipText}
            icon="check-circle"
          >
            Completed
          </Chip>
          <Text style={styles.completionDate}>Submitted: {completionDate}</Text>
        </View>
        
        <Text style={styles.clientName}>{client}</Text>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#2ecc71" />
          <Text style={styles.addressText}>{address}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    backgroundColor: '#e8f6ef',
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    color: '#27ae60',
  },
  completionDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
}); 