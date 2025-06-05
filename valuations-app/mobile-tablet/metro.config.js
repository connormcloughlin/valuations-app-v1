const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Set the project root to the current directory
config.projectRoot = __dirname;

// Enhanced ES Module support for SDK 53 and New Architecture
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs', 'json'];

// Add support for expo-router's file system based routing
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Enhanced ESM resolution for SDK 53
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// Fix for ES module resolution warnings in SDK 53
config.resolver.unstable_enableSymlinks = false;
config.resolver.unstable_enablePackageExports = true;

// Enhanced platform extensions for New Architecture
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Transformer enhancements for New Architecture
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Enable ESM support
  unstable_esModuleInterop: true,
};

module.exports = config; 