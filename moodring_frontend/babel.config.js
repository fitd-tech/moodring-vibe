module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: [
      'babel-preset-expo',
      // Use NativeWind as a preset, not a plugin, and only in non-test environments
      ...(isTest ? [] : ['nativewind/babel']),
    ],
    plugins: [],
  };
};
