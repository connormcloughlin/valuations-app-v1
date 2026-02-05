import AsyncStorage from '@react-native-async-storage/async-storage';
import { REVIEW_MODE_STORAGE_KEY } from './constants';

/**
 * Check if the app is in review mode (mock reviewer signed in).
 * Used by transportClient to return mock data instead of calling the real API.
 */
export async function isReviewMode(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(REVIEW_MODE_STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}
