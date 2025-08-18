import { useState, useEffect, useCallback } from 'react';
import { SavedPlaylist, SavedAlbum, BackendUser } from '../types';
import { spotifyApi } from '../services/spotifyApi';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface UseSavedLibraryOptions {
  autoLoad?: boolean;
  initialPageSize?: number;
  maxRetries?: number;
}

interface UseSavedLibraryReturn {
  // Data states
  savedPlaylists: SavedPlaylist[];
  savedAlbums: SavedAlbum[];

  // Loading states
  isLoading: boolean;
  isLoadingPlaylists: boolean;
  isLoadingAlbums: boolean;
  isLoadingMorePlaylists: boolean;
  isLoadingMoreAlbums: boolean;

  // Pagination states
  hasMorePlaylists: boolean;
  hasMoreAlbums: boolean;

  // Error states
  error: string | null;
  playlistsError: string | null;
  albumsError: string | null;

  // Actions
  loadSavedLibrary: () => Promise<void>;
  loadMorePlaylists: () => Promise<void>;
  loadMoreAlbums: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useSavedLibrary = (options: UseSavedLibraryOptions = {}): UseSavedLibraryReturn => {
  const { autoLoad = true, initialPageSize = 10, maxRetries = 3 } = options;

  const { user, authToken, refreshUserToken } = useAuth();

  // Data states
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isLoadingMorePlaylists, setIsLoadingMorePlaylists] = useState(false);
  const [isLoadingMoreAlbums, setIsLoadingMoreAlbums] = useState(false);

