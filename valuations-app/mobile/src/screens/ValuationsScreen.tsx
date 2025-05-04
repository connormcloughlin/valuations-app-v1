import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockValuations = [
  { id: '1', address: '123 Main St', date: '2024-03-15', value: '$500,000' },
  { id: '2', address: '456 Oak Ave', date: '2024-03-10', value: '$750,000' },
  { id: '3', address: '789 Pine Rd', date: '2024-03-05', value: '$600,000' },
];

const ValuationsScreen = () => {
  const renderItem = ({ item }: { item: typeof mockValuations[0] }) => (
    <View style={styles.valuationItem}>
      <Text style={styles.address}>{item.address}</Text>
      <Text style={styles.details}>Date: {item.date}</Text>
      <Text style={styles.details}>Value: {item.value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Valuations</Text>
      <FlatList
        data={mockValuations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  valuationItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  address: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
});

export default ValuationsScreen; 