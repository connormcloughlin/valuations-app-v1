import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Divider } from 'react-native-paper';
import { PredefinedItemsListProps } from '../../../app/survey/items/components/types';
import ItemStates from '../../../app/survey/items/components/ItemStates';
import CameraModal from '../../../app/survey/items/components/CameraModal';
import PhotoGalleryModal from '../../../app/survey/items/components/PhotoGalleryModal';
import DynamicItemsList from './dynamic/DynamicItemsList';
import {
  calculateTotals,
  fieldNameFromStrategyName,
  getEffectiveFields,
  groupItems,
  ItemViewModel,
} from './dynamic/dynamicItemLogic';
import { getUnsupportedVisibleFields, PersistedItemField } from './dynamic/itemFieldMapping';
import { useDynamicItemDrafts } from './dynamic/useDynamicItemDrafts';
import { useItemPersistence } from './dynamic/useItemPersistence';
import mediaService from '../../../services/mediaService';
import { debugLog, errorLog } from '../../../utils/debugUtils';

const ImagePicker = require('expo-image-picker');

const samePhotoMap = (a: { [key: string]: any[] }, b: { [key: string]: any[] }) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return bKeys.every(key => (a[key] || []).length === (b[key] || []).length);
};

const parseStrategyConfig = (groupingStrategy: PredefinedItemsListProps['groupingStrategy']): any => {
  const raw = groupingStrategy?.strategy_config;
  if (!raw) return undefined;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export default function PredefinedItemsMobile(props: PredefinedItemsListProps) {
  if (props.loading) {
    return <ItemStates loading={true} />;
  }
  if (props.error) {
    return (
      <ItemStates
        error={props.error}
        onRetry={props.onRefresh}
        isOffline={props.isOffline}
        fromCache={props.fromCache}
      />
    );
  }
  return <PredefinedItemsListContent {...props} />;
}

function PredefinedItemsListContent({
  items: propsItems,
  categoryTitle,
  categoryId,
  dynamicFieldConfig = [],
  categoryConfig,
  groupingStrategy,
  onRefresh,
  onAddNewItem,
  onSyncStatusChange,
  onSyncRequest,
  onTotalsChange,
}: PredefinedItemsListProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [itemPhotos, setItemPhotos] = useState<{ [key: string]: any[] }>({});
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoItemId, setCurrentPhotoItemId] = useState<string | null>(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemType, setNewItemType] = useState('');
  const [newPrimaryValue, setNewPrimaryValue] = useState('');
  const [copySourcePrimary, setCopySourcePrimary] = useState<string | null>(null);
  const [addingNewItems, setAddingNewItems] = useState(false);
  const [locallyPendingItemIds, setLocallyPendingItemIds] = useState<Set<string>>(() => new Set());
  const onAddNewItemRef = useRef(onAddNewItem);
  const onSyncStatusChangeRef = useRef(onSyncStatusChange);
  const onSyncRequestRef = useRef(onSyncRequest);
  const onTotalsChangeRef = useRef(onTotalsChange);
  const nestedPrimaryInputRef = useRef<TextInput>(null);
  const nestedSecondaryInputRef = useRef<TextInput>(null);

  const {
    items,
    edits,
    addDraft,
    addSavedItems,
    updateField,
    markSaved,
    removeDraft,
    getItemValues,
  } = useDynamicItemDrafts(propsItems, String(categoryId));

  const {
    pendingChangesCount,
    syncing,
    refreshPendingCount,
    saveItem,
    saveItems,
    deleteItem,
    sync: persistSync,
  } = useItemPersistence(String(categoryId));

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount, categoryId]);

  useEffect(() => {
    onAddNewItemRef.current = onAddNewItem;
    onSyncStatusChangeRef.current = onSyncStatusChange;
    onSyncRequestRef.current = onSyncRequest;
    onTotalsChangeRef.current = onTotalsChange;
  }, [onAddNewItem, onSyncStatusChange, onSyncRequest, onTotalsChange]);

  useEffect(() => {
    onSyncStatusChangeRef.current?.(pendingChangesCount, syncing);
  }, [pendingChangesCount, syncing]);

  const handleSync = useCallback(
    async (options?: { silent?: boolean }) => {
      const result = await persistSync(options);
      if (result?.success) {
        setLocallyPendingItemIds(new Set());
        await onRefresh?.();
      }
    },
    [onRefresh, persistSync]
  );

  useEffect(() => {
    onSyncRequestRef.current?.(handleSync);
  }, [handleSync]);

  const openNewItemModal = useCallback(() => {
    setNewItemType('');
    setNewPrimaryValue('');
    setCopySourcePrimary(null);
    setShowNewItemModal(true);
  }, []);

  useEffect(() => {
    onAddNewItemRef.current?.(openNewItemModal);
  }, [openNewItemModal]);

  const unsupportedFields = useMemo(
    () => getUnsupportedVisibleFields(dynamicFieldConfig),
    [dynamicFieldConfig]
  );

  useEffect(() => {
    if (unsupportedFields.length > 0) {
      debugLog('Unsupported dynamic fields excluded from editing', unsupportedFields.map(f => f.item_fields));
    }
  }, [unsupportedFields]);

  const fieldsByItemId = useMemo(() => {
    const out: Record<string, any[]> = {};
    for (const item of items) {
      out[item.id] = getEffectiveFields(
        item,
        dynamicFieldConfig,
        categoryConfig?.itemFieldConfigs,
        groupingStrategy
      );
    }
    return out;
  }, [categoryConfig?.itemFieldConfigs, dynamicFieldConfig, groupingStrategy, items]);

  const valuesByItemId = useMemo(() => {
    const out: Record<string, Record<string, any>> = {};
    for (const item of items) {
      out[item.id] = getItemValues(item);
    }
    return out;
  }, [getItemValues, items]);

  const grouped = useMemo(
    () => groupItems(items, groupingStrategy),
    [groupingStrategy, items]
  );

  const nestedAddConfig = useMemo(() => {
    const config = parseStrategyConfig(groupingStrategy);
    if (!config?.primary_group || !config?.secondary_group) return null;
    const primaryField = fieldNameFromStrategyName(config.primary_group);
    const secondaryField = fieldNameFromStrategyName(config.secondary_group);
    if (!primaryField || !secondaryField) return null;
    return {
      primaryLabel: String(config.primary_group),
      secondaryLabel: String(config.secondary_group),
      primaryField,
      secondaryField,
    };
  }, [groupingStrategy]);

  const nestedStructureOptions = useMemo(() => {
    if (grouped?.kind !== 'nested') return [];
    return grouped.groups
      .filter(primary => primary.key !== 'Draft Items' && primary.key !== 'No Location')
      .map(primary => ({
        key: primary.key,
        secondary: primary.secondary
          .filter(secondary => secondary.key !== 'New Item' && !secondary.key.startsWith('Unknown '))
          .map(secondary => ({
            key: secondary.key,
            template: secondary.items.find(item => !item.isDraft) || secondary.items[0],
          })),
      }))
      .filter(primary => primary.secondary.length > 0);
  }, [grouped]);

  const totals = useMemo(
    () => calculateTotals(items, edits),
    [edits, items]
  );

  useEffect(() => {
    onTotalsChangeRef.current?.(totals.itemCount, totals.totalValue);
  }, [totals.itemCount, totals.totalValue]);

  const savedPhotoKey = useMemo(
    () => items.filter(item => !item.isDraft).map(item => item.id).join('|'),
    [items]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const savedItems = items.filter(item => !item.isDraft);
      const entries = await Promise.all(
        savedItems.map(async item => {
          try {
            const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(item.id));
            return [item.id, photos] as const;
          } catch {
            return [item.id, []] as const;
          }
        })
      );
      if (!cancelled) {
        const next = Object.fromEntries(entries);
        setItemPhotos(prev => (samePhotoMap(prev, next) ? prev : next));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [savedPhotoKey]);

  const handleSave = useCallback(
    async (item: ItemViewModel, values: Record<string, any>) => {
      const saved = await saveItem(item, values);
      setLocallyPendingItemIds(prev => new Set(prev).add(String(saved.id)));
      if (item.isDraft) {
        markSaved(item.id, saved);
        setExpandedItemId(saved.id);
        await onRefresh?.();
      } else {
        setExpandedItemId(item.id);
      }
    },
    [markSaved, onRefresh, saveItem]
  );

  const handleDelete = useCallback(
    async (item: ItemViewModel) => {
      if (item.isDraft) {
        removeDraft(item.id);
        return;
      }
      await deleteItem(item);
      if (expandedItemId === item.id) setExpandedItemId(null);
      await onRefresh?.();
    },
    [deleteItem, expandedItemId, onRefresh, removeDraft]
  );

  const handleDuplicate = useCallback(
    (item: ItemViewModel) => {
      const values = getItemValues(item);
      const draftValues: Partial<ItemViewModel> = {
        type: values.type || item.type,
        quantity: '',
        price: '',
        description: '',
        model: '',
        room: '',
        notes: '',
        selectedanswer: '',
        excludefromreport: 0,
        rank: item.rank || 0,
        itemtype: item.itemtype || 0,
      };

      const preserveField = (fieldName?: string) => {
        if (!fieldName) return;
        const mapped = fieldNameFromStrategyName(fieldName);
        if (!mapped) return;
        const nextValue = values[mapped] ?? (item as any)[mapped];
        if (nextValue !== undefined && nextValue !== null) {
          (draftValues as any)[mapped] = String(nextValue);
        }
      };

      const config = parseStrategyConfig(groupingStrategy);
      if (config?.primary_group || config?.secondary_group) {
        preserveField(config.primary_group);
        preserveField(config.secondary_group);
      } else {
        switch (groupingStrategy?.strategy_type) {
          case 'by_location':
            preserveField('Location');
            break;
          case 'by_brand':
            preserveField('Model');
            break;
          case 'by_type':
          default:
            preserveField('ItemPrompt');
            break;
        }
      }

      const draft = addDraft(draftValues);
      setExpandedItemId(draft.id);
      setExpandedGroups(prev => {
        const next = { ...prev };
        if (groupingStrategy?.strategy_type === 'by_location' && draft.room) {
          next[`flat::${draft.room}`] = true;
        } else if (groupingStrategy?.strategy_type === 'by_brand' && draft.model) {
          next[`flat::${draft.model}`] = true;
        } else {
          next[`flat::${draft.type || 'Draft Items'}`] = true;
        }
        const config = parseStrategyConfig(groupingStrategy);
        if (config?.primary_group && config?.secondary_group) {
          const primaryMapped = fieldNameFromStrategyName(config.primary_group);
          const secondaryMapped = fieldNameFromStrategyName(config.secondary_group);
          const primary = primaryMapped ? (draft as any)[primaryMapped] : undefined;
          const secondary = secondaryMapped ? (draft as any)[secondaryMapped] : undefined;
          if (primary) next[`primary::${primary}`] = true;
          if (primary && secondary) next[`secondary::${primary}::${secondary}`] = true;
        }
        return next;
      });
    },
    [addDraft, getItemValues, groupingStrategy]
  );

  const openDraftInGroup = useCallback((draft: ItemViewModel) => {
    setExpandedItemId(draft.id);
    setExpandedGroups(prev => {
      const next = { ...prev };
      const config = parseStrategyConfig(groupingStrategy);
      if (config?.primary_group && config?.secondary_group) {
        const primaryMapped = fieldNameFromStrategyName(config.primary_group);
        const secondaryMapped = fieldNameFromStrategyName(config.secondary_group);
        const primary = primaryMapped ? (draft as any)[primaryMapped] : undefined;
        const secondary = secondaryMapped ? (draft as any)[secondaryMapped] : undefined;
        next[`primary::${primary || 'Draft Items'}`] = true;
        next[`secondary::${primary || 'Draft Items'}::${secondary || 'New Item'}`] = true;
      } else if (groupingStrategy?.strategy_type === 'by_location' && draft.room) {
        next[`flat::${draft.room}`] = true;
      } else if (groupingStrategy?.strategy_type === 'by_brand' && draft.model) {
        next[`flat::${draft.model}`] = true;
      } else {
        next[`flat::${draft.type || 'Draft Items'}`] = true;
      }
      return next;
    });
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  }, [groupingStrategy]);

  const blurNewItemInputs = useCallback(() => {
    nestedPrimaryInputRef.current?.blur();
    nestedSecondaryInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const selectCopySource = useCallback((source: string | null) => {
    blurNewItemInputs();
    setCopySourcePrimary(source);
  }, [blurNewItemInputs]);

  const createNamedDraft = useCallback(async () => {
    if (addingNewItems) return;

    const closeModal = () => {
      setShowNewItemModal(false);
      setNewItemType('');
      setNewPrimaryValue('');
      setCopySourcePrimary(null);
    };

    if (nestedAddConfig) {
      const primary = newPrimaryValue.trim();
      if (!primary) {
        Alert.alert(`${nestedAddConfig.primaryLabel} Required`, `Enter ${nestedAddConfig.primaryLabel.toLowerCase()} or cancel.`);
        return;
      }

      const selectedStructure = copySourcePrimary
        ? nestedStructureOptions.find(option => option.key === copySourcePrimary)
        : null;

      if (selectedStructure) {
        setAddingNewItems(true);
        try {
          const baseId = Date.now();
          const entries = selectedStructure.secondary.map((secondary, index) => {
            const template = secondary.template;
            const itemToSave: ItemViewModel = {
              categoryId: String(categoryId),
              id: String(baseId + index),
              type: secondary.key,
              quantity: '',
              price: '',
              description: '',
              model: '',
              room: '',
              notes: '',
              selectedanswer: '',
              excludefromreport: 0,
              rank: template?.rank || 0,
              itemtype: template?.itemtype || 0,
              commaseparatedlist: template?.commaseparatedlist || '',
              multiSelectAnswer: template?.multiSelectAnswer,
              lifecycle: 'draft',
              isDraft: true,
            };
            (itemToSave as any)[nestedAddConfig.primaryField] = primary;
            (itemToSave as any)[nestedAddConfig.secondaryField] = secondary.key;

            return {
              item: itemToSave,
              changes: {
                type: itemToSave.type,
                quantity: '',
                price: '',
                description: '',
                model: itemToSave.model,
                room: itemToSave.room,
                notes: '',
                selectedanswer: '',
                excludefromreport: 0,
              },
            };
          });

          const savedItems = (await saveItems(entries)).map(item => ({
            ...item,
            lifecycle: 'pending_sync' as const,
            isDraft: false,
            pending_sync: 1,
          }));

          setLocallyPendingItemIds(prev => {
            const next = new Set(prev);
            savedItems.forEach(item => next.add(String(item.id)));
            return next;
          });
          addSavedItems(savedItems);
          closeModal();
          if (savedItems[0]) openDraftInGroup(savedItems[0]);
          await onRefresh?.();
        } catch (error) {
          errorLog('Failed to copy nested item structure', error);
          Alert.alert('Copy Failed', 'Could not copy the item structure. Please try again.');
        } finally {
          setAddingNewItems(false);
        }
        return;
      }

      const secondary = newItemType.trim();
      if (!secondary) {
        Alert.alert(`${nestedAddConfig.secondaryLabel} Required`, `Enter ${nestedAddConfig.secondaryLabel.toLowerCase()} or choose an existing structure to copy.`);
        return;
      }
      const draftValues: Partial<ItemViewModel> = {
        type: secondary,
        quantity: '',
      };
      (draftValues as any)[nestedAddConfig.primaryField] = primary;
      (draftValues as any)[nestedAddConfig.secondaryField] = secondary;
      const draft = addDraft(draftValues);
      closeModal();
      openDraftInGroup(draft);
      return;
    }

    const type = newItemType.trim();
    if (!type) {
      Alert.alert('Item Type Required', 'Enter an item type or cancel.');
      return;
    }
    const draft = addDraft({ type });
    closeModal();
    openDraftInGroup(draft);
  }, [
    addDraft,
    addSavedItems,
    addingNewItems,
    categoryId,
    copySourcePrimary,
    nestedAddConfig,
    nestedStructureOptions,
    newItemType,
    newPrimaryValue,
    onRefresh,
    openDraftInGroup,
    saveItems,
  ]);

  const handleTakePhoto = useCallback((itemId: string) => {
    setCurrentPhotoItemId(itemId);
    if ((itemPhotos[itemId] || []).length > 0) {
      setShowPhotoGallery(true);
      return;
    }
    setShowCamera(true);
  }, [itemPhotos]);

  const takePhoto = useCallback(async () => {
    if (!currentPhotoItemId) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        await mediaService.savePhoto(result.assets[0].uri, 'riskAssessmentItem', Number(currentPhotoItemId), {
          category: 'predefined-item',
          timestamp: new Date().toISOString(),
          exif: result.assets[0].exif,
        });
        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
        const item = items.find(i => i.id === currentPhotoItemId);
        if (item) {
          const saved = await saveItem(item, { ...valuesByItemId[currentPhotoItemId], photos: '1' });
          setLocallyPendingItemIds(prev => new Set(prev).add(String(saved.id)));
        }
      }
    } catch (error) {
      errorLog('Failed to take photo', error);
      Alert.alert('Photo Error', 'Failed to take photo. Please try again.');
    } finally {
      setShowCamera(false);
      setCurrentPhotoItemId(null);
    }
  }, [currentPhotoItemId, items, saveItem, valuesByItemId]);

  const selectFromGallery = useCallback(async () => {
    if (!currentPhotoItemId) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets?.length) {
        for (const asset of result.assets) {
          await mediaService.savePhoto(asset.uri, 'riskAssessmentItem', Number(currentPhotoItemId), {
            category: 'predefined-item',
            timestamp: new Date().toISOString(),
            exif: asset.exif,
          });
        }
        const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
        setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
        const item = items.find(i => i.id === currentPhotoItemId);
        if (item) {
          const saved = await saveItem(item, { ...valuesByItemId[currentPhotoItemId], photos: '1' });
          setLocallyPendingItemIds(prev => new Set(prev).add(String(saved.id)));
        }
      }
    } catch (error) {
      errorLog('Failed to select photo', error);
      Alert.alert('Photo Error', 'Failed to select photo. Please try again.');
    } finally {
      setShowCamera(false);
      setCurrentPhotoItemId(null);
    }
  }, [currentPhotoItemId, items, saveItem, valuesByItemId]);

  const deletePhoto = useCallback(async (photoId: number) => {
    if (!currentPhotoItemId) return;
    await mediaService.deletePhoto(photoId);
    const photos = await mediaService.getPhotosForEntity('riskAssessmentItem', Number(currentPhotoItemId));
    setItemPhotos(prev => ({ ...prev, [currentPhotoItemId]: photos }));
  }, [currentPhotoItemId]);

  const hasConfig = dynamicFieldConfig.length > 0;

  return (
    <>
      <Card style={styles.card}>
        <Card.Title title={categoryTitle} />
        <Divider />
        <Card.Content style={styles.content}>
          <View style={styles.scrollIndicator}>
            <MaterialCommunityIcons name="gesture-swipe-down" size={16} color="#7f8c8d" />
            <Text style={styles.scrollHint}>Tap items to view and edit details</Text>
          </View>
          {unsupportedFields.length > 0 ? (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                {unsupportedFields.length} configured field{unsupportedFields.length === 1 ? '' : 's'} cannot save with the current mobile sync contract.
              </Text>
            </View>
          ) : null}
          {!hasConfig ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="small" color="#4a90e2" />
              <Text style={styles.loadingText}>Preparing fields...</Text>
            </View>
          ) : (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
              <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
              >
                <DynamicItemsList
                  groupedItems={grouped}
                  flatItems={items}
                  expandedItemId={expandedItemId}
                  expandedGroups={expandedGroups}
                  fieldsByItemId={fieldsByItemId}
                  valuesByItemId={valuesByItemId}
                  editsByItemId={edits}
                  locallyPendingItemIds={locallyPendingItemIds}
                  itemPhotos={itemPhotos}
                  onToggleItem={(itemId) => setExpandedItemId(prev => (prev === itemId ? null : itemId))}
                  onToggleGroup={(key) => setExpandedGroups(prev => ({ ...prev, [key]: !(prev[key] ?? false) }))}
                  onChange={(itemId: string, fieldName: PersistedItemField, value: any) => updateField(itemId, fieldName, value)}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onTakePhoto={handleTakePhoto}
                />
                {items.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>No predefined items found</Text>
                    <Text style={styles.emptySubtext}>Use Add Item to create a local draft.</Text>
                  </View>
                ) : null}
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </Card.Content>
      </Card>

      <CameraModal
        visible={showCamera}
        onClose={() => {
          setShowCamera(false);
          setCurrentPhotoItemId(null);
        }}
        onTakePhoto={takePhoto}
        onSelectFromGallery={selectFromGallery}
      />
      <PhotoGalleryModal
        visible={showPhotoGallery}
        photos={currentPhotoItemId ? itemPhotos[currentPhotoItemId] || [] : []}
        onClose={() => {
          setShowPhotoGallery(false);
          setCurrentPhotoItemId(null);
        }}
        onDeletePhoto={deletePhoto}
        onTakeNewPhoto={() => {
          setShowPhotoGallery(false);
          setShowCamera(true);
        }}
      />
      <Modal
        visible={showNewItemModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNewItemModal(false);
          setNewItemType('');
          setNewPrimaryValue('');
          setCopySourcePrimary(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <Text style={styles.modalText}>
              {nestedAddConfig
                ? `Enter ${nestedAddConfig.primaryLabel.toLowerCase()} and add one ${nestedAddConfig.secondaryLabel.toLowerCase()}, or copy item types from an existing ${nestedAddConfig.primaryLabel.toLowerCase()}.`
                : 'Enter the item type to add.'}
            </Text>
            {nestedAddConfig ? (
              <>
                <Text style={styles.modalLabel}>{nestedAddConfig.primaryLabel}</Text>
                <TextInput
                  ref={nestedPrimaryInputRef}
                  style={styles.modalInput}
                  value={newPrimaryValue}
                  onChangeText={setNewPrimaryValue}
                  placeholder={nestedAddConfig.primaryLabel}
                  placeholderTextColor="#95a5a6"
                  autoFocus
                  returnKeyType="next"
                />
                <Text style={styles.modalLabel}>{nestedAddConfig.secondaryLabel}</Text>
                <TextInput
                  ref={nestedSecondaryInputRef}
                  style={[styles.modalInput, copySourcePrimary !== null && styles.modalInputDisabled]}
                  value={newItemType}
                  onChangeText={setNewItemType}
                  placeholder={`${nestedAddConfig.secondaryLabel} to add`}
                  placeholderTextColor="#95a5a6"
                  editable={copySourcePrimary === null}
                  returnKeyType="done"
                  onSubmitEditing={createNamedDraft}
                />
                {nestedStructureOptions.length > 0 ? (
                  <View
                    style={styles.copyBlock}
                    onTouchStart={blurNewItemInputs}
                    onStartShouldSetResponderCapture={() => {
                      blurNewItemInputs();
                      return false;
                    }}
                  >
                    <Text style={styles.modalLabel}>Copy item types from</Text>
                    <Pressable
                      style={[styles.copyOption, copySourcePrimary === null && styles.copyOptionSelected]}
                      onPressIn={() => selectCopySource(null)}
                      onPress={() => selectCopySource(null)}
                    >
                      <Text style={[styles.copyOptionText, copySourcePrimary === null && styles.copyOptionSelectedText]}>
                        Do not copy
                      </Text>
                    </Pressable>
                    <ScrollView style={styles.copyOptionsList} keyboardShouldPersistTaps="always">
                      {nestedStructureOptions.map(option => (
                        <Pressable
                          key={option.key}
                          style={[styles.copyOption, copySourcePrimary === option.key && styles.copyOptionSelected]}
                          onPressIn={() => selectCopySource(option.key)}
                          onPress={() => selectCopySource(option.key)}
                        >
                          <Text style={[styles.copyOptionText, copySourcePrimary === option.key && styles.copyOptionSelectedText]}>
                            {option.key}
                          </Text>
                          <Text style={styles.copyOptionMeta}>{option.secondary.length}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </>
            ) : (
              <TextInput
                style={styles.modalInput}
                value={newItemType}
                onChangeText={setNewItemType}
                placeholder="Item type"
                placeholderTextColor="#95a5a6"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={createNamedDraft}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewItemModal(false);
                  setNewItemType('');
                  setNewPrimaryValue('');
                  setCopySourcePrimary(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddButton, addingNewItems && styles.modalAddButtonDisabled]}
                onPress={createNamedDraft}
                disabled={addingNewItems}
              >
                {addingNewItems ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalAddText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 0,
    paddingVertical: 8,
    flex: 1,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  warning: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#fff8e5',
    borderWidth: 1,
    borderColor: '#f5d58a',
    marginBottom: 8,
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
  },
  loadingBlock: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6c7f90',
  },
  keyboardWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    minHeight: 200,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  empty: {
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    color: '#52677a',
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#8a98a8',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '86%',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalText: {
    marginTop: 6,
    marginBottom: 14,
    color: '#7f8c8d',
    fontSize: 14,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#2c3e50',
    fontSize: 16,
    marginBottom: 12,
  },
  modalInputDisabled: {
    backgroundColor: '#f4f7fa',
    color: '#8a98a8',
  },
  modalLabel: {
    color: '#52677a',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  copyBlock: {
    marginTop: 2,
  },
  copyOptionsList: {
    maxHeight: 170,
  },
  copyOption: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  copyOptionSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#eef6ff',
  },
  copyOptionText: {
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  copyOptionSelectedText: {
    color: '#2f6fab',
  },
  copyOptionMeta: {
    minWidth: 24,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 2,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancelButton: {
    minWidth: 92,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#52677a',
    fontWeight: '700',
  },
  modalAddButton: {
    minWidth: 92,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.7,
  },
  modalAddText: {
    color: '#fff',
    fontWeight: '700',
  },
});
