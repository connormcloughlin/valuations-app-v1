import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { logNavigation } from '../../utils/logger';
import { valuationsTabStyles } from '../GlobalStyles';

const mockValuations = [
  { id: '1', address: '123 Main St', date: '2024-03-15', value: '$500,000' },
  { id: '2', address: '456 Oak Ave', date: '2024-03-10', value: '$750,000' },
  { id: '3', address: '789 Pine Rd', date: '2024-03-05', value: '$600,000' },
];

export default function ValuationsScreen() {
  logNavigation('Valuations Screen');
  const renderItem = ({ item }: { item: typeof mockValuations[0] }) => (
    <View style={valuationsTabStyles.valuationItem}>
      <Text style={valuationsTabStyles.address}>{item.address}</Text>
      <Text style={valuationsTabStyles.details}>Date: {item.date}</Text>
      <Text style={valuationsTabStyles.details}>Value: {item.value}</Text>
    </View>
  );

  return (
    <View style={valuationsTabStyles.container}>
      <Text style={valuationsTabStyles.title}>Recent Valuations</Text>
      <FlatList
        data={mockValuations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={valuationsTabStyles.list}
      />
    </View>
  );
} 