// Determine which environment file to load
const getEnvFile = () => {
  const appEnv = process.env.APP_ENV || 'development';
  const envFile = process.env.ENV_FILE;
  
  console.log(`APP_ENV: ${appEnv}`);
  console.log(`ENV_FILE: ${envFile}`);
  
  // If ENV_FILE is explicitly set, use it
  if (envFile) {
    console.log(`Using explicit ENV_FILE: ${envFile}`);
    return envFile;
  }
  
  // Otherwise, determine based on APP_ENV
  const envFiles = {
    development: '.env.development',
    staging: '.env.staging',
    production: '.env.production'
  };
  
  const selectedFile = envFiles[appEnv] || '.env';
  console.log(`Using environment file based on APP_ENV: ${selectedFile}`);
  return selectedFile;
};

const envFile = getEnvFile();
console.log(`Loading environment: ${envFile}`);

// Clear any previously loaded environment variables that might conflict
if (envFile !== '.env') {
  console.log('🔧 Clearing previously loaded environment variables');
  delete process.env.API_BASE_URL;
  delete process.env.API_TIMEOUT;
  delete process.env.AZURE_REDIRECT_URI;
}

require('dotenv').config({
  path: envFile,
  override: true  // This ensures our specific env file overrides any existing env vars
});

// Don't load the default .env file if we're using a specific one
if (envFile !== '.env') {
  // Clear any variables that might have been loaded from default .env
  console.log('🔧 Using specific environment file, not loading default .env');
}

// Debug what was actually loaded
console.log('🔧 === APP.CONFIG.JS DEBUG ===');
console.log('🔧 process.env.API_BASE_URL:', process.env.API_BASE_URL);
console.log('🔧 process.env.API_TIMEOUT:', process.env.API_TIMEOUT);
console.log('🔧 process.env.AZURE_MOBILE_CLIENT_ID:', process.env.AZURE_MOBILE_CLIENT_ID);
console.log('🔧 === END APP.CONFIG.JS DEBUG ===');

// Determine environment
const appEnv = process.env.APP_ENV || 'development';

// Configure package name and app name based on environment
const getPackageName = () => {
  switch (appEnv) {
    case 'staging':
      return 'com.qantam.valuationsmobiletablet.staging';
    case 'production':
      return 'com.qantam.valuationsmobiletablet.production';
    case 'development':
    default:
      return 'com.qantam.valuationsmobiletablet.development';
  }
};

const getAppName = () => {
  switch (appEnv) {
    case 'staging':
      return 'Qantam App (Staging)';
    case 'production':
      return 'Qantam App';
    case 'development':
    default:
      return 'Qantam App (Dev)';
  }
};

const getBundleIdentifier = () => {
  switch (appEnv) {
    case 'staging':
      return 'com.qantam.valuationsmobiletablet.staging';
    case 'production':
      return 'com.qantam.valuationsmobiletablet.production';
    case 'development':
    default:
      return 'com.qantam.valuationsmobiletablet.development';
  }
};

// URL scheme per environment so auth callbacks route to the correct app when multiple builds are installed
const getScheme = () => {
  switch (appEnv) {
    case 'staging':
      return 'valuations-app-staging';
    case 'production':
      return 'valuations-app';
    case 'development':
    default:
      return 'valuations-app-dev';
  }
};

module.exports = {
  "expo": {
    "name": getAppName(),
    "slug": "valuations-mobile-tablet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": getScheme(),
    "userInterfaceStyle": "light",
    "extra": {
      "eas": {
        "projectId": "fe1dee59-ac56-4ef1-82cd-b04aabd1bebc"
      },
      appScheme: getScheme(),
      azureMobileClientId: process.env.AZURE_MOBILE_CLIENT_ID,
      azureTenantId: process.env.AZURE_TENANT_ID,
      azureApiClientId: process.env.AZURE_API_CLIENT_ID,
      azureRedirectUri: process.env.AZURE_REDIRECT_URI,
      apiBaseUrl: process.env.API_BASE_URL,
      apiTimeout: process.env.API_TIMEOUT,
      debugMode: process.env.DEBUG_MODE,
      logLevel: process.env.LOG_LEVEL,
      // API Key Authentication Configuration (DEPRECATED - JWT only)
      // apiKey: process.env.API_KEY,
      // apiKeyHeaderName: process.env.API_KEY_HEADER_NAME || 'X-API-Key',
      userContextHeaderName: process.env.USER_CONTEXT_HEADER_NAME || 'X-User-Context',
    },
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "updates": {
      "url": "https://u.expo.dev/fe1dee59-ac56-4ef1-82cd-b04aabd1bebc"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": getBundleIdentifier(),
      "runtimeVersion": {
        "policy": "appVersion"
      }
    },
    "android": {
      "package": getPackageName(),
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "compileSdkVersion": 35,
      "runtimeVersion": {
        "policy": "appVersion"
      },
      "softwareKeyboardLayoutMode": "pan",
      "allowBackup": true,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO"
      ]
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/images/favicon.png"
    },
    "experiments": {
      "typedRoutes": true
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-screen-orientation",
      "expo-sqlite",
      "expo-web-browser",
      "expo-system-ui",
      "expo-updates",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "minSdkVersion": 24
          }
        }
      ],
      "./withAndroidCompileSdk.js",
      [
        "expo-media-library",
        {
          "photosPermission": "Allow Valuations App to save photos to your gallery.",
          "savePhotosPermission": "Allow Valuations App to save photos to your gallery.",
          "isAccessMediaLocationEnabled": true
        }
      ],
    ],
    "newArchEnabled": true
  }
}; 