import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { MediaFile } from '../../../../../utils/db';
import mediaService from '../../../../../services/mediaService';

export interface UsePhotoManagementProps {
  categoryId: string;
  onSyncStatusChange?: (pendingChangesCount: number, syncing: boolean) => void;
}

export const usePhotoManagement = ({ categoryId, onSyncStatusChange }: UsePhotoManagementProps) => {
  const [itemPhotos, setItemPhotos] = useState<{ [key: string]: MediaFile[] }>({});
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoItemId, setCurrentPhotoItemId] = useState<string | null>(null);
  const [addingAnotherPhoto, setAddingAnotherPhoto] = useState(false);

  // Load photos for an item
  const loadPhotos = useCallback(async (itemId: string) => {
    try {
      const photos = await mediaService.getPhotosForEntity('risk_assessment_items', parseInt(itemId));
      setItemPhotos(prev => ({
        ...prev,
        [itemId]: photos
      }));
    } catch (error) {
      console.error('❌ Error loading photos for item:', itemId, error);
    }
  }, [categoryId]);

  // Take photo
  const takePhoto = useCallback(async () => {
    if (!currentPhotoItemId) return;

    try {
      // This would need to be implemented in mediaService
      // For now, we'll use a placeholder
      console.log('Taking photo for item:', currentPhotoItemId);
      
      // Update sync status
      if (onSyncStatusChange) {
        onSyncStatusChange(1, false);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setShowCamera(false);
      setCurrentPhotoItemId(null);
      setAddingAnotherPhoto(false);
    }
  }, [currentPhotoItemId, categoryId, onSyncStatusChange]);

  // Select from gallery
  const selectFromGallery = useCallback(async () => {
    if (!currentPhotoItemId) return;

    try {
      // This would need to be implemented in mediaService
      // For now, we'll use a placeholder
      console.log('Selecting from gallery for item:', currentPhotoItemId);
      
      // Update sync status
      if (onSyncStatusChange) {
        onSyncStatusChange(1, false);
      }
    } catch (error) {
      console.error('❌ Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setShowCamera(false);
      setCurrentPhotoItemId(null);
      setAddingAnotherPhoto(false);
    }
  }, [currentPhotoItemId, categoryId, onSyncStatusChange]);

  // Handle take photo action
  const handleTakePhoto = useCallback((itemId: string) => {
    setCurrentPhotoItemId(itemId);
    setShowCamera(true);
  }, []);

  // Handle view photos action
  const handleViewPhotos = useCallback((itemId: string) => {
    setCurrentPhotoItemId(itemId);
    setShowPhotoGallery(true);
  }, []);

  // Handle delete photo
  const handleDeletePhoto = useCallback(async (photoId: number) => {
    try {
      await mediaService.deletePhoto(photoId);
      
      // Remove from local state
      if (currentPhotoItemId) {
        setItemPhotos(prev => ({
          ...prev,
          [currentPhotoItemId]: prev[currentPhotoItemId]?.filter(p => p.MediaID !== photoId) || []
        }));
      }

      // Update sync status
      if (onSyncStatusChange) {
        onSyncStatusChange(1, false);
      }
    } catch (error) {
      console.error('❌ Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  }, [currentPhotoItemId, onSyncStatusChange]);

  return {
    itemPhotos,
    showCamera,
    showPhotoGallery,
    currentPhotoItemId,
    loadPhotos,
    takePhoto,
    selectFromGallery,
    handleTakePhoto,
    handleViewPhotos,
    handleDeletePhoto,
    setShowCamera,
    setShowPhotoGallery,
    setCurrentPhotoItemId,
    setAddingAnotherPhoto
  };
}; 