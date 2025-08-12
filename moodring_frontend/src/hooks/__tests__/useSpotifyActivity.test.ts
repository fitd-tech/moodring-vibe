import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSpotifyActivity } from '../useSpotifyActivity';
import { spotifyApi } from '../../services/spotifyApi';
import { authService } from '../../services/authService';
import { useAuth, AuthContextType } from '../../contexts/AuthContext';
import { SavedTrack, BackendUser } from '../../types';

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
});