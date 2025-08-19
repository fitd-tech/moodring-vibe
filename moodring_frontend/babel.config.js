module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Disable the automatic reanimated plugin to prevent deprecation warning
          reanimated: false,
        },
      ],
    ],
    plugins: [
      // Add the new worklets plugin instead of the deprecated reanimated plugin
      'react-native-worklets/plugin',
    ],
  };
};
