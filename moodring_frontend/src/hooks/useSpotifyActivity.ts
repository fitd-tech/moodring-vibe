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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTracks, setHasMoreTracks] = useState(true);
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
        spotifyApi.getCurrentlyPlaying(spotifyToken).catch(async error => {
          if (error.message === 'TOKEN_EXPIRED') {
            const refreshResult = await refreshUserToken(activeUser.id);
            if (refreshResult) {
              return spotifyApi.getCurrentlyPlaying(
                refreshResult.user.spotify_access_token || refreshResult.token
              );
            }
          }
          return null;
        }),
        spotifyApi.getRecentTracks(spotifyToken, 10).catch(async error => {
          if (error.message === 'TOKEN_EXPIRED') {
            const refreshResult = await refreshUserToken(activeUser.id);
            if (refreshResult) {
              return spotifyApi.getRecentTracks(
                refreshResult.user.spotify_access_token || refreshResult.token,
                10
              );
            }
          }
          return [];
        }),
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

  const loadMoreTracks = async () => {
    if (!user || !authToken || isLoadingMore || !hasMoreTracks) return;

    setIsLoadingMore(true);
    try {
      let spotifyToken = user.spotify_access_token || authToken;
      let activeUser = user;

      if (authService.isTokenExpired(activeUser)) {
        const refreshResult = await refreshUserToken(activeUser.id);
        if (refreshResult) {
          spotifyToken = refreshResult.user.spotify_access_token || refreshResult.token;
          activeUser = refreshResult.user;
        }
      }

      // Get the oldest track's played_at timestamp for pagination
      const before = recentTracks.length > 0 ? recentTracks[recentTracks.length - 1].played_at : undefined;
      
      const moreTracksData = await spotifyApi.getMoreRecentTracks(spotifyToken, before).catch(async error => {
        if (error.message === 'TOKEN_EXPIRED') {
          const refreshResult = await refreshUserToken(activeUser.id);
          if (refreshResult) {
            return spotifyApi.getMoreRecentTracks(
              refreshResult.user.spotify_access_token || refreshResult.token,
              before
            );
          }
        }
        return [];
      });

      if (moreTracksData.length > 0) {
        // Filter out duplicates and add new tracks
        const existingPlayedAt = new Set(recentTracks.map(track => track.played_at));
        const newTracks = moreTracksData.filter(track => !existingPlayedAt.has(track.played_at));
        
        if (newTracks.length > 0) {
          setRecentTracks(prevTracks => [...prevTracks, ...newTracks]);
        }
        
        // If we got less than 50 tracks, we've reached the end
        if (moreTracksData.length < 50) {
          setHasMoreTracks(false);
        }
      } else {
        setHasMoreTracks(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Error loading more tracks:', error);
      }
      setHasMoreTracks(false);
    } finally {
      setIsLoadingMore(false);
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
    isLoadingMore,
    hasMoreTracks,
    refresh,
    loadActivity,
    loadMoreTracks,
  };
};
