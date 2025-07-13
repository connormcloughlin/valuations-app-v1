import React from 'react';
import { View, Text } from 'react-native';
import { Card, DataTable, IconButton } from 'react-native-paper';
import { UserItemsTableProps, Item } from './types';
import { userItemsTableStyles } from '../../../GlobalStyles';

export default function UserItemsTable({ items, totalValue, onDeleteItem }: UserItemsTableProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card style={userItemsTableStyles.card}>
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
                <View style={userItemsTableStyles.itemDescriptionCell}>
                  {item.photo && <View style={userItemsTableStyles.photoIndicator} />}
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
        
        <DataTable.Row style={userItemsTableStyles.totalRow}>
          <DataTable.Cell><Text style={userItemsTableStyles.totalLabel}>Total</Text></DataTable.Cell>
          <DataTable.Cell>{' '}</DataTable.Cell>
          <DataTable.Cell>{' '}</DataTable.Cell>
          <DataTable.Cell numeric><Text style={userItemsTableStyles.totalValue}>R{totalValue.toLocaleString()}</Text></DataTable.Cell>
          <DataTable.Cell>{' '}</DataTable.Cell>
        </DataTable.Row>
      </DataTable>
    </Card>
  );
}