  // Pagination states
  const [hasMorePlaylists, setHasMorePlaylists] = useState(true);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [albumsError, setAlbumsError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setPlaylistsError(null);
    setAlbumsError(null);
  }, []);

  const reset = useCallback(() => {
    setSavedPlaylists([]);
    setSavedAlbums([]);
    setIsLoading(false);
    setIsLoadingPlaylists(false);
    setIsLoadingAlbums(false);
    setIsLoadingMorePlaylists(false);
    setIsLoadingMoreAlbums(false);
    setHasMorePlaylists(true);
    setHasMoreAlbums(true);
    clearError();
  }, [clearError]);

  const getValidToken = useCallback(
    async (
      currentUser: BackendUser,
      currentToken: string,
      retryCount = 0
    ): Promise<{ token: string; user: BackendUser } | null> => {
      try {
        // Check if token is expired
        if (authService.isTokenExpired(currentUser)) {
          const refreshResult = await refreshUserToken(currentUser.id);
          if (refreshResult) {
            return { token: refreshResult.token, user: refreshResult.user };
          }
          return null;
        }

        return { token: currentToken, user: currentUser };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'TOKEN_EXPIRED' &&
          retryCount < maxRetries
        ) {
          const refreshResult = await refreshUserToken(currentUser.id);
          if (refreshResult) {
            return getValidToken(refreshResult.user, refreshResult.token, retryCount + 1);
          }
        }
        throw error;
      }
    },
    [refreshUserToken, maxRetries]
  );

  const loadSavedPlaylists = useCallback(
    async (currentUser: BackendUser, token: string, append = false): Promise<SavedPlaylist[]> => {
      try {
        if (!append) {
          setIsLoadingPlaylists(true);
          setPlaylistsError(null);
        } else {
          setIsLoadingMorePlaylists(true);
        }

        const tokenResult = await getValidToken(currentUser, token);
        if (!tokenResult) {
          throw new Error('Unable to get valid token');
        }

        let newPlaylists: SavedPlaylist[];
        if (append && savedPlaylists.length > 0) {
          newPlaylists = await spotifyApi.getMoreSavedPlaylists(
            tokenResult.token,
            savedPlaylists.length
          );
        } else {
          newPlaylists = await spotifyApi.getSavedPlaylists(tokenResult.token);
        }

        if (append) {
          // Filter out duplicates when appending
          const existingIds = new Set(savedPlaylists.map(p => p.playlist_id));
          const uniqueNewPlaylists = newPlaylists.filter(p => !existingIds.has(p.playlist_id));

          if (uniqueNewPlaylists.length === 0) {
            setHasMorePlaylists(false);
            return savedPlaylists;
          }

          const updatedPlaylists = [...savedPlaylists, ...uniqueNewPlaylists];
          setSavedPlaylists(updatedPlaylists);
          setHasMorePlaylists(newPlaylists.length >= initialPageSize);
          return updatedPlaylists;
        } else {
          setSavedPlaylists(newPlaylists);
          setHasMorePlaylists(newPlaylists.length >= initialPageSize);
          return newPlaylists;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load playlists';
        setPlaylistsError(errorMessage);
        if (!append) {
          setError(errorMessage);
        }
        throw error;
      } finally {
        if (!append) {
          setIsLoadingPlaylists(false);
        } else {
          setIsLoadingMorePlaylists(false);
        }
      }
    },
    [savedPlaylists, getValidToken, initialPageSize]
  );

  const loadSavedAlbums = useCallback(
    async (currentUser: BackendUser, token: string, append = false): Promise<SavedAlbum[]> => {
      try {
        if (!append) {
          setIsLoadingAlbums(true);
          setAlbumsError(null);
        } else {
          setIsLoadingMoreAlbums(true);
        }

        const tokenResult = await getValidToken(currentUser, token);
        if (!tokenResult) {
          throw new Error('Unable to get valid token');
        }

        let newAlbums: SavedAlbum[];
        if (append && savedAlbums.length > 0) {
          newAlbums = await spotifyApi.getMoreSavedAlbums(tokenResult.token, savedAlbums.length);
        } else {
          newAlbums = await spotifyApi.getSavedAlbums(tokenResult.token);
        }

        if (append) {
          // Filter out duplicates when appending
          const existingIds = new Set(savedAlbums.map(a => a.album_id));
          const uniqueNewAlbums = newAlbums.filter(a => !existingIds.has(a.album_id));

          if (uniqueNewAlbums.length === 0) {
            setHasMoreAlbums(false);
            return savedAlbums;
          }

          const updatedAlbums = [...savedAlbums, ...uniqueNewAlbums];
          setSavedAlbums(updatedAlbums);
          setHasMoreAlbums(newAlbums.length >= initialPageSize);
          return updatedAlbums;
        } else {
          setSavedAlbums(newAlbums);
          setHasMoreAlbums(newAlbums.length >= initialPageSize);
          return newAlbums;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load albums';
        setAlbumsError(errorMessage);
        if (!append) {
          setError(errorMessage);
        }
        throw error;
      } finally {
        if (!append) {
          setIsLoadingAlbums(false);
        } else {
          setIsLoadingMoreAlbums(false);
        }
      }
    },
    [savedAlbums, getValidToken, initialPageSize]
  );

  const loadSavedLibrary = useCallback(async (): Promise<void> => {
    if (!user || !authToken) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await Promise.all([
        loadSavedPlaylists(user, authToken, false),
        loadSavedAlbums(user, authToken, false),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load saved library';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, authToken, loadSavedPlaylists, loadSavedAlbums, clearError]);

  const loadMorePlaylists = useCallback(async (): Promise<void> => {
    if (!user || !authToken || isLoadingMorePlaylists || !hasMorePlaylists) {
      return;
    }

    try {
      await loadSavedPlaylists(user, authToken, true);
    } catch (error) {
      // Error handling is done in loadSavedPlaylists
      console.warn('Error loading more playlists:', error);
    }
  }, [user, authToken, isLoadingMorePlaylists, hasMorePlaylists, loadSavedPlaylists]);

  const loadMoreAlbums = useCallback(async (): Promise<void> => {
    if (!user || !authToken || isLoadingMoreAlbums || !hasMoreAlbums) {
      return;
    }

    try {
      await loadSavedAlbums(user, authToken, true);
    } catch (error) {
      // Error handling is done in loadSavedAlbums
      console.warn('Error loading more albums:', error);
    }
  }, [user, authToken, isLoadingMoreAlbums, hasMoreAlbums, loadSavedAlbums]);

  const refreshLibrary = useCallback(async (): Promise<void> => {
    if (!user || !authToken) {
      return;
    }

    // Reset pagination states
    setHasMorePlaylists(true);
    setHasMoreAlbums(true);

    await loadSavedLibrary();
  }, [user, authToken, loadSavedLibrary]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && user && authToken) {
      loadSavedLibrary();
    }
  }, [autoLoad, user, authToken, loadSavedLibrary]);

  return {
    // Data states
    savedPlaylists,
    savedAlbums,

    // Loading states
    isLoading,
    isLoadingPlaylists,
    isLoadingAlbums,
    isLoadingMorePlaylists,
    isLoadingMoreAlbums,

    // Pagination states
    hasMorePlaylists,
    hasMoreAlbums,

    // Error states
    error,
    playlistsError,
    albumsError,

    // Actions
    loadSavedLibrary,
    loadMorePlaylists,
    loadMoreAlbums,
    refreshLibrary,
    clearError,
    reset,
  };
};
