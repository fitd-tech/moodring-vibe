/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle nested react-native-css-interop module
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'node_modules/nativewind/node_modules'),
];

// Ensure react-native-css-interop jsx-runtime can be resolved
config.resolver.alias = {
  'react-native-css-interop': path.resolve(
    __dirname,
    'node_modules/nativewind/node_modules/react-native-css-interop'
  ),
};

module.exports = config;