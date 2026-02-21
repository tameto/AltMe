const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Default: conditionsByPlatform.web = ["browser"] only.
// Zustand 5.x ESM exports use import.meta.env which fails in non-module scripts.
// Adding "react-native" resolves to CJS version (no import.meta).
config.resolver.unstable_conditionsByPlatform = {
  ...config.resolver.unstable_conditionsByPlatform,
  web: ['react-native', 'browser', 'require'],
};

module.exports = config;
