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

require('dotenv').config({
  path: envFile
});

// Debug what was actually loaded
console.log('🔧 === APP.CONFIG.JS DEBUG ===');
console.log('🔧 process.env.API_BASE_URL:', process.env.API_BASE_URL);
console.log('🔧 process.env.API_TIMEOUT:', process.env.API_TIMEOUT);
console.log('🔧 process.env.AZURE_MOBILE_CLIENT_ID:', process.env.AZURE_MOBILE_CLIENT_ID);
console.log('🔧 === END APP.CONFIG.JS DEBUG ===');

module.exports = {
  "expo": {
    "name": "Valuations App",
    "slug": "valuations-mobile-tablet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "valuations-app",
    "userInterfaceStyle": "light",
    "extra": {
      "eas": {
        "projectId": "fe1dee59-ac56-4ef1-82cd-b04aabd1bebc"
      },
      azureMobileClientId: process.env.AZURE_MOBILE_CLIENT_ID,
      azureTenantId: process.env.AZURE_TENANT_ID,
      azureApiClientId: process.env.AZURE_API_CLIENT_ID,
      azureRedirectUri: process.env.AZURE_REDIRECT_URI,
      apiBaseUrl: process.env.API_BASE_URL,
      apiTimeout: process.env.API_TIMEOUT,
    },
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.valuationsmobiletablet"
    },
    "android": {
      "package": "com.anonymous.valuationsmobiletablet",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
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
      [
        "react-native-msal",
        {
          "clientId": process.env.AZURE_MOBILE_CLIENT_ID,
          "authority": `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
          "redirectUri": process.env.AZURE_REDIRECT_URI,
          "additionalScopes": [`api://${process.env.AZURE_API_CLIENT_ID}/access_as_user`],
          "additionalParameters": {},
          "webviewParameters": {}
        }
      ]
    ],
    "newArchEnabled": true
  }
}; 