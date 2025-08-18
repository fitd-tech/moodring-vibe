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
      const result = await handleTokenExpiredError(error, activeUser, refreshedToken =>
        spotifyApi.getRecentTracks(refreshedToken, limit)
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
      const result = await handleTokenExpiredError(error, activeUser, refreshedToken =>
        spotifyApi.getTopTracks(refreshedToken, timeRange, limit)
      );
      return result || [];
    }
  };

  const fetchSavedTracks = async (token: string, activeUser: BackendUser, limit: number = 10) => {
    try {
      // Verify token has required scope before attempting fetch
      const scopes = await spotifyApi.verifyTokenScopes(token);
      if (!scopes.includes('user-library-read')) {
        // Return empty array instead of throwing error to prevent app crashes
        return [];
      }

      const tracks = await spotifyApi.getSavedTracks(token, limit);
      return tracks;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        return [];
      }

      const result = await handleTokenExpiredError(error, activeUser, refreshedToken =>
        spotifyApi.getSavedTracks(refreshedToken, limit)
      );
      return result || [];
    }
  };

  const fetchSavedPlaylists = async (
    token: string,
    activeUser: BackendUser,
    limit: number = 20
  ) => {
    try {
      // Verify token has required scope before attempting fetch
      const scopes = await spotifyApi.verifyTokenScopes(token);
      if (!scopes.includes('playlist-read-private')) {
        if (__DEV__) {
          console.warn('[SpotifyData] Missing playlist-read-private scope');
        }
        // Return empty array instead of throwing error to prevent app crashes
        return [];
      }

      if (!scopes.includes('playlist-read-collaborative')) {
        if (__DEV__) {
          console.warn(
            '[SpotifyData] Missing playlist-read-collaborative scope - collaborative playlists may not be returned'
          );
        }
      }

      const playlists = await spotifyApi.getSavedPlaylists(token, limit);
      if (__DEV__) {
        console.log('[SpotifyData] fetchSavedPlaylists result:', {
          playlistsCount: playlists.length,
          limit,
          playlists: playlists.map(p => ({ name: p.name, id: p.playlist_id })),
        });
      }
      return playlists;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        if (__DEV__) {
          console.warn('[SpotifyData] Permission denied for saved playlists');
        }
        return [];
      }

      const result = await handleTokenExpiredError(error, activeUser, refreshedToken =>
        spotifyApi.getSavedPlaylists(refreshedToken, limit)
      );
      return result || [];
    }
  };

  const fetchSavedAlbums = async (token: string, activeUser: BackendUser, limit: number = 20) => {
    try {
      // Verify token has required scope before attempting fetch
      const scopes = await spotifyApi.verifyTokenScopes(token);
      if (!scopes.includes('user-library-read')) {
        // Return empty array instead of throwing error to prevent app crashes
        return [];
      }

      const albums = await spotifyApi.getSavedAlbums(token, limit);
      return albums;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        return [];
      }

      const result = await handleTokenExpiredError(error, activeUser, refreshedToken =>
        spotifyApi.getSavedAlbums(refreshedToken, limit)
      );
      return result || [];
    }
  };

  const fetchAllInitialData = async (token: string, activeUser: BackendUser) => {
    const [
      currentlyPlayingData,
      recentTracksData,
      topTracksData,
      savedTracksData,
      savedPlaylistsData,
      savedAlbumsData,
    ] = await Promise.all([
      fetchCurrentlyPlaying(token, activeUser),
      fetchRecentTracks(token, activeUser, 10),
      fetchTopTracks(token, activeUser, 'medium_term', 10),
      fetchSavedTracks(token, activeUser, 10),
      fetchSavedPlaylists(token, activeUser, 20),
      fetchSavedAlbums(token, activeUser, 20),
    ]);

    return {
      currentlyPlayingData,
      recentTracksData,
      topTracksData,
      savedTracksData,
      savedPlaylistsData,
      savedAlbumsData,
    };
  };

  return {
    getValidToken,
    fetchCurrentlyPlaying,
    fetchRecentTracks,
    fetchTopTracks,
    fetchSavedTracks,
    fetchSavedPlaylists,
    fetchSavedAlbums,
    fetchAllInitialData,
  };
};
