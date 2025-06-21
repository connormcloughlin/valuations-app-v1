import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, DataTable, IconButton } from 'react-native-paper';
import { UserItemsTableProps, Item } from './types';

export default function UserItemsTable({ items, totalValue, onDeleteItem }: UserItemsTableProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="Added Items" />
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Description</DataTable.Title>
          <DataTable.Title numeric>Qty</DataTable.Title>
          <DataTable.Title numeric>Price (R)</DataTable.Title>
          <DataTable.Title numeric>Total (R)</DataTable.Title>
          <DataTable.Title>{' '}</DataTable.Title>
        </DataTable.Header>
        
        {items.filter(item => (parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0) || (item.description && item.description.trim() !== '')).map((item: Item) => {
          const total = parseFloat(item.price) * parseInt(item.quantity || '1', 10);
          return (
            <DataTable.Row key={item.id}>
              <DataTable.Cell>
                <View style={styles.itemDescriptionCell}>
                  {item.photo && <View style={styles.photoIndicator} />}
                  <Text>{item.description || item.type}</Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
              <DataTable.Cell numeric>{parseFloat(item.price).toLocaleString()}</DataTable.Cell>
              <DataTable.Cell numeric>{total.toLocaleString()}</DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => onDeleteItem(item.id)}
                  iconColor="#e74c3c"
                />
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
        
        <DataTable.Row style={styles.totalRow}>
          <DataTable.Cell><Text style={styles.totalLabel}>Total</Text></DataTable.Cell>
          <DataTable.Cell>{' '}</DataTable.Cell>
          <DataTable.Cell>{' '}</DataTable.Cell>
          <DataTable.Cell numeric><Text style={styles.totalValue}>R{totalValue.toLocaleString()}</Text></DataTable.Cell>
          <DataTable.Cell>{' '}</DataTable.Cell>
        </DataTable.Row>
      </DataTable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  totalRow: {
    backgroundColor: '#f0f4f7',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#27ae60',
  },
  itemDescriptionCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a90e2',
    marginRight: 6,
  },
}); 