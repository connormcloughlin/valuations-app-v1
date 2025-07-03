export interface SyncConfig {
  batchSizes: {
    riskAssessmentItems: number;
    appointments: number;
    riskAssessmentMasters: number;
    mediaFiles: number;
  };
  delays: {
    betweenBatches: number;
    betweenMediaBatches: number;
  };
  retries: {
    maxRetries: number;
    retryDelay: number;
  };
  timeout: {
    defaultTimeout: number;
    mediaTimeout: number;
  };
}

export const SYNC_CONFIG: SyncConfig = {
  batchSizes: {
    riskAssessmentItems: 10,  // 10 items per batch - optimal for network performance
    appointments: 20,         // 20 appointments per batch - appointments are smaller
    riskAssessmentMasters: 10, // 10 masters per batch
    mediaFiles: 5             // 5 media files per batch - media files are large
  },
  delays: {
    betweenBatches: 300,      // 300ms delay between regular batches
    betweenMediaBatches: 500  // 500ms delay between media batches (longer for large files)
  },
  retries: {
    maxRetries: 3,            // Maximum number of retry attempts per batch
    retryDelay: 1000          // 1 second delay before retry
  },
  timeout: {
    defaultTimeout: 30000,    // 30 seconds for regular requests
    mediaTimeout: 120000      // 2 minutes for media uploads
  }
};

// Environment-specific configurations
export const getEnvironmentConfig = (env: 'development' | 'production' | 'test'): SyncConfig => {
  switch (env) {
    case 'development':
      return {
        ...SYNC_CONFIG,
        batchSizes: {
          ...SYNC_CONFIG.batchSizes,
          riskAssessmentItems: 5,  // Smaller batches for development
          appointments: 10,
          riskAssessmentMasters: 5,
          mediaFiles: 2
        },
        delays: {
          betweenBatches: 500,     // Longer delays for development
          betweenMediaBatches: 1000
        }
      };
    case 'test':
      return {
        ...SYNC_CONFIG,
        batchSizes: {
          riskAssessmentItems: 2,
          appointments: 5,
          riskAssessmentMasters: 2,
          mediaFiles: 1
        },
        delays: {
          betweenBatches: 100,
          betweenMediaBatches: 200
        }
      };
    case 'production':
    default:
      return SYNC_CONFIG;
  }
}; 