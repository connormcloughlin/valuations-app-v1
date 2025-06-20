import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ProgressBar, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Types for the sync configuration
export interface SyncConfig {
  batchSize?: number;
  retryAttempts?: number;
  batchDelay?: number;
  timeout?: number;
}

export interface SyncItem {
  id: string;
  type: 'data' | 'media';
  data: any;
  size?: number; // For media files
}

export interface SyncResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ id: string; error: string }>;
}

export interface SyncStrategy {
  data: SyncConfig;
  media: SyncConfig;
}

// Props for the BatchSyncManager component
export interface BatchSyncManagerProps {
  // Data to sync
  items: SyncItem[];
  
  // Sync function - should return Promise<void> for success
  onSyncItem: (item: SyncItem) => Promise<void>;
  
  // Configuration
  strategy?: Partial<SyncStrategy>;
  
  // Callbacks
  onSyncStart?: () => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncProgress?: (current: number, total: number, currentItem?: SyncItem) => void;
  onSyncError?: (error: string, item?: SyncItem) => void;
  
  // UI Configuration
  showProgress?: boolean;
  showDetails?: boolean;
  autoStart?: boolean;
  
  // Custom labels
  labels?: {
    startButton?: string;
    cancelButton?: string;
    syncingText?: string;
    completeText?: string;
    errorText?: string;
  };
}

// Default configurations
const DEFAULT_STRATEGY: SyncStrategy = {
  data: {
    batchSize: 5,
    retryAttempts: 3,
    batchDelay: 200,
    timeout: 30000
  },
  media: {
    batchSize: 1,
    retryAttempts: 3,
    batchDelay: 500,
    timeout: 120000 // 2 minutes for media files
  }
};

const DEFAULT_LABELS = {
  startButton: 'Start Sync',
  cancelButton: 'Cancel',
  syncingText: 'Syncing...',
  completeText: 'Sync Complete',
  errorText: 'Sync Error'
};

