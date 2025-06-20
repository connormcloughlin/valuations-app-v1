# Batch Sync Manager

A reusable component for handling large-scale data synchronization with different strategies for data records and media files.

## Features

- **Batched Processing**: Data records in batches of 5, media files one at a time
- **Progress Tracking**: Real-time progress updates with visual indicators
- **Error Handling**: Continues processing on individual failures with detailed error reporting
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Cancellation**: Users can cancel long-running sync operations
- **Flexible Configuration**: Customizable batch sizes, delays, and retry strategies

## Basic Usage

```tsx
import { BatchSyncManager, createSyncItems } from '../components/sync';
import api from '../api';

// In your component
const MyComponent = () => {
  // Prepare your data
  const dataRecords = [
    { id: '1', name: 'Record 1', data: 'some data' },
    { id: '2', name: 'Record 2', data: 'more data' }
  ];
  
  const mediaFiles = [
    { id: 'img1', filename: 'photo1.jpg', size: 1024000 },
    { id: 'img2', filename: 'photo2.jpg', size: 2048000 }
  ];

  // Create sync items
  const syncItems = [
    ...createSyncItems(dataRecords, 'data'),
    ...createSyncItems(mediaFiles, 'media', 'id', 'size')
  ];

  // Define sync function
  const handleSyncItem = async (item: SyncItem) => {
    if (item.type === 'data') {
      await api.syncDataRecord(item.data);
    } else {
      await api.uploadMediaFile(item.data);
    }
  };

  return (
    <BatchSyncManager
      items={syncItems}
      onSyncItem={handleSyncItem}
      onSyncComplete={(result) => {
        console.log(`Sync complete: ${result.successCount} success, ${result.errorCount} errors`);
      }}
    />
  );
};
```

## Advanced Configuration

```tsx
<BatchSyncManager
  items={syncItems}
  onSyncItem={handleSyncItem}
  strategy={{
    data: {
      batchSize: 10,        // Process 10 data records at once
      retryAttempts: 5,     // Retry failed items 5 times
      batchDelay: 100,      // 100ms delay between batches
      timeout: 60000        // 60 second timeout per item
    },
    media: {
      batchSize: 1,         // Always 1 for media files
      retryAttempts: 3,     // 3 retry attempts for media
      batchDelay: 1000,     // 1 second delay between media files
      timeout: 300000       // 5 minute timeout for large files
    }
  }}
  labels={{
    startButton: 'Begin Upload',
    cancelButton: 'Stop Upload',
    syncingText: 'Uploading...',
    completeText: 'Upload Complete'
  }}
  showProgress={true}
  showDetails={true}
  onSyncStart={() => console.log('Sync started')}
  onSyncProgress={(current, total) => console.log(`Progress: ${current}/${total}`)}
  onSyncError={(error, item) => console.error(`Error with ${item?.id}: ${error}`)}
  onSyncComplete={(result) => {
    if (result.errorCount > 0) {
      alert(`Sync completed with ${result.errorCount} errors`);
    }
  }}
/>
```

## Using the Hook

For more control, you can use the `useBatchSync` hook:

```tsx
import { useBatchSync, createSyncItems } from '../components/sync';

const MyComponent = () => {
  const { isActive, progress, result, error, startSync, cancelSync } = useBatchSync();
  
  const handleSync = async () => {
    const items = createSyncItems(myData, 'data');
    await startSync(items, async (item) => {
      await api.syncItem(item.data);
    });
  };

  return (
    <View>
      <Button onPress={handleSync} disabled={isActive}>
        Start Sync ({progress.total} items)
      </Button>
      
      {isActive && (
        <View>
          <Text>Progress: {progress.current}/{progress.total}</Text>
          <Button onPress={cancelSync}>Cancel</Button>
        </View>
      )}
      
      {result && (
        <Text>
          Complete: {result.successCount} success, {result.errorCount} errors
        </Text>
      )}
    </View>
  );
};
```

## Utility Functions

```tsx
import { 
  createSyncItems, 
  groupSyncItemsByType, 
  calculateTotalSize,
  formatFileSize,
  estimateSyncDuration 
} from '../components/sync';

// Create sync items from different data sources
const dataItems = createSyncItems(records, 'data', 'recordId');
const mediaItems = createSyncItems(files, 'media', 'fileId', 'fileSize');

// Group items by type
const { data, media } = groupSyncItemsByType([...dataItems, ...mediaItems]);

// Calculate sizes and estimates
const totalSize = calculateTotalSize(mediaItems);
const formattedSize = formatFileSize(totalSize); // "15.2 MB"
const estimatedTime = estimateSyncDuration([...dataItems, ...mediaItems]); // "~3 minutes"
```

## Integration with SQLite

```tsx
// Example integration with your existing SQLite utilities
const syncPendingRecords = async () => {
  const { getAllPendingSyncRecords, getAllPendingMediaFiles } = await import('../utils/db');
  
  const pendingData = await getAllPendingSyncRecords();
  const pendingMedia = await getAllPendingMediaFiles();
  
  const syncItems = [
    ...createSyncItems(pendingData, 'data'),
    ...createSyncItems(pendingMedia, 'media', 'id', 'fileSize')
  ];
  
  const handleSync = async (item: SyncItem) => {
    if (item.type === 'data') {
      await api.syncRecord(item.data);
      // Mark as synced in SQLite
      await markRecordAsSynced(item.id);
    } else {
      await api.uploadFile(item.data);
      // Mark media as synced
      await markMediaAsSynced(item.id);
    }
  };
  
  return { syncItems, handleSync };
};
```

## Best Practices

1. **Data vs Media**: Always use smaller batch sizes for media files (1-2) and larger for data (5-10)
2. **Error Handling**: Don't stop the entire sync on individual failures - let it continue
3. **Progress Feedback**: Always show progress for long-running operations
4. **Cancellation**: Provide cancel functionality for user experience
5. **Retry Logic**: Use exponential backoff for network-related failures
6. **Resource Management**: Add delays between batches to avoid overwhelming the server

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `batchSize` | number | 5 (data), 1 (media) | Items processed simultaneously |
| `retryAttempts` | number | 3 | Number of retry attempts for failed items |
| `batchDelay` | number | 200ms (data), 500ms (media) | Delay between batches |
| `timeout` | number | 30s (data), 120s (media) | Timeout per item |
| `showProgress` | boolean | true | Show progress bar |
| `showDetails` | boolean | true | Show current item and error details |
| `autoStart` | boolean | false | Start sync automatically when items are provided | 