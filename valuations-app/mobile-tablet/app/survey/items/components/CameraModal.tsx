import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraModalProps } from './types';
import { cameraModalStyles } from '../../../GlobalStyles';

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
      <View style={cameraModalStyles.modalContainer}>
        <View style={cameraModalStyles.modalContent}>
          <View style={cameraModalStyles.modalHeader}>
            <Text style={cameraModalStyles.modalTitle}>Add Photo</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onClose}
            />
          </View>
          
          <View style={cameraModalStyles.photoOptionsContainer}>
            <TouchableOpacity
              style={cameraModalStyles.photoOption}
              onPress={onTakePhoto}
            >
              <MaterialCommunityIcons name="camera" size={48} color="#4a90e2" />
              <Text style={cameraModalStyles.photoOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={cameraModalStyles.photoOption}
              onPress={onSelectFromGallery}
            >
              <MaterialCommunityIcons name="image" size={48} color="#4a90e2" />
              <Text style={cameraModalStyles.photoOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

