import { useState, useEffect, useRef } from 'react';
import { CurrentlyPlaying, RecentTrack } from '../types';
import { spotifyApi } from '../services/spotifyApi';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const useSpotifyActivity = () => {
  const { user, authToken, refreshUserToken } = useAuth();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlaying | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadActivity = async (token?: string, userOverride?: typeof user) => {
    const currentUser = userOverride || user;
    const currentToken = token || authToken;
    
    if (!currentUser || !currentToken) return;

    try {
      let spotifyToken = currentUser.spotify_access_token || currentToken;
      let activeUser = currentUser;

      if (authService.isTokenExpired(activeUser)) {
        const refreshResult = await refreshUserToken(activeUser.id);
        if (refreshResult) {
          spotifyToken = refreshResult.user.spotify_access_token || refreshResult.token;
          activeUser = refreshResult.user;
        }
      }

      const [currentlyPlayingData, recentTracksData] = await Promise.all([
        spotifyApi.getCurrentlyPlaying(spotifyToken).catch(async (error) => {
          if (error.message === 'TOKEN_EXPIRED') {
            const refreshResult = await refreshUserToken(activeUser.id);
            if (refreshResult) {
              return spotifyApi.getCurrentlyPlaying(refreshResult.user.spotify_access_token || refreshResult.token);
            }
          }
          return null;
        }),
        spotifyApi.getRecentTracks(spotifyToken, 10).catch(async (error) => {
          if (error.message === 'TOKEN_EXPIRED') {
            const refreshResult = await refreshUserToken(activeUser.id);
            if (refreshResult) {
              return spotifyApi.getRecentTracks(refreshResult.user.spotify_access_token || refreshResult.token, 10);
            }
          }
          return [];
        })
      ]);

      setCurrentlyPlaying(currentlyPlayingData);
      setRecentTracks(recentTracksData);
    } catch (error) {
      if (__DEV__) {
        console.warn('Error loading Spotify activity:', error);
      }
      setCurrentlyPlaying(null);
      setRecentTracks([]);
    }
  };

  const refresh = async () => {
    if (!user || !authToken) return;
    
    setIsRefreshing(true);
    try {
      await loadActivity(authToken, user);
    } catch (error) {
      if (__DEV__) {
        console.warn('Refresh failed:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && authToken) {
      loadActivity(authToken, user);
    }
  }, [user, authToken]);

  useEffect(() => {
    if (user && authToken) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(async () => {
        try {
          await loadActivity(authToken, user);
        } catch (error) {
          if (__DEV__) {
            console.warn('Periodic update failed:', error);
          }
        }
      }, 30000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [user, authToken]);

  return {
    currentlyPlaying,
    recentTracks,
    isRefreshing,
    refresh,
    loadActivity,
  };
};