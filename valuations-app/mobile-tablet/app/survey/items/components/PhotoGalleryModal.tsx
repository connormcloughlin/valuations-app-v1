import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { IconButton, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MediaFile } from '../../../../utils/db';
import { photoGalleryModalStyles } from '../../../GlobalStyles';
import hybridImageService from '../../../../services/hybridImageService';

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
  const [processedImages, setProcessedImages] = useState<{ [mediaID: number]: string }>({});
  const [loadingImages, setLoadingImages] = useState<{ [mediaID: number]: boolean }>({});

  // Debug: Log when photos change
  useEffect(() => {
    console.log('PhotoGalleryModal: Photos updated, count:', photos.length);
  }, [photos]);

  // Clear processed images when photos change (e.g., after deletion)
  useEffect(() => {
    console.log('PhotoGalleryModal: Clearing processed images due to photos change');
    setProcessedImages({});
    setLoadingImages({});
  }, [photos]);

  // Process images when modal opens
  useEffect(() => {
    if (visible && photos.length > 0) {
      processImages();
    }
  }, [visible, photos]);

  // Process images through the hybrid image service
  const processImages = async () => {
    console.log('🖼️ PhotoGalleryModal: Processing images through hybrid image service');
    
    for (const photo of photos) {
      const mediaId = photo.MediaID;
      
      if (mediaId && !processedImages[mediaId] && !loadingImages[mediaId]) {
        setLoadingImages(prev => ({ ...prev, [mediaId]: true }));
        
        try {
          // Use hybrid image service with entity context
          const imageUrl = await hybridImageService.getImageUrl(
            mediaId, 
            photo.EntityName, 
            photo.EntityID
          );
          
          if (imageUrl) {
            setProcessedImages(prev => ({ ...prev, [mediaId]: imageUrl }));
            console.log(`🖼️ PhotoGalleryModal: Processed image for media ID ${mediaId}`);
          } else {
            console.error(`🖼️ PhotoGalleryModal: Failed to get image URL for media ID ${mediaId}`);
          }
        } catch (error) {
          console.error(`🖼️ PhotoGalleryModal: Error processing image for media ID ${mediaId}:`, error);
        } finally {
          setLoadingImages(prev => ({ ...prev, [mediaId]: false }));
        }
      }
    }
  };

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
            const mediaId = photo.MediaID;
            onDeletePhoto(mediaId || 0);
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
                  {photos.map((photo, index) => {
                    const mediaId = photo.MediaID;
                    const imageUrl = mediaId ? processedImages[mediaId] : null;
                    const isLoading = mediaId ? loadingImages[mediaId] : false;
                    
                    return (
                      <TouchableOpacity
                        key={mediaId || index}
                        style={photoGalleryModalStyles.photoThumbnail}
                        onPress={() => viewFullImage(photo)}
                      >
                        {isLoading ? (
                          <View style={[photoGalleryModalStyles.thumbnailImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                            <MaterialCommunityIcons name="loading" size={24} color="#666" />
                          </View>
                        ) : imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={photoGalleryModalStyles.thumbnailImage}
                            onError={(error) => {
                              console.log('📸 Image load error for photo:', {
                                MediaID: mediaId,
                                imageUrl,
                                error: error.nativeEvent.error
                              });
                            }}
                            onLoad={() => {
                              console.log('📸 Image loaded successfully:', {
                                MediaID: mediaId,
                                URL: imageUrl
                              });
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[photoGalleryModalStyles.thumbnailImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                            <MaterialCommunityIcons name="image-broken" size={24} color="#999" />
                            <Text style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4 }}>
                              API proxy required
                            </Text>
                          </View>
                        )}
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
                    );
                  })}
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
              {(() => {
                const mediaId = selectedPhoto.MediaID;
                const imageUrl = mediaId ? processedImages[mediaId] : null;
                const isLoading = mediaId ? loadingImages[mediaId] : false;
                
                if (isLoading) {
                  return (
                    <View style={[photoGalleryModalStyles.fullImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                      <MaterialCommunityIcons name="loading" size={48} color="#666" />
                      <Text style={{ marginTop: 16, color: '#666' }}>Loading image...</Text>
                    </View>
                  );
                } else if (imageUrl) {
                  return (
                    <Image
                      source={{ uri: imageUrl }}
                      style={photoGalleryModalStyles.fullImage}
                      resizeMode="contain"
                      onError={(error) => {
                        console.log('📸 Full image load error:', {
                          MediaID: selectedPhoto.MediaID,
                          imageUrl,
                          error: error.nativeEvent.error
                        });
                      }}
                      onLoad={() => {
                        console.log('📸 Full image loaded successfully:', {
                          MediaID: selectedPhoto.MediaID,
                          URL: imageUrl
                        });
                      }}
                    />
                  );
                } else {
                  return (
                    <View style={[photoGalleryModalStyles.fullImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                      <MaterialCommunityIcons name="image-broken" size={48} color="#999" />
                      <Text style={{ marginTop: 16, color: '#999', textAlign: 'center' }}>API proxy required</Text>
                      <Text style={{ marginTop: 8, color: '#666', textAlign: 'center', fontSize: 12 }}>
                        Backend endpoint /media/{mediaId}/image not implemented
                      </Text>
                    </View>
                  );
                }
              })()}
              
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

