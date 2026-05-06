import * as FileSystem from 'expo-file-system/legacy';
import api from '../api';
import { getMediaFilesByEntity } from '../utils/db';
import { debugLog, errorLog } from '../utils/debugUtils';

interface PrefetchProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

interface PrefetchResult {
  success: boolean;
  downloaded: number;
  failed: number;
  errors: string[];
  totalSize: number;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

class ImagePrefetchService {
  private mediaDirectory: string | null = null;
  private isPrefetching = false;
  private currentProgress: PrefetchProgress | null = null;

  constructor() {
    this.initializeMediaDirectory();
  }

  /**
   * Get the media directory path
   */
  private async getMediaDirectory(): Promise<string> {
    if (!this.mediaDirectory) {
      // In SDK 54, documentDirectory is available in the legacy module
      const docDir = FileSystem.documentDirectory;
      if (!docDir) {
        throw new Error('documentDirectory is not available');
      }
      this.mediaDirectory = `${docDir}prefetched_images/`;
    }
    return this.mediaDirectory;
  }

  /**
   * Initialize the prefetched images directory
   */
  private async initializeMediaDirectory(): Promise<void> {
    try {
      const mediaDir = await this.getMediaDirectory();
      const dirInfo = await FileSystem.getInfoAsync(mediaDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
        debugLog('ImagePrefetchService: Created prefetched images directory', mediaDir);
      }
    } catch (error) {
      errorLog('ImagePrefetchService: Error creating media directory', error);
    }
  }

  /**
   * Prefetch all images for a specific entity (e.g., risk assessment item)
   */
  async prefetchImagesForEntity(entityName: string, entityID: number): Promise<PrefetchResult> {
    try {
      debugLog(`ImagePrefetchService: Starting prefetch for ${entityName} ${entityID}`);
      
      // Get all media files for this entity
      const mediaFiles = await getMediaFilesByEntity(entityName, entityID);
      const backendMediaFiles = mediaFiles.filter(f => (f as any).BackendMediaID && f.pending_sync === 0);
      
      if (backendMediaFiles.length === 0) {
        debugLog(`ImagePrefetchService: No backend media files found for ${entityName} ${entityID}`);
        return { success: true, downloaded: 0, failed: 0, errors: [], totalSize: 0 };
      }

      debugLog(`ImagePrefetchService: Found ${backendMediaFiles.length} backend media files to prefetch`);

      const progress: PrefetchProgress = {
        total: backendMediaFiles.length,
        completed: 0,
        failed: 0
      };
      this.currentProgress = progress;

      const result: PrefetchResult = {
        success: true,
        downloaded: 0,
        failed: 0,
        errors: [],
        totalSize: 0
      };

      // Download each image
      for (const mediaFile of backendMediaFiles) {
        try {
          progress.current = mediaFile.FileName;
          this.currentProgress = { ...progress };
          
          const downloadResult = await this.downloadAndStoreImage(mediaFile);
          if (downloadResult.success) {
            result.downloaded++;
            result.totalSize += downloadResult.size || 0;
            progress.completed++;
            this.currentProgress = { ...progress };
            debugLog(`ImagePrefetchService: Downloaded ${mediaFile.FileName} (${downloadResult.size} bytes)`);
          } else {
            result.failed++;
            result.errors.push(`Failed to download ${mediaFile.FileName}: ${downloadResult.error}`);
            progress.failed++;
            this.currentProgress = { ...progress };
            errorLog(`ImagePrefetchService: Failed to download ${mediaFile.FileName}`, downloadResult.error);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error downloading ${mediaFile.FileName}: ${error}`);
          progress.failed++;
          this.currentProgress = { ...progress };
          errorLog(`ImagePrefetchService: Error downloading ${mediaFile.FileName}`, error);
        }
      }

      debugLog(`ImagePrefetchService: Prefetch completed for ${entityName} ${entityID}: ${result.downloaded} downloaded, ${result.failed} failed`);
      return result;

    } catch (error) {
      errorLog('ImagePrefetchService: Error prefetching images', error);
      return {
        success: false,
        downloaded: 0,
        failed: 0,
        errors: [errorMessage(error)],
        totalSize: 0
      };
    } finally {
      this.currentProgress = null;
    }
  }

  /**
   * Download and store a single image
   */
  private async downloadAndStoreImage(mediaFile: any): Promise<{ success: boolean; size?: number; error?: string }> {
    try {
      const backendMediaID = (mediaFile as any).BackendMediaID;
      if (!backendMediaID) {
        return { success: false, error: 'No BackendMediaID found' };
      }

      // Fetch image from backend API
      debugLog(`ImagePrefetchService: Fetching image ${backendMediaID} from backend API`);
      const response = await api.fetchImage(backendMediaID);
      
      if (!response.success || !response.data?.imageUrl) {
        return { success: false, error: response.message || 'Failed to fetch image from API' };
      }

      // Convert data URL to base64
      const imageUrl = response.data.imageUrl;
      let base64Data: string;
      
      if (imageUrl.startsWith('data:')) {
        // Extract base64 from data URL
        const base64Index = imageUrl.indexOf(',');
        base64Data = imageUrl.substring(base64Index + 1);
      } else {
        // Assume it's already base64
        base64Data = imageUrl;
      }

      // Create local file path
      const fileName = `prefetched_${backendMediaID}_${mediaFile.FileName}`;
      const mediaDir = await this.getMediaDirectory();
      const localPath = `${mediaDir}${fileName}`;

      // Write base64 data to file
      await FileSystem.writeAsStringAsync(localPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = (fileInfo as any).size || 0;

      // Update media file record with local path
      await this.updateMediaFileWithLocalPath(mediaFile.MediaID, localPath);

      return { success: true, size };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  }

  /**
   * Update media file record with local prefetched path
   */
  private async updateMediaFileWithLocalPath(mediaID: number, localPath: string): Promise<void> {
    try {
      const { runSql } = await import('../utils/db');
      
      // Update the media file directly in the database
      await runSql(
        'UPDATE media_files SET LocalPath = ?, pending_sync = 0 WHERE MediaID = ?',
        [localPath, mediaID]
      );
      
      debugLog(`ImagePrefetchService: Updated media file ${mediaID} with local path`, localPath);
    } catch (error) {
      errorLog('ImagePrefetchService: Error updating media file with local path', error);
    }
  }

  /**
   * Prefetch all images for multiple entities (batch operation)
   */
  async prefetchImagesForEntities(entities: Array<{ entityName: string; entityID: number }>): Promise<PrefetchResult> {
    try {
      debugLog(`ImagePrefetchService: Starting batch prefetch for ${entities.length} entities`);
      
      const totalResult: PrefetchResult = {
        success: true,
        downloaded: 0,
        failed: 0,
        errors: [],
        totalSize: 0
      };

      for (const entity of entities) {
        try {
          const result = await this.prefetchImagesForEntity(entity.entityName, entity.entityID);
          totalResult.downloaded += result.downloaded;
          totalResult.failed += result.failed;
          totalResult.errors.push(...result.errors);
          totalResult.totalSize += result.totalSize;
        } catch (error) {
          errorLog(`ImagePrefetchService: Error prefetching ${entity.entityName} ${entity.entityID}`, error);
          totalResult.failed++;
          totalResult.errors.push(`Error prefetching ${entity.entityName} ${entity.entityID}: ${error}`);
        }
      }

      debugLog(`ImagePrefetchService: Batch prefetch completed: ${totalResult.downloaded} downloaded, ${totalResult.failed} failed`);
      return totalResult;

    } catch (error) {
      errorLog('ImagePrefetchService: Error in batch prefetch', error);
      return {
        success: false,
        downloaded: 0,
        failed: 0,
        errors: [errorMessage(error)],
        totalSize: 0
      };
    }
  }

  /**
   * Get current prefetch progress
   */
  getProgress(): PrefetchProgress | null {
    return this.currentProgress;
  }

  /**
   * Check if prefetch is currently running
   */
  isRunning(): boolean {
    return this.isPrefetching;
  }

  /**
   * Get storage statistics for prefetched images
   */
  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number; files: Array<{ name: string; size: number }> }> {
    try {
      const mediaDir = await this.getMediaDirectory();
      const files = await FileSystem.readDirectoryAsync(mediaDir);
      let totalSize = 0;
      const fileStats: Array<{ name: string; size: number }> = [];
      
      for (const fileName of files) {
        const filePath = `${mediaDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && (fileInfo as any).size) {
          const size = (fileInfo as any).size;
          totalSize += size;
          fileStats.push({ name: fileName, size });
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        files: fileStats
      };
    } catch (error) {
      errorLog('ImagePrefetchService: Error getting storage stats', error);
      return { totalFiles: 0, totalSize: 0, files: [] };
    }
  }

  /**
   * Clean up old prefetched images
   */
  async cleanupOldImages(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const mediaDir = await this.getMediaDirectory();
      const files = await FileSystem.readDirectoryAsync(mediaDir);
      
      for (const fileName of files) {
        const filePath = `${mediaDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < cutoffDate.getTime()) {
          await FileSystem.deleteAsync(filePath);
          debugLog('ImagePrefetchService: Cleaned up old prefetched image', fileName);
        }
      }
    } catch (error) {
      errorLog('ImagePrefetchService: Error cleaning up old images', error);
    }
  }

  /**
   * Clear all prefetched images
   */
  async clearAllPrefetchedImages(): Promise<void> {
    try {
      const mediaDir = await this.getMediaDirectory();
      const files = await FileSystem.readDirectoryAsync(mediaDir);
      
      for (const fileName of files) {
        const filePath = `${mediaDir}${fileName}`;
        await FileSystem.deleteAsync(filePath);
      }
      
      debugLog(`ImagePrefetchService: Cleared ${files.length} prefetched images`);
    } catch (error) {
      errorLog('ImagePrefetchService: Error clearing prefetched images', error);
    }
  }

  /**
   * Check if images have been prefetched for debugging
   */
  async checkPrefetchStatus(entityName: string, entityID: number): Promise<{ total: number; prefetched: number; notPrefetched: number }> {
    try {
      const mediaFiles = await getMediaFilesByEntity(entityName, entityID);
      const backendMediaFiles = mediaFiles.filter(f => (f as any).BackendMediaID && f.pending_sync === 0);
      
      let prefetched = 0;
      let notPrefetched = 0;
      
      for (const mediaFile of backendMediaFiles) {
        if (mediaFile.LocalPath) {
          // Check if the local file actually exists
          const fileInfo = await FileSystem.getInfoAsync(mediaFile.LocalPath);
          if (fileInfo.exists) {
            prefetched++;
          } else {
            notPrefetched++;
          }
        } else {
          notPrefetched++;
        }
      }
      
      debugLog(`ImagePrefetchService: Status for ${entityName} ${entityID}: ${prefetched} prefetched, ${notPrefetched} not prefetched`);
      return { total: backendMediaFiles.length, prefetched, notPrefetched };
    } catch (error) {
      errorLog('ImagePrefetchService: Error checking prefetch status', error);
      return { total: 0, prefetched: 0, notPrefetched: 0 };
    }
  }
}

export const imagePrefetchService = new ImagePrefetchService();
export default imagePrefetchService;
