import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { IconButton, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MediaFile } from '../../../../utils/db';
import { photoGalleryModalStyles } from '../../../GlobalStyles';

interface PhotoGalleryModalProps {
  visible: boolean;
  photos: MediaFile[];
  onClose: () => void;
  onDeletePhoto: (photoId: number) => void;
  onTakeNewPhoto: () => void;
}

export default function PhotoGalleryModal({
  visible,
  photos,
  onClose,
  onDeletePhoto,
  onTakeNewPhoto
}: PhotoGalleryModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<MediaFile | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  // Debug: Log when photos change
  useEffect(() => {
    console.log('PhotoGalleryModal: Photos updated, count:', photos.length);
  }, [photos]);

  const handleDeletePhoto = (photo: MediaFile) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDeletePhoto(photo.MediaID || 0);
            setSelectedPhoto(null);
            setShowFullImage(false);
          }
        }
      ]
    );
  };

  const viewFullImage = (photo: MediaFile) => {
    setSelectedPhoto(photo);
    setShowFullImage(true);
  };

  return (
    <>
      {/* Main Photo Gallery Modal */}
      <Modal
        visible={visible && !showFullImage}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={photoGalleryModalStyles.modalContainer}>
          <View style={photoGalleryModalStyles.modalContent}>
            <View style={photoGalleryModalStyles.modalHeader}>
              <Text style={photoGalleryModalStyles.modalTitle}>Photos ({photos.length})</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={onClose}
              />
            </View>
            
            {photos.length === 0 ? (
              <View style={photoGalleryModalStyles.emptyState}>
                <MaterialCommunityIcons name="camera-off" size={48} color="#bdc3c7" />
                <Text style={photoGalleryModalStyles.emptyStateText}>No photos taken yet</Text>
                <Button
                  mode="contained"
                  onPress={onTakeNewPhoto}
                  style={photoGalleryModalStyles.takePhotoButton}
                  icon="camera"
                >
                  Take First Photo
                </Button>
              </View>
            ) : (
              <>
                <ScrollView style={photoGalleryModalStyles.photosContainer} contentContainerStyle={photoGalleryModalStyles.photosGrid}>
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={photo.MediaID || index}
                      style={photoGalleryModalStyles.photoThumbnail}
                      onPress={() => viewFullImage(photo)}
                    >
                      <Image
                        source={{ uri: photo.LocalPath || photo.BlobURL }}
                        style={photoGalleryModalStyles.thumbnailImage}
                        resizeMode="cover"
                      />
                      <View style={photoGalleryModalStyles.photoOverlay}>
                        <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      </View>
                      <TouchableOpacity
                        style={photoGalleryModalStyles.deleteButton}
                        onPress={() => handleDeletePhoto(photo)}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <View style={photoGalleryModalStyles.bottomActions}>
                  <Button
                    mode="contained"
                    onPress={onTakeNewPhoto}
                    style={photoGalleryModalStyles.addPhotoButton}
                    icon="camera-plus"
                  >
                    Add Another Photo
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Full Image Modal */}
      <Modal
        visible={showFullImage && selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowFullImage(false);
          setSelectedPhoto(null);
        }}
      >
        <View style={photoGalleryModalStyles.fullImageContainer}>
          <TouchableOpacity
            style={photoGalleryModalStyles.fullImageCloseButton}
            onPress={() => {
              setShowFullImage(false);
              setSelectedPhoto(null);
            }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.LocalPath || selectedPhoto.BlobURL }}
                style={photoGalleryModalStyles.fullImage}
                resizeMode="contain"
              />
              
              <View style={photoGalleryModalStyles.fullImageActions}>
                <Button
                  mode="outlined"
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                  style={photoGalleryModalStyles.deletePhotoButton}
                  labelStyle={{ color: '#ff4444' }}
                  icon="delete"
                >
                  Delete Photo
                </Button>
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

