import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { getMediaFilesByEntity } from '../utils/db';

interface CachedImage {
  mediaID: number;
  imageUrl: string;
  cachedAt: string;
  expiresAt: string;
  isLocal: boolean; // Track if this is a local image
}

interface ImageResult {
  imageUrl: string;
  isLocal: boolean;
  source: 'local' | 'backend' | 'cache';
}

class HybridImageService {
  private cachePrefix = 'cached_image_';
  private cacheExpiryHours = 24; // Cache images for 24 hours

  /**
   * Get image URL for a media file - handles both local and backend images intelligently
   * Priority: Local file > Prefetched image > Cache > Backend API
   */
  async getImageUrl(mediaID: number, entityName?: string, entityID?: number): Promise<string | null> {
    try {
      console.log(`🖼️ HybridImageService: Getting image for media ID ${mediaID}`);

      // First, try to get the media file record to determine if it's local or backend
      let mediaFile = null;
      if (entityName && entityID) {
        const mediaFiles = await getMediaFilesByEntity(entityName, entityID);
        mediaFile = mediaFiles.find(f => f.MediaID === mediaID);
      }

      // Check if this is a local image (has LocalPath and pending_sync = 1)
      if (mediaFile && mediaFile.LocalPath && mediaFile.pending_sync === 1) {
        console.log(`🖼️ HybridImageService: Found local image for media ID ${mediaID}`);
        return await this.getLocalImageUrl(mediaFile.LocalPath);
      }

      // Check if this is a prefetched image (has LocalPath and pending_sync = 0)
      if (mediaFile && mediaFile.LocalPath && mediaFile.pending_sync === 0) {
        console.log(`🖼️ HybridImageService: Found prefetched image for media ID ${mediaID}`);
        return await this.getLocalImageUrl(mediaFile.LocalPath);
      }

      // Check cache first for backend images
      const cachedImage = await this.getCachedImage(mediaID);
      if (cachedImage && !this.isCacheExpired(cachedImage)) {
        console.log(`🖼️ HybridImageService: Using cached image for media ID ${mediaID}`);
        return cachedImage.imageUrl;
      }

      // For backend images, fetch from API
      if (mediaFile && (mediaFile as any).BackendMediaID) {
        console.log(`🖼️ HybridImageService: Fetching backend image for media ID ${mediaID}`);
        return await this.fetchBackendImage((mediaFile as any).BackendMediaID);
      }

      // Fallback: try to fetch from API with the provided mediaID
      console.log(`🖼️ HybridImageService: Attempting API fetch for media ID ${mediaID}`);
      return await this.fetchBackendImage(mediaID);

    } catch (error) {
      console.error(`🖼️ HybridImageService: Error getting image for media ID ${mediaID}:`, error);
      return null;
    }
  }

