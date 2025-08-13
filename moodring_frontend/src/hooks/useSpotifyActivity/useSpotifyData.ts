import { spotifyApi } from '../../services/spotifyApi';
import { useSpotifyTokenManagement } from './useSpotifyTokenManagement';
import { BackendUser } from '../../types';

export const useSpotifyData = (
  user: BackendUser | null,
  authToken: string | null,
  refreshUserToken: (_userId: number) => Promise<{ user: BackendUser; token: string } | null>
) => {
  const { getValidToken, handleTokenExpiredError } = useSpotifyTokenManagement(
    user,
    authToken,
    refreshUserToken
  );

  const fetchCurrentlyPlaying = async (token: string, activeUser: BackendUser) => {
    try {
      return await spotifyApi.getCurrentlyPlaying(token);
    } catch (error) {
      return await handleTokenExpiredError(error, activeUser, spotifyApi.getCurrentlyPlaying);
    }
  };

  const fetchRecentTracks = async (token: string, activeUser: BackendUser, limit: number = 10) => {
    try {
      return await spotifyApi.getRecentTracks(token, limit);
    } catch (error) {
      const result = await handleTokenExpiredError(
        error,
        activeUser,
        (refreshedToken) => spotifyApi.getRecentTracks(refreshedToken, limit)
      );
      return result || [];
    }
  };

  const fetchTopTracks = async (
    token: string,
    activeUser: BackendUser,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 10
  ) => {
    try {
      return await spotifyApi.getTopTracks(token, timeRange, limit);
    } catch (error) {
      const result = await handleTokenExpiredError(
        error,
        activeUser,
        (refreshedToken) => spotifyApi.getTopTracks(refreshedToken, timeRange, limit)
      );
      return result || [];
    }
  };

  const fetchSavedTracks = async (token: string, activeUser: BackendUser, limit: number = 10) => {
    try {
      return await spotifyApi.getSavedTracks(token, limit);
    } catch (error) {
      const result = await handleTokenExpiredError(
        error,
        activeUser,
        (refreshedToken) => spotifyApi.getSavedTracks(refreshedToken, limit)
      );
      return result || [];
    }
  };

  const fetchAllInitialData = async (token: string, activeUser: BackendUser) => {
    const [currentlyPlayingData, recentTracksData, topTracksData, savedTracksData] =
      await Promise.all([
        fetchCurrentlyPlaying(token, activeUser),
        fetchRecentTracks(token, activeUser, 10),
        fetchTopTracks(token, activeUser, 'medium_term', 10),
        fetchSavedTracks(token, activeUser, 10),
      ]);

    return {
      currentlyPlayingData,
      recentTracksData,
      topTracksData,
      savedTracksData,
    };
  };

  return {
    getValidToken,
    fetchCurrentlyPlaying,
    fetchRecentTracks,
    fetchTopTracks,
    fetchSavedTracks,
    fetchAllInitialData,
  };
};