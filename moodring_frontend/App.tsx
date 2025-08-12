import React, { useEffect, useState } from 'react';
import { useAuthRequest, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useSpotifyActivity } from './src/hooks/useSpotifyActivity';
import { authService } from './src/services/authService';
import { LoginScreen, Dashboard, LoadingSpinner } from './src/components';
import { TagsDashboard } from './src/components/dashboard/TagsDashboard';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error(
    'Missing EXPO_PUBLIC_SPOTIFY_CLIENT_ID environment variable. ' +
      'Please add it to your .env file or environment configuration.'
  );
}

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-recently-played',
  'user-read-currently-playing',
  'user-top-read',
  'user-library-read',
];

const AppContent: React.FC = () => {
  const { user, authToken, isLoading, error, setUser, setAuthToken, setError, logout } = useAuth();
  const { currentlyPlaying, recentTracks, topTracks, savedTracks, isRefreshing, isLoadingMore, isLoadingMoreTopTracks, isLoadingMoreSavedTracks, hasMoreTracks, hasMoreTopTracks, hasMoreSavedTracks, refresh, loadActivity, loadMoreTracks, loadMoreTopTracks, loadMoreSavedTracks, resetToFreshState } =
    useSpotifyActivity();
  const [currentView, setCurrentView] = useState<'dashboard' | 'tags'>('dashboard');

  const redirectUri = 'moodring://auth';

  // Navigation handlers
  const handleCreatePlaylist = () => {
    // TODO: Implement create playlist functionality
    console.log('Create playlist pressed');
  };

  const handleBrowseTags = () => {
    setCurrentView('tags');
  };

  const handleHome = async () => {
    setCurrentView('dashboard');
    // Reset to fresh state to ensure we always get latest Spotify data
    await resetToFreshState();
  };

  const handleSettings = () => {
    // TODO: Implement settings functionality
    console.log('Settings pressed');
  };

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

  const handleLogin = async () => {
    try {
      setError(null);
      await promptAsync();
    } catch {
      setError('Failed to start login process');
    }
  };

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success' && response.params.code && request?.codeVerifier) {
        try {
          setError(null);
          const authData = await authService.authenticateWithBackend(
            response.params.code,
            request.codeVerifier
          );

          await authService.saveAuthData(authData);
          setUser(authData.user);
          setAuthToken(authData.access_token);
          await loadActivity(authData.access_token, authData.user);
        } catch (err) {
          await authService.clearStoredAuthData();
          setUser(null);
          setAuthToken(null);
          setError(err instanceof Error ? err.message : 'Authentication failed');
        }
      } else if (response?.type === 'error') {
        setError(`Authentication error: ${response.params.error_description || response.error}`);
      }
    };

    handleAuthResponse();
  }, [response, request]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user && authToken) {
    if (currentView === 'tags') {
      return (
        <TagsDashboard
          user={user}
          onLogout={logout}
          onCreatePlaylist={handleCreatePlaylist}
          onHome={handleHome}
          onSettings={handleSettings}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        currentlyPlaying={currentlyPlaying}
        recentTracks={recentTracks}
        topTracks={topTracks}
        savedTracks={savedTracks}
        isRefreshing={isRefreshing}
        isLoadingMore={isLoadingMore}
        isLoadingMoreTopTracks={isLoadingMoreTopTracks}
        isLoadingMoreSavedTracks={isLoadingMoreSavedTracks}
        hasMoreTracks={hasMoreTracks}
        hasMoreTopTracks={hasMoreTopTracks}
        hasMoreSavedTracks={hasMoreSavedTracks}
        onRefresh={refresh}
        onLoadMoreTracks={loadMoreTracks}
        onLoadMoreTopTracks={loadMoreTopTracks}
        onLoadMoreSavedTracks={loadMoreSavedTracks}
        onLogout={logout}
        onCreatePlaylist={handleCreatePlaylist}
        onBrowseTags={handleBrowseTags}
        onSettings={handleSettings}
      />
    );
  }

  return <LoginScreen error={error} onLogin={handleLogin} isLoginDisabled={!request} />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