export const BatchSyncManager: React.FC<BatchSyncManagerProps> = ({
  items = [],
  onSyncItem,
  strategy = {},
  onSyncStart,
  onSyncComplete,
  onSyncProgress,
  onSyncError,
  showProgress = true,
  showDetails = true,
  autoStart = false,
  labels = {}
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentItem, setCurrentItem] = useState<SyncItem | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Merge configurations
  const config = {
    data: { ...DEFAULT_STRATEGY.data, ...strategy.data },
    media: { ...DEFAULT_STRATEGY.media, ...strategy.media }
  };
  
  const uiLabels = { ...DEFAULT_LABELS, ...labels };

  // Individual item sync with retry logic
  const syncSingleItem = useCallback(async (item: SyncItem, maxRetries: number): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await onSyncItem(item);
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Exponential backoff for retries
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retry ${attempt}/${maxRetries} for ${item.type} item ${item.id} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [onSyncItem]);

  // Process items by type with appropriate strategy
  const processItemsByType = useCallback(async (
    itemsToProcess: SyncItem[], 
    itemType: 'data' | 'media'
  ): Promise<{ successCount: number; errorCount: number; errors: Array<{ id: string; error: string }> }> => {
    const typeConfig = config[itemType];
    const batchSize = typeConfig.batchSize || 1;
    const delay = typeConfig.batchDelay || 200;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];
    
    console.log(`🔄 Processing ${itemsToProcess.length} ${itemType} items in batches of ${batchSize}`);
    
    // Process in batches
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      if (isCancelled) {
        console.log('🛑 Sync cancelled by user');
        break;
      }
      
      const batch = itemsToProcess.slice(i, i + batchSize);
      console.log(`📦 Processing ${itemType} batch ${Math.floor(i/batchSize) + 1}: ${batch.length} items`);
      
      try {
        if (itemType === 'media' || batchSize === 1) {
          // Process sequentially for media files or when batch size is 1
          for (const item of batch) {
            if (isCancelled) break;
            
            setCurrentItem(item);
            try {
              await syncSingleItem(item, typeConfig.retryAttempts || 3);
              successCount++;
            } catch (error) {
              console.error(`❌ Failed to sync ${itemType} item ${item.id}:`, error);
              errorCount++;
              const errorMessage = error instanceof Error ? error.message : String(error);
              errors.push({ id: item.id, error: errorMessage });
              onSyncError?.(errorMessage, item);
            }
            
            // Update progress
            const totalProcessed = i + successCount + errorCount;
            setProgress({ current: totalProcessed, total: items.length });
            onSyncProgress?.(totalProcessed, items.length, item);
          }
        } else {
          // Process batch in parallel for data items
          const results = await Promise.allSettled(
            batch.map(item => {
              setCurrentItem(item);
              return syncSingleItem(item, typeConfig.retryAttempts || 3);
            })
          );
          
          results.forEach((result, index) => {
            const item = batch[index];
            if (result.status === 'fulfilled') {
              successCount++;
            } else {
              console.error(`❌ Failed to sync ${itemType} item ${item.id}:`, result.reason);
              errorCount++;
              const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
              errors.push({ id: item.id, error: errorMessage });
              onSyncError?.(errorMessage, item);
            }
          });
          
          // Update progress
          const totalProcessed = i + batch.length;
          setProgress({ current: totalProcessed, total: items.length });
          onSyncProgress?.(totalProcessed, items.length);
        }
        
        // Delay between batches
        if (i + batchSize < itemsToProcess.length && !isCancelled) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (batchError) {
        console.error(`❌ Batch processing error for ${itemType}:`, batchError);
        batch.forEach(item => {
          errorCount++;
          const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
          errors.push({ id: item.id, error: errorMessage });
        });
      }
    }
    
    return { successCount, errorCount, errors };
  }, [config, isCancelled, items.length, onSyncProgress, onSyncError, syncSingleItem]);

  // Main sync function
  const startSync = useCallback(async () => {
    try {
      setIsActive(true);
      setIsCancelled(false);
      setProgress({ current: 0, total: items.length });
      setResult(null);
      setError(null);
      setCurrentItem(null);
      
      onSyncStart?.();
      
      console.log(`🚀 Starting sync: ${items.length} total items`);
      
      // Separate items by type
      const dataItems = items.filter(item => item.type === 'data');
      const mediaItems = items.filter(item => item.type === 'media');
      
      let totalSuccessCount = 0;
      let totalErrorCount = 0;
      let allErrors: Array<{ id: string; error: string }> = [];
      
      // Process data items first
      if (dataItems.length > 0 && !isCancelled) {
        console.log(`📊 Processing ${dataItems.length} data items...`);
        const dataResult = await processItemsByType(dataItems, 'data');
        totalSuccessCount += dataResult.successCount;
        totalErrorCount += dataResult.errorCount;
        allErrors = [...allErrors, ...dataResult.errors];
      }
      
      // Process media items second
      if (mediaItems.length > 0 && !isCancelled) {
        console.log(`🎬 Processing ${mediaItems.length} media items...`);
        const mediaResult = await processItemsByType(mediaItems, 'media');
        totalSuccessCount += mediaResult.successCount;
        totalErrorCount += mediaResult.errorCount;
        allErrors = [...allErrors, ...mediaResult.errors];
      }
      
      const finalResult: SyncResult = {
        successCount: totalSuccessCount,
        errorCount: totalErrorCount,
        errors: allErrors
      };
      
      setResult(finalResult);
      onSyncComplete?.(finalResult);
      
      console.log(`🎉 Sync completed: ${totalSuccessCount} success, ${totalErrorCount} errors`);
      
    } catch (syncError) {
      const errorMessage = `Sync failed: ${syncError instanceof Error ? syncError.message : String(syncError)}`;
      console.error('❌', errorMessage);
      setError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setIsActive(false);
      setCurrentItem(null);
    }
  }, [items, isCancelled, onSyncStart, onSyncComplete, onSyncError, processItemsByType]);

  // Cancel sync
  const cancelSync = useCallback(() => {
    setIsCancelled(true);
    setIsActive(false);
    setCurrentItem(null);
    console.log('🛑 User cancelled sync');
  }, []);

  // Auto-start if configured
  React.useEffect(() => {
    if (autoStart && items.length > 0 && !isActive) {
      startSync();
    }
  }, [autoStart, items.length, isActive, startSync]);

  // Calculate progress percentage
  const progressPercentage = progress.total > 0 ? progress.current / progress.total : 0;

  return (
    <Card style={styles.container}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name={isActive ? "sync" : result ? "check-circle" : "sync-off"} 
            size={24} 
            color={isActive ? "#2196F3" : result ? "#4CAF50" : "#757575"} 
          />
          <Text style={styles.title}>
            {isActive ? uiLabels.syncingText : result ? uiLabels.completeText : 'Batch Sync'}
          </Text>
        </View>

        {/* Progress Bar */}
        {showProgress && (
          <View style={styles.progressSection}>
            <ProgressBar 
              progress={progressPercentage} 
              color="#2196F3"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {progress.current} of {progress.total} items
              {progressPercentage > 0 && ` (${Math.round(progressPercentage * 100)}%)`}
            </Text>
          </View>
        )}

        {/* Current Item */}
        {showDetails && currentItem && (
          <View style={styles.currentItemSection}>
            <Text style={styles.currentItemText}>
              Processing {currentItem.type}: {currentItem.id}
            </Text>
          </View>
        )}

        {/* Result Summary */}
        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.resultText}>
              ✅ Success: {result.successCount} | ❌ Errors: {result.errorCount}
            </Text>
            {result.errors.length > 0 && showDetails && (
              <View style={styles.errorsSection}>
                <Text style={styles.errorsTitle}>Errors:</Text>
                {result.errors.slice(0, 3).map((err, index) => (
                  <Text key={index} style={styles.errorItem}>
                    • {err.id}: {err.error}
                  </Text>
                ))}
                {result.errors.length > 3 && (
                  <Text style={styles.moreErrors}>
                    ... and {result.errors.length - 3} more errors
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          {!isActive ? (
            <Button 
              mode="contained" 
              onPress={startSync}
              disabled={items.length === 0}
              style={styles.startButton}
            >
              {uiLabels.startButton} ({items.length} items)
            </Button>
          ) : (
            <Button 
              mode="outlined" 
              onPress={cancelSync}
              style={styles.cancelButton}
            >
              {uiLabels.cancelButton}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#212121',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  currentItemSection: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  currentItemText: {
    fontSize: 12,
    color: '#1976D2',
    fontFamily: 'monospace',
  },
  resultSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  errorsSection: {
    marginTop: 8,
  },
  errorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 4,
  },
  errorItem: {
    fontSize: 11,
    color: '#D32F2F',
    marginLeft: 8,
    marginBottom: 2,
  },
  moreErrors: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  errorSection: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  buttonSection: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  cancelButton: {
    borderColor: '#FF5722',
    flex: 1,
  },
});

export default BatchSyncManager; 