  /**
   * Get local image URL from file system
   */
  private async getLocalImageUrl(localPath: string): Promise<string | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        // Return file:// URI for local images
        return `file://${localPath}`;
      } else {
        console.warn(`🖼️ HybridImageService: Local file not found: ${localPath}`);
        return null;
      }
    } catch (error) {
      console.error('🖼️ HybridImageService: Error getting local image URL:', error);
      return null;
    }
  }

  /**
   * Fetch image from backend API
   */
  private async fetchBackendImage(backendMediaID: number): Promise<string | null> {
    try {
      console.log(`🖼️ HybridImageService: Fetching from backend API for media ID ${backendMediaID}`);
      const response = await api.fetchImage(backendMediaID);

      if (response.success && response.data?.imageUrl) {
        // Cache the backend image
        await this.cacheImage(backendMediaID, response.data.imageUrl, false);
        console.log(`🖼️ HybridImageService: Successfully fetched and cached backend image for media ID ${backendMediaID}`);
        return response.data.imageUrl;
      } else {
        console.error(`🖼️ HybridImageService: Failed to fetch backend image for media ID ${backendMediaID}:`, response.message);
        return null;
      }
    } catch (error) {
      console.error(`🖼️ HybridImageService: Error fetching backend image for media ID ${backendMediaID}:`, error);
      return null;
    }
  }

  /**
   * Get cached image from AsyncStorage
   */
  private async getCachedImage(mediaID: number): Promise<CachedImage | null> {
    try {
      const cacheKey = `${this.cachePrefix}${mediaID}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      console.error('🖼️ HybridImageService: Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Cache image in AsyncStorage
   */
  private async cacheImage(mediaID: number, imageUrl: string, isLocal: boolean = false): Promise<void> {
    try {
      const cacheKey = `${this.cachePrefix}${mediaID}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.cacheExpiryHours * 60 * 60 * 1000));
      
      const cachedImage: CachedImage = {
        mediaID,
        imageUrl,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isLocal
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedImage));
      console.log(`🖼️ HybridImageService: Cached image for media ID ${mediaID} (local: ${isLocal})`);
    } catch (error) {
      console.error('🖼️ HybridImageService: Error caching image:', error);
    }
  }

  /**
   * Check if cached image is expired
   */
  private isCacheExpired(cachedImage: CachedImage): boolean {
    return new Date() > new Date(cachedImage.expiresAt);
  }

  /**
   * Get image with detailed result information
   */
  async getImageWithDetails(mediaID: number, entityName?: string, entityID?: number): Promise<ImageResult | null> {
    try {
      console.log(`🖼️ HybridImageService: Getting image details for media ID ${mediaID}`);

      // First, try to get the media file record
      let mediaFile = null;
      if (entityName && entityID) {
        const mediaFiles = await getMediaFilesByEntity(entityName, entityID);
        mediaFile = mediaFiles.find(f => f.MediaID === mediaID);
      }

      // Check if this is a local image
      if (mediaFile && mediaFile.LocalPath && mediaFile.pending_sync === 1) {
        const localUrl = await this.getLocalImageUrl(mediaFile.LocalPath);
        if (localUrl) {
          return {
            imageUrl: localUrl,
            isLocal: true,
            source: 'local'
          };
        }
      }

      // Check cache for backend images
      const cachedImage = await this.getCachedImage(mediaID);
      if (cachedImage && !this.isCacheExpired(cachedImage)) {
        return {
          imageUrl: cachedImage.imageUrl,
          isLocal: cachedImage.isLocal,
          source: 'cache'
        };
      }

      // Fetch from backend
      if (mediaFile && (mediaFile as any).BackendMediaID) {
        const backendUrl = await this.fetchBackendImage((mediaFile as any).BackendMediaID);
        if (backendUrl) {
          return {
            imageUrl: backendUrl,
            isLocal: false,
            source: 'backend'
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`🖼️ HybridImageService: Error getting image details for media ID ${mediaID}:`, error);
      return null;
    }
  }

  /**
   * Clear all cached images
   */
  async clearImageCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(imageCacheKeys);
      console.log(`🖼️ HybridImageService: Cleared ${imageCacheKeys.length} cached images`);
    } catch (error) {
      console.error('🖼️ HybridImageService: Error clearing image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ total: number; expired: number; valid: number; local: number; backend: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let total = 0;
      let expired = 0;
      let valid = 0;
      let local = 0;
      let backend = 0;

      for (const key of imageCacheKeys) {
        try {
          const cachedData = await AsyncStorage.getItem(key);
          if (cachedData) {
            const cachedImage: CachedImage = JSON.parse(cachedData);
            total++;
            
            if (this.isCacheExpired(cachedImage)) {
              expired++;
            } else {
              valid++;
            }
            
            if (cachedImage.isLocal) {
              local++;
            } else {
              backend++;
            }
          }
        } catch (error) {
          console.error('Error parsing cached image:', error);
        }
      }

      return { total, expired, valid, local, backend };
    } catch (error) {
      console.error('🖼️ HybridImageService: Error getting cache stats:', error);
      return { total: 0, expired: 0, valid: 0, local: 0, backend: 0 };
    }
  }
}

export const hybridImageService = new HybridImageService();
export default hybridImageService;
