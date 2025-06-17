import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { IconButton, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MediaFile } from '../../../../utils/db';

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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photos ({photos.length})</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={onClose}
              />
            </View>
            
            {photos.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="camera-off" size={48} color="#bdc3c7" />
                <Text style={styles.emptyStateText}>No photos taken yet</Text>
                <Button
                  mode="contained"
                  onPress={onTakeNewPhoto}
                  style={styles.takePhotoButton}
                  icon="camera"
                >
                  Take First Photo
                </Button>
              </View>
            ) : (
              <>
                <ScrollView style={styles.photosContainer} contentContainerStyle={styles.photosGrid}>
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={photo.MediaID || index}
                      style={styles.photoThumbnail}
                      onPress={() => viewFullImage(photo)}
                    >
                      <Image
                        source={{ uri: photo.LocalPath || photo.BlobURL }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      <View style={styles.photoOverlay}>
                        <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePhoto(photo)}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <View style={styles.bottomActions}>
                  <Button
                    mode="contained"
                    onPress={onTakeNewPhoto}
                    style={styles.addPhotoButton}
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
        <View style={styles.fullImageContainer}>
          <TouchableOpacity
            style={styles.fullImageCloseButton}
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
                style={styles.fullImage}
                resizeMode="contain"
              />
              
              <View style={styles.fullImageActions}>
                <Button
                  mode="outlined"
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                  style={styles.deletePhotoButton}
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  takePhotoButton: {
    backgroundColor: '#4a90e2',
  },
  photosContainer: {
    maxHeight: 400,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  bottomActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addPhotoButton: {
    backgroundColor: '#4a90e2',
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: '90%',
    height: '70%',
  },
  fullImageActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  deletePhotoButton: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
}); 