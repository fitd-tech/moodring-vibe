import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
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

// Scopes for profile access and recent activity
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-recently-played',
  'user-read-currently-playing',
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

interface RecentTrack {
  name: string;
  artist: string;
  album: string;
  played_at: string;
}

interface CurrentlyPlaying {
  name: string;
  artist: string;
  album: string;
  is_playing: boolean;
}

// Keep for backward compatibility with stored tokens
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
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
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlaying | null>(null);

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
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/auth/spotify`, {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const loadRecentActivity = async (_token: string) => {
    try {
      // TODO: TEMP - Placeholder for real Spotify API integration
      // For now, set sample data to demonstrate UI
      setRecentTracks([
        { name: 'Sample Track 1', artist: 'Artist 1', album: 'Album 1', played_at: new Date().toISOString() },
        { name: 'Sample Track 2', artist: 'Artist 2', album: 'Album 2', played_at: new Date(Date.now() - 300000).toISOString() },
        { name: 'Sample Track 3', artist: 'Artist 3', album: 'Album 3', played_at: new Date(Date.now() - 600000).toISOString() },
      ]);
      setCurrentlyPlaying({
        name: 'Current Song',
        artist: 'Current Artist',
        album: 'Current Album',
        is_playing: true
      });
    } catch {
      // TODO: Replace with proper logging service
      // Error loading recent activity - will be handled when logging service is implemented
    }
  };

  const handleLogout = async () => {
    await clearStoredAuthData();
    setUser(null);
    setAuthToken(null);
    setRecentTracks([]);
    setCurrentlyPlaying(null);
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
          // Load recent activity for logged in user
          await loadRecentActivity(savedAuth.access_token);
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
          // Load recent activity for newly authenticated user
          await loadRecentActivity(authData.access_token);
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
    // User is logged in - show dashboard
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>MOODRING</Text>
        </View>

        {/* User Dashboard */}
        <View style={styles.dashboardContainer}>
          
          {/* User Profile Section */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {user.profile_image_url ? (
                <Image 
                  source={{ uri: user.profile_image_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarPlaceholder}>
                    {user.display_name?.charAt(0).toUpperCase() || user.spotify_id.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.display_name || user.spotify_id}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>

          {/* Currently Playing Section */}
          {currentlyPlaying && (
            <View style={styles.nowPlayingCard}>
              <Text style={styles.cardTitle}>NOW PLAYING</Text>
              <View style={styles.trackInfo}>
                <Text style={styles.trackName}>{currentlyPlaying.name}</Text>
                <Text style={styles.trackArtist}>by {currentlyPlaying.artist}</Text>
                <Text style={styles.trackAlbum}>{currentlyPlaying.album}</Text>
              </View>
              <View style={[styles.playingIndicator, currentlyPlaying.is_playing && styles.playing]} />
            </View>
          )}

          {/* Recent Activity Section */}
          <View style={styles.recentCard}>
            <Text style={styles.cardTitle}>RECENT TRACKS</Text>
            {recentTracks.map((track, index) => (
              <View key={index} style={styles.trackItem}>
                <View style={styles.trackDetails}>
                  <Text style={styles.recentTrackName}>{track.name}</Text>
                  <Text style={styles.recentTrackArtist}>{track.artist}</Text>
                </View>
                <Text style={styles.playedTime}>
                  {new Date(track.played_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>QUICK ACTIONS</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Create New Tag</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Browse Playlists</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Generate Playlist</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <StatusBar style="light" />
      </ScrollView>
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
            <Text style={styles.loginButtonText}>Connect with Spotify</Text>
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
  // Base Container Styles
  container: {
    flex: 1,
    backgroundColor: '#1a0033', // Deep purple background
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
    fontWeight: 'bold',
  },

  // Login Screen Styles - 90's Neon Aesthetic
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff00ff', // Hot pink
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#00ffff', // Cyan
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: '#330066', // Dark purple
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
    width: '100%',
    borderWidth: 2,
    borderColor: '#ff00ff',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffff00', // Bright yellow
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 16,
    color: '#00ff00', // Bright green
    marginBottom: 8,
    lineHeight: 24,
    fontWeight: '500',
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
    backgroundColor: '#ff6600', // Bright orange
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffff00',
  },
  loginButtonDisabled: {
    backgroundColor: '#666666',
    borderColor: '#888888',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#990033',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: '#ff0066',
  },
  errorText: {
    color: '#ff66aa',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Dashboard Styles - 90's Retro Design
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ff00ff',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 3,
  },
  dashboardContainer: {
    flex: 1,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#4d0099', // Purple
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#ff00ff',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#00ffff',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff6600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#ffff00',
  },
  avatarPlaceholder: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffff00',
    marginBottom: 5,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 16,
    color: '#00ffff',
    fontWeight: '600',
  },

  // Now Playing Card
  nowPlayingCard: {
    backgroundColor: '#006633', // Dark green
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffff00',
    marginBottom: 15,
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trackInfo: {
    marginBottom: 10,
  },
  trackName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  trackArtist: {
    fontSize: 16,
    color: '#00ffff',
    marginBottom: 3,
  },
  trackAlbum: {
    fontSize: 14,
    color: '#cccccc',
  },
  playingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#666666',
    alignSelf: 'flex-end',
  },
  playing: {
    backgroundColor: '#00ff00',
  },

  // Recent Tracks Card
  recentCard: {
    backgroundColor: '#990066', // Dark magenta
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#ff00aa',
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ff00aa',
  },
  trackDetails: {
    flex: 1,
  },
  recentTrackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  recentTrackArtist: {
    fontSize: 14,
    color: '#ffaacc',
  },
  playedTime: {
    fontSize: 12,
    color: '#00ffff',
    fontWeight: 'bold',
  },

  // Actions Card
  actionsCard: {
    backgroundColor: '#cc3300', // Dark red-orange
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#ff6600',
  },
  actionButton: {
    backgroundColor: '#ff6600',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ffff00',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: '#666666',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#999999',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
