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

describe('useSpotifyActivity', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(AuthProvider, {}, children)
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');
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

    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(mockCurrentlyPlaying);
    mockSpotifyApi.getRecentTracks.mockResolvedValue(mockRecentTracks);

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
    expect(mockSpotifyApi.getRecentTracks).toHaveBeenCalledWith('access-token');
  });

  it('handles getCurrentlyPlaying API error', async () => {
    mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('API Error'));
    mockSpotifyApi.getRecentTracks.mockResolvedValue([]);

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

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    act(() => {
      result.current.loadActivity('test-token', mockUser);
    });

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

    const { result, unmount } = renderHook(() => useSpotifyActivity(), { wrapper });

    act(() => {
      result.current.loadActivity('test-token', mockUser);
    });

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

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    await act(async () => {
      await result.current.loadActivity('test-token', mockUser);
    });

    // Fast-forward time to trigger interval
    act(() => {
      jest.advanceTimersByTime(30000);
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

    const { result } = renderHook(() => useSpotifyActivity(), { wrapper });

    await act(async () => {
      await result.current.loadActivity('access-token', mockUser);
    });

    // Fast-forward time to trigger interval
    await act(async () => {
      jest.advanceTimersByTime(30000);
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
});