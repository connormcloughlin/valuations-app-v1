import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSurveyData } from './SurveyDataProvider';
import { useSurveyNavigation } from './SurveyNavigationHandlers';
import riskAssessmentSyncService from '../../../services/riskAssessmentSyncService';
import mediaService from '../../../services/mediaService';
import type { MediaFile } from '../../../utils/db';
import { CameraModal, PhotoGalleryModal } from '../items/components';

// Import existing components
import SurveyHeader from './SurveyHeader';
import SurveyDetails from './SurveyDetails';
import RiskAssessmentTemplates from './RiskAssessmentTemplates';
import CategoriesList from './CategoriesList';
import SurveyActions from './SurveyActions';

// Import GlobalStyles constants
import { colors, spacing, borderRadius, typography } from '../../GlobalStyles';

const ImagePicker = require('expo-image-picker');

interface SurveyMainContentProps {
  surveyId: string;
}

export const SurveyMainContent: React.FC<SurveyMainContentProps> = ({ surveyId }) => {
  const {
    survey,
    categories,
    categoriesLoading,
    categoriesError,
    selectedSectionTitle,
    fetchCategories,
  } = useSurveyData();

  const {
    navigateToCategory,
    handleTemplateSelection,
    continueSurvey,
    finishSurvey,
  } = useSurveyNavigation({ survey, surveyId });

  const [syncing, setSyncing] = useState(false);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [showAppointmentPhotoModal, setShowAppointmentPhotoModal] = useState(false);
  const [showAppointmentPhotoGallery, setShowAppointmentPhotoGallery] = useState(false);
  const [appointmentPhotos, setAppointmentPhotos] = useState<MediaFile[]>([]);
  const [appointmentPhotoCount, setAppointmentPhotoCount] = useState(0);
  const [templatePhotoTarget, setTemplatePhotoTarget] = useState<{ templateId: string; templateName: string } | null>(null);
  const [showTemplatePhotoGallery, setShowTemplatePhotoGallery] = useState(false);
  const [templateGalleryPhotos, setTemplateGalleryPhotos] = useState<MediaFile[]>([]);
  const [templateGalleryTarget, setTemplateGalleryTarget] = useState<{ templateId: string; templateName: string } | null>(null);
  const [templatePhotosRefreshKey, setTemplatePhotosRefreshKey] = useState(0);
  const [sectionPhotoTarget, setSectionPhotoTarget] = useState<{ sectionId: string; sectionName: string } | null>(null);
  const [showSectionPhotoGallery, setShowSectionPhotoGallery] = useState(false);
  const [sectionGalleryPhotos, setSectionGalleryPhotos] = useState<MediaFile[]>([]);
  const [sectionGalleryTarget, setSectionGalleryTarget] = useState<{ sectionId: string; sectionName: string } | null>(null);
  const [categoryPhotoTarget, setCategoryPhotoTarget] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [showCategoryPhotoGallery, setShowCategoryPhotoGallery] = useState(false);
  const [categoryGalleryPhotos, setCategoryGalleryPhotos] = useState<MediaFile[]>([]);
  const [categoryGalleryTarget, setCategoryGalleryTarget] = useState<{ categoryId: string; categoryName: string } | null>(null);

  // Order form photos: entityName = 'orderform', entityID = order number (from survey)
  const orderId = survey ? parseInt(survey.orderNumber ?? '', 10) : NaN;
  const canAddOrderFormPhotos = !isNaN(orderId);

  const refreshOrderFormPhotoCount = useCallback(async () => {
    if (!canAddOrderFormPhotos) return;
    try {
      const photos = await mediaService.getPhotosForEntity('orderform', orderId);
      setAppointmentPhotoCount(photos.length);
    } catch (error) {
      console.error('Error fetching order form photos:', error);
      setAppointmentPhotoCount(0);
    }
  }, [orderId, canAddOrderFormPhotos]);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await riskAssessmentSyncService.getPendingChangesCount();
      setPendingChangesCount(count.total);
    } catch (error) {
      console.error('Error fetching pending changes count:', error);
      setPendingChangesCount(0);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (canAddOrderFormPhotos) {
      refreshOrderFormPhotoCount();
    }
  }, [canAddOrderFormPhotos, refreshOrderFormPhotoCount]);

  // Refresh pending count and order form photos when user navigates back to this screen (e.g. from categories)
  useFocusEffect(
    useCallback(() => {
      refreshPendingCount();
      if (canAddOrderFormPhotos) {
        refreshOrderFormPhotoCount();
      }
    }, [refreshPendingCount, canAddOrderFormPhotos, refreshOrderFormPhotoCount])
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await riskAssessmentSyncService.syncPendingChanges();
      if (result.success) {
        const message = result.synced && (result.synced.riskAssessmentItems > 0 || result.synced.appointments > 0 || result.synced.riskAssessmentMasters > 0)
          ? `Successfully synced ${result.synced.riskAssessmentItems} risk assessment items, ${result.synced.riskAssessmentMasters} assessments, and ${result.synced.appointments} appointments.`
          : (result.message || 'No pending changes to sync.');
        Alert.alert('Sync Complete', message, [{ text: 'OK' }]);
        await refreshPendingCount();
      } else {
        Alert.alert(
          'Sync Failed',
          result.error || 'Failed to sync changes to server. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(
        'Sync Error',
        'An unexpected error occurred during sync. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSyncing(false);
    }
  }, [refreshPendingCount]);

  const handleSectionSelection = (sectionId: string, sectionTitle: string) => {
    console.log('🚀 Section selected:', sectionId, sectionTitle);
    fetchCategories(sectionId, sectionTitle);
  };

  const saveOrderFormPhoto = useCallback(async (photoUri: string, metadata?: Record<string, unknown>) => {
    if (!canAddOrderFormPhotos) return;
    await mediaService.savePhoto(photoUri, 'orderform', orderId, {
      category: 'orderform',
      timestamp: new Date().toISOString(),
      ...metadata
    });
    await refreshOrderFormPhotoCount();
    await refreshPendingCount();
  }, [orderId, canAddOrderFormPhotos, refreshOrderFormPhotoCount, refreshPendingCount]);

  const saveTemplatePhoto = useCallback(async (photoUri: string, templateId: string, templateName: string, metadata?: Record<string, unknown>) => {
    const entityId = parseInt(templateId, 10);
    if (isNaN(entityId)) return;
    await mediaService.savePhoto(photoUri, 'riskAssessmentMaster', entityId, {
      category: 'template',
      templateName,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const saveSectionPhoto = useCallback(async (photoUri: string, sectionId: string, sectionName: string, metadata?: Record<string, unknown>) => {
    const entityId = parseInt(sectionId, 10);
    if (isNaN(entityId)) return;
    await mediaService.savePhoto(photoUri, 'riskAssessmentSection', entityId, {
      category: 'section',
      sectionName,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const saveCategoryPhoto = useCallback(async (photoUri: string, categoryId: string, categoryName: string, metadata?: Record<string, unknown>) => {
    const entityId = parseInt(categoryId, 10);
    if (isNaN(entityId)) return;
    await mediaService.savePhoto(photoUri, 'riskAssessmentCategory', entityId, {
      category: 'category',
      categoryName,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: undefined,
        quality: 1.0,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true
      });
      if (!result.canceled) {
        if (templatePhotoTarget) {
          await saveTemplatePhoto(result.assets[0].uri, templatePhotoTarget.templateId, templatePhotoTarget.templateName, { exif: result.assets[0].exif });
          setTemplatePhotosRefreshKey((k) => k + 1);
          Alert.alert('Success', `Photo added to ${templatePhotoTarget.templateName}.`);
        } else if (sectionPhotoTarget) {
          await saveSectionPhoto(result.assets[0].uri, sectionPhotoTarget.sectionId, sectionPhotoTarget.sectionName, { exif: result.assets[0].exif });
          setTemplatePhotosRefreshKey((k) => k + 1);
          Alert.alert('Success', `Photo added to ${sectionPhotoTarget.sectionName}.`);
        } else if (categoryPhotoTarget) {
          await saveCategoryPhoto(result.assets[0].uri, categoryPhotoTarget.categoryId, categoryPhotoTarget.categoryName, { exif: result.assets[0].exif });
          setTemplatePhotosRefreshKey((k) => k + 1);
          Alert.alert('Success', `Photo added to ${categoryPhotoTarget.categoryName}.`);
        } else {
          await saveOrderFormPhoto(result.assets[0].uri, { exif: result.assets[0].exif });
          Alert.alert('Success', 'Photo added to this order.');
        }
        // Keep modal open so user can take more photos
      } else {
        // User cancelled camera – stay on Add Photo modal so they can try again or choose gallery
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setTemplatePhotoTarget(null);
      setSectionPhotoTarget(null);
      setCategoryPhotoTarget(null);
      setShowAppointmentPhotoModal(false);
    }
  }, [saveOrderFormPhoto, saveTemplatePhoto, saveSectionPhoto, saveCategoryPhoto, templatePhotoTarget, sectionPhotoTarget, categoryPhotoTarget]);

  const handleSelectPhotoFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        aspect: undefined,
        quality: 1.0,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true
      });
      if (!result.canceled && result.assets?.length) {
        const count = result.assets.length;
        if (templatePhotoTarget) {
          for (const asset of result.assets) {
            await saveTemplatePhoto(asset.uri, templatePhotoTarget.templateId, templatePhotoTarget.templateName, { source: 'gallery' });
          }
          setTemplatePhotosRefreshKey((k) => k + 1);
          Alert.alert('Success', count === 1 ? `Photo added to ${templatePhotoTarget.templateName}.` : `${count} photos added to ${templatePhotoTarget.templateName}.`);
        } else if (sectionPhotoTarget) {
          for (const asset of result.assets) {
            await saveSectionPhoto(asset.uri, sectionPhotoTarget.sectionId, sectionPhotoTarget.sectionName, { source: 'gallery' });
          }
          setTemplatePhotosRefreshKey((k) => k + 1);
          Alert.alert('Success', count === 1 ? `Photo added to ${sectionPhotoTarget.sectionName}.` : `${count} photos added to ${sectionPhotoTarget.sectionName}.`);
        } else if (categoryPhotoTarget) {
          for (const asset of result.assets) {
            await saveCategoryPhoto(asset.uri, categoryPhotoTarget.categoryId, categoryPhotoTarget.categoryName, { source: 'gallery' });
          }
          setTemplatePhotosRefreshKey((k) => k + 1);
          Alert.alert('Success', count === 1 ? `Photo added to ${categoryPhotoTarget.categoryName}.` : `${count} photos added to ${categoryPhotoTarget.categoryName}.`);
        } else {
          for (const asset of result.assets) {
            await saveOrderFormPhoto(asset.uri, { source: 'gallery' });
          }
          Alert.alert('Success', count === 1 ? 'Photo added to this order.' : `${count} photos added to this order.`);
        }
        // Keep modal open so user can add more
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
      setTemplatePhotoTarget(null);
      setSectionPhotoTarget(null);
      setCategoryPhotoTarget(null);
      setShowAppointmentPhotoModal(false);
    }
  }, [saveOrderFormPhoto, saveTemplatePhoto, saveSectionPhoto, saveCategoryPhoto, templatePhotoTarget, sectionPhotoTarget, categoryPhotoTarget]);

  const openOrderFormPhotoGallery = useCallback(async () => {
    if (!canAddOrderFormPhotos) return;
    try {
      const photos = await mediaService.getPhotosForEntity('orderform', orderId);
      setAppointmentPhotos(photos);
      setShowAppointmentPhotoGallery(true);
    } catch (error) {
      console.error('Error loading order form photos:', error);
      Alert.alert('Error', 'Failed to load photos.');
    }
  }, [orderId, canAddOrderFormPhotos]);

  const handleDeleteOrderFormPhoto = useCallback(async (photoId: number) => {
    try {
      await mediaService.deletePhoto(photoId);
      const photos = await mediaService.getPhotosForEntity('orderform', orderId);
      setAppointmentPhotos(photos);
      await refreshOrderFormPhotoCount();
      await refreshPendingCount();
      Alert.alert('Success', 'Photo deleted.');
    } catch (error) {
      console.error('Error deleting order form photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  }, [orderId, refreshOrderFormPhotoCount, refreshPendingCount]);

  const openTemplatePhotoGallery = useCallback(async (templateId: string, templateName: string) => {
    try {
      const entityId = parseInt(templateId, 10);
      if (isNaN(entityId)) return;
      const photos = await mediaService.getPhotosForEntity('riskAssessmentMaster', entityId);
      setTemplateGalleryPhotos(photos);
      setTemplateGalleryTarget({ templateId, templateName });
      setShowTemplatePhotoGallery(true);
    } catch (error) {
      console.error('Error loading template photos:', error);
      Alert.alert('Error', 'Failed to load photos.');
    }
  }, []);

  const openSectionPhotoGallery = useCallback(async (sectionId: string, sectionName: string) => {
    try {
      const entityId = parseInt(sectionId, 10);
      if (isNaN(entityId)) return;
      const photos = await mediaService.getPhotosForEntity('riskAssessmentSection', entityId);
      setSectionGalleryPhotos(photos);
      setSectionGalleryTarget({ sectionId, sectionName });
      setShowSectionPhotoGallery(true);
    } catch (error) {
      console.error('Error loading section photos:', error);
      Alert.alert('Error', 'Failed to load photos.');
    }
  }, []);

  const openCategoryPhotoGallery = useCallback(async (categoryId: string, categoryName: string) => {
    try {
      const entityId = parseInt(categoryId, 10);
      if (isNaN(entityId)) return;
      const photos = await mediaService.getPhotosForEntity('riskAssessmentCategory', entityId);
      setCategoryGalleryPhotos(photos);
      setCategoryGalleryTarget({ categoryId, categoryName });
      setShowCategoryPhotoGallery(true);
    } catch (error) {
      console.error('Error loading category photos:', error);
      Alert.alert('Error', 'Failed to load photos.');
    }
  }, []);

  const handleDeleteTemplatePhoto = useCallback(async (photoId: number) => {
    if (!templateGalleryTarget) return;
    try {
      await mediaService.deletePhoto(photoId);
      const entityId = parseInt(templateGalleryTarget.templateId, 10);
      const photos = await mediaService.getPhotosForEntity('riskAssessmentMaster', entityId);
      setTemplateGalleryPhotos(photos);
      setTemplatePhotosRefreshKey((k) => k + 1);
      await refreshPendingCount();
      Alert.alert('Success', 'Photo deleted.');
    } catch (error) {
      console.error('Error deleting template photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  }, [templateGalleryTarget, refreshPendingCount]);

  const handleDeleteSectionPhoto = useCallback(async (photoId: number) => {
    if (!sectionGalleryTarget) return;
    try {
      await mediaService.deletePhoto(photoId);
      const entityId = parseInt(sectionGalleryTarget.sectionId, 10);
      const photos = await mediaService.getPhotosForEntity('riskAssessmentSection', entityId);
      setSectionGalleryPhotos(photos);
      setTemplatePhotosRefreshKey((k) => k + 1);
      await refreshPendingCount();
      Alert.alert('Success', 'Photo deleted.');
    } catch (error) {
      console.error('Error deleting section photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  }, [sectionGalleryTarget, refreshPendingCount]);

  const handleDeleteCategoryPhoto = useCallback(async (photoId: number) => {
    if (!categoryGalleryTarget) return;
    try {
      await mediaService.deletePhoto(photoId);
      const entityId = parseInt(categoryGalleryTarget.categoryId, 10);
      const photos = await mediaService.getPhotosForEntity('riskAssessmentCategory', entityId);
      setCategoryGalleryPhotos(photos);
      setTemplatePhotosRefreshKey((k) => k + 1);
      await refreshPendingCount();
      Alert.alert('Success', 'Photo deleted.');
    } catch (error) {
      console.error('Error deleting category photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  }, [categoryGalleryTarget, refreshPendingCount]);

  if (!survey) {
    return null;
  }

  // Calculate progress based on available categories
  const totalCategories = categories.length > 0 ? categories.length : survey.categories.length;
  const completedCategories = categories.length > 0 ? 
    categories.filter(cat => cat.items > 0).length : survey.completedCategories;
  
  const progress = totalCategories > 0 ? 
    Math.floor((completedCategories / totalCategories) * 100) : 
    // If no categories loaded yet, allow completion (user can still finish survey)
    100;

  return (
    <>
      <ScrollView style={styles.scrollView}>
        <SurveyHeader 
          address={survey.address}
          completedCategories={survey.completedCategories}
          totalCategories={survey.categories.length || 1} // Avoid division by zero
        />
        
        <SurveyDetails
          client={survey.client}
          orderNumber={survey.orderNumber}
          policyNo={survey.policyNo}
          sumInsured={survey.sumInsured}
          broker={survey.broker}
          lastEdited={survey.lastEdited}
          orderFormPhotoCount={canAddOrderFormPhotos ? appointmentPhotoCount : undefined}
          onAddOrderFormPhoto={canAddOrderFormPhotos ? () => setShowAppointmentPhotoModal(true) : undefined}
          onViewOrderFormPhotos={canAddOrderFormPhotos ? openOrderFormPhotoGallery : undefined}
        />

        
        <RiskAssessmentTemplates
          orderNumber={survey.orderNumber}
          templatePhotosRefreshKey={templatePhotosRefreshKey}
          onTemplatePress={handleTemplateSelection}
          onSectionPress={handleSectionSelection}
          onAddTemplatePhoto={(templateId, templateName) => {
            setTemplatePhotoTarget({ templateId, templateName });
            setSectionPhotoTarget(null);
            setCategoryPhotoTarget(null);
            setShowAppointmentPhotoModal(true);
          }}
          onViewTemplatePhotos={openTemplatePhotoGallery}
          onAddSectionPhoto={(sectionId, sectionName) => {
            setSectionPhotoTarget({ sectionId, sectionName });
            setTemplatePhotoTarget(null);
            setCategoryPhotoTarget(null);
            setShowAppointmentPhotoModal(true);
          }}
          onViewSectionPhotos={openSectionPhotoGallery}
        />
        
        {/* Show categories status when a section is selected */}
        {selectedSectionTitle && (
          <View style={styles.categoriesStatus}>
            <Text style={styles.selectedSectionTitle}>
              Categories from: {selectedSectionTitle}
            </Text>
            {categoriesLoading && (
              <Text style={styles.loadingText}>Loading categories...</Text>
            )}
            {categoriesError && (
              <Text style={styles.errorText}>{categoriesError}</Text>
            )}
          </View>
        )}
        
        <CategoriesList
          categories={categories.length > 0 ? categories : survey.categories}
          totalValue={categories.length > 0 ? categories.reduce((sum, cat) => sum + cat.value, 0) : survey.totalValue}
          onCategoryPress={navigateToCategory}
          photoCountRefreshKey={templatePhotosRefreshKey}
          onAddCategoryPhoto={(categoryId, categoryName) => {
            setCategoryPhotoTarget({ categoryId, categoryName });
            setTemplatePhotoTarget(null);
            setSectionPhotoTarget(null);
            setShowAppointmentPhotoModal(true);
          }}
          onViewCategoryPhotos={openCategoryPhotoGallery}
        />
      </ScrollView>
      
      <SurveyActions
        progress={progress}
        onContinueSurvey={continueSurvey}
        onFinishSurvey={finishSurvey}
        onSync={handleSync}
        syncing={syncing}
        pendingChangesCount={pendingChangesCount}
      />

      <CameraModal
        visible={showAppointmentPhotoModal}
        onClose={() => {
          setTemplatePhotoTarget(null);
          setSectionPhotoTarget(null);
          setCategoryPhotoTarget(null);
          setShowAppointmentPhotoModal(false);
        }}
        onTakePhoto={handleTakePhoto}
        onSelectFromGallery={handleSelectPhotoFromGallery}
      />

      <PhotoGalleryModal
        visible={showAppointmentPhotoGallery}
        photos={appointmentPhotos}
        onClose={() => setShowAppointmentPhotoGallery(false)}
        onDeletePhoto={handleDeleteOrderFormPhoto}
        onTakeNewPhoto={() => {
          setShowAppointmentPhotoGallery(false);
          setShowAppointmentPhotoModal(true);
        }}
      />

      <PhotoGalleryModal
        visible={showTemplatePhotoGallery}
        photos={templateGalleryPhotos}
        onClose={() => { setShowTemplatePhotoGallery(false); setTemplateGalleryTarget(null); }}
        onDeletePhoto={handleDeleteTemplatePhoto}
        onTakeNewPhoto={() => {
          if (templateGalleryTarget) {
            setShowTemplatePhotoGallery(false);
            setTemplatePhotoTarget(templateGalleryTarget);
            setTemplateGalleryTarget(null);
            setShowAppointmentPhotoModal(true);
          }
        }}
      />

      <PhotoGalleryModal
        visible={showSectionPhotoGallery}
        photos={sectionGalleryPhotos}
        onClose={() => { setShowSectionPhotoGallery(false); setSectionGalleryTarget(null); }}
        onDeletePhoto={handleDeleteSectionPhoto}
        onTakeNewPhoto={() => {
          if (sectionGalleryTarget) {
            setShowSectionPhotoGallery(false);
            setSectionPhotoTarget(sectionGalleryTarget);
            setSectionGalleryTarget(null);
            setShowAppointmentPhotoModal(true);
          }
        }}
      />

      <PhotoGalleryModal
        visible={showCategoryPhotoGallery}
        photos={categoryGalleryPhotos}
        onClose={() => { setShowCategoryPhotoGallery(false); setCategoryGalleryTarget(null); }}
        onDeletePhoto={handleDeleteCategoryPhoto}
        onTakeNewPhoto={() => {
          if (categoryGalleryTarget) {
            setShowCategoryPhotoGallery(false);
            setCategoryPhotoTarget(categoryGalleryTarget);
            setCategoryGalleryTarget(null);
            setShowAppointmentPhotoModal(true);
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  categoriesStatus: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  selectedSectionTitle: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  loadingText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.error,
    fontStyle: 'italic',
  },
}); 