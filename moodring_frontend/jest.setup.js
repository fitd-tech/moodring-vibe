// Jest setup for React Native testing

// Define React Native globals
global.__DEV__ = true;

// Mock Expo modules before any imports
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'moodring://auth'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  ResponseType: { Code: 'code' },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(),
  parse: jest.fn(),
  createURL: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      spotifyClientId: 'test_client_id',
    },
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Set test environment variables
process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID = 'test_client_id';

// Mock React Native modules
jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(styles => styles),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  useColorScheme: jest.fn(() => 'light'),
  NativeModules: {
    StatusBarManager: {
      HEIGHT: 20,
      getHeight: jest.fn(cb => cb({ height: 20 })),
    },
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Set up React Native bridge mock
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// Silence console during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
