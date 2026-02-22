const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Set the project root to the current directory
config.projectRoot = __dirname;

// Add support for expo-router's file system based routing (SVG support)
// Preserve default extensions and only add SVG to sourceExts
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Enhanced ESM resolution for SDK 54
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// Enable package.json exports support for SDK 54
config.resolver.unstable_enablePackageExports = true;

// Enhanced platform extensions for New Architecture
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Transformer enhancements for New Architecture and SDK 54
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Enable ESM support
  unstable_esModuleInterop: true,
  // Configure transformer for better performance
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Add resolver configuration for better module resolution
config.resolver = {
  ...config.resolver,
  alias: {
    // Add any module aliases here if needed
  },
};

module.exports = config; 