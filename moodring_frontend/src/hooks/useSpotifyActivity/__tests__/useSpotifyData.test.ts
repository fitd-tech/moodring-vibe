import { renderHook, act } from '@testing-library/react-native';
import { useSpotifyData } from '../useSpotifyData';
import { spotifyApi } from '../../../services/spotifyApi';
import { BackendUser, CurrentlyPlaying, RecentTrack, TopTrack, SavedTrack, SavedPlaylist, SavedAlbum } from '../../../types';

// Mock the modules
jest.mock('../../../services/spotifyApi');
jest.mock('../useSpotifyTokenManagement');

const mockSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;

// Mock useSpotifyTokenManagement
const mockUseSpotifyTokenManagement = jest.fn();
jest.mock('../useSpotifyTokenManagement', () => ({
  useSpotifyTokenManagement: () => mockUseSpotifyTokenManagement(),
}));

// Define mock user type with fixed timestamp to avoid timing issues
const FIXED_TIMESTAMP = '2025-08-13T05:29:58.479Z';

const createMockUser = (id: number): BackendUser => ({
  id,
  spotify_id: `spotify_${id}`,
  email: `user${id}@example.com`,
  display_name: `User ${id}`,
  spotify_access_token: 'mock_access_token',
  spotify_refresh_token: 'mock_refresh_token',
  token_expires_at: FIXED_TIMESTAMP,
  profile_image_url: null,
  created_at: FIXED_TIMESTAMP,
  updated_at: FIXED_TIMESTAMP,
});

const mockCurrentlyPlaying: CurrentlyPlaying = {
  name: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  album_image_url: 'https://example.com/album.jpg',
  is_playing: true,
  progress_ms: 60000,
  duration_ms: 240000,
};

const mockRecentTracks: RecentTrack[] = [
  {
    name: 'Recent Track 1',
    artist: 'Recent Artist 1',
    album: 'Recent Album 1',
    album_image_url: 'https://example.com/recent1.jpg',
    played_at: '2023-01-01T12:00:00Z',
  },
  {
    name: 'Recent Track 2',
    artist: 'Recent Artist 2',
    album: 'Recent Album 2',
    album_image_url: 'https://example.com/recent2.jpg',
    played_at: '2023-01-01T11:00:00Z',
  },
];

const mockTopTracks: TopTrack[] = [
  {
    song_id: 'top1',
    name: 'Top Track 1',
    artist: 'Top Artist 1',
    album: 'Top Album 1',
    album_image_url: 'https://example.com/top1.jpg',
    popularity: 95,
  },
  {
    song_id: 'top2',
    name: 'Top Track 2',
    artist: 'Top Artist 2',
    album: 'Top Album 2',
    album_image_url: 'https://example.com/top2.jpg',
    popularity: 90,
  },
];

const mockSavedTracks: SavedTrack[] = [
  {
    song_id: 'saved1',
    name: 'Saved Track 1',
    artist: 'Saved Artist 1',
    album: 'Saved Album 1',
    album_image_url: 'https://example.com/saved1.jpg',
    added_at: '2023-01-01T12:00:00Z',
  },
  {
    song_id: 'saved2',
    name: 'Saved Track 2',
    artist: 'Saved Artist 2',
    album: 'Saved Album 2',
    album_image_url: 'https://example.com/saved2.jpg',
    added_at: '2023-01-01T11:00:00Z',
  },
];

const mockSavedPlaylists: SavedPlaylist[] = [
  {
    playlist_id: 'playlist1',
    name: 'Saved Playlist 1',
    description: 'Description for playlist 1',
    image_url: 'https://example.com/playlist1.jpg',
    track_count: 25,
    created_at: '2023-01-01T12:00:00Z',
  },
  {
    playlist_id: 'playlist2',
    name: 'Saved Playlist 2',
    description: 'Description for playlist 2',
    image_url: 'https://example.com/playlist2.jpg',
    track_count: 30,
    created_at: '2023-01-01T11:00:00Z',
  },
];

