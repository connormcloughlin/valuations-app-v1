import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Item } from '../types';
import {
  updateRiskAssessmentItem,
  RiskAssessmentItem,
  getAllRiskAssessmentItems
} from '../../../../../utils/db';
import riskAssessmentSyncService from '../../../../../services/riskAssessmentSyncService';

export interface UseItemsManagementProps {
  items: Item[];
  groupingStrategy?: any;
  onSyncStatusChange?: (pendingChangesCount: number, syncing: boolean) => void;
  onTotalsChange?: (itemCount: number, totalValue: number) => void;
}

export const useItemsManagement = ({
  items,
  groupingStrategy,
  onSyncStatusChange,
  onTotalsChange
}: UseItemsManagementProps) => {
  const [editItems, setEditItems] = useState<{ [key: string]: any }>({});
  const [autoSavedItems, setAutoSavedItems] = useState<{ [key: string]: boolean }>({});
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Function to check if item has meaningful data captured
  const hasDataCaptured = useCallback((item: Item) => {
    const itemId = String(item.id);
    const editData = editItems[itemId] || {};
    
    const quantity = editData.quantity ?? String(item.quantity || '1');
    const price = editData.price ?? String(item.price || '');
    const description = editData.description ?? (item.description || '');
    const model = editData.model ?? (item.model || '');
    const notes = editData.notes ?? (item.notes || '');
    
    // Check if any meaningful data is captured
    return (
      (quantity && quantity !== '1') ||
      (price && price !== '0' && price !== '') ||
      description ||
      model ||
      notes
    );
  }, [editItems]);

  // Handle field editing
  const handleEdit = useCallback((itemId: string, fieldName: string, value: string) => {
    setEditItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [fieldName]: value
      }
    }));
  }, []);

  // Auto-save item to database
  const autoSaveItem = useCallback(async (id: string) => {
    try {
      const item = items.find(i => String(i.id) === id);
      if (!item) return;

      const editData = editItems[id] || {};
      const isNewItem = item.id.startsWith('custom-new-') || item.id.startsWith('duplicate-');

      if (isNewItem) {
        // For new items, we need to create them in the database
        console.log('🔄 Auto-saving new item:', id);
        
        // Mark as auto-saved
        setAutoSavedItems(prev => ({
          ...prev,
          [id]: true
        }));

        // Update pending changes count
        const count = await riskAssessmentSyncService.getPendingChangesCount();
        setPendingChangesCount(count.total);
        
        if (onSyncStatusChange) {
          onSyncStatusChange(count.total, false);
        }
      } else {
        // For existing items, update the database
        const existingItems = await getAllRiskAssessmentItems();
        const existingItem = existingItems.find(dbItem => 
          String(dbItem.riskassessmentitemid) === String(item.id)
        );

        if (existingItem) {
          const updated: RiskAssessmentItem = {
            ...existingItem,
            qty: parseInt(editData.quantity || String(item.quantity || '1')),
            price: parseFloat(editData.price || String(item.price || '0')),
            description: editData.description ?? (item.description || ''),
            model: editData.model ?? (item.model || ''),
            location: editData.room ?? (item.room || ''),
            notes: editData.notes ?? (item.notes || ''),
            pending_sync: 1,
            issynced: 0,
            dateupdated: new Date().toISOString(),
          };

          await updateRiskAssessmentItem(updated);
          
          // Mark as auto-saved
          setAutoSavedItems(prev => ({
            ...prev,
            [id]: true
          }));

          // Update pending changes count
          const count = await riskAssessmentSyncService.getPendingChangesCount();
          setPendingChangesCount(count.total);
          
          if (onSyncStatusChange) {
            onSyncStatusChange(count.total, false);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error auto-saving item:', error);
    }
  }, [items, editItems, onSyncStatusChange]);

  // Delete item function
  const deleteItem = useCallback(async (itemToDelete: Item) => {
    const itemId = String(itemToDelete.id);

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear values instead of deleting
              console.log('🧹 Clearing item values instead of deleting');
              
              // If it's not a new item, update it in the database with cleared values
              if (!itemToDelete.id.startsWith('custom-new-') && !itemToDelete.id.startsWith('duplicate-')) {
                const existingItems = await getAllRiskAssessmentItems();
                const existingItem = existingItems.find(dbItem => 
                  String(dbItem.riskassessmentitemid) === String(itemToDelete.id)
                );

                if (existingItem) {
                  // Reset to default values while preserving grouping fields
                  const updated: RiskAssessmentItem = {
                    ...existingItem,
                    qty: 1,
                    price: 0,
                    description: '',
                    model: (groupingStrategy?.strategy_type === 'by_brand') ? existingItem.model : '',
                    location: existingItem.location,
                    notes: '',
                    pending_sync: 1,
                    issynced: 0,
                    dateupdated: new Date().toISOString(),
                  };
                  
                  await updateRiskAssessmentItem(updated);
                  
                  // Update pending changes count
                  const count = await riskAssessmentSyncService.getPendingChangesCount();
                  setPendingChangesCount(count.total);
                }
              }
              
              // Clear edit state
              setEditItems(prev => {
                const newEditItems = { ...prev };
                delete newEditItems[itemId];
                return newEditItems;
              });
              
              // Clear auto-saved state
              setAutoSavedItems(prev => {
                const newAutoSaved = { ...prev };
                delete newAutoSaved[itemId];
                return newAutoSaved;
              });
              
            } catch (error) {
              console.error('❌ Error deleting item:', error);
            }
          }
        }
      ]
    );
  }, [groupingStrategy]);

  // Duplicate item function
  const duplicateItem = useCallback((originalItem: Item) => {
    const newId = `duplicate-${Date.now()}`;
    const duplicatedItem: Item = {
      ...originalItem,
      id: newId,
      quantity: '1',
      price: '0',
      description: '',
      notes: ''
    };

    // Add to edit items with default values
    setEditItems(prev => ({
      ...prev,
      [newId]: {
        type: originalItem.type || '',
        quantity: '1',
        price: '0',
        description: '',
        model: '',
        room: originalItem.room || '',
        notes: ''
      }
    }));
  }, []);

  return {
    editItems,
    autoSavedItems,
    pendingChangesCount,
    hasDataCaptured,
    handleEdit,
    autoSaveItem,
    deleteItem,
    duplicateItem
  };
}; 