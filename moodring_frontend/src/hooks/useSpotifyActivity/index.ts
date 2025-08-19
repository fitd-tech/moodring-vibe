import { useState, useEffect, useRef } from 'react';
import {
  CurrentlyPlaying,
  RecentTrack,
  TopTrack,
  SavedTrack,
  SavedPlaylist,
  SavedAlbum,
  BackendUser,
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSpotifyData } from './useSpotifyData';
import { useSpotifyPagination } from './useSpotifyPagination';

export const useSpotifyActivity = () => {
  const { user, authToken, refreshUserToken } = useAuth();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlaying | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { fetchAllInitialData, getValidToken } = useSpotifyData(user, authToken, refreshUserToken);

  const {
    isLoadingMore,
    isLoadingMoreTopTracks,
    isLoadingMoreSavedTracks,
    isLoadingMoreSavedPlaylists,
    isLoadingMoreSavedAlbums,
    hasMoreTracks,
    hasMoreTopTracks,
    hasMoreSavedTracks,
    hasMoreSavedPlaylists,
    hasMoreSavedAlbums,
    loadMoreRecentTracks,
    loadMoreTopTracks,
    loadMoreSavedTracks,
    loadMoreSavedPlaylists,
    loadMoreSavedAlbums,
    resetPaginationStates,
    updateHasMoreFlags,
  } = useSpotifyPagination(user, authToken, refreshUserToken);

  const updateTracksWithPreservation = <T extends { song_id?: string; name?: string }>(
    newTracks: T[],
    existingTracks: T[],
    preserveAdditionalTracks: boolean,
    getId: (_track: T) => string
  ) => {
    if (!preserveAdditionalTracks || existingTracks.length <= 10) {
      return newTracks;
    } else {
      const newTrackIds = new Set(newTracks.map(getId));
      const additionalTracks = existingTracks
        .slice(10)
        .filter(track => !newTrackIds.has(getId(track)));
      return [...newTracks, ...additionalTracks];
    }
  };

  const loadActivity = async (
    token?: string,
    userOverride?: BackendUser | null,
    preserveAdditionalTracks: boolean = true
  ) => {
    const currentUser = userOverride || user;
    const currentToken = token || authToken;

    if (!currentUser || !currentToken) return;

    try {
      const tokenResult = await getValidToken(currentUser, currentToken);
      if (!tokenResult) return;

      const {
        currentlyPlayingData,
        recentTracksData,
        topTracksData,
        savedTracksData,
        savedPlaylistsData,
        savedAlbumsData,
      } = await fetchAllInitialData(tokenResult.token, tokenResult.user);

      setCurrentlyPlaying(currentlyPlayingData);

      // Update tracks with preservation logic
      setRecentTracks(prevTracks =>
        updateTracksWithPreservation(
          recentTracksData,
          prevTracks,
          preserveAdditionalTracks,
          track => track.played_at
        )
      );

      setTopTracks(prevTopTracks =>
        updateTracksWithPreservation(
          topTracksData,
          prevTopTracks,
          preserveAdditionalTracks,
          track => track.song_id || track.name
        )
      );

      setSavedTracks(prevSavedTracks =>
        updateTracksWithPreservation(
          savedTracksData,
          prevSavedTracks,
          preserveAdditionalTracks,
          track => track.song_id || track.name
        )
      );

      // Update playlists and albums with preservation logic
      setSavedPlaylists(prevPlaylists =>
        updateTracksWithPreservation(
          savedPlaylistsData,
          prevPlaylists,
          preserveAdditionalTracks,
          playlist => playlist.playlist_id
        )
      );

      setSavedAlbums(prevAlbums =>
        updateTracksWithPreservation(
          savedAlbumsData,
          prevAlbums,
          preserveAdditionalTracks,
          album => album.album_id
        )
      );

      // Update pagination flags
      updateHasMoreFlags(
        recentTracksData.length,
        topTracksData.length,
        savedTracksData.length,
        savedPlaylistsData.length,
        savedAlbumsData.length
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('Error loading Spotify activity:', error);
      }
      setCurrentlyPlaying(null);
      setRecentTracks([]);
      setSavedTracks([]);
      setSavedPlaylists([]);
      setSavedAlbums([]);
    }
  };

  const refresh = async () => {
    if (!user || !authToken) return;

    setIsRefreshing(true);
    try {
      await loadActivity(authToken, user, false);
    } catch (error) {
      if (__DEV__) {
        console.warn('Refresh failed:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetToFreshState = async () => {
    setIsResetting(true);
    try {
      // Reset all state to initial values
      setCurrentlyPlaying(null);
      setRecentTracks([]);
      setTopTracks([]);
      setSavedTracks([]);
      setSavedPlaylists([]);
      setSavedAlbums([]);
      setIsRefreshing(false);
      resetPaginationStates();

      // Load fresh data from Spotify API
      if (user && authToken) {
        await loadActivity(authToken, user, false);
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Wrapper functions for pagination
  const loadMoreTracks = () => loadMoreRecentTracks(recentTracks, setRecentTracks);
  const loadMoreTopTracksHandler = () => loadMoreTopTracks(topTracks, setTopTracks);
  const loadMoreSavedTracksHandler = () => loadMoreSavedTracks(savedTracks, setSavedTracks);
  const loadMoreSavedPlaylistsHandler = () =>
    loadMoreSavedPlaylists(savedPlaylists, setSavedPlaylists);
  const loadMoreSavedAlbumsHandler = () => loadMoreSavedAlbums(savedAlbums, setSavedAlbums);

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
    savedTracks,
    savedPlaylists,
    savedAlbums,
    isRefreshing,
    isResetting,
    isLoadingMore,
    isLoadingMoreTopTracks,
    isLoadingMoreSavedTracks,
    isLoadingMoreSavedPlaylists,
    isLoadingMoreSavedAlbums,
    hasMoreTracks,
    hasMoreTopTracks,
    hasMoreSavedTracks,
    hasMoreSavedPlaylists,
    hasMoreSavedAlbums,
    refresh,
    loadActivity,
    loadMoreTracks,
    loadMoreTopTracks: loadMoreTopTracksHandler,
    loadMoreSavedTracks: loadMoreSavedTracksHandler,
    loadMoreSavedPlaylists: loadMoreSavedPlaylistsHandler,
    loadMoreSavedAlbums: loadMoreSavedAlbumsHandler,
    resetToFreshState,
  };
};