const mockSavedAlbums: SavedAlbum[] = [
  {
    album_id: 'album1',
    name: 'Saved Album 1',
    artist: 'Album Artist 1',
    image_url: 'https://example.com/album1.jpg',
    release_date: '2023-01-01',
    track_count: 12,
  },
  {
    album_id: 'album2',
    name: 'Saved Album 2',
    artist: 'Album Artist 2',
    image_url: 'https://example.com/album2.jpg',
    release_date: '2022-12-01',
    track_count: 15,
  },
];

describe('useSpotifyData', () => {
  const mockRefreshUserToken = jest.fn();
  const mockGetValidToken = jest.fn();
  const mockHandleTokenExpiredError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock return values
    mockUseSpotifyTokenManagement.mockReturnValue({
      getValidToken: mockGetValidToken,
      handleTokenExpiredError: mockHandleTokenExpiredError,
    });

    mockGetValidToken.mockResolvedValue({
      token: 'valid_token',
      user: createMockUser(1),
    });

    mockHandleTokenExpiredError.mockImplementation((error, user, apiCall) => {
      if (error.message === 'TOKEN_EXPIRED') {
        return apiCall('refreshed_token');
      }
      return null;
    });

    // Set default mock return values
    mockSpotifyApi.getCurrentlyPlaying.mockResolvedValue(mockCurrentlyPlaying);
    mockSpotifyApi.getRecentTracks.mockResolvedValue(mockRecentTracks);
    mockSpotifyApi.getTopTracks.mockResolvedValue(mockTopTracks);
    mockSpotifyApi.getSavedTracks.mockResolvedValue(mockSavedTracks);
    mockSpotifyApi.getSavedPlaylists.mockResolvedValue(mockSavedPlaylists);
    mockSpotifyApi.getSavedAlbums.mockResolvedValue(mockSavedAlbums);
    mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read', 'playlist-read-private']);
  });

  describe('fetchCurrentlyPlaying', () => {
    it('successfully fetches currently playing data', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const currentlyPlaying = await act(async () => {
        return await result.current.fetchCurrentlyPlaying('test_token', testUser);
      });

      expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalledWith('test_token');
      expect(currentlyPlaying).toEqual(mockCurrentlyPlaying);
    });

    it('handles TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getCurrentlyPlaying
        .mockRejectedValueOnce(tokenExpiredError)
        .mockResolvedValueOnce(mockCurrentlyPlaying);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const currentlyPlaying = await act(async () => {
        return await result.current.fetchCurrentlyPlaying('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        testUser,
        expect.any(Function)
      );
      expect(currentlyPlaying).toEqual(mockCurrentlyPlaying);
    });

    it('handles other errors', async () => {
      const testUser = createMockUser(1);
      const networkError = new Error('Network Error');

      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(networkError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const currentlyPlaying = await act(async () => {
        return await result.current.fetchCurrentlyPlaying('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        networkError,
        testUser,
        expect.any(Function)
      );
      expect(currentlyPlaying).toBeNull();
    });
  });

  describe('fetchRecentTracks', () => {
    it('successfully fetches recent tracks with default limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const recentTracks = await act(async () => {
        return await result.current.fetchRecentTracks('test_token', testUser);
      });

      expect(mockSpotifyApi.getRecentTracks).toHaveBeenCalledWith('test_token', 10);
      expect(recentTracks).toEqual(mockRecentTracks);
    });

    it('successfully fetches recent tracks with custom limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const recentTracks = await act(async () => {
        return await result.current.fetchRecentTracks('test_token', testUser, 20);
      });

      expect(mockSpotifyApi.getRecentTracks).toHaveBeenCalledWith('test_token', 20);
      expect(recentTracks).toEqual(mockRecentTracks);
    });

    it('handles TOKEN_EXPIRED error and returns empty array on failure', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getRecentTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const recentTracks = await act(async () => {
        return await result.current.fetchRecentTracks('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        testUser,
        expect.any(Function)
      );
      expect(recentTracks).toEqual([]);
    });

    it('successfully recovers from TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getRecentTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(mockRecentTracks);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const recentTracks = await act(async () => {
        return await result.current.fetchRecentTracks('test_token', testUser);
      });

      expect(recentTracks).toEqual(mockRecentTracks);
    });
  });

  describe('fetchTopTracks', () => {
    it('successfully fetches top tracks with default parameters', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const topTracks = await act(async () => {
        return await result.current.fetchTopTracks('test_token', testUser);
      });

      expect(mockSpotifyApi.getTopTracks).toHaveBeenCalledWith('test_token', 'medium_term', 10);
      expect(topTracks).toEqual(mockTopTracks);
    });

    it('successfully fetches top tracks with custom parameters', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const topTracks = await act(async () => {
        return await result.current.fetchTopTracks('test_token', testUser, 'short_term', 20);
      });

      expect(mockSpotifyApi.getTopTracks).toHaveBeenCalledWith('test_token', 'short_term', 20);
      expect(topTracks).toEqual(mockTopTracks);
    });

    it('handles TOKEN_EXPIRED error and returns empty array on failure', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getTopTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const topTracks = await act(async () => {
        return await result.current.fetchTopTracks('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        testUser,
        expect.any(Function)
      );
      expect(topTracks).toEqual([]);
    });

    it('successfully recovers from TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getTopTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(mockTopTracks);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const topTracks = await act(async () => {
        return await result.current.fetchTopTracks('test_token', testUser, 'long_term', 15);
      });

      expect(topTracks).toEqual(mockTopTracks);
    });
  });

  describe('fetchSavedTracks', () => {
    it('successfully fetches saved tracks with default limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedTracks).toHaveBeenCalledWith('test_token', 10);
      expect(savedTracks).toEqual(mockSavedTracks);
    });

    it('successfully fetches saved tracks with custom limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser, 25);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedTracks).toHaveBeenCalledWith('test_token', 25);
      expect(savedTracks).toEqual(mockSavedTracks);
    });

    it('handles TOKEN_EXPIRED error and returns empty array on failure', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      // Make verifyTokenScopes succeed but getSavedTracks fail
      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
      mockSpotifyApi.getSavedTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        testUser,
        expect.any(Function)
      );
      expect(savedTracks).toEqual([]);
    });

    it('returns empty array when token missing user-library-read scope', async () => {
      const testUser = createMockUser(1);
      
      // Mock token without user-library-read scope
      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-read-private', 'user-read-email']);
      
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedTracks).not.toHaveBeenCalled();
      expect(savedTracks).toEqual([]);
    });

    it('successfully recovers from TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      // Make verifyTokenScopes succeed but getSavedTracks fail
      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
      mockSpotifyApi.getSavedTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(mockSavedTracks);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser);
      });

      expect(savedTracks).toEqual(mockSavedTracks);
    });

    it('handles PERMISSION_DENIED error for saved tracks', async () => {
      const testUser = createMockUser(1);
      const permissionError = new Error('PERMISSION_DENIED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
      mockSpotifyApi.getSavedTracks.mockRejectedValue(permissionError);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser);
      });

      // Should return empty array for permission denied errors
      expect(savedTracks).toEqual([]);
      expect(mockHandleTokenExpiredError).not.toHaveBeenCalled();
    });

    it('handles scope verification error for saved tracks', async () => {
      const testUser = createMockUser(1);
      const scopeError = new Error('Scope verification failed');

      mockSpotifyApi.verifyTokenScopes.mockRejectedValue(scopeError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedTracks = await act(async () => {
        return await result.current.fetchSavedTracks('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        scopeError,
        testUser,
        expect.any(Function)
      );
      expect(savedTracks).toEqual([]);
    });
  });

  describe('fetchSavedPlaylists', () => {
    it('successfully fetches saved playlists with default limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedPlaylists).toHaveBeenCalledWith('test_token', 20);
      expect(savedPlaylists).toEqual(mockSavedPlaylists);
    });

    it('successfully fetches saved playlists with custom limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser, 50);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedPlaylists).toHaveBeenCalledWith('test_token', 50);
      expect(savedPlaylists).toEqual(mockSavedPlaylists);
    });

    it('returns empty array when token missing playlist-read-private scope', async () => {
      const testUser = createMockUser(1);
      
      // Mock token without playlist-read-private scope
      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-read-private', 'user-read-email']);
      
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedPlaylists).not.toHaveBeenCalled();
      expect(savedPlaylists).toEqual([]);
    });

    it('handles TOKEN_EXPIRED error and returns empty array on failure', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['playlist-read-private']);
      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        testUser,
        expect.any(Function)
      );
      expect(savedPlaylists).toEqual([]);
    });

    it('successfully recovers from TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['playlist-read-private']);
      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(mockSavedPlaylists);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser);
      });

      expect(savedPlaylists).toEqual(mockSavedPlaylists);
    });

    it('handles PERMISSION_DENIED error for saved playlists', async () => {
      const testUser = createMockUser(1);
      const permissionError = new Error('PERMISSION_DENIED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['playlist-read-private']);
      mockSpotifyApi.getSavedPlaylists.mockRejectedValue(permissionError);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser);
      });

      // Should return empty array for permission denied errors
      expect(savedPlaylists).toEqual([]);
      expect(mockHandleTokenExpiredError).not.toHaveBeenCalled();
    });

    it('handles scope verification error for saved playlists', async () => {
      const testUser = createMockUser(1);
      const scopeError = new Error('Scope verification failed');

      mockSpotifyApi.verifyTokenScopes.mockRejectedValue(scopeError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedPlaylists = await act(async () => {
        return await result.current.fetchSavedPlaylists('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        scopeError,
        testUser,
        expect.any(Function)
      );
      expect(savedPlaylists).toEqual([]);
    });
  });

  describe('fetchSavedAlbums', () => {
    it('successfully fetches saved albums with default limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedAlbums).toHaveBeenCalledWith('test_token', 20);
      expect(savedAlbums).toEqual(mockSavedAlbums);
    });

    it('successfully fetches saved albums with custom limit', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser, 50);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedAlbums).toHaveBeenCalledWith('test_token', 50);
      expect(savedAlbums).toEqual(mockSavedAlbums);
    });

    it('returns empty array when token missing user-library-read scope', async () => {
      const testUser = createMockUser(1);
      
      // Mock token without user-library-read scope
      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-read-private', 'user-read-email']);
      
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser);
      });

      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedAlbums).not.toHaveBeenCalled();
      expect(savedAlbums).toEqual([]);
    });

    it('handles TOKEN_EXPIRED error and returns empty array on failure', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
      mockSpotifyApi.getSavedAlbums.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        testUser,
        expect.any(Function)
      );
      expect(savedAlbums).toEqual([]);
    });

    it('successfully recovers from TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
      mockSpotifyApi.getSavedAlbums.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(mockSavedAlbums);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser);
      });

      expect(savedAlbums).toEqual(mockSavedAlbums);
    });

    it('handles PERMISSION_DENIED error for saved albums', async () => {
      const testUser = createMockUser(1);
      const permissionError = new Error('PERMISSION_DENIED');

      mockSpotifyApi.verifyTokenScopes.mockResolvedValue(['user-library-read']);
      mockSpotifyApi.getSavedAlbums.mockRejectedValue(permissionError);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser);
      });

      // Should return empty array for permission denied errors
      expect(savedAlbums).toEqual([]);
      expect(mockHandleTokenExpiredError).not.toHaveBeenCalled();
    });

    it('handles scope verification error for saved albums', async () => {
      const testUser = createMockUser(1);
      const scopeError = new Error('Scope verification failed');

      mockSpotifyApi.verifyTokenScopes.mockRejectedValue(scopeError);
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const savedAlbums = await act(async () => {
        return await result.current.fetchSavedAlbums('test_token', testUser);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        scopeError,
        testUser,
        expect.any(Function)
      );
      expect(savedAlbums).toEqual([]);
    });
  });

  describe('fetchAllInitialData', () => {
    it('successfully fetches all initial data', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const allData = await act(async () => {
        return await result.current.fetchAllInitialData('test_token', testUser);
      });

      expect(mockSpotifyApi.getCurrentlyPlaying).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getRecentTracks).toHaveBeenCalledWith('test_token', 10);
      expect(mockSpotifyApi.getTopTracks).toHaveBeenCalledWith('test_token', 'medium_term', 10);
      expect(mockSpotifyApi.verifyTokenScopes).toHaveBeenCalledWith('test_token');
      expect(mockSpotifyApi.getSavedTracks).toHaveBeenCalledWith('test_token', 10);
      expect(mockSpotifyApi.getSavedPlaylists).toHaveBeenCalledWith('test_token', 20);
      expect(mockSpotifyApi.getSavedAlbums).toHaveBeenCalledWith('test_token', 20);

      expect(allData).toEqual({
        currentlyPlayingData: mockCurrentlyPlaying,
        recentTracksData: mockRecentTracks,
        topTracksData: mockTopTracks,
        savedTracksData: mockSavedTracks,
        savedPlaylistsData: mockSavedPlaylists,
        savedAlbumsData: mockSavedAlbums,
      });
    });

    it('handles mixed success and failure scenarios', async () => {
      const testUser = createMockUser(1);

      // Mock some API calls to fail
      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('API_ERROR'));
      mockHandleTokenExpiredError.mockImplementation(() => {
        // Return null for all failed calls in this test
        return Promise.resolve(null);
      });

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const allData = await act(async () => {
        return await result.current.fetchAllInitialData('test_token', testUser);
      });

      expect(allData.currentlyPlayingData).toBeNull();
      expect(allData.recentTracksData).toEqual(mockRecentTracks);
      expect(allData.topTracksData).toEqual(mockTopTracks);
      expect(allData.savedTracksData).toEqual(mockSavedTracks);
      expect(allData.savedPlaylistsData).toEqual(mockSavedPlaylists);
      expect(allData.savedAlbumsData).toEqual(mockSavedAlbums);
    });

    it('executes all API calls in parallel', async () => {
      const testUser = createMockUser(1);

      // Track call order
      const callOrder: string[] = [];

      mockSpotifyApi.getCurrentlyPlaying.mockImplementation(async () => {
        callOrder.push('currently-playing-start');
        await new Promise(resolve => setTimeout(resolve, 10));
        callOrder.push('currently-playing-end');
        return mockCurrentlyPlaying;
      });

      mockSpotifyApi.getRecentTracks.mockImplementation(async () => {
        callOrder.push('recent-tracks-start');
        await new Promise(resolve => setTimeout(resolve, 5));
        callOrder.push('recent-tracks-end');
        return mockRecentTracks;
      });

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.fetchAllInitialData('test_token', testUser);
      });

      // All API calls should start before any end
      expect(callOrder.indexOf('currently-playing-start')).toBeLessThan(
        callOrder.indexOf('currently-playing-end')
      );
      expect(callOrder.indexOf('recent-tracks-start')).toBeLessThan(
        callOrder.indexOf('recent-tracks-end')
      );

      // Recent tracks should start before currently playing ends (proving parallelism)
      expect(callOrder.indexOf('recent-tracks-start')).toBeLessThan(
        callOrder.indexOf('currently-playing-end')
      );
    });
  });

  describe('getValidToken integration', () => {
    it('uses getValidToken for consistent token management', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      // The hook should expose getValidToken
      expect(result.current.getValidToken).toBeDefined();
      expect(typeof result.current.getValidToken).toBe('function');

      // Test that it's accessible
      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(mockGetValidToken).toHaveBeenCalled();
      expect(tokenResult).toEqual({
        token: 'valid_token',
        user: createMockUser(1),
      });
    });
  });

  describe('Error handling edge cases', () => {
    it('handles null responses from token management', async () => {
      const testUser = createMockUser(1);

      mockSpotifyApi.getCurrentlyPlaying.mockRejectedValue(new Error('TOKEN_EXPIRED'));
      mockHandleTokenExpiredError.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      const currentlyPlaying = await act(async () => {
        return await result.current.fetchCurrentlyPlaying('test_token', testUser);
      });

      expect(currentlyPlaying).toBeNull();
    });

    it('propagates non-TOKEN_EXPIRED errors', async () => {
      const testUser = createMockUser(1);
      const networkError = new Error('Network failure');

      mockSpotifyApi.getRecentTracks.mockRejectedValue(networkError);
      mockHandleTokenExpiredError.mockRejectedValue(networkError);

      const { result } = renderHook(() =>
        useSpotifyData(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await expect(result.current.fetchRecentTracks('test_token', testUser)).rejects.toThrow(
          'Network failure'
        );
      });
    });
  });
});
