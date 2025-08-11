import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSpotifyActivity } from '../useSpotifyActivity';
import { spotifyApi } from '../../services/spotifyApi';
import { AuthProvider } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

// Mock the spotifyApi module
jest.mock('../../services/spotifyApi');
const mockSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;

// Mock the authService module
jest.mock('../../services/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock useAuth hook
const mockUseAuth: {
  user: any;
  authToken: any;
  refreshUserToken: jest.MockedFunction<any>;
} = {
  user: null,
  authToken: null,
  refreshUserToken: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useSpotifyActivity', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthProvider, { children }, children);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');

    // Reset useAuth mock
    mockUseAuth.user = null;
    mockUseAuth.authToken = null;
    mockUseAuth.refreshUserToken.mockResolvedValue(null);

    // Set default mock return values
    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);
    mockSpotifyApi.getTopTracks.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    expect(result.current.currentlyPlaying).toBeNull();
    expect(result.current.recentTracks).toEqual([]);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('loads activity successfully', async () => {
    const mockCurrentlyPlaying = {
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      album_image_url: 'https://example.com/image.jpg',
      is_playing: true,
    };

    const mockRecentTracks = [
      {
        name: 'Recent Song',
        artist: 'Recent Artist',
        album: 'Recent Album',
        album_image_url: 'https://example.com/recent.jpg',
        played_at: '2025-08-08T01:00:00Z',
      },
    ];

    const mockTopTracks = [
      {
        song_id: 'top_song_1',
        name: 'Top Song 1',
        artist: 'Top Artist 1',
        album: 'Top Album 1',
        album_image_url: 'https://example.com/top1.jpg',
        popularity: 80,
      },
    ];

    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(mockCurrentlyPlaying);
    mockSpotifyApi.getRecentTracks.mockResolvedValue(mockRecentTracks);
    mockSpotifyApi.getTopTracks.mockResolvedValue(mockTopTracks);

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.loadActivity('test-token', mockUser);
    });

    expect(result.current.currentlyPlaying).toEqual(mockCurrentlyPlaying);
    expect(result.current.recentTracks).toEqual(mockRecentTracks);
    expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalledWith('access-token');
    expect(mockSpotifyApi.getRecentTracks).toHaveBeenCalledWith('access-token', 10);
    expect(mockSpotifyApi.getTopTracks).toHaveBeenCalledWith('access-token', 'medium_term', 10);
  });

  it('handles getCurrentlyPlaying API error', async () => {
    mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('API Error'));
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);
    mockSpotifyApi.getTopTracks.mockResolvedValue([]);

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.loadActivity('access-token', mockUser);
    });

    expect(result.current.currentlyPlaying).toBeNull();
  });

  it('handles getRecentTracks API error', async () => {
    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
    mockSpotifyApi.getRecentTracks.mockRejectedValue(new Error('API Error'));
    mockSpotifyApi.getTopTracks.mockResolvedValue([]);

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.loadActivity('access-token', mockUser);
    });

    expect(result.current.recentTracks).toEqual([]);
  });

  it('handles refresh functionality', async () => {
    const mockCurrentlyPlaying = {
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      album_image_url: 'https://example.com/image.jpg',
      is_playing: true,
    };

    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(mockCurrentlyPlaying);
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);
    mockSpotifyApi.getTopTracks.mockResolvedValue([]);

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it('sets up polling interval when token is provided', () => {
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);

    // Set up useAuth to return user and token
    mockUseAuth.user = mockUser;
    mockUseAuth.authToken = 'test-token';

    renderHook(() => useSpotifyActivity(), { wrapper });

    expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
  });

  it('cleans up polling interval on unmount', () => {
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);

    // Set up useAuth to return user and token
    mockUseAuth.user = mockUser;
    mockUseAuth.authToken = 'test-token';

    const { unmount } = renderHook(() => useSpotifyActivity(), { wrapper });

    unmount();

    expect(global.clearInterval).toHaveBeenCalled();
  });

  it('handles polling interval execution', async () => {
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(null);
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);

    // Set up useAuth to return user and token
    mockUseAuth.user = mockUser;
    mockUseAuth.authToken = 'test-token';

    renderHook(() => useSpotifyActivity(), { wrapper });

    // Fast-forward time to trigger interval
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve(); // Allow async operations to complete
    });

    expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalledTimes(2);
  });

  it('handles interval error gracefully', async () => {
    const mockUser = {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      profile_image_url: null,
      spotify_access_token: 'access-token',
      spotify_refresh_token: 'refresh-token',
      token_expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // First call succeeds, second call (from interval) fails
    mockSpotifyApi.getCurrentlyPlaying
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('Interval Error'));
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);

    // Set up useAuth to return user and token
    mockUseAuth.user = mockUser;
    mockUseAuth.authToken = 'access-token' as typeof mockUseAuth.authToken;

    renderHook(() => useSpotifyActivity(), { wrapper });

    // Fast-forward time to trigger interval
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve(); // Allow async operations to complete
    });

    // Error is handled gracefully, no need to check console logs
    expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalledTimes(2);
  });

  it('does not set up polling when token is not provided', () => {
    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    act(() => {
      result.current.loadActivity('', null);
    });

    expect(global.setInterval).not.toHaveBeenCalled();
  });

  describe('loadMoreTracks', () => {
    beforeEach(() => {
      // Set up mock to include getMoreRecentTracks
      mockSpotifyApi.getMoreRecentTracks = jest.fn().mockResolvedValue([]);
    });

    it('should return new state properties for loading more tracks', () => {
      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.hasMoreTracks).toBe(true);
      expect(typeof result.current.loadMoreTracks).toBe('function');
    });

    it('should handle loadMoreTracks function existence', async () => {
      mockUseAuth.user = { id: 1, spotify_access_token: 'test_token' } as typeof mockUseAuth.user;
      mockUseAuth.authToken = 'test_token' as typeof mockUseAuth.authToken;

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      expect(result.current.loadMoreTracks).toBeDefined();
      expect(typeof result.current.loadMoreTracks).toBe('function');
    });
  });

  describe('resetToFreshState', () => {
    it('should return resetToFreshState function', () => {
      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      expect(result.current.resetToFreshState).toBeDefined();
      expect(typeof result.current.resetToFreshState).toBe('function');
    });

    it('should reset all state to initial values and reload activity', async () => {
      const mockCurrentlyPlaying = {
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        album_image_url: 'https://example.com/image.jpg',
        is_playing: true,
      };

      const mockRecentTracks = [
        {
          name: 'Recent Song',
          artist: 'Recent Artist',
          album: 'Recent Album',
          album_image_url: 'https://example.com/recent.jpg',
          played_at: '2025-08-08T01:00:00Z',
        },
      ];

      const mockTopTracks = [
        {
          song_id: 'top_song_1',
          name: 'Top Song 1',
          artist: 'Top Artist 1',
          album: 'Top Album 1',
          album_image_url: 'https://example.com/top1.jpg',
          popularity: 80,
        },
      ];

      mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(mockCurrentlyPlaying);
      mockSpotifyApi.getRecentTracks.mockResolvedValue(mockRecentTracks);
      mockSpotifyApi.getTopTracks.mockResolvedValue(mockTopTracks);

      const mockUser = {
        id: 1,
        spotify_id: 'test_user',
        email: 'test@example.com',
        display_name: 'Test User',
        profile_image_url: null,
        spotify_access_token: 'access-token',
        spotify_refresh_token: 'refresh-token',
        token_expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockUseAuth.user = mockUser;
      mockUseAuth.authToken = 'test-token';

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.resetToFreshState();
      });

      expect(result.current.currentlyPlaying).toEqual(mockCurrentlyPlaying);
      expect(result.current.recentTracks).toEqual(mockRecentTracks);
      // hasMoreTracks should be false since we only loaded 1 track (less than 10)
      expect(result.current.hasMoreTracks).toBe(false);
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should set hasMoreTracks to true when loading exactly 10 tracks', async () => {
      const mockCurrentlyPlaying = {
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        album_image_url: 'https://example.com/image.jpg',
        is_playing: true,
      };

      // Create exactly 10 mock tracks
      const mockTenTracks = Array.from({ length: 10 }, (_, i) => ({
        name: `Recent Song ${i + 1}`,
        artist: `Recent Artist ${i + 1}`,
        album: `Recent Album ${i + 1}`,
        album_image_url: `https://example.com/recent${i + 1}.jpg`,
        played_at: `2025-08-08T0${i}:00:00Z`,
      }));

      const mockTopTracks = Array.from({ length: 10 }, (_, i) => ({
        song_id: `top_song_${i + 1}`,
        name: `Top Song ${i + 1}`,
        artist: `Top Artist ${i + 1}`,
        album: `Top Album ${i + 1}`,
        album_image_url: `https://example.com/top${i + 1}.jpg`,
        popularity: 80 - i,
      }));

      mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(mockCurrentlyPlaying);
      mockSpotifyApi.getRecentTracks.mockResolvedValue(mockTenTracks);
      mockSpotifyApi.getTopTracks.mockResolvedValue(mockTopTracks);

      const mockUser = {
        id: 1,
        spotify_id: 'test_user',
        email: 'test@example.com',
        display_name: 'Test User',
        profile_image_url: null,
        spotify_access_token: 'access-token',
        spotify_refresh_token: 'refresh-token',
        token_expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockUseAuth.user = mockUser;
      mockUseAuth.authToken = 'test-token';

      const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

      await act(async () => {
        await result.current.resetToFreshState();
      });

      expect(result.current.recentTracks).toHaveLength(10);
      expect(result.current.hasMoreTracks).toBe(true);
    });
  });
});
