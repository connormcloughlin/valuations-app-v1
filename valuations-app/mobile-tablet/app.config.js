module.exports = {
  "expo": {
    "name": "Valuations App",
    "slug": "valuations-mobile-tablet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "valuations-app",
    "userInterfaceStyle": "light",
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
      "expo-system-ui"
    ],
    "newArchEnabled": true
  }
}; 