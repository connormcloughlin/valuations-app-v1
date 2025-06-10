require('dotenv').config();

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
      azureMobileClientId: process.env.AZURE_MOBILE_CLIENT_ID,
      azureTenantId: process.env.AZURE_TENANT_ID,
      azureApiClientId: process.env.AZURE_API_CLIENT_ID,
      azureRedirectUri: process.env.AZURE_REDIRECT_URI,
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
      "supportsTablet": true
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