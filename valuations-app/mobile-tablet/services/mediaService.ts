import * as FileSystem from 'expo-file-system';
import {
  insertMediaFile,
  getMediaFilesByEntity,
  updateMediaFile,
  deleteMediaFile,
  MediaFile,
  getPendingSyncMediaFiles,
  markMediaFilesAsSynced
} from '../utils/db';
import api from '../api';

export interface PhotoResult {
  uri: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  exif?: any;
}

class MediaService {
  private mediaDirectory = `${FileSystem.documentDirectory}media/`;

  constructor() {
    this.initializeMediaDirectory();
  }

  private async initializeMediaDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.mediaDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.mediaDirectory, { intermediates: true });
        console.log('Created media directory:', this.mediaDirectory);
      }
    } catch (error) {
      console.error('Error creating media directory:', error);
    }
  }

  /**
   * Process and save a photo to local storage
   */
  async savePhoto(photoUri: string, entityName: string, entityID: number, metadata?: any): Promise<MediaFile> {
    try {
      console.log('Processing photo for:', { entityName, entityID, photoUri });

      // Get photo info
      const photoInfo = await FileSystem.getInfoAsync(photoUri);
      if (!photoInfo.exists) {
        throw new Error('Photo file does not exist');
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const extension = photoUri.split('.').pop() || 'jpg';
      const fileName = `${entityName}_${entityID}_${timestamp}.${extension}`;
      const localPath = `${this.mediaDirectory}${fileName}`;

      // Copy the image to our media directory (preserving full quality for high-value art)
      await FileSystem.copyAsync({
        from: photoUri,
        to: localPath
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const fileSize = (fileInfo as any).size || 0;
      
      // Create media record
      const mediaFile: MediaFile = {
        FileName: fileName,
        FileType: 'image/jpeg',
        BlobURL: '', // Will be populated when uploaded to Azure
        EntityName: entityName,
        EntityID: entityID,
        UploadedAt: new Date().toISOString(),
        UploadedBy: 'mobile-user', // TODO: Get actual user ID
        IsDeleted: 0,
        Metadata: JSON.stringify({
          originalSize: fileSize,
          fullQuality: true,
          timestamp: timestamp,
          ...metadata
        }),
        LocalPath: localPath,
        pending_sync: 1
      };

      // Save to database
      const mediaID = await insertMediaFile(mediaFile);
      if (typeof mediaID === 'number') {
        mediaFile.MediaID = mediaID;
      }

      console.log('Successfully saved photo:', { mediaID, fileName, localPath });
      return mediaFile;

    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  /**
   * Get photos for a specific entity (risk assessment item)
   */
  async getPhotosForEntity(entityName: string, entityID: number, includeDeleted: boolean = false): Promise<MediaFile[]> {
    try {
      return await getMediaFilesByEntity(entityName, entityID, includeDeleted);
    } catch (error) {
      console.error('Error getting photos for entity:', error);
      return [];
    }
  }

  /**
   * Delete a photo (soft delete)
   */
  async deletePhoto(mediaID: number): Promise<void> {
    try {
      await deleteMediaFile(mediaID);
      console.log('Deleted photo:', mediaID);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Get local file URI for a media file
   */
  async getLocalPhotoUri(mediaFile: MediaFile): Promise<string | null> {
    if (mediaFile.LocalPath) {
      const fileInfo = await FileSystem.getInfoAsync(mediaFile.LocalPath);
      if (fileInfo.exists) {
        return mediaFile.LocalPath;
      }
    }
    return null;
  }

  /**
   * Upload pending photos to Azure Blob Storage via API
   */
  async uploadPendingPhotos(): Promise<{ success: boolean; uploaded: number; errors: any[] }> {
    try {
      const pendingFiles = await getPendingSyncMediaFiles();
      console.log('Found pending media files to upload:', pendingFiles.length);

      let uploaded = 0;
      const errors: any[] = [];

      for (const mediaFile of pendingFiles) {
        try {
          if (mediaFile.LocalPath) {
            const fileInfo = await FileSystem.getInfoAsync(mediaFile.LocalPath);
            if (fileInfo.exists) {
              // Read the file as base64
              const base64Data = await FileSystem.readAsStringAsync(mediaFile.LocalPath, {
                encoding: FileSystem.EncodingType.Base64
              });

              // Upload via API
              const uploadResult = await api.uploadMedia({
                fileName: mediaFile.FileName,
                fileType: mediaFile.FileType,
                entityName: mediaFile.EntityName,
                entityID: mediaFile.EntityID,
                base64Data: base64Data,
                metadata: mediaFile.Metadata
              });

              if (uploadResult.success && uploadResult.data.blobUrl) {
                // Update the media file with the blob URL
                await updateMediaFile({
                  ...mediaFile,
                  BlobURL: uploadResult.data.blobUrl,
                  pending_sync: 0
                });
                uploaded++;
                console.log('Successfully uploaded:', mediaFile.FileName);
              } else {
                errors.push({
                  mediaID: mediaFile.MediaID,
                  fileName: mediaFile.FileName,
                  error: uploadResult.message || 'Upload failed'
                });
              }
            } else {
              errors.push({
                mediaID: mediaFile.MediaID,
                fileName: mediaFile.FileName,
                error: 'Local file not found'
              });
            }
          } else {
            errors.push({
              mediaID: mediaFile.MediaID,
              fileName: mediaFile.FileName,
              error: 'No local path specified'
            });
          }
        } catch (error) {
          errors.push({
            mediaID: mediaFile.MediaID,
            fileName: mediaFile.FileName,
            error: (error as Error).message
          });
        }
      }

      return {
        success: errors.length === 0,
        uploaded,
        errors
      };

    } catch (error) {
      console.error('Error uploading pending photos:', error);
      return {
        success: false,
        uploaded: 0,
        errors: [{ error: (error as Error).message }]
      };
    }
  }

  /**
   * Download photos from Azure Blob Storage for a specific entity
   */
  async downloadPhotosForEntity(entityName: string, entityID: number): Promise<MediaFile[]> {
    try {
      console.log('Downloading photos for:', { entityName, entityID });

      // Call API to get media files for this entity
      const response = await api.getMediaForEntity(entityName, entityID);
      
      if (!response.success || !response.data) {
        console.log('No photos found on server for entity');
        return await this.getPhotosForEntity(entityName, entityID);
      }

      const downloadedFiles: MediaFile[] = [];

      for (const serverMediaFile of response.data) {
        try {
          // Check if we already have this file locally
          const existingFiles = await getMediaFilesByEntity(entityName, entityID);
          const existingFile = existingFiles.find(f => f.FileName === serverMediaFile.FileName);

          if (existingFile && existingFile.LocalPath) {
            // File already exists locally
            downloadedFiles.push(existingFile);
            continue;
          }

          // Download the file
          const localPath = `${this.mediaDirectory}${serverMediaFile.FileName}`;
          const downloadResult = await FileSystem.downloadAsync(
            serverMediaFile.BlobURL,
            localPath
          );

          if (downloadResult.status === 200) {
            // Create or update media record
            const mediaFile: MediaFile = {
              MediaID: existingFile?.MediaID,
              FileName: serverMediaFile.FileName,
              FileType: serverMediaFile.FileType,
              BlobURL: serverMediaFile.BlobURL,
              EntityName: entityName,
              EntityID: entityID,
              UploadedAt: serverMediaFile.UploadedAt,
              UploadedBy: serverMediaFile.UploadedBy,
              IsDeleted: serverMediaFile.IsDeleted ? 1 : 0,
              Metadata: serverMediaFile.Metadata,
              LocalPath: localPath,
              pending_sync: 0
            };

            if (existingFile) {
              await updateMediaFile(mediaFile);
            } else {
              const mediaID = await insertMediaFile(mediaFile);
              if (typeof mediaID === 'number') {
                mediaFile.MediaID = mediaID;
              }
            }

            downloadedFiles.push(mediaFile);
            console.log('Downloaded:', serverMediaFile.FileName);
          }
        } catch (error) {
          console.error('Error downloading file:', serverMediaFile.FileName, error);
        }
      }

      return downloadedFiles;

    } catch (error) {
      console.error('Error downloading photos for entity:', error);
      return await this.getPhotosForEntity(entityName, entityID);
    }
  }

  /**
   * Clean up old local files to free space
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = await FileSystem.readDirectoryAsync(this.mediaDirectory);
      
      for (const fileName of files) {
        const filePath = `${this.mediaDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < cutoffDate.getTime()) {
          await FileSystem.deleteAsync(filePath);
          console.log('Cleaned up old file:', fileName);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.mediaDirectory);
      let totalSize = 0;

      for (const fileName of files) {
        const filePath = `${this.mediaDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && (fileInfo as any).size) {
          totalSize += (fileInfo as any).size;
        }
      }

      return {
        totalFiles: files.length,
        totalSize
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

export default new MediaService(); 