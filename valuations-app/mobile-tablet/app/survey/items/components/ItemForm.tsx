import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Card, IconButton, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemFormProps, Item } from './types';

export default function ItemForm({
  currentItem,
  onUpdateItem,
  handwritingEnabled,
  hasRooms,
  includeRooms,
  photo,
  onCancel,
  onSave,
  onDelete,
  onOpenCamera,
  onOpenHandwriting
}: ItemFormProps) {

  const updateItem = (field: keyof Item, value: string) => {
    onUpdateItem({ ...currentItem, [field]: value });
  };

  return (
    <Card style={styles.card}>
      <Card.Title 
        title={currentItem.id ? "Edit Item" : "Add New Item"} 
        right={(props) => (
          <View style={styles.headerButtons}>
            <IconButton
              {...props}
              icon="camera"
              onPress={onOpenCamera}
              iconColor="#4a90e2"
            />
            {onDelete && currentItem.id && (
              <IconButton
                {...props}
                icon="delete"
                onPress={onDelete}
                iconColor="#e74c3c"
              />
            )}
          </View>
        )}
      />
      <Card.Content>
        {photo && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo }} style={styles.photoImage} />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={currentItem.description}
              onChangeText={(text) => updateItem('description', text)}
              placeholder="Enter item description"
            />
            {handwritingEnabled && (
              <TouchableOpacity
                style={styles.handwritingButton}
                onPress={() => onOpenHandwriting('description')}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasRooms && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Room</Text>
            <View style={styles.roomButtons}>
              {includeRooms.map((room) => (
                <TouchableOpacity
                  key={room}
                  style={[
                    styles.roomButton,
                    currentItem.room === room && styles.roomButtonSelected
                  ]}
                  onPress={() => updateItem('room', room)}
                >
                  <Text
                    style={[
                      styles.roomButtonText,
                      currentItem.room === room && styles.roomButtonTextSelected
                    ]}
                  >
                    {room}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formRow}>
          <View style={styles.quantityField}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={currentItem.quantity}
                onChangeText={(text) => updateItem('quantity', text)}
                keyboardType="numeric"
                placeholder="1"
              />
              {handwritingEnabled && (
                <TouchableOpacity
                  style={styles.handwritingButton}
                  onPress={() => onOpenHandwriting('quantity')}
                >
                  <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.priceField}>
            <Text style={styles.label}>Price (R)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={currentItem.price}
                onChangeText={(text) => updateItem('price', text)}
                keyboardType="numeric"
                placeholder="0.00"
              />
              {handwritingEnabled && (
                <TouchableOpacity
                  style={styles.handwritingButton}
                  onPress={() => onOpenHandwriting('price')}
                >
                  <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={currentItem.notes}
            onChangeText={(text) => updateItem('notes', text)}
            placeholder="Enter any additional notes"
            multiline
          />
        </View>

        <View style={styles.formButtons}>
          {onDelete && currentItem.id && (
            <Button
              mode="outlined"
              onPress={onDelete}
              style={styles.deleteButton}
              icon="delete"
              textColor="#e74c3c"
            >
              Delete
            </Button>
          )}
          <View style={styles.rightButtons}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={onSave}
              style={styles.saveButton}
              disabled={!currentItem.description || !currentItem.price}
            >
              {currentItem.id ? "Save Changes" : "Add Item"}
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handwritingButton: {
    padding: 10,
    marginLeft: -44,
    zIndex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityField: {
    flex: 1,
    marginRight: 8,
  },
  priceField: {
    flex: 2,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  roomButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginHorizontal: -4,
  },
  roomButton: {
    backgroundColor: '#f0f4f7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  roomButtonSelected: {
    backgroundColor: '#4a90e2',
  },
  roomButtonText: {
    fontSize: 12,
    color: '#34495e',
  },
  roomButtonTextSelected: {
    color: '#fff',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    borderColor: '#e74c3c',
  },
  cancelButton: {
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
}); 