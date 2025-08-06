import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useAuthRequest, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

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
  spotify_access_token: string | null;
  spotify_refresh_token: string | null;
  token_expires_at: string | null;
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
  album_image_url?: string;
  played_at: string;
}

interface CurrentlyPlaying {
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  is_playing: boolean;
}

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: { 
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

interface SpotifyCurrentlyPlayingResponse {
  item: SpotifyTrack;
  is_playing: boolean;
}

interface SpotifyRecentTrackItem {
  track: SpotifyTrack;
  played_at: string;
}

interface SpotifyRecentTracksResponse {
  items: SpotifyRecentTrackItem[];
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const intervalRef = useRef<any>(null);

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

  const refreshSpotifyToken = async (userId: number) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/auth/refresh/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const authData = await response.json();
      return authData;
    } catch (err) {
      throw new Error(`Failed to refresh token: ${err}`);
    }
  };

  const isTokenExpired = (user: BackendUser): boolean => {
    if (!user.token_expires_at) {
      return true; // If no expiry time, assume expired
    }
    const expiryTime = new Date(user.token_expires_at);
    const now = new Date();
    // Consider token expired if it expires within 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();
    return timeUntilExpiry <= bufferTime;
  };

  const handleLogin = async () => {
    try {
      setError(null);
      await promptAsync();
    } catch {
      setError('Failed to start login process');
    }
  };

  const loadRecentActivity = async (token: string, userOverride?: BackendUser) => {
    try {
      // Use userOverride if provided (for initialization), otherwise use state
      const currentUserData = userOverride || user;
      
      // Check if token is expired and refresh if needed
      let currentUser = currentUserData;
      let spotifyToken = currentUserData?.spotify_access_token || token;

      if (currentUser && isTokenExpired(currentUser)) {
        try {
          const refreshedAuth = await refreshSpotifyToken(currentUser.id);
          currentUser = refreshedAuth.user;
          spotifyToken = refreshedAuth.user.spotify_access_token || token;
          
          // Update user state and save to storage
          setUser(currentUser);
          setAuthToken(refreshedAuth.access_token);
          await saveAuthDataSecurely(refreshedAuth);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Token refresh failed:', error);
          // If refresh fails, try to continue with existing token
          // If that fails too, user will need to re-authenticate
        }
      }
      
      // Get currently playing track
      try {
        const currentlyPlayingResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`,
          },
        });

        if (currentlyPlayingResponse.status === 200) {
          const currentData = await currentlyPlayingResponse.json() as SpotifyCurrentlyPlayingResponse;
          if (currentData && currentData.item && currentData.is_playing) {
            // Only show currently playing if a track exists AND is actively playing
            const albumImageUrl = currentData.item.album.images && currentData.item.album.images.length > 0
              ? currentData.item.album.images[0].url
              : undefined;
            setCurrentlyPlaying({
              name: currentData.item.name,
              artist: currentData.item.artists[0]?.name || 'Unknown Artist',
              album: currentData.item.album.name,
              album_image_url: albumImageUrl,
              is_playing: currentData.is_playing
            });
          } else {
            // Hide if no track or playback is paused/stopped
            setCurrentlyPlaying(null);
          }
        } else if (currentlyPlayingResponse.status === 204) {
          // No track currently playing
          setCurrentlyPlaying(null);
        } else {
          
          // If 401, try to refresh token and retry once
          if (currentlyPlayingResponse.status === 401 && currentUser) {
            try {
              const refreshedAuth = await refreshSpotifyToken(currentUser.id);
              currentUser = refreshedAuth.user;
              spotifyToken = refreshedAuth.user.spotify_access_token || token;
              
              // Update user state and save to storage
              setUser(currentUser);
              setAuthToken(refreshedAuth.access_token);
              await saveAuthDataSecurely(refreshedAuth);
              
              // Retry the API call with new token
              const retryResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                  'Authorization': `Bearer ${spotifyToken}`,
                },
              });
              
              if (retryResponse.status === 200) {
                const currentData = await retryResponse.json() as SpotifyCurrentlyPlayingResponse;
                if (currentData && currentData.item && currentData.is_playing) {
                  // Only show currently playing if a track exists AND is actively playing
                  const albumImageUrl = currentData.item.album.images && currentData.item.album.images.length > 0
                    ? currentData.item.album.images[0].url
                    : undefined;
                  setCurrentlyPlaying({
                    name: currentData.item.name,
                    artist: currentData.item.artists[0]?.name || 'Unknown Artist',
                    album: currentData.item.album.name,
                    album_image_url: albumImageUrl,
                    is_playing: currentData.is_playing
                  });
                } else {
                  // Hide if no track or playback is paused/stopped
                  setCurrentlyPlaying(null);
                }
              } else if (retryResponse.status === 204) {
                setCurrentlyPlaying(null);
              }
            } catch (refreshError) {
              // eslint-disable-next-line no-console
              console.warn('Token refresh failed after 401:', refreshError);
              setCurrentlyPlaying(null);
            }
          } else {
            setCurrentlyPlaying(null);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Currently playing fetch error:', error);
        setCurrentlyPlaying(null);
      }

      // Get recently played tracks
      try {
        const recentTracksResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`,
          },
        });

        if (recentTracksResponse.ok) {
          const recentData = await recentTracksResponse.json() as SpotifyRecentTracksResponse;
          const formattedTracks = recentData.items.map((item: SpotifyRecentTrackItem) => {
            const albumImageUrl = item.track.album.images && item.track.album.images.length > 0
              ? item.track.album.images[0].url
              : undefined;
            return {
              name: item.track.name,
              artist: item.track.artists[0]?.name || 'Unknown Artist',
              album: item.track.album.name,
              album_image_url: albumImageUrl,
              played_at: item.played_at,
            };
          });
          setRecentTracks(formattedTracks);
        } else {
          
          // If 401, try to refresh token and retry once
          if (recentTracksResponse.status === 401 && currentUser) {
            try {
              const refreshedAuth = await refreshSpotifyToken(currentUser.id);
              const newSpotifyToken = refreshedAuth.user.spotify_access_token;
              
              // Update user state and save to storage
              setUser(refreshedAuth.user);
              setAuthToken(refreshedAuth.access_token);
              await saveAuthDataSecurely(refreshedAuth);
              
              // Retry the API call with new token
              const retryResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
                headers: {
                  'Authorization': `Bearer ${newSpotifyToken}`,
                },
              });
              
              if (retryResponse.ok) {
                const recentData = await retryResponse.json() as SpotifyRecentTracksResponse;
                const formattedTracks = recentData.items.map((item: SpotifyRecentTrackItem) => {
                  const albumImageUrl = item.track.album.images && item.track.album.images.length > 0
                    ? item.track.album.images[0].url
                    : undefined;
                  return {
                    name: item.track.name,
                    artist: item.track.artists[0]?.name || 'Unknown Artist',
                    album: item.track.album.name,
                    album_image_url: albumImageUrl,
                    played_at: item.played_at,
                  };
                });
                setRecentTracks(formattedTracks);
              } else {
                setRecentTracks([]);
              }
            } catch (refreshError) {
              // eslint-disable-next-line no-console
              console.warn('Token refresh failed after recent tracks 401:', refreshError);
              setRecentTracks([]);
            }
          } else {
            setRecentTracks([]);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Recent tracks fetch error:', error);
        setRecentTracks([]);
      }
    } catch {
      // Error loading Spotify activity - set empty states
      setCurrentlyPlaying(null);
      setRecentTracks([]);
    }
  };

  const handleLogout = async () => {
    // Clear periodic update interval
    if (intervalRef.current) {
      // eslint-disable-next-line no-undef
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    await clearStoredAuthData();
    setUser(null);
    setAuthToken(null);
    setRecentTracks([]);
    setCurrentlyPlaying(null);
    setError(null);
    setIsLoading(false);
  };

  const onRefresh = async () => {
    if (!user || !authToken) return;
    
    setIsRefreshing(true);
    try {
      await loadRecentActivity(authToken, user);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
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
          await loadRecentActivity(savedAuth.access_token, savedAuth.user);
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
          await loadRecentActivity(authData.access_token, authData.user);
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

  useEffect(() => {
    // Set up periodic updates for listening activity when user is logged in
    if (user && authToken) {
      // Clear any existing interval
      if (intervalRef.current) {
        // eslint-disable-next-line no-undef
        clearInterval(intervalRef.current);
      }
      
      // Start periodic updates every 30 seconds
      // eslint-disable-next-line no-undef
      intervalRef.current = setInterval(async () => {
        try {
          await loadRecentActivity(authToken, user);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Periodic update failed:', error);
        }
      }, 30000); // 30 seconds
      
      // Cleanup on unmount or when user/token changes
      return () => {
        if (intervalRef.current) {
          // eslint-disable-next-line no-undef
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [user, authToken]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8a2be2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user && authToken) {
    // User is logged in - show dashboard
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#8a2be2"
            colors={['#8a2be2']}
            progressBackgroundColor="#1a0a1a"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>MOODRING</Text>
        </View>

        {/* User Dashboard */}
        <View style={styles.dashboardContainer}>
          
          {/* User Profile Section */}
          <LinearGradient
            colors={['#1a0a1a', '#0d0d0d', '#1a0a2e']}
            style={styles.profileCard}
          >
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
          </LinearGradient>

          {/* Currently Playing Section */}
          {currentlyPlaying && (
            <LinearGradient
              colors={['#2a0a2a', '#0d0d0d', '#0a2a2a']}
              style={styles.nowPlayingCard}
            >
              <Text style={styles.cardTitle}>NOW PLAYING</Text>
              <View style={styles.trackInfo}>
                <Text style={styles.trackName}>{currentlyPlaying.name}</Text>
                <Text style={styles.trackArtist}>by {currentlyPlaying.artist}</Text>
                <Text style={styles.trackAlbum}>{currentlyPlaying.album}</Text>
              </View>
              <View style={[styles.playingIndicator, currentlyPlaying.is_playing && styles.playing]} />
            </LinearGradient>
          )}

          {/* Recent Activity Section */}
          <View style={styles.recentSection}>
            <Text style={styles.cardTitle}>RECENT TRACKS</Text>
            {recentTracks.map((track, index) => (
              <LinearGradient
                key={index}
                colors={['#4a1458', '#2d0a35', '#1a0a2a']}
                style={styles.trackCard}
              >
                <TouchableOpacity 
                  style={styles.trackHeader}
                  onPress={() => setExpandedTrack(expandedTrack === index ? null : index)}
                >
                  <View style={styles.albumArt}>
                    {track.album_image_url ? (
                      <Image 
                        source={{ uri: track.album_image_url }}
                        style={styles.albumImage}
                      />
                    ) : (
                      <View style={styles.albumPlaceholder} />
                    )}
                  </View>
                  <View style={styles.trackMainInfo}>
                    <Text style={styles.trackTitle}>{track.name}</Text>
                    <Text style={styles.newTrackArtist}>{track.artist}</Text>
                    {track.album && <Text style={styles.newTrackAlbum}>Album: {track.album}</Text>}
                  </View>
                  <View style={styles.trackActions}>
                    <Text style={styles.trackDuration}>
                      {new Date(track.played_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                    <TouchableOpacity style={styles.heartButton}>
                      <Text style={styles.heartIcon}>♡</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}>
                      <Text style={styles.menuIcon}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                
                {expandedTrack === index && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.tagsLabel}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>pop</Text>
                        <TouchableOpacity style={styles.tagRemove}>
                          <Text style={styles.tagRemoveText}>×</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>recent</Text>
                        <TouchableOpacity style={styles.tagRemove}>
                          <Text style={styles.tagRemoveText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.addTagContainer}>
                      <View style={styles.addTagInput}>
                        <Text style={styles.addTagPlaceholder}>Add tag...</Text>
                      </View>
                      <TouchableOpacity style={styles.addButton}>
                        <Text style={styles.addButtonText}>+ Add</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.collapseButton}>
                      <Text style={styles.collapseText}>Collapse</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </LinearGradient>
            ))}
          </View>

          {/* Quick Actions */}
          <LinearGradient
            colors={['#1a0a0a', '#0d0d0d', '#2a0a1a']}
            style={styles.actionsCard}
          >
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
          </LinearGradient>

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
        <View style={styles.appTitleContainer}>
          <Text style={styles.appTitle}>MOODRING</Text>
        </View>
        <Text style={styles.tagline}>Organize your music with powerful tags</Text>

        {error && (
          <LinearGradient
            colors={['#4a1458', '#2d0a35', '#1a0a2a']}
            style={styles.errorContainer}
          >
            <Text style={styles.errorText}>{error}</Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['#4a1458', '#2d0a35', '#1a0a2a']}
          style={styles.featuresContainer}
        >
          <Text style={styles.featuresTitle}>What you can do:</Text>
          <Text style={styles.featureItem}>• Tag your songs and playlists</Text>
          <Text style={styles.featureItem}>• Create hierarchical organization</Text>
          <Text style={styles.featureItem}>• Generate smart playlists</Text>
          <Text style={styles.featureItem}>• Discover music patterns</Text>
        </LinearGradient>

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
    backgroundColor: '#1a0a1a', // Deep purple background
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

  // Login Screen Styles - Modern Design
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitleContainer: {
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(138, 43, 226, 0.5)',
    shadowColor: '#8a2be2',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '400',
    opacity: 0.8,
  },
  featuresContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 1,
    opacity: 0.9,
  },
  featureItem: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 24,
    fontWeight: '400',
    opacity: 0.8,
  },
  authSection: {
    alignItems: 'center',
    width: '100%',
  },
  authText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  loginButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#8a2be2',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.6,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },

  // Dashboard Styles - Modern Design
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  dashboardContainer: {
    flex: 1,
  },

  // Profile Card
  profileCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    opacity: 0.7,
  },

  // Now Playing Card
  nowPlayingCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 1,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  trackInfo: {
    marginBottom: 10,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
    opacity: 0.8,
  },
  trackAlbum: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.6,
  },
  playingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-end',
  },
  playing: {
    backgroundColor: '#8a2be2',
    shadowColor: '#8a2be2',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },

  // Recent Tracks Card
  recentCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  recentTrackArtist: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
  },
  playedTime: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    opacity: 0.6,
  },

  // Actions Card
  actionsCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Logout Button
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },

  // New Accordion-Style Track Cards
  recentSection: {
    marginBottom: 20,
  },
  trackCard: {
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  albumPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  trackMainInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  newTrackArtist: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 2,
  },
  newTrackAlbum: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.6,
  },
  trackActions: {
    alignItems: 'flex-end',
  },
  trackDuration: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  heartButton: {
    padding: 4,
    marginBottom: 4,
  },
  heartIcon: {
    fontSize: 20,
    color: '#ff69b4',
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: '#ffffff',
    opacity: 0.6,
  },

  // Expanded Content Styles
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.7)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  tagRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRemoveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
  },
  addTagPlaceholder: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.6,
  },
  addButton: {
    backgroundColor: '#8a2be2',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  collapseButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  collapseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
});
