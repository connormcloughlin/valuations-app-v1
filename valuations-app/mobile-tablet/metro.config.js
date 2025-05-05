const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Handle both ESM and CommonJS modules
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs', 'json'];

// Add support for expo-router's file system based routing
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Add ESM resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

module.exports = config; 