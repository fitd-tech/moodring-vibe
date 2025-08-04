module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { presets: ['babel-preset-expo', '@babel/preset-typescript'] },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|unimodules|sentry-expo|native-base|@react-navigation|react-navigation|@react-native-community|@expo/vector-icons|expo-status-bar|expo-auth-session|expo-web-browser|expo-secure-store|expo-linking|expo-constants)/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.expo/**',
    '!**/dist/**',
    '!**/web-build/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!app.config.js',
    '!babel.config.js',
    '!eslint.config.js',
    '!tailwind.config.js',
    '!.prettierrc.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
