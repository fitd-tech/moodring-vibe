import { useState, useEffect, useRef } from 'react';
import { CurrentlyPlaying, RecentTrack, TopTrack } from '../types';
import { spotifyApi } from '../services/spotifyApi';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const useSpotifyActivity = () => {
  const { user, authToken, refreshUserToken } = useAuth();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlaying | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMoreTopTracks, setIsLoadingMoreTopTracks] = useState(false);
  const [hasMoreTracks, setHasMoreTracks] = useState(true);
  const [hasMoreTopTracks, setHasMoreTopTracks] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadActivity = async (token?: string, userOverride?: typeof user, preserveAdditionalTracks: boolean = true) => {
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

      const [currentlyPlayingData, recentTracksData, topTracksData] = await Promise.all([
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
        spotifyApi.getTopTracks(spotifyToken, 'medium_term', 10).catch(async error => {
          if (error.message === 'TOKEN_EXPIRED') {
            const refreshResult = await refreshUserToken(activeUser.id);
            if (refreshResult) {
              return spotifyApi.getTopTracks(
                refreshResult.user.spotify_access_token || refreshResult.token,
                'medium_term',
                10
              );
            }
          }
          return [];
        }),
      ]);

      setCurrentlyPlaying(currentlyPlayingData);
      
      // Only replace tracks if we don't have more than the initial load
      // This preserves additional tracks loaded via "See More" unless explicitly disabled
      setRecentTracks(prevTracks => {
        if (!preserveAdditionalTracks || prevTracks.length <= 10) {
          return recentTracksData;
        } else {
          // Update existing tracks and preserve additional ones
          const newPlayedAtSet = new Set(recentTracksData.map(track => track.played_at));
          const additionalTracks = prevTracks.slice(10).filter(track => !newPlayedAtSet.has(track.played_at));
          return [...recentTracksData, ...additionalTracks];
        }
      });

      // Handle top tracks with similar logic
      setTopTracks(prevTopTracks => {
        if (!preserveAdditionalTracks || prevTopTracks.length <= 10) {
          return topTracksData;
        } else {
          // Update existing tracks and preserve additional ones
          const newSongIdSet = new Set(topTracksData.map(track => track.song_id));
          const additionalTopTracks = prevTopTracks.slice(10).filter(track => !newSongIdSet.has(track.song_id));
          return [...topTracksData, ...additionalTopTracks];
        }
      });
      
      // Set hasMoreTracks based on initial load - if we got less than 10, there are no more
      if (recentTracksData.length < 10) {
        setHasMoreTracks(false);
      } else {
        setHasMoreTracks(true);
      }

      // Top tracks API has maximum 50 items, so if we got less than 10, there are no more
      if (topTracksData.length < 10) {
        setHasMoreTopTracks(false);
      } else {
        setHasMoreTopTracks(true);
      }
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
      await loadActivity(authToken, user, false); // Don't preserve additional tracks during refresh
    } catch (error) {
      if (__DEV__) {
        console.warn('Refresh failed:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetToFreshState = async () => {
    // Reset all state to initial values
    setCurrentlyPlaying(null);
    setRecentTracks([]);
    setTopTracks([]);
    setIsRefreshing(false);
    setIsLoadingMore(false);
    setIsLoadingMoreTopTracks(false);
    setHasMoreTracks(true);
    setHasMoreTopTracks(true);
    
    // Load fresh data from Spotify API
    if (user && authToken) {
      await loadActivity(authToken, user, false); // Don't preserve additional tracks during reset
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
      // Convert ISO string to Unix timestamp in milliseconds for Spotify API
      const before = recentTracks.length > 0 
        ? new Date(recentTracks[recentTracks.length - 1].played_at).getTime().toString()
        : undefined;
      
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
        } else {
          // If we got tracks but they were all duplicates, we might be at the end
          // This can happen if Spotify doesn't have more unique tracks to return
          setHasMoreTracks(false);
        }
        
        // If we got less than 10 tracks, we've reached the end
        if (moreTracksData.length < 10) {
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

  const loadMoreTopTracks = async () => {
    if (!user || !authToken || isLoadingMoreTopTracks || !hasMoreTopTracks) return;

    setIsLoadingMoreTopTracks(true);
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

      // Use offset for pagination - get the next 10 tracks
      const offset = topTracks.length;
      
      const moreTopTracksData = await spotifyApi.getMoreTopTracks(spotifyToken, offset, 'medium_term').catch(async error => {
        if (error.message === 'TOKEN_EXPIRED') {
          const refreshResult = await refreshUserToken(activeUser.id);
          if (refreshResult) {
            return spotifyApi.getMoreTopTracks(
              refreshResult.user.spotify_access_token || refreshResult.token,
              offset,
              'medium_term'
            );
          }
        }
        return [];
      });

      if (moreTopTracksData.length > 0) {
        // Filter out duplicates and add new tracks
        const existingSongIds = new Set(topTracks.map(track => track.song_id));
        const newTopTracks = moreTopTracksData.filter(track => !existingSongIds.has(track.song_id));
        
        if (newTopTracks.length > 0) {
          setTopTracks(prevTracks => [...prevTracks, ...newTopTracks]);
        } else {
          // If we got tracks but they were all duplicates, we might be at the end
          setHasMoreTopTracks(false);
        }
        
        // If we got less than 10 tracks, we've reached the end (max 50 total)
        if (moreTopTracksData.length < 10 || (topTracks.length + moreTopTracksData.length) >= 50) {
          setHasMoreTopTracks(false);
        }
      } else {
        setHasMoreTopTracks(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Error loading more top tracks:', error);
      }
      setHasMoreTopTracks(false);
    } finally {
      setIsLoadingMoreTopTracks(false);
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
    topTracks,
    isRefreshing,
    isLoadingMore,
    isLoadingMoreTopTracks,
    hasMoreTracks,
    hasMoreTopTracks,
    refresh,
    loadActivity,
    loadMoreTracks,
    loadMoreTopTracks,
    resetToFreshState,
  };
};
