import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedImage {
  mediaID: number;
  imageUrl: string;
  cachedAt: string;
  expiresAt: string;
}

class ImageService {
  private cachePrefix = 'cached_image_';
  private cacheExpiryHours = 24; // Cache images for 24 hours

  /**
   * Get image URL for a media file
   * First checks cache, then fetches from API if needed
   * No fallback to original blob URLs - API proxy only
   */
  async getImageUrl(mediaID: number): Promise<string | null> {
    try {
      console.log(`🖼️ ImageService: Getting image for media ID ${mediaID}`);

      // Check cache first
      const cachedImage = await this.getCachedImage(mediaID);
      if (cachedImage && !this.isCacheExpired(cachedImage)) {
        console.log(`🖼️ ImageService: Using cached image for media ID ${mediaID}`);
        return cachedImage.imageUrl;
      }

      // Fetch from API
      console.log(`🖼️ ImageService: Fetching image from API for media ID ${mediaID}`);
      const response = await api.fetchImage(mediaID);

      if (response.success && response.data?.imageUrl) {
        // Cache the image
        await this.cacheImage(mediaID, response.data.imageUrl);
        console.log(`🖼️ ImageService: Successfully fetched and cached image for media ID ${mediaID}`);
        return response.data.imageUrl;
      } else {
        console.error(`🖼️ ImageService: Failed to fetch image for media ID ${mediaID}:`, response.message);
        return null;
      }
    } catch (error) {
      console.error(`🖼️ ImageService: Error getting image for media ID ${mediaID}:`, error);
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
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Cache image in AsyncStorage
   */
  private async cacheImage(mediaID: number, imageUrl: string): Promise<void> {
    try {
      const cacheKey = `${this.cachePrefix}${mediaID}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.cacheExpiryHours * 60 * 60 * 1000));
      
      const cachedImage: CachedImage = {
        mediaID,
        imageUrl,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedImage));
      console.log(`🖼️ ImageService: Cached image for media ID ${mediaID}`);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  /**
   * Check if cached image is expired
   */
  private isCacheExpired(cachedImage: CachedImage): boolean {
    const now = new Date();
    const expiresAt = new Date(cachedImage.expiresAt);
    return now > expiresAt;
  }

  /**
   * Clear all cached images
   */
  async clearImageCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(imageCacheKeys);
      console.log(`🖼️ ImageService: Cleared ${imageCacheKeys.length} cached images`);
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ total: number; expired: number; valid: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let expired = 0;
      let valid = 0;
      
      for (const key of imageCacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const cachedImage: CachedImage = JSON.parse(cachedData);
          if (this.isCacheExpired(cachedImage)) {
            expired++;
          } else {
            valid++;
          }
        }
      }
      
      return {
        total: imageCacheKeys.length,
        expired,
        valid
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { total: 0, expired: 0, valid: 0 };
    }
  }
}

export const imageService = new ImageService();
export default imageService;
