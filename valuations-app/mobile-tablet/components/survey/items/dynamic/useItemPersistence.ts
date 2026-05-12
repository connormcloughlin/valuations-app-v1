import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import riskAssessmentSyncService from '../../../../services/riskAssessmentSyncService';
import {
  batchInsertRiskAssessmentItemsBulk,
  deleteRiskAssessmentItem,
  getAllRiskAssessmentItems,
  insertRiskAssessmentItem,
  updateRiskAssessmentItem,
} from '../../../../utils/db';
import { Item } from '../../../../app/survey/items/components/types';
import { ItemViewModel } from './dynamicItemLogic';
import { mergeItemWithChanges, toRiskAssessmentItem } from './itemFieldMapping';

export function useItemPersistence(categoryId: string) {
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await riskAssessmentSyncService.getPendingChangesCount();
    setPendingChangesCount(count.total);
    return count.total;
  }, []);

  const saveItem = useCallback(
    async (
      item: ItemViewModel,
      changes: Record<string, any>
    ): Promise<Item> => {
      const allItems = await getAllRiskAssessmentItems();
      const existing = allItems.find(dbItem => String(dbItem.riskassessmentitemid) === String(item.id));
      const dbItem = toRiskAssessmentItem(item, changes, categoryId, existing);
      if (existing) {
        await updateRiskAssessmentItem(dbItem);
      } else {
        await insertRiskAssessmentItem(dbItem);
      }
      await refreshPendingCount();
      const merged = mergeItemWithChanges(item, changes);
      return {
        ...merged,
        id: String(dbItem.riskassessmentitemid),
        categoryId: String(categoryId),
        quantity: dbItem.qty == null ? '' : String(dbItem.qty),
        price: dbItem.price ? String(dbItem.price) : '',
        excludefromreport: dbItem.excludefromreport ?? 0,
        pending_sync: dbItem.pending_sync ?? 1,
      };
    },
    [categoryId, refreshPendingCount]
  );

  const deleteItem = useCallback(
    async (item: ItemViewModel) => {
      if (item.isDraft) return;
      await deleteRiskAssessmentItem(Number(item.id));
      await refreshPendingCount();
    },
    [refreshPendingCount]
  );

  const saveItems = useCallback(
    async (
      entries: Array<{ item: ItemViewModel; changes: Record<string, any> }>
    ): Promise<Item[]> => {
      if (entries.length === 0) return [];

      const allItems = await getAllRiskAssessmentItems();
      const existingById = new Map(
        allItems.map(dbItem => [String(dbItem.riskassessmentitemid), dbItem])
      );
      const dbItems = entries.map(({ item, changes }) =>
        toRiskAssessmentItem(item, changes, categoryId, existingById.get(String(item.id)))
      );

      await batchInsertRiskAssessmentItemsBulk(dbItems);
      await refreshPendingCount();

      return dbItems.map((dbItem, index) => {
        const { item, changes } = entries[index];
        const merged = mergeItemWithChanges(item, changes);
        return {
          ...merged,
          id: String(dbItem.riskassessmentitemid),
          categoryId: String(categoryId),
          quantity: dbItem.qty == null ? '' : String(dbItem.qty),
          price: dbItem.price ? String(dbItem.price) : '',
          excludefromreport: dbItem.excludefromreport ?? 0,
          pending_sync: dbItem.pending_sync ?? 1,
        };
      });
    },
    [categoryId, refreshPendingCount]
  );

  const sync = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setSyncing(true);
    }
    try {
      const result = await riskAssessmentSyncService.syncPendingChanges();
      await refreshPendingCount();
      if (!silent && !result.success) {
        Alert.alert('Sync Failed', result.error || 'Failed to sync changes to server.');
      }
      if (!silent && result.success) {
        Alert.alert('Sync Complete', result.message || 'Pending changes synced.');
      }
      return result;
    } finally {
      setSyncing(false);
    }
  }, [refreshPendingCount]);

  return {
    pendingChangesCount,
    syncing,
    refreshPendingCount,
    saveItem,
    saveItems,
    deleteItem,
    sync,
  };
}
