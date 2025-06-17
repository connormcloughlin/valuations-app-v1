import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraModalProps } from './types';

export default function CameraModal({
  visible,
  onClose,
  onTakePhoto,
  onSelectFromGallery
}: CameraModalProps) {

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onClose}
            />
          </View>
          
          <View style={styles.photoOptionsContainer}>
            <TouchableOpacity
              style={styles.photoOption}
              onPress={onTakePhoto}
            >
              <MaterialCommunityIcons name="camera" size={48} color="#4a90e2" />
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoOption}
              onPress={onSelectFromGallery}
            >
              <MaterialCommunityIcons name="image" size={48} color="#4a90e2" />
              <Text style={styles.photoOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  photoOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 32,
  },
  photoOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f4f7',
    width: '45%',
  },
  photoOptionText: {
    marginTop: 12,
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
  },
}); 