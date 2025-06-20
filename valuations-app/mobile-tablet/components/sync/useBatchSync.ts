import { useState, useCallback } from 'react';
import { SyncItem, SyncResult } from './BatchSyncManager';

export interface UseBatchSyncReturn {
  // State
  isActive: boolean;
  progress: { current: number; total: number };
  result: SyncResult | null;
  error: string | null;
  
  // Actions
  startSync: (items: SyncItem[], syncFunction: (item: SyncItem) => Promise<void>) => Promise<void>;
  cancelSync: () => void;
  resetSync: () => void;
}

export const useBatchSync = (): UseBatchSyncReturn => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  const startSync = useCallback(async (
    items: SyncItem[], 
    syncFunction: (item: SyncItem) => Promise<void>
  ) => {
    try {
      setIsActive(true);
      setIsCancelled(false);
      setProgress({ current: 0, total: items.length });
      setResult(null);
      setError(null);

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ id: string; error: string }> = [];

      // Separate items by type for different processing strategies
      const dataItems = items.filter(item => item.type === 'data');
      const mediaItems = items.filter(item => item.type === 'media');

      // Process data items in batches of 5
      for (let i = 0; i < dataItems.length; i += 5) {
        if (isCancelled) break;
        
        const batch = dataItems.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map(item => syncFunction(item))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
            errors.push({ 
              id: batch[index].id, 
              error: result.reason.message 
            });
          }
        });

        setProgress({ current: successCount + errorCount, total: items.length });
        
        // Small delay between batches
        if (i + 5 < dataItems.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Process media items one at a time
      for (const item of mediaItems) {
        if (isCancelled) break;
        
        try {
          await syncFunction(item);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({ id: item.id, error: error instanceof Error ? error.message : String(error) });
        }

        setProgress({ current: successCount + errorCount, total: items.length });
        
        // Longer delay for media items
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const finalResult: SyncResult = {
        successCount,
        errorCount,
        errors
      };

      setResult(finalResult);

    } catch (syncError) {
      setError(`Sync failed: ${syncError instanceof Error ? syncError.message : String(syncError)}`);
    } finally {
      setIsActive(false);
    }
  }, [isCancelled]);

  const cancelSync = useCallback(() => {
    setIsCancelled(true);
    setIsActive(false);
  }, []);

  const resetSync = useCallback(() => {
    setIsActive(false);
    setProgress({ current: 0, total: 0 });
    setResult(null);
    setError(null);
    setIsCancelled(false);
  }, []);

  return {
    isActive,
    progress,
    result,
    error,
    startSync,
    cancelSync,
    resetSync
  };
}; 