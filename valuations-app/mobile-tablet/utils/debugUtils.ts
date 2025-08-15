import Constants from 'expo-constants';

// Get environment variables from Expo config
const getEnvVar = (key: string): string | undefined => {
  return Constants.expoConfig?.extra?.[key] || process.env[key];
};

// Check if debug mode is enabled
export const isDebugMode = (): boolean => {
  const debugMode = getEnvVar('DEBUG_MODE');
  const logLevel = getEnvVar('LOG_LEVEL');
  
  // In staging, respect the environment settings
  if (debugMode === 'false' || logLevel === 'info' || logLevel === 'error') {
    return false;
  }
  
  // Default to __DEV__ for development
  return __DEV__;
};

// Check if verbose logging is enabled
export const isVerboseLogging = (): boolean => {
  const logLevel = getEnvVar('LOG_LEVEL');
  
  // Only enable verbose logging in development or when explicitly set to debug
  if (logLevel === 'debug' && __DEV__) {
    return true;
  }
  
  return false;
};

// Debug logger that respects environment settings
export const debugLog = (message: string, data?: any): void => {
  if (isDebugMode()) {
    if (data) {
      console.log(`🔧 ${message}`, data);
    } else {
      console.log(`🔧 ${message}`);
    }
  }
};

// Verbose logger for detailed debugging
export const verboseLog = (message: string, data?: any): void => {
  if (isVerboseLogging()) {
    if (data) {
      console.log(`🔍 ${message}`, data);
    } else {
      console.log(`🔍 ${message}`);
    }
  }
};

// Error logger (always logs)
export const errorLog = (message: string, error?: any): void => {
  if (error) {
    console.error(`❌ ${message}`, error);
  } else {
    console.error(`❌ ${message}`);
  }
};

// Info logger (always logs)
export const infoLog = (message: string, data?: any): void => {
  if (data) {
    console.log(`ℹ️ ${message}`, data);
  } else {
    console.log(`ℹ️ ${message}`);
  }
};
