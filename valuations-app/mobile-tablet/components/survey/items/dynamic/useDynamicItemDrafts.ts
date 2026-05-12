import { useCallback, useEffect, useMemo, useState } from 'react';
import { Item } from '../../../../app/survey/items/components/types';
import { itemToDraftValues, mergeItemWithChanges, PersistedItemField } from './itemFieldMapping';
import { ItemViewModel } from './dynamicItemLogic';

const makeDraftId = () => `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createDraftItem = (
  categoryId: string,
  initialValues: Partial<ItemViewModel> = {}
): ItemViewModel => ({
  categoryId,
  type: '',
  description: '',
  model: '',
  room: '',
  quantity: '',
  price: '',
  notes: '',
  selectedanswer: '',
  excludefromreport: 0,
  ...initialValues,
  id: makeDraftId(),
  lifecycle: 'draft',
  isDraft: true,
});

export const isDraftId = (id: string): boolean => id.startsWith('draft-');

export function useDynamicItemDrafts(
  propsItems: Item[],
  categoryId: string
) {
  const [drafts, setDrafts] = useState<ItemViewModel[]>([]);
  const [localSavedItems, setLocalSavedItems] = useState<ItemViewModel[]>([]);
  const [edits, setEdits] = useState<Record<string, Record<string, any>>>({});
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(() => new Set());

  const savedItems = useMemo<ItemViewModel[]>(
    () =>
      propsItems
        .filter(item => Number((item as any).isDeleted || 0) !== 1)
        .filter(item => !removedItemIds.has(String(item.id)))
        .map(item => ({
          ...item,
          lifecycle:
            item.excludefromreport === -1
              ? 'sync_error'
              : (item as any).pending_sync === 1
                ? 'pending_sync'
                : 'saved_local',
          isDraft: false,
        })),
    [propsItems, removedItemIds]
  );

  useEffect(() => {
    const visibleSavedIds = new Set(
      propsItems
        .filter(item => Number((item as any).isDeleted || 0) !== 1)
        .map(item => String(item.id))
    );
    const deletedIds = new Set(
      propsItems
        .filter(item => Number((item as any).isDeleted || 0) === 1)
        .map(item => String(item.id))
    );
    setLocalSavedItems(prev =>
      prev.filter(item =>
        !visibleSavedIds.has(String(item.id)) &&
        !deletedIds.has(String(item.id))
      )
    );
    setEdits(prev => {
      const next: Record<string, Record<string, any>> = {};
      for (const [id, value] of Object.entries(prev)) {
        if ((visibleSavedIds.has(id) || isDraftId(id)) && !deletedIds.has(id)) {
          next[id] = value;
        }
      }
      return next;
    });
  }, [propsItems]);

  const items = useMemo(
    () => [...drafts, ...localSavedItems, ...savedItems],
    [drafts, localSavedItems, savedItems]
  );

  const addDraft = useCallback((initialValues?: Partial<ItemViewModel>): ItemViewModel => {
    const draft = createDraftItem(categoryId, initialValues);
    setDrafts(prev => [draft, ...prev]);
    setEdits(prev => ({
      ...prev,
      [draft.id]: itemToDraftValues(draft),
    }));
    return draft;
  }, [categoryId]);

  const updateField = useCallback((itemId: string, fieldName: PersistedItemField, value: any) => {
    setEdits(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [fieldName]: value,
      },
    }));
    setDrafts(prev =>
      prev.map(draft =>
        draft.id === itemId
          ? {
              ...mergeItemWithChanges(draft, { [fieldName]: value }),
              lifecycle: 'draft',
              isDraft: true,
            }
          : draft
      )
    );
  }, []);

  const markSaved = useCallback((oldId: string, saved: Item) => {
    setDrafts(prev => prev.filter(draft => draft.id !== oldId));
    setLocalSavedItems(prev => [
      {
        ...saved,
        lifecycle: (saved as any).pending_sync === 1 ? 'pending_sync' : 'saved_local',
        isDraft: false,
      } as ItemViewModel,
      ...prev.filter(item => String(item.id) !== String(saved.id)),
    ]);
    setEdits(prev => {
      const next = { ...prev };
      delete next[oldId];
      next[String(saved.id)] = itemToDraftValues(saved);
      return next;
    });
  }, []);

  const addSavedItems = useCallback((savedItemsToAdd: ItemViewModel[]) => {
    setLocalSavedItems(prev => {
      const nextById = new Map<string, ItemViewModel>();
      for (const item of prev) {
        nextById.set(String(item.id), item);
      }
      for (const item of savedItemsToAdd) {
        nextById.set(String(item.id), {
          ...item,
          lifecycle: item.pending_sync === 1 ? 'pending_sync' : item.lifecycle || 'saved_local',
          isDraft: false,
        });
      }
      return Array.from(nextById.values());
    });
  }, []);

  const removeDraft = useCallback((itemId: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== itemId));
    setEdits(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const removeSavedItem = useCallback((itemId: string) => {
    setRemovedItemIds(prev => {
      const next = new Set(prev);
      next.add(String(itemId));
      return next;
    });
    setLocalSavedItems(prev => prev.filter(item => String(item.id) !== String(itemId)));
    setEdits(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const restoreSavedItem = useCallback((itemId: string) => {
    setRemovedItemIds(prev => {
      const next = new Set(prev);
      next.delete(String(itemId));
      return next;
    });
  }, []);

  const clearEditsForItem = useCallback((itemId: string) => {
    setEdits(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const getItemValues = useCallback(
    (item: ItemViewModel): Record<string, any> => ({
      ...itemToDraftValues(item),
      ...(edits[item.id] || {}),
    }),
    [edits]
  );

  return {
    items,
    drafts,
    edits,
    addDraft,
    addSavedItems,
    updateField,
    markSaved,
    removeDraft,
    removeSavedItem,
    restoreSavedItem,
    clearEditsForItem,
    getItemValues,
  };
}
