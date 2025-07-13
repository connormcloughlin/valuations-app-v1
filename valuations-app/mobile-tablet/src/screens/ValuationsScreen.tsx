import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { valuationsScreenStyles } from '../../app/GlobalStyles';

const mockValuations = [
  { id: '1', address: '123 Main St', date: '2024-03-15', value: '$500,000' },
  { id: '2', address: '456 Oak Ave', date: '2024-03-10', value: '$750,000' },
  { id: '3', address: '789 Pine Rd', date: '2024-03-05', value: '$600,000' },
];

const ValuationsScreen = () => {
  const renderItem = ({ item }: { item: typeof mockValuations[0] }) => (
    <View style={valuationsScreenStyles.valuationItem}>
      <Text style={valuationsScreenStyles.address}>{item.address}</Text>
      <Text style={valuationsScreenStyles.details}>Date: {item.date}</Text>
      <Text style={valuationsScreenStyles.details}>Value: {item.value}</Text>
    </View>
  );

  return (
    <View style={valuationsScreenStyles.container}>
      <Text style={valuationsScreenStyles.title}>Recent Valuations</Text>
      <FlatList
        data={mockValuations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={valuationsScreenStyles.list}
      />
    </View>
  );
};

export default ValuationsScreen; 