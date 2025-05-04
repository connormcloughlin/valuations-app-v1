/**
 * Internationalization (i18n) utilities
 */
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import enZATranslations from '../locales/en-ZA.json';

// Available languages
export const LANGUAGES = {
  'en-ZA': 'English (South Africa)',
};

// Default language
export const DEFAULT_LANGUAGE = 'en-ZA';

// Get the device locale
export const getDeviceLocale = (): string => {
  try {
    // iOS
    if (Platform.OS === 'ios') {
      return (
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        DEFAULT_LANGUAGE
      );
    }
    
    // Android
    if (Platform.OS === 'android') {
      return NativeModules.I18nManager?.localeIdentifier || DEFAULT_LANGUAGE;
    }
    
    // Default to en-ZA if not available
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('Error getting device locale:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Translations object
const translations: { [key: string]: any } = {
  'en-ZA': enZATranslations,
};

// Current language
let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Initialize the i18n module
 * Loads the saved language or falls back to device locale
 */
export const initI18n = async (): Promise<void> => {
  try {
    console.log('Initializing i18n...');
    
    // Try to get saved language
    const savedLanguage = await AsyncStorage.getItem('@language');
    console.log('Saved language:', savedLanguage);
    
    if (savedLanguage && translations[savedLanguage]) {
      currentLanguage = savedLanguage;
      console.log('Using saved language:', currentLanguage);
    } else {
      try {
        // Try to match the device locale to an available language
        const deviceLocale = getDeviceLocale();
        console.log('Device locale:', deviceLocale);
        
        if (deviceLocale) {
          const languageCode = deviceLocale.substring(0, 2).toLowerCase();
          
          // Find a matching language
          const matchedLanguage = Object.keys(translations).find(
            key => key.toLowerCase().startsWith(languageCode)
          );
          
          if (matchedLanguage) {
            currentLanguage = matchedLanguage;
            console.log('Using matched language:', currentLanguage);
          }
        }
      } catch (localeError) {
        console.warn('Error getting device locale:', localeError);
      }
      
      // Always set to default language for now as we only have en-ZA
      currentLanguage = DEFAULT_LANGUAGE;
      console.log('Defaulting to language:', currentLanguage);
      
      // Save the language
      try {
        await AsyncStorage.setItem('@language', currentLanguage);
      } catch (saveError) {
        console.warn('Error saving language setting:', saveError);
      }
    }
  } catch (error) {
    console.error('Error initializing i18n:', error);
    currentLanguage = DEFAULT_LANGUAGE;
    console.log('Error fallback to default language:', currentLanguage);
  }
  
  console.log('i18n initialized with language:', currentLanguage);
};

/**
 * Set the current language
 * @param language - The language code to set
 */
export const setLanguage = async (language: string): Promise<void> => {
  if (translations[language]) {
    currentLanguage = language;
    await AsyncStorage.setItem('@language', language);
  } else {
    console.error(`Language not available: ${language}`);
  }
};

/**
 * Get the current language
 */
export const getLanguage = (): string => {
  return currentLanguage;
};

/**
 * Get a translation by key
 * @param key - The translation key (dot notation)
 * @param params - Parameters to replace in the translation
 */
export const t = (key: string, params?: { [key: string]: string }): string => {
  if (!key) {
    console.warn('Translation key is undefined or empty');
    return '';
  }
  
  try {
    // Make sure we have a valid current language
    const lang = currentLanguage && translations[currentLanguage] 
      ? currentLanguage 
      : DEFAULT_LANGUAGE;
      
    const keys = key.split('.');
    let value = translations[lang];
    
    if (!value) {
      console.warn(`No translations available for language: ${lang}`);
      return key;
    }
    
    // Navigate through the keys
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} in language: ${lang}`);
        return key;
      }
    }
    
    // Replace parameters
    if (params && typeof value === 'string') {
      Object.keys(params).forEach(param => {
        const paramValue = params[param] || '';
        value = value.replace(new RegExp(`{${param}}`, 'g'), paramValue);
      });
    }
    
    return value || key;
  } catch (error) {
    console.error(`Error getting translation for key: ${key}`, error);
    return key;
  }
};

/**
 * Format a date according to the current locale
 * @param date - The date to format
 * @param options - Format options
 */
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(
    currentLanguage,
    options || defaultOptions
  ).format(date);
};

/**
 * Format a number as currency
 * @param value - The number to format
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(currentLanguage, {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default {
  initI18n,
  setLanguage,
  getLanguage,
  t,
  formatDate,
  formatCurrency,
}; 