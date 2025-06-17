import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

interface SurveyDetailsProps {
  client: string;
  orderNumber: string;
  policyNo: string;
  sumInsured: string;
  broker: string;
  lastEdited: string;
}

export default function SurveyDetails({ 
  client, 
  orderNumber, 
  policyNo, 
  sumInsured, 
  broker, 
  lastEdited 
}: SurveyDetailsProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Survey Details</Text>
      <Card style={styles.detailsCard}>
        <Card.Content>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client:</Text>
            <Text style={styles.detailValue}>{client}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number:</Text>
            <Text style={styles.detailValue}>{orderNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Policy Number:</Text>
            <Text style={styles.detailValue}>{policyNo}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sum Insured:</Text>
            <Text style={styles.detailValue}>{sumInsured}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Broker:</Text>
            <Text style={styles.detailValue}>{broker}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Edited:</Text>
            <Text style={styles.detailValue}>{lastEdited}</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailsCard: {
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
}); 