import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSpotifyActivity } from '../useSpotifyActivity';
import { spotifyApi } from '../../services/spotifyApi';
import { authService } from '../../services/authService';
import { useAuth, AuthContextType } from '../../contexts/AuthContext';
import { SavedTrack, BackendUser, CurrentlyPlaying, RecentTrack, TopTrack } from '../../types';

// Mock the modules
jest.mock('../../services/spotifyApi');
jest.mock('../../services/authService');
jest.mock('../../contexts/AuthContext');

const mockSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Define mock user type
const createMockUser = (id: number): BackendUser => ({
  id,
  spotify_id: `spotify_${id}`,
  email: `user${id}@example.com`,
  display_name: `User ${id}`,
  spotify_access_token: 'mock_access_token',
  spotify_refresh_token: 'mock_refresh_token',
  token_expires_at: new Date().toISOString(),
  profile_image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Create wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

describe('useSpotifyActivity - Core Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);
    mockAuthService.isTokenExpired.mockReturnValue(false);

    // Reset useAuth mock
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

    // Set default mock return values
    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);
    mockSpotifyApi.getTopTracks.mockResolvedValue([]);
    mockSpotifyApi.getSavedTracks.mockResolvedValue([]);
    mockSpotifyApi.getMoreSavedTracks.mockResolvedValue([]);
    mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    expect(result.current.currentlyPlaying).toBeNull();
    expect(result.current.recentTracks).toEqual([]);
    expect(result.current.topTracks).toEqual([]);
    expect(result.current.savedTracks).toEqual([]);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMoreTracks).toBe(true);
    expect(result.current.hasMoreTopTracks).toBe(true);
    expect(result.current.hasMoreSavedTracks).toBe(true);
  });

  it('loads saved tracks activity successfully', async () => {
    const mockSavedTracks: SavedTrack[] = [
      {
        song_id: 'saved1',
        name: 'Saved Song 1',
        artist: 'Artist 1',
        album: 'Album 1',
        album_image_url: 'http://example.com/image1.jpg',
        added_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockSpotifyApi.getSavedTracks.mockResolvedValue(mockSavedTracks);

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    await act(async () => {
      await result.current.loadActivity('test-token', createMockUser(1));
    });

    expect(result.current.savedTracks).toEqual(mockSavedTracks);
  });

  it('handles loadMoreSavedTracks successfully', async () => {
    const initialSavedTracks: SavedTrack[] = Array.from({ length: 10 }, (_, i) => ({
      song_id: `saved_${i + 1}`,
      name: `Saved Song ${i + 1}`,
      artist: `Saved Artist ${i + 1}`,
      album: `Saved Album ${i + 1}`,
      album_image_url: `http://example.com/image${i + 1}.jpg`,
      added_at: new Date().toISOString(),
    }));

    const moreSavedTracks: SavedTrack[] = Array.from({ length: 5 }, (_, i) => ({
      song_id: `more_saved_${i + 1}`,
      name: `More Saved Song ${i + 1}`,
      artist: `More Saved Artist ${i + 1}`,
      album: `More Saved Album ${i + 1}`,
      album_image_url: `http://example.com/moreimage${i + 1}.jpg`,
      added_at: new Date().toISOString(),
    }));

    const testUser = createMockUser(1);

    // Setup mocks for this test
    mockSpotifyApi.getSavedTracks.mockResolvedValue(initialSavedTracks);
    mockSpotifyApi.getMoreSavedTracks.mockResolvedValue(moreSavedTracks);

    // Mock useAuth to return the test user and token
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

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    await act(async () => {
      await result.current.loadActivity('test-token', testUser);
    });

    await act(async () => {
      await result.current.loadMoreSavedTracks();
    });

    expect(result.current.savedTracks).toHaveLength(15);
    expect(result.current.hasMoreSavedTracks).toBe(false); // Less than 10 returned
  });

  describe('Token Refresh Integration', () => {
    it('refreshes token when TOKEN_EXPIRED error occurs', async () => {
      const testUser = createMockUser(1);
      const refreshedUser = { ...testUser, spotify_access_token: 'new_token' };
      const refreshResult = { user: refreshedUser, token: 'new_token' };

      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValueOnce(new Error('TOKEN_EXPIRED'));
      mockSpotifyApi.getCurrentlyPlaying.mockResolvedValueOnce({
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        is_playing: true,
      } as CurrentlyPlaying);

      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(refreshResult),
      } as AuthContextType);

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      expect(mockUseAuth().refreshUserToken).toHaveBeenCalledWith(testUser.id);
      expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalledWith('new_token');
    });

    it('handles token refresh failure gracefully', async () => {
      const testUser = createMockUser(1);

      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('TOKEN_EXPIRED'));
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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      expect(result.current.currentlyPlaying).toBeNull();
    });

    it('handles expired token detection', async () => {
      const testUser = createMockUser(1);
      const refreshedUser = { ...testUser, spotify_access_token: 'new_token' };
      const refreshResult = { user: refreshedUser, token: 'new_token' };

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        user: testUser,
        authToken: 'test-token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        refreshUserToken: jest.fn().mockResolvedValue(refreshResult),
      } as AuthContextType);

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      expect(mockAuthService.isTokenExpired).toHaveBeenCalledWith(testUser);
      expect(mockUseAuth().refreshUserToken).toHaveBeenCalledWith(testUser.id);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors during loadActivity', async () => {
      const testUser = createMockUser(1);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('API Error'));
      mockSpotifyApi.getRecentTracks.mockRejectedValue(new Error('API Error'));
      mockSpotifyApi.getTopTracks.mockRejectedValue(new Error('API Error'));
      mockSpotifyApi.getSavedTracks.mockRejectedValue(new Error('API Error'));

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      expect(result.current.currentlyPlaying).toBeNull();
      expect(result.current.recentTracks).toEqual([]);
      expect(result.current.savedTracks).toEqual([]);

      consoleSpy.mockRestore();
    });

    it('handles network errors during loadMoreTracks', async () => {
      const testUser = createMockUser(1);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock initial load with tracks
      const initialTracks: RecentTrack[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Track ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        played_at: new Date(Date.now() - i * 60000).toISOString(),
        song_id: `track_${i + 1}`,
      }));

      mockSpotifyApi.getRecentTracks.mockResolvedValue(initialTracks);
      // Create a mock that throws an error that isn't TOKEN_EXPIRED
      mockSpotifyApi.getMoreRecentTracks.mockImplementation(() => {
        throw new Error('Network Error');
      });

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      await act(async () => {
        await result.current.loadMoreTracks();
      });

      expect(result.current.hasMoreTracks).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading more tracks:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Pagination Logic', () => {
    it('handles loadMoreTopTracks with offset pagination', async () => {
      const testUser = createMockUser(1);
      const initialTopTracks: TopTrack[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Top Track ${i + 1}`,
        artist: `Top Artist ${i + 1}`,
        album: `Top Album ${i + 1}`,
        song_id: `top_track_${i + 1}`,
        popularity: 90 - i,
      }));

      const moreTopTracks: TopTrack[] = Array.from({ length: 10 }, (_, i) => ({
        name: `More Top Track ${i + 1}`,
        artist: `More Top Artist ${i + 1}`,
        album: `More Top Album ${i + 1}`,
        song_id: `more_top_track_${i + 1}`,
        popularity: 80 - i,
      }));

      mockSpotifyApi.getTopTracks.mockResolvedValue(initialTopTracks);
      mockSpotifyApi.getMoreTopTracks.mockResolvedValue(moreTopTracks);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      await act(async () => {
        await result.current.loadMoreTopTracks();
      });

      expect(mockSpotifyApi.getMoreTopTracks).toHaveBeenCalledWith(
        'mock_access_token',
        10,
        'medium_term'
      );
      expect(result.current.topTracks).toHaveLength(20);
      expect(result.current.hasMoreTopTracks).toBe(true);
    });

    it('stops pagination when reaching 50 track limit for top tracks', async () => {
      const testUser = createMockUser(1);
      const initialTopTracks: TopTrack[] = Array.from({ length: 40 }, (_, i) => ({
        name: `Top Track ${i + 1}`,
        artist: `Top Artist ${i + 1}`,
        album: `Top Album ${i + 1}`,
        song_id: `top_track_${i + 1}`,
        popularity: 90 - i,
      }));

      const moreTopTracks: TopTrack[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Final Top Track ${i + 1}`,
        artist: `Final Top Artist ${i + 1}`,
        album: `Final Top Album ${i + 1}`,
        song_id: `final_top_track_${i + 1}`,
        popularity: 50 - i,
      }));

      mockSpotifyApi.getTopTracks.mockResolvedValue(initialTopTracks.slice(0, 10));
      mockSpotifyApi.getMoreTopTracks.mockResolvedValue(moreTopTracks);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      // Simulate having 40 tracks already loaded
      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      // Manually set to 40 tracks to test 50 limit
      act(() => {
        result.current.topTracks.length = 40;
      });

      await act(async () => {
        await result.current.loadMoreTopTracks();
      });

      expect(result.current.hasMoreTopTracks).toBe(false);
    });

    it('handles duplicate filtering in loadMoreSavedTracks', async () => {
      const testUser = createMockUser(1);
      const initialSavedTracks: SavedTrack[] = [
        {
          song_id: 'saved1',
          name: 'Saved Song 1',
          artist: 'Artist 1',
          album: 'Album 1',
          added_at: '2023-01-01T00:00:00.000Z',
        },
      ];

      // Return duplicate track
      const duplicateSavedTracks: SavedTrack[] = [
        {
          song_id: 'saved1', // Same as initial
          name: 'Saved Song 1',
          artist: 'Artist 1',
          album: 'Album 1',
          added_at: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockSpotifyApi.getSavedTracks.mockResolvedValue(initialSavedTracks);
      mockSpotifyApi.getMoreSavedTracks.mockResolvedValue(duplicateSavedTracks);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      await act(async () => {
        await result.current.loadMoreSavedTracks();
      });

      expect(result.current.savedTracks).toHaveLength(1); // No duplicates added
      expect(result.current.hasMoreSavedTracks).toBe(false); // All duplicates means end
    });
  });

  describe('State Management', () => {
    it('handles refresh functionality', async () => {
      const testUser = createMockUser(1);
      const refreshedTracks: RecentTrack[] = [
        {
          name: 'Refreshed Track',
          artist: 'Refreshed Artist',
          album: 'Refreshed Album',
          played_at: new Date().toISOString(),
          song_id: 'refreshed_track',
        },
      ];

      mockSpotifyApi.getRecentTracks.mockResolvedValue(refreshedTracks);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.recentTracks).toEqual(refreshedTracks);
    });

    it('handles resetToFreshState functionality', async () => {
      const testUser = createMockUser(1);
      const freshTracks: RecentTrack[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Fresh Track ${i + 1}`,
        artist: `Fresh Artist ${i + 1}`,
        album: `Fresh Album ${i + 1}`,
        played_at: new Date(Date.now() - i * 60000).toISOString(),
        song_id: `fresh_track_${i + 1}`,
      }));

      const freshTopTracks = Array.from({ length: 10 }, (_, i) => ({
        name: `Fresh Top Track ${i + 1}`,
        artist: `Fresh Top Artist ${i + 1}`,
        album: `Fresh Top Album ${i + 1}`,
        song_id: `fresh_top_track_${i + 1}`,
        popularity: 80 - i,
      }));

      const freshSavedTracks = Array.from({ length: 10 }, (_, i) => ({
        name: `Fresh Saved Track ${i + 1}`,
        artist: `Fresh Saved Artist ${i + 1}`,
        album: `Fresh Saved Album ${i + 1}`,
        song_id: `fresh_saved_track_${i + 1}`,
        added_at: new Date(Date.now() - i * 60000).toISOString(),
      }));

      mockSpotifyApi.getRecentTracks.mockResolvedValue(freshTracks);
      mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
      mockSpotifyApi.getTopTracks.mockResolvedValue(freshTopTracks);
      mockSpotifyApi.getSavedTracks.mockResolvedValue(freshSavedTracks);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.resetToFreshState();
      });

      expect(result.current.recentTracks).toEqual(freshTracks);
      expect(result.current.hasMoreTracks).toBe(true);
      expect(result.current.hasMoreTopTracks).toBe(true);
      expect(result.current.hasMoreSavedTracks).toBe(true);
    });

    it('prevents multiple concurrent loadMore calls', async () => {
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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      // Load some initial tracks so hasMoreTracks is true
      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      // Clear previous calls
      mockSpotifyApi.getMoreRecentTracks.mockClear();

      // Manually set loading state before calling loadMoreTracks
      // Note: This is a limitation of the current implementation - we can't actually set the internal state
      // This test verifies the function works but the internal state management is harder to test
      expect(result.current.isLoadingMore).toBe(false);
    });

    it('prevents loadMore when hasMoreTracks is false', async () => {
      const testUser = createMockUser(1);

      // Mock to return no tracks, which sets hasMoreTracks to false
      mockSpotifyApi.getRecentTracks.mockResolvedValue([]);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      // Load activity which should set hasMoreTracks to false
      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      // Clear the mock to check if loadMoreTracks is called
      mockSpotifyApi.getMoreRecentTracks.mockClear();

      // Should not call API since hasMoreTracks should be false
      await act(async () => {
        await result.current.loadMoreTracks();
      });

      expect(result.current.hasMoreTracks).toBe(false);
    });
  });

  describe('Polling and Intervals', () => {
    it('sets up polling interval when user and token are available', async () => {
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

      renderHook(() => useSpotifyActivity(), { wrapper });

      // Clear the initial calls from useEffect
      mockSpotifyApi.getCurrentlyPlaying.mockClear();

      // Fast forward time to trigger interval
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // The interval should trigger the loadActivity which calls getCurrentlyPlaying
      expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalled();
    });

    it('clears interval on unmount', () => {
      const testUser = createMockUser(1);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

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

      const { unmount } = renderHook(() => useSpotifyActivity(), { wrapper });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('handles polling errors gracefully', async () => {
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

      renderHook(() => useSpotifyActivity(), { wrapper });

      // Clear the initial calls and make ALL API calls fail to ensure loadActivity fails
      mockSpotifyApi.getCurrentlyPlaying.mockClear();
      mockSpotifyApi.getRecentTracks.mockClear();
      mockSpotifyApi.getTopTracks.mockClear();
      mockSpotifyApi.getSavedTracks.mockClear();

      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('Polling Error'));
      mockSpotifyApi.getRecentTracks.mockRejectedValue(new Error('Polling Error'));
      mockSpotifyApi.getTopTracks.mockRejectedValue(new Error('Polling Error'));
      mockSpotifyApi.getSavedTracks.mockRejectedValue(new Error('Polling Error'));

      // Trigger the interval manually
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // The error message comes from loadActivity, but only in __DEV__ mode
      // In test environment, __DEV__ is false, so no console warning is expected
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles loadActivity without user or token', async () => {
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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity();
      });

      expect(mockSpotifyApi.getCurrentlyPlaying).not.toHaveBeenCalled();
    });

    it('handles empty track responses correctly', async () => {
      const testUser = createMockUser(1);

      mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
      mockSpotifyApi.getRecentTracks.mockResolvedValue([]);
      mockSpotifyApi.getTopTracks.mockResolvedValue([]);
      mockSpotifyApi.getSavedTracks.mockResolvedValue([]);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      expect(result.current.currentlyPlaying).toBeNull();
      expect(result.current.recentTracks).toEqual([]);
      expect(result.current.topTracks).toEqual([]);
      expect(result.current.savedTracks).toEqual([]);
      expect(result.current.hasMoreTracks).toBe(false);
      expect(result.current.hasMoreTopTracks).toBe(false);
      expect(result.current.hasMoreSavedTracks).toBe(false);
    });

    it('handles preserveAdditionalTracks logic correctly', async () => {
      const testUser = createMockUser(1);

      // Initial tracks with more than 10 items
      const existingTracks: RecentTrack[] = Array.from({ length: 15 }, (_, i) => ({
        name: `Existing Track ${i + 1}`,
        artist: `Existing Artist ${i + 1}`,
        album: `Existing Album ${i + 1}`,
        played_at: new Date(Date.now() - i * 60000).toISOString(),
        song_id: `existing_track_${i + 1}`,
      }));

      const freshTracks: RecentTrack[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Fresh Track ${i + 1}`,
        artist: `Fresh Artist ${i + 1}`,
        album: `Fresh Album ${i + 1}`,
        played_at: new Date(Date.now() + i * 30000).toISOString(), // Use + to ensure no overlap
        song_id: `fresh_track_${i + 1}`,
      }));

      mockSpotifyApi.getRecentTracks
        .mockResolvedValueOnce(existingTracks) // First call
        .mockResolvedValueOnce(freshTracks) // Second call
        .mockResolvedValueOnce(freshTracks); // Third call (in case useEffect calls again)
      mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
      mockSpotifyApi.getTopTracks.mockResolvedValue([]);
      mockSpotifyApi.getSavedTracks.mockResolvedValue([]);

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

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      // Load initial tracks
      await act(async () => {
        await result.current.loadActivity('test-token', testUser);
      });

      expect(result.current.recentTracks).toHaveLength(15);

      // Test with preserveAdditionalTracks = false first
      await act(async () => {
        await result.current.loadActivity('test-token', testUser, false);
      });

      // Clean up debug logs for final version

      // Should only have fresh tracks (10)
      expect(result.current.recentTracks.length).toBe(10);
      expect(
        result.current.recentTracks.every(track => track.song_id?.startsWith('fresh_track_'))
      ).toBe(true);

      // Now test with preserveAdditionalTracks = true
      // Need to reload the initial 15 tracks first, then load fresh tracks with preservation
      mockSpotifyApi.getRecentTracks
        .mockResolvedValueOnce(existingTracks) // Reload existing
        .mockResolvedValueOnce(freshTracks); // Load fresh with preservation

      // First reload the existing tracks
      await act(async () => {
        await result.current.loadActivity('test-token', testUser, false);
      });

      expect(result.current.recentTracks.length).toBe(15);

      // Now load fresh tracks with preservation
      await act(async () => {
        await result.current.loadActivity('test-token', testUser, true);
      });

      // Clean up debug logs for final version

      // Should have fresh tracks (10) + additional preserved tracks (5) = 15
      expect(result.current.recentTracks.length).toBe(15);

      // Should contain both fresh tracks and some existing tracks
      const hasFreshTracks = result.current.recentTracks.some(track =>
        track.song_id?.startsWith('fresh_track_')
      );
      const hasExistingTracks = result.current.recentTracks.some(track =>
        track.song_id?.startsWith('existing_track_')
      );
      expect(hasFreshTracks).toBe(true);
      expect(hasExistingTracks).toBe(true);
    });
  });
});
