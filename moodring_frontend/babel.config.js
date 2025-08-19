module.exports = function (api) {
  // Cache based on environment
  api.cache.using(() => process.env.NODE_ENV);
  
  // Environment-specific configuration
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Default configuration for compatibility
        },
      ],
    ],
    plugins: [
      // Only add NativeWind for non-test environments
      ...(isTest ? [] : ['nativewind/babel']),
    ],
  };
};
