import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Card, IconButton, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemFormProps, Item } from './types';
import { colors, spacing, borderRadius, typography, commonStyles } from '../../../GlobalStyles';

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
        <View style={styles.headerButtons}>
          {onOpenCamera && (
            <Button
              mode="outlined"
              onPress={onOpenCamera}
              icon="camera"
              style={styles.cameraButton}
            >
              {photo ? "Change Photo" : "Add Photo"}
            </Button>
          )}
        </View>

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
                <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasRooms && includeRooms && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Room</Text>
            <View style={styles.roomButtons}>
              {['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office', 'Other'].map((room) => (
                <TouchableOpacity
                  key={room}
                  style={[
                    styles.roomButton,
                    currentItem.room === room && styles.roomButtonSelected
                  ]}
                  onPress={() => updateItem('room', room)}
                >
                  <Text style={[
                    styles.roomButtonText,
                    currentItem.room === room && styles.roomButtonTextSelected
                  ]}>
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
                  <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
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
                  <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
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
              textColor={colors.error}
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
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraButton: {
    marginBottom: spacing.md,
  },
  photoPreview: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: colors.gray[50],
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handwritingButton: {
    padding: spacing.sm,
    marginLeft: -44,
    zIndex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityField: {
    flex: 1,
    marginRight: spacing.sm,
  },
  priceField: {
    flex: 2,
  },
  label: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  roomButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    marginHorizontal: -spacing.xs,
  },
  roomButton: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    margin: spacing.xs,
  },
  roomButtonSelected: {
    backgroundColor: colors.primary,
  },
  roomButtonText: {
    fontSize: typography.sm,
    color: colors.secondaryLight,
  },
  roomButtonTextSelected: {
    color: colors.white,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    borderColor: colors.error,
  },
  cancelButton: {
    marginRight: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
}); 