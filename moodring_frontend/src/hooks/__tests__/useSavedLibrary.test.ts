import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSavedLibrary } from '../useSavedLibrary';
import { spotifyApi } from '../../services/spotifyApi';
import { authService } from '../../services/authService';
import { useAuth, AuthContextType } from '../../contexts/AuthContext';
import { SavedPlaylist, SavedAlbum, BackendUser } from '../../types';

// Mock the modules
jest.mock('../../services/spotifyApi');
jest.mock('../../services/authService');
jest.mock('../../contexts/AuthContext');

const mockSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock user factory
const createMockUser = (id: number): BackendUser => ({
  id,
  spotify_id: `spotify_${id}`,
  email: `user${id}@example.com`,
  display_name: `User ${id}`,
  spotify_access_token: 'mock_access_token',
  spotify_refresh_token: 'mock_refresh_token',
  token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  profile_image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Mock data factories
const createMockPlaylist = (id: string, name: string): SavedPlaylist => ({
  playlist_id: id,
  name,
  description: `Description for ${name}`,
  image_url: `https://example.com/${id}.jpg`,
  track_count: Math.floor(Math.random() * 50) + 1,
  created_at: new Date().toISOString(),
});

const createMockAlbum = (id: string, name: string, artist: string): SavedAlbum => ({
  album_id: id,
  name,
  artist,
  image_url: `https://example.com/${id}.jpg`,
  release_date: '2023-01-01',
  track_count: Math.floor(Math.random() * 20) + 1,
});

const mockPlaylists: SavedPlaylist[] = Array.from({ length: 10 }, (_, i) =>
  createMockPlaylist(`playlist-${i + 1}`, `Test Playlist ${i + 1}`)
);

const mockAlbums: SavedAlbum[] = Array.from({ length: 10 }, (_, i) =>
  createMockAlbum(`album-${i + 1}`, `Test Album ${i + 1}`, `Test Artist ${i + 1}`)
);

// Create wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

describe('useSavedLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.isTokenExpired.mockReturnValue(false);

    // Default useAuth mock
    mockUseAuth.mockReturnValue({
      user: null,
      authToken: null,
      isLoading: false,
      error: null,
      setUser: jest.fn(),
      setAuthToken: jest.fn(),
      setError: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      refreshUserToken: jest.fn().mockResolvedValue(null),
    } as AuthContextType);

    // Default API mocks
    mockSpotifyApi.getSavedPlaylists.mockResolvedValue([]);
    mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);
    mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue([]);
    mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue([]);
  });

  describe('Initial State', () => {
    it('initializes with default state when no user is authenticated', () => {
      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      expect(result.current.savedPlaylists).toEqual([]);
      expect(result.current.savedAlbums).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingPlaylists).toBe(false);
      expect(result.current.isLoadingAlbums).toBe(false);
      expect(result.current.isLoadingMorePlaylists).toBe(false);
      expect(result.current.isLoadingMoreAlbums).toBe(false);
      expect(result.current.hasMorePlaylists).toBe(true);
      expect(result.current.hasMoreAlbums).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.playlistsError).toBeNull();
      expect(result.current.albumsError).toBeNull();
    });

    it('does not auto-load when user is not authenticated', () => {
      renderHook(() => useSavedLibrary({ autoLoad: true }), { wrapper });

      expect(mockSpotifyApi.getSavedPlaylists).not.toHaveBeenCalled();
      expect(mockSpotifyApi.getSavedAlbums).not.toHaveBeenCalled();
    });
  });

  describe('Auto-loading', () => {
    it('auto-loads data when user and token are available', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 5));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockAlbums.slice(0, 5));

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: true }), { wrapper });

      await act(async () => {
        // Wait for auto-load to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockSpotifyApi.getSavedPlaylists).toHaveBeenCalledWith('test-token');
      expect(mockSpotifyApi.getSavedAlbums).toHaveBeenCalledWith('test-token');
      expect(result.current.savedPlaylists).toHaveLength(5);
      expect(result.current.savedAlbums).toHaveLength(5);
    });

    it('does not auto-load when autoLoad is disabled', () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      expect(mockSpotifyApi.getSavedPlaylists).not.toHaveBeenCalled();
      expect(mockSpotifyApi.getSavedAlbums).not.toHaveBeenCalled();
    });
  });

  describe('loadSavedLibrary', () => {
    it('loads both playlists and albums successfully', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 3));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockAlbums.slice(0, 4));

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.savedPlaylists).toHaveLength(3);
      expect(result.current.savedAlbums).toHaveLength(4);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading states correctly during load', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Make API calls return pending promises to check loading states
      let _resolvePlaylistsPromise: (_value: SavedPlaylist[]) => void;
      const pendingPlaylistsPromise = new Promise<SavedPlaylist[]>(_resolve => {
        _resolvePlaylistsPromise = _resolve;
      });

      let _resolveAlbumsPromise: (_value: SavedAlbum[]) => void;
      const pendingAlbumsPromise = new Promise<SavedAlbum[]>(_resolve => {
        _resolveAlbumsPromise = _resolve;
      });

      mockSpotifyApi.getSavedPlaylists.mockReturnValue(pendingPlaylistsPromise);
      mockSpotifyApi.getSavedAlbums.mockReturnValue(pendingAlbumsPromise);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      act(() => {
        result.current.loadSavedLibrary();
      });

      // Check loading state is true
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isLoadingPlaylists).toBe(true);
      expect(result.current.isLoadingAlbums).toBe(true);

      // Resolve the promises
      await act(async () => {
        _resolvePlaylistsPromise([]);
        _resolveAlbumsPromise([]);
        await pendingPlaylistsPromise;
        await pendingAlbumsPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingPlaylists).toBe(false);
      expect(result.current.isLoadingAlbums).toBe(false);
    });

    it('handles authentication errors', async () => {
      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.error).toBe('User not authenticated');
      expect(result.current.savedPlaylists).toEqual([]);
      expect(result.current.savedAlbums).toEqual([]);
    });

    it('handles API errors gracefully', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(new Error('API Error'));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.playlistsError).toBe('API Error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Pagination - loadMorePlaylists', () => {
    it('loads more playlists successfully', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Initial load
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 10));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Load more - create new playlists with different IDs to avoid duplicates
      const morePlaylists = Array.from({ length: 5 }, (_, i) =>
        createMockPlaylist(`more-playlist-${i + 1}`, `More Playlist ${i + 1}`)
      );
      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(morePlaylists);

      await act(async () => {
        await result.current.loadMorePlaylists();
      });

      expect(result.current.savedPlaylists).toHaveLength(15);
      expect(mockSpotifyApi.getMoreSavedPlaylists).toHaveBeenCalledWith('test-token', 10);
    });

    it('prevents loading more when already loading', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Set up initial data
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 10));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Make loadMore hang to simulate loading state
      let _resolveMore: (_value: SavedPlaylist[]) => void;
      const hangingPromise = new Promise<SavedPlaylist[]>(_resolve => {
        _resolveMore = _resolve;
      });

      mockSpotifyApi.getMoreSavedPlaylists.mockReturnValue(hangingPromise);

      // First call should start loading
      act(() => {
        result.current.loadMorePlaylists();
      });

      expect(result.current.isLoadingMorePlaylists).toBe(true);

      // Second call should be ignored because first is still loading
      await act(async () => {
        await result.current.loadMorePlaylists();
      });

      // getMoreSavedPlaylists should only have been called once (from the first call)
      expect(mockSpotifyApi.getMoreSavedPlaylists).toHaveBeenCalledTimes(1);

      // Complete the first call
      await act(async () => {
        _resolveMore([]);
        await hangingPromise;
      });
    });

    it('prevents loading more when hasMorePlaylists is false', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Return fewer than page size to trigger hasMorePlaylists = false
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 5));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(
        () => useSavedLibrary({ autoLoad: false, initialPageSize: 10 }),
        { wrapper }
      );

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.hasMorePlaylists).toBe(false);

      // Try to load more
      await act(async () => {
        await result.current.loadMorePlaylists();
      });

      expect(mockSpotifyApi.getMoreSavedPlaylists).not.toHaveBeenCalled();
    });

    it('filters out duplicate playlists when loading more', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Initial load
      const initialPlaylists = mockPlaylists.slice(0, 5);
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(initialPlaylists);
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Load more with duplicates
      const duplicatePlaylists = [initialPlaylists[0], initialPlaylists[1]]; // Same as initial
      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(duplicatePlaylists);

      await act(async () => {
        await result.current.loadMorePlaylists();
      });

      // Should not have duplicates and hasMorePlaylists should be false
      expect(result.current.savedPlaylists).toHaveLength(5);
      expect(result.current.hasMorePlaylists).toBe(false);
    });
  });

  describe('Pagination - loadMoreAlbums', () => {
    it('loads more albums successfully', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Initial load
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue([]);
      mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockAlbums.slice(0, 10));

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Load more - create new albums with different IDs to avoid duplicates
      const moreAlbums = Array.from({ length: 5 }, (_, i) =>
        createMockAlbum(`more-album-${i + 1}`, `More Album ${i + 1}`, `More Artist ${i + 1}`)
      );
      mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue(moreAlbums);

      await act(async () => {
        await result.current.loadMoreAlbums();
      });

      expect(result.current.savedAlbums).toHaveLength(15);
      expect(mockSpotifyApi.getMoreSavedAlbums).toHaveBeenCalledWith('test-token', 10);
    });

    it('prevents loading more when already loading', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Set up initial data
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue([]);
      mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockAlbums.slice(0, 10));

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Make loadMore hang to simulate loading state
      let _resolveMore: (_value: SavedAlbum[]) => void;
      const hangingPromise = new Promise<SavedAlbum[]>(_resolve => {
        _resolveMore = _resolve;
      });

      mockSpotifyApi.getMoreSavedAlbums.mockReturnValue(hangingPromise);

      // First call should start loading
      act(() => {
        result.current.loadMoreAlbums();
      });

      expect(result.current.isLoadingMoreAlbums).toBe(true);

      // Second call should be ignored because first is still loading
      await act(async () => {
        await result.current.loadMoreAlbums();
      });

      // getMoreSavedAlbums should only have been called once (from the first call)
      expect(mockSpotifyApi.getMoreSavedAlbums).toHaveBeenCalledTimes(1);

      // Complete the first call
      await act(async () => {
        _resolveMore([]);
        await hangingPromise;
      });
    });
  });

  describe('Token Management', () => {
    it('refreshes token when expired', async () => {
      const testUser = createMockUser(1);
      const refreshedUser = { ...testUser, spotify_access_token: 'new_token' };
      const refreshResult = { user: refreshedUser, token: 'new_token' };

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'expired-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(refreshResult),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockResolvedValue([]);
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(mockAuthService.isTokenExpired).toHaveBeenCalledWith(testUser);
      expect(mockUseAuth().refreshUserToken).toHaveBeenCalledWith(testUser.id);
      expect(mockSpotifyApi.getSavedPlaylists).toHaveBeenCalledWith('new_token');
      expect(mockSpotifyApi.getSavedAlbums).toHaveBeenCalledWith('new_token');
    });

    it('handles TOKEN_EXPIRED error during API calls', async () => {
      const testUser = createMockUser(1);

      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // API call fails with TOKEN_EXPIRED
      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(new Error('TOKEN_EXPIRED'));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Should have error set due to TOKEN_EXPIRED
      expect(result.current.error).toBeTruthy();
      expect(mockSpotifyApi.getSavedPlaylists).toHaveBeenCalledTimes(1);
    });

    it('handles token refresh failure', async () => {
      const testUser = createMockUser(1);

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'expired-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null), // Refresh fails
      } as AuthContextType);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.error).toBe('Unable to get valid token');
      expect(mockSpotifyApi.getSavedPlaylists).not.toHaveBeenCalled();
      expect(mockSpotifyApi.getSavedAlbums).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('clears all errors', () => {
      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      // Set some errors manually (this is testing behavior, not typical usage)
      act(() => {
        // We can't directly set error states from outside, but we can test clearError
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.playlistsError).toBeNull();
      expect(result.current.albumsError).toBeNull();
    });

    it('resets all state', () => {
      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      act(() => {
        result.current.reset();
      });

      expect(result.current.savedPlaylists).toEqual([]);
      expect(result.current.savedAlbums).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingPlaylists).toBe(false);
      expect(result.current.isLoadingAlbums).toBe(false);
      expect(result.current.isLoadingMorePlaylists).toBe(false);
      expect(result.current.isLoadingMoreAlbums).toBe(false);
      expect(result.current.hasMorePlaylists).toBe(true);
      expect(result.current.hasMoreAlbums).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.playlistsError).toBeNull();
      expect(result.current.albumsError).toBeNull();
    });

    it('refreshes library and resets pagination states', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Return fewer items to set hasMore flags to false initially
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 5));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockAlbums.slice(0, 5));

      const { result } = renderHook(
        () => useSavedLibrary({ autoLoad: false, initialPageSize: 10 }),
        { wrapper }
      );

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Should have hasMore flags set to false
      expect(result.current.hasMorePlaylists).toBe(false);
      expect(result.current.hasMoreAlbums).toBe(false);

      // Refresh should reset hasMore flags
      await act(async () => {
        await result.current.refreshLibrary();
      });

      // hasMore flags should be reset to true and then set based on new data
      expect(result.current.hasMorePlaylists).toBe(false); // Still false due to < 10 items
      expect(result.current.hasMoreAlbums).toBe(false); // Still false due to < 10 items
    });
  });

  describe('Hook Options', () => {
    it('respects custom initialPageSize', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Return exactly the page size
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 5));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(
        () => useSavedLibrary({ autoLoad: false, initialPageSize: 5 }),
        { wrapper }
      );

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Should set hasMorePlaylists to true because we got exactly the page size
      expect(result.current.hasMorePlaylists).toBe(true);
    });

    it('handles maxRetries option for token refresh', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(new Error('API Error'));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false, maxRetries: 1 }), {
        wrapper,
      });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Should have error due to API failure
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles individual playlist loading errors', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(new Error('Playlist error'));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockAlbums.slice(0, 3));

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.playlistsError).toBe('Playlist error');
      expect(result.current.error).toBe('Playlist error');
      expect(result.current.albumsError).toBeNull();
      expect(result.current.savedAlbums).toHaveLength(3); // Albums should still load
    });

    it('handles individual album loading errors', async () => {
      const testUser = createMockUser(1);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 3));
      mockSpotifyApi.getSavedAlbums.mockRejectedValue(new Error('Album error'));

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      expect(result.current.albumsError).toBe('Album error');
      expect(result.current.error).toBe('Album error');
      expect(result.current.playlistsError).toBeNull();
      expect(result.current.savedPlaylists).toHaveLength(3); // Playlists should still load
    });

    it('handles errors during loadMorePlaylists gracefully', async () => {
      const testUser = createMockUser(1);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(null),
      } as AuthContextType);

      // Initial load successful
      mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockPlaylists.slice(0, 10));
      mockSpotifyApi.getSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedLibrary({ autoLoad: false }), { wrapper });

      await act(async () => {
        await result.current.loadSavedLibrary();
      });

      // Load more fails
      mockSpotifyApi.getMoreSavedPlaylists.mockRejectedValue(new Error('Load more error'));

      await act(async () => {
        await result.current.loadMorePlaylists();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading more playlists:', expect.any(Error));
      expect(result.current.savedPlaylists).toHaveLength(10); // Original data preserved

      consoleSpy.mockRestore();
    });
  });
});
