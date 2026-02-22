import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  RISK_TEMPLATES: 'risk_templates',
  TEMPLATE_SECTIONS: 'template_sections_',
  TEMPLATE_CATEGORIES: 'template_categories_',
  TEMPLATE_ITEMS: 'template_items_',
  ASSESSMENT_SECTIONS: 'assessment_sections_',
  ASSESSMENT_CATEGORIES: 'assessment_categories_',
  ASSESSMENT_ITEMS: 'assessment_items_'
};

export const storeData = async (key: string, data: any, ttl?: number): Promise<void> => {
  try {
    const jsonValue = JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000,
    });
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error storing data:', e);
  }
};

export const getData = async (key: string): Promise<{ data: any; timestamp: number; ttl: number } | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error retrieving data:', e);
    return null;
  }
};

export const clearAllCachedData = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const apiKeys = keys.filter(key =>
      key.startsWith(STORAGE_KEYS.RISK_TEMPLATES) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_SECTIONS) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_CATEGORIES) ||
      key.startsWith(STORAGE_KEYS.TEMPLATE_ITEMS) ||
      key.startsWith(STORAGE_KEYS.ASSESSMENT_SECTIONS) ||
      key.startsWith(STORAGE_KEYS.ASSESSMENT_CATEGORIES) ||
      key.startsWith(STORAGE_KEYS.ASSESSMENT_ITEMS)
    );
    if (apiKeys.length > 0) {
      await AsyncStorage.multiRemove(apiKeys);
      console.log(`Cleared ${apiKeys.length} cached data items`);
    }
    return { success: true, message: 'All cached data cleared successfully' };
  } catch (e) {
    console.error('Error clearing cached data:', e);
    return { success: false, message: (e as Error).message };
  }
};
