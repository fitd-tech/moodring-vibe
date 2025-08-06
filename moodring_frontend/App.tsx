import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthRequest, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

// Spotify OAuth configuration
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

// Spotify Client ID from environment variable
const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error(
    'Missing EXPO_PUBLIC_SPOTIFY_CLIENT_ID environment variable. ' +
      'Please add it to your .env file or environment configuration.'
  );
}

// Minimal scopes needed for basic user profile access
const SCOPES = [
  'user-read-private',
  'user-read-email',
];

interface BackendUser {
  id: number;
  spotify_id: string;
  email: string;
  display_name: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendAuthResponse {
  user: BackendUser;
  access_token: string;
}

// Keep for backward compatibility with stored tokens
interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export default function App() {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use explicit redirect URI for consistent behavior
  const redirectUri = 'moodring://auth';

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: CLIENT_ID,
      scopes: SCOPES,
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  const authenticateWithBackend = async (code: string, codeVerifier: string) => {
    try {
      const response = await fetch('http://localhost:8000/auth/spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend authentication failed: ${response.status} - ${errorText}`);
      }

      const authData = await response.json();
      return authData;
    } catch (err) {
      throw new Error(`Failed to authenticate with backend: ${err}`);
    }
  };

  const saveAuthDataSecurely = async (authData: BackendAuthResponse) => {
    try {
      await SecureStore.setItemAsync('moodring_auth', JSON.stringify(authData));
    } catch {
      // TODO: Replace with proper logging service
      // Error saving auth data - will be handled when logging service is implemented
    }
  };

  const loadSavedAuthData = async (): Promise<BackendAuthResponse | null> => {
    try {
      const authString = await SecureStore.getItemAsync('moodring_auth');
      if (authString) {
        return JSON.parse(authString);
      }
    } catch {
      // TODO: Replace with proper logging service
      // Error loading saved auth data - will be handled when logging service is implemented
    }
    return null;
  };

  const clearStoredAuthData = async () => {
    try {
      await SecureStore.deleteItemAsync('moodring_auth');
      // Also clear legacy tokens for migration
      await SecureStore.deleteItemAsync('spotify_tokens');
    } catch {
      // TODO: Replace with proper logging service
      // Error clearing auth data - will be handled when logging service is implemented
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      await promptAsync();
    } catch {
      setError('Failed to start login process');
    }
  };

  const handleLogout = async () => {
    await clearStoredAuthData();
    setUser(null);
    setAuthToken(null);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    // Load saved auth data on app start
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const savedAuth = await loadSavedAuthData();
        if (savedAuth) {
          // Set auth state from saved data
          setUser(savedAuth.user);
          setAuthToken(savedAuth.access_token);
        }
      } catch {
        // If saved auth data is invalid, clear everything
        await clearStoredAuthData();
        setUser(null);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    // Handle OAuth response
    const handleAuthResponse = async () => {
      if (response?.type === 'success' && response.params.code && request?.codeVerifier) {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        try {
          const authData = await authenticateWithBackend(response.params.code, request.codeVerifier);

          // Only set auth state if backend authentication succeeds
          await saveAuthDataSecurely(authData);
          setUser(authData.user);
          setAuthToken(authData.access_token);
        } catch (err) {
          // If backend authentication fails, clear everything
          await clearStoredAuthData();
          setUser(null);
          setAuthToken(null);
          setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
          setIsLoading(false);
        }
      } else if (response?.type === 'error') {
        setError(`Authentication error: ${response.params.error_description || response.error}`);
        setIsLoading(false);
      }
    };

    handleAuthResponse();
  }, [response, request]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1db954" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user && authToken) {
    // User is logged in - show main app
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎵 Moodring</Text>

        {/* User Profile */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarPlaceholder}>
              {user.display_name?.charAt(0).toUpperCase() || user.spotify_id.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.display_name || user.spotify_id}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userId}>User ID: {user.id}</Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <Text style={styles.welcomeText}>
            Welcome to Moodring! Ready to organize your music with tags?
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>🎵 Access your playlists and saved music</Text>
            <Text style={styles.featureItem}>🏷️ Create hierarchical tags for organization</Text>
            <Text style={styles.featureItem}>📚 Generate custom playlists from tags</Text>
            <Text style={styles.featureItem}>🔄 Sync back to your Spotify account</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <StatusBar style="light" />
      </View>
    );
  }

  // User is not logged in - show login screen
  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.appTitle}>🎵 Moodring</Text>
        <Text style={styles.tagline}>Organize your music with powerful tags</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you can do:</Text>
          <Text style={styles.featureItem}>• Tag your songs and playlists</Text>
          <Text style={styles.featureItem}>• Create hierarchical organization</Text>
          <Text style={styles.featureItem}>• Generate smart playlists</Text>
          <Text style={styles.featureItem}>• Discover music patterns</Text>
        </View>

        <View style={styles.authSection}>
          <Text style={styles.authText}>Connect your Spotify account to get started</Text>

          <TouchableOpacity
            style={[styles.loginButton, !request && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!request}
          >
            <Text style={styles.loginButtonText}>🎧 Connect with Spotify</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            We'll only access your music library and playlists.{'\n'}
            Your data stays private and secure.
          </Text>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 60,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 15,
  },
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1db954',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#b3b3b3',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 16,
    color: '#b3b3b3',
    marginBottom: 8,
    lineHeight: 24,
  },
  authSection: {
    alignItems: 'center',
    width: '100%',
  },
  authText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
  },
  loginButton: {
    backgroundColor: '#1db954',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#444444',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#330000',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    fontSize: 14,
  },
  // Logged In Screen Styles
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1db954',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1db954',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarPlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#b3b3b3',
    marginBottom: 3,
  },
  userFollowers: {
    fontSize: 12,
    color: '#777777',
  },
  userId: {
    fontSize: 12,
    color: '#777777',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 26,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  logoutButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
