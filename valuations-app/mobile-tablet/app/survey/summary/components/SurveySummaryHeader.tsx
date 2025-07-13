import React from 'react';
import { View, Text } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { surveySummaryHeaderStyles } from '../../../GlobalStyles';

interface SurveySummaryHeaderProps {
  client: string;
  address: string;
  completionDate: string;
}

export default function SurveySummaryHeader({ client, address, completionDate }: SurveySummaryHeaderProps) {
  return (
    <Card style={surveySummaryHeaderStyles.headerCard}>
      <Card.Content>
        <View style={surveySummaryHeaderStyles.statusRow}>
          <Chip 
            style={surveySummaryHeaderStyles.statusChip} 
            textStyle={surveySummaryHeaderStyles.statusChipText}
            icon="check-circle"
          >
            Completed
          </Chip>
          <Text style={surveySummaryHeaderStyles.completionDate}>Submitted: {completionDate}</Text>
        </View>
        
        <Text style={surveySummaryHeaderStyles.clientName}>{client}</Text>
        <View style={surveySummaryHeaderStyles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#2ecc71" />
          <Text style={surveySummaryHeaderStyles.addressText}>{address}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

