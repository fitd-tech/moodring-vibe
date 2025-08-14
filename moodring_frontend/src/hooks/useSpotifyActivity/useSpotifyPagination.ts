import { useState } from 'react';
import { spotifyApi } from '../../services/spotifyApi';
import { RecentTrack, TopTrack, SavedTrack, BackendUser } from '../../types';
import { useSpotifyTokenManagement } from './useSpotifyTokenManagement';

export const useSpotifyPagination = (
  user: BackendUser | null,
  authToken: string | null,
  refreshUserToken: (_userId: number) => Promise<{ user: BackendUser; token: string } | null>
) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMoreTopTracks, setIsLoadingMoreTopTracks] = useState(false);
  const [isLoadingMoreSavedTracks, setIsLoadingMoreSavedTracks] = useState(false);
  const [hasMoreTracks, setHasMoreTracks] = useState(true);
  const [hasMoreTopTracks, setHasMoreTopTracks] = useState(true);
  const [hasMoreSavedTracks, setHasMoreSavedTracks] = useState(true);

  const { getValidToken, handleTokenExpiredError } = useSpotifyTokenManagement(
    user,
    authToken,
    refreshUserToken
  );

  const loadMoreRecentTracks = async (
    recentTracks: RecentTrack[],
    setRecentTracks: (_updater: (_prev: RecentTrack[]) => RecentTrack[]) => void
  ) => {
    if (!user || !authToken || isLoadingMore || !hasMoreTracks) return;

    setIsLoadingMore(true);
    try {
      const tokenResult = await getValidToken();
      if (!tokenResult) return;

      const before =
        recentTracks.length > 0
          ? new Date(recentTracks[recentTracks.length - 1].played_at).getTime().toString()
          : undefined;

      const moreTracksData = await spotifyApi
        .getMoreRecentTracks(tokenResult.token, before)
        .catch(async error => {
          const result = await handleTokenExpiredError(error, tokenResult.user, refreshedToken =>
            spotifyApi.getMoreRecentTracks(refreshedToken, before)
          );
          return result || [];
        });

      if (moreTracksData.length > 0) {
        const existingPlayedAt = new Set(recentTracks.map(track => track.played_at));
        const newTracks = moreTracksData.filter(
          (track: RecentTrack) => !existingPlayedAt.has(track.played_at)
        );

        if (newTracks.length > 0) {
          setRecentTracks(prevTracks => [...prevTracks, ...newTracks]);
        } else {
          setHasMoreTracks(false);
        }

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

  const loadMoreTopTracks = async (
    topTracks: TopTrack[],
    setTopTracks: (_updater: (_prev: TopTrack[]) => TopTrack[]) => void
  ) => {
    if (!user || !authToken || isLoadingMoreTopTracks || !hasMoreTopTracks) return;

    setIsLoadingMoreTopTracks(true);
    try {
      const tokenResult = await getValidToken();
      if (!tokenResult) return;

      const offset = topTracks.length;

      const moreTopTracksData = await spotifyApi
        .getMoreTopTracks(tokenResult.token, offset, 'medium_term')
        .catch(async error => {
          const result = await handleTokenExpiredError(error, tokenResult.user, refreshedToken =>
            spotifyApi.getMoreTopTracks(refreshedToken, offset, 'medium_term')
          );
          return result || [];
        });

      if (moreTopTracksData.length > 0) {
        const existingSongIds = new Set(topTracks.map(track => track.song_id));
        const newTopTracks = moreTopTracksData.filter(
          (track: TopTrack) => !existingSongIds.has(track.song_id)
        );

        if (newTopTracks.length > 0) {
          setTopTracks(prevTracks => [...prevTracks, ...newTopTracks]);
        } else {
          setHasMoreTopTracks(false);
        }

        if (moreTopTracksData.length < 10 || topTracks.length + moreTopTracksData.length >= 50) {
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

  const loadMoreSavedTracks = async (
    savedTracks: SavedTrack[],
    setSavedTracks: (_updater: (_prev: SavedTrack[]) => SavedTrack[]) => void
  ) => {
    if (!user || !authToken || isLoadingMoreSavedTracks || !hasMoreSavedTracks) return;

    setIsLoadingMoreSavedTracks(true);
    try {
      const tokenResult = await getValidToken();
      if (!tokenResult) return;

      const offset = savedTracks.length;

      const moreSavedTracksData = await spotifyApi
        .getMoreSavedTracks(tokenResult.token, offset)
        .catch(async error => {
          const result = await handleTokenExpiredError(error, tokenResult.user, refreshedToken =>
            spotifyApi.getMoreSavedTracks(refreshedToken, offset)
          );
          return result || [];
        });

      if (moreSavedTracksData.length > 0) {
        const existingSongIds = new Set(savedTracks.map(track => track.song_id));
        const newSavedTracks = moreSavedTracksData.filter(
          (track: SavedTrack) => !existingSongIds.has(track.song_id)
        );

        if (newSavedTracks.length > 0) {
          setSavedTracks(prevTracks => [...prevTracks, ...newSavedTracks]);
        } else {
          setHasMoreSavedTracks(false);
        }

        if (moreSavedTracksData.length < 10) {
          setHasMoreSavedTracks(false);
        }
      } else {
        setHasMoreSavedTracks(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Error loading more saved tracks:', error);
      }
      setHasMoreSavedTracks(false);
    } finally {
      setIsLoadingMoreSavedTracks(false);
    }
  };

  const resetPaginationStates = () => {
    setIsLoadingMore(false);
    setIsLoadingMoreTopTracks(false);
    setIsLoadingMoreSavedTracks(false);
    setHasMoreTracks(true);
    setHasMoreTopTracks(true);
    setHasMoreSavedTracks(true);
  };

  const updateHasMoreFlags = (
    recentTracksLength: number,
    topTracksLength: number,
    savedTracksLength: number
  ) => {
    if (recentTracksLength < 10) {
      setHasMoreTracks(false);
    } else {
      setHasMoreTracks(true);
    }

    if (topTracksLength < 10) {
      setHasMoreTopTracks(false);
    } else {
      setHasMoreTopTracks(true);
    }

    if (savedTracksLength < 10) {
      setHasMoreSavedTracks(false);
    } else {
      setHasMoreSavedTracks(true);
    }
  };

  return {
    isLoadingMore,
    isLoadingMoreTopTracks,
    isLoadingMoreSavedTracks,
    hasMoreTracks,
    hasMoreTopTracks,
    hasMoreSavedTracks,
    loadMoreRecentTracks,
    loadMoreTopTracks,
    loadMoreSavedTracks,
    resetPaginationStates,
    updateHasMoreFlags,
  };
};
