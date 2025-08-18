import { renderHook, act } from '@testing-library/react-native';
import { useSpotifyPagination } from '../useSpotifyPagination';
import { spotifyApi } from '../../../services/spotifyApi';
import {
  BackendUser,
  RecentTrack,
  TopTrack,
  SavedTrack,
  SavedPlaylist,
  SavedAlbum,
} from '../../../types';

// Mock the modules
jest.mock('../../../services/spotifyApi');
jest.mock('../useSpotifyTokenManagement');

const mockSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;

// Mock useSpotifyTokenManagement
const mockUseSpotifyTokenManagement = jest.fn();
jest.mock('../useSpotifyTokenManagement', () => ({
  useSpotifyTokenManagement: () => mockUseSpotifyTokenManagement(),
}));

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

const createMockRecentTracks = (count: number, startIndex: number = 0): RecentTrack[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Recent Track ${startIndex + i + 1}`,
    artist: `Recent Artist ${startIndex + i + 1}`,
    album: `Recent Album ${startIndex + i + 1}`,
    album_image_url: `https://example.com/recent${startIndex + i + 1}.jpg`,
    played_at: new Date(Date.now() - (startIndex + i) * 60000).toISOString(),
  }));
};

const createMockTopTracks = (count: number, startIndex: number = 0): TopTrack[] => {
  return Array.from({ length: count }, (_, i) => ({
    song_id: `top_track_${startIndex + i + 1}`,
    name: `Top Track ${startIndex + i + 1}`,
    artist: `Top Artist ${startIndex + i + 1}`,
    album: `Top Album ${startIndex + i + 1}`,
    album_image_url: `https://example.com/top${startIndex + i + 1}.jpg`,
    popularity: 95 - (startIndex + i),
  }));
};

const createMockSavedTracks = (count: number, startIndex: number = 0): SavedTrack[] => {
  return Array.from({ length: count }, (_, i) => ({
    song_id: `saved_track_${startIndex + i + 1}`,
    name: `Saved Track ${startIndex + i + 1}`,
    artist: `Saved Artist ${startIndex + i + 1}`,
    album: `Saved Album ${startIndex + i + 1}`,
    album_image_url: `https://example.com/saved${startIndex + i + 1}.jpg`,
    added_at: new Date(Date.now() - (startIndex + i) * 60000).toISOString(),
  }));
};

const createMockSavedPlaylists = (count: number, startIndex: number = 0): SavedPlaylist[] => {
  return Array.from({ length: count }, (_, i) => ({
    playlist_id: `saved_playlist_${startIndex + i + 1}`,
    name: `Saved Playlist ${startIndex + i + 1}`,
    description: `Description for playlist ${startIndex + i + 1}`,
    image_url: `https://example.com/playlist${startIndex + i + 1}.jpg`,
    track_count: 25 + (startIndex + i),
    created_at: new Date(Date.now() - (startIndex + i) * 86400000).toISOString(), // Different days
  }));
};

const createMockSavedAlbums = (count: number, startIndex: number = 0): SavedAlbum[] => {
  return Array.from({ length: count }, (_, i) => ({
    album_id: `saved_album_${startIndex + i + 1}`,
    name: `Saved Album ${startIndex + i + 1}`,
    artist: `Album Artist ${startIndex + i + 1}`,
    image_url: `https://example.com/album${startIndex + i + 1}.jpg`,
    release_date: new Date(Date.now() - (startIndex + i) * 86400000 * 30)
      .toISOString()
      .split('T')[0], // Different months
    track_count: 10 + (startIndex + i),
  }));
};

describe('useSpotifyPagination', () => {
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
    mockSpotifyApi.getMoreRecentTracks.mockResolvedValue(createMockRecentTracks(10, 10));
    mockSpotifyApi.getMoreTopTracks.mockResolvedValue(createMockTopTracks(10, 10));
    mockSpotifyApi.getMoreSavedTracks.mockResolvedValue(createMockSavedTracks(10, 10));
    mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(createMockSavedPlaylists(20, 20));
    mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue(createMockSavedAlbums(20, 20));
  });

  describe('Initial state', () => {
    it('initializes with correct default state', () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.isLoadingMoreTopTracks).toBe(false);
      expect(result.current.isLoadingMoreSavedTracks).toBe(false);
      expect(result.current.isLoadingMoreSavedPlaylists).toBe(false);
      expect(result.current.isLoadingMoreSavedAlbums).toBe(false);
      expect(result.current.hasMoreTracks).toBe(true);
      expect(result.current.hasMoreTopTracks).toBe(true);
      expect(result.current.hasMoreSavedTracks).toBe(true);
      expect(result.current.hasMoreSavedPlaylists).toBe(true);
      expect(result.current.hasMoreSavedAlbums).toBe(true);
    });
  });

  describe('loadMoreRecentTracks', () => {
    it('successfully loads more recent tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const moreTracks = createMockRecentTracks(10, 5);
      const mockSetRecentTracks = jest.fn();

      mockSpotifyApi.getMoreRecentTracks.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(mockGetValidToken).toHaveBeenCalled();
      expect(mockSpotifyApi.getMoreRecentTracks).toHaveBeenCalledWith(
        'valid_token',
        expect.any(String) // before timestamp
      );
      expect(mockSetRecentTracks).toHaveBeenCalledWith(expect.any(Function));
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.hasMoreTracks).toBe(true);
    });

    it('does not load when user is null', async () => {
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(null, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(mockSetRecentTracks).not.toHaveBeenCalled();
    });

    it('does not load when authToken is null', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, null, mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(mockSetRecentTracks).not.toHaveBeenCalled();
    });

    it('does not load when already loading', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      // Make getValidToken take some time to simulate async loading
      mockGetValidToken.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ token: 'valid_token', user: testUser }), 50)
          )
      );

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      // Start first load
      act(() => {
        result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      // Wait a bit for the loading state to be set
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Try to start second load while first is in progress - this should be blocked
      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      // Wait for first load to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should only be called once because second call was blocked
      expect(mockGetValidToken).toHaveBeenCalledTimes(1);
    });

    it('does not load when hasMoreTracks is false', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      // Set hasMoreTracks to false first
      act(() => {
        result.current.updateHasMoreFlags(5, 10, 10);
      });

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(result.current.hasMoreTracks).toBe(false);
    });

    it('handles TOKEN_EXPIRED error', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const moreTracks = createMockRecentTracks(10, 5);
      const mockSetRecentTracks = jest.fn();
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getMoreRecentTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalledWith(
        tokenExpiredError,
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockSetRecentTracks).toHaveBeenCalled();
    });

    it('filters out duplicate tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      // Create duplicates with same played_at
      const duplicateTracks = [
        initialTracks[0], // Duplicate
        ...createMockRecentTracks(5, 5), // New tracks
      ];
      const mockSetRecentTracks = jest.fn();

      mockSpotifyApi.getMoreRecentTracks.mockResolvedValue(duplicateTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      // Check that the setter function was called with a function that filters duplicates
      const setterFunction = mockSetRecentTracks.mock.calls[0][0];
      const newTracks = setterFunction(initialTracks);

      // Should have original 5 + 5 new (no duplicates)
      expect(newTracks.length).toBe(10);
    });

    it('sets hasMoreTracks to false when no new tracks after filtering', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      // Return only duplicates
      const duplicateTracks = [...initialTracks];
      const mockSetRecentTracks = jest.fn();

      mockSpotifyApi.getMoreRecentTracks.mockResolvedValue(duplicateTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(result.current.hasMoreTracks).toBe(false);
    });

    it('sets hasMoreTracks to false when less than 10 tracks returned', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const fewTracks = createMockRecentTracks(5, 5); // Only 5 tracks
      const mockSetRecentTracks = jest.fn();

      mockSpotifyApi.getMoreRecentTracks.mockResolvedValue(fewTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(result.current.hasMoreTracks).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock __DEV__ to true for this test
      const originalDev = (global as { __DEV__?: boolean }).__DEV__;
      (global as { __DEV__?: boolean }).__DEV__ = true;

      mockSpotifyApi.getMoreRecentTracks.mockRejectedValue(new Error('Network Error'));
      mockHandleTokenExpiredError.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading more tracks:', expect.any(Error));
      expect(result.current.hasMoreTracks).toBe(false);
      expect(result.current.isLoadingMore).toBe(false);

      consoleSpy.mockRestore();
      (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    });
  });

  describe('loadMoreTopTracks', () => {
    it('successfully loads more top tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockTopTracks(10);
      const moreTracks = createMockTopTracks(10, 10);
      const mockSetTopTracks = jest.fn();

      mockSpotifyApi.getMoreTopTracks.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreTopTracks(initialTracks, mockSetTopTracks);
      });

      expect(mockSpotifyApi.getMoreTopTracks).toHaveBeenCalledWith(
        'valid_token',
        10, // offset
        'medium_term'
      );
      expect(mockSetTopTracks).toHaveBeenCalled();
      expect(result.current.isLoadingMoreTopTracks).toBe(false);
    });

    it('stops loading when reaching 50 track limit', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockTopTracks(45); // Close to limit
      const moreTracks = createMockTopTracks(10, 45);
      const mockSetTopTracks = jest.fn();

      mockSpotifyApi.getMoreTopTracks.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreTopTracks(initialTracks, mockSetTopTracks);
      });

      expect(result.current.hasMoreTopTracks).toBe(false);
    });

    it('filters out duplicate top tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockTopTracks(5);
      const duplicateTracks = [
        initialTracks[0], // Duplicate by song_id
        ...createMockTopTracks(5, 5),
      ];
      const mockSetTopTracks = jest.fn();

      mockSpotifyApi.getMoreTopTracks.mockResolvedValue(duplicateTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreTopTracks(initialTracks, mockSetTopTracks);
      });

      const setterFunction = mockSetTopTracks.mock.calls[0][0];
      const newTracks = setterFunction(initialTracks);

      // Should filter out the duplicate
      expect(newTracks.length).toBe(10);
    });

    it('handles TOKEN_EXPIRED error for top tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockTopTracks(5);
      const moreTracks = createMockTopTracks(5, 5);
      const mockSetTopTracks = jest.fn();
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getMoreTopTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreTopTracks(initialTracks, mockSetTopTracks);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalled();
      expect(mockSetTopTracks).toHaveBeenCalled();
    });
  });

  describe('loadMoreSavedTracks', () => {
    it('successfully loads more saved tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockSavedTracks(10);
      const moreTracks = createMockSavedTracks(10, 10);
      const mockSetSavedTracks = jest.fn();

      mockSpotifyApi.getMoreSavedTracks.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedTracks(initialTracks, mockSetSavedTracks);
      });

      expect(mockSpotifyApi.getMoreSavedTracks).toHaveBeenCalledWith(
        'valid_token',
        10 // offset
      );
      expect(mockSetSavedTracks).toHaveBeenCalled();
      expect(result.current.isLoadingMoreSavedTracks).toBe(false);
    });

    it('filters out duplicate saved tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockSavedTracks(5);
      const duplicateTracks = [
        initialTracks[0], // Duplicate by song_id
        ...createMockSavedTracks(5, 5),
      ];
      const mockSetSavedTracks = jest.fn();

      mockSpotifyApi.getMoreSavedTracks.mockResolvedValue(duplicateTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedTracks(initialTracks, mockSetSavedTracks);
      });

      const setterFunction = mockSetSavedTracks.mock.calls[0][0];
      const newTracks = setterFunction(initialTracks);

      expect(newTracks.length).toBe(10);
    });

    it('handles TOKEN_EXPIRED error for saved tracks', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockSavedTracks(5);
      const moreTracks = createMockSavedTracks(5, 5);
      const mockSetSavedTracks = jest.fn();
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getMoreSavedTracks.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedTracks(initialTracks, mockSetSavedTracks);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalled();
      expect(mockSetSavedTracks).toHaveBeenCalled();
    });
  });

  describe('loadMoreSavedPlaylists', () => {
    it('successfully loads more saved playlists', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(10);
      const morePlaylists = createMockSavedPlaylists(20, 10);
      const mockSetSavedPlaylists = jest.fn();

      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(morePlaylists);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(mockSpotifyApi.getMoreSavedPlaylists).toHaveBeenCalledWith(
        'valid_token',
        10 // offset
      );
      expect(mockSetSavedPlaylists).toHaveBeenCalled();
      expect(result.current.isLoadingMoreSavedPlaylists).toBe(false);
    });

    it('does not load when user is null', async () => {
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(null, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(mockSetSavedPlaylists).not.toHaveBeenCalled();
    });

    it('does not load when authToken is null', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, null, mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(mockSetSavedPlaylists).not.toHaveBeenCalled();
    });

    it('does not load when already loading', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();

      mockGetValidToken.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ token: 'valid_token', user: testUser }), 50)
          )
      );

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      act(() => {
        result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockGetValidToken).toHaveBeenCalledTimes(1);
    });

    it('does not load when hasMoreSavedPlaylists is false', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      act(() => {
        result.current.updateHasMoreFlags(10, 10, 10, 15); // Set playlists to false
      });

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(result.current.hasMoreSavedPlaylists).toBe(false);
    });

    it('handles TOKEN_EXPIRED error for saved playlists', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const morePlaylists = createMockSavedPlaylists(5, 5);
      const mockSetSavedPlaylists = jest.fn();
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getMoreSavedPlaylists.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(morePlaylists);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalled();
      expect(mockSetSavedPlaylists).toHaveBeenCalled();
    });

    it('filters out duplicate saved playlists', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const duplicatePlaylists = [
        initialPlaylists[0], // Duplicate by playlist_id
        ...createMockSavedPlaylists(5, 5),
      ];
      const mockSetSavedPlaylists = jest.fn();

      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(duplicatePlaylists);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      const setterFunction = mockSetSavedPlaylists.mock.calls[0][0];
      const newPlaylists = setterFunction(initialPlaylists);

      expect(newPlaylists.length).toBe(10);
    });

    it('sets hasMoreSavedPlaylists to false when no new playlists after filtering', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const duplicatePlaylists = [...initialPlaylists];
      const mockSetSavedPlaylists = jest.fn();

      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(duplicatePlaylists);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(result.current.hasMoreSavedPlaylists).toBe(false);
    });

    it('sets hasMoreSavedPlaylists to false when less than 20 playlists returned', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(10);
      const fewPlaylists = createMockSavedPlaylists(15, 10); // Only 15 playlists
      const mockSetSavedPlaylists = jest.fn();

      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue(fewPlaylists);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(result.current.hasMoreSavedPlaylists).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const originalDev = (global as { __DEV__?: boolean }).__DEV__;
      (global as { __DEV__?: boolean }).__DEV__ = true;

      mockSpotifyApi.getMoreSavedPlaylists.mockRejectedValue(new Error('Network Error'));
      mockHandleTokenExpiredError.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading more saved playlists:',
        expect.any(Error)
      );
      expect(result.current.hasMoreSavedPlaylists).toBe(false);
      expect(result.current.isLoadingMoreSavedPlaylists).toBe(false);

      consoleSpy.mockRestore();
      (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    it('handles null getValidToken result', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();

      mockGetValidToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(mockSpotifyApi.getMoreSavedPlaylists).not.toHaveBeenCalled();
      expect(mockSetSavedPlaylists).not.toHaveBeenCalled();
      expect(result.current.isLoadingMoreSavedPlaylists).toBe(false);
    });

    it('handles empty API responses', async () => {
      const testUser = createMockUser(1);
      const initialPlaylists = createMockSavedPlaylists(5);
      const mockSetSavedPlaylists = jest.fn();

      mockSpotifyApi.getMoreSavedPlaylists.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedPlaylists(initialPlaylists, mockSetSavedPlaylists);
      });

      expect(result.current.hasMoreSavedPlaylists).toBe(false);
      expect(mockSetSavedPlaylists).not.toHaveBeenCalled();
    });
  });

  describe('loadMoreSavedAlbums', () => {
    it('successfully loads more saved albums', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(10);
      const moreAlbums = createMockSavedAlbums(20, 10);
      const mockSetSavedAlbums = jest.fn();

      mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue(moreAlbums);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(mockSpotifyApi.getMoreSavedAlbums).toHaveBeenCalledWith(
        'valid_token',
        10 // offset
      );
      expect(mockSetSavedAlbums).toHaveBeenCalled();
      expect(result.current.isLoadingMoreSavedAlbums).toBe(false);
    });

    it('does not load when user is null', async () => {
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(null, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(mockSetSavedAlbums).not.toHaveBeenCalled();
    });

    it('does not load when authToken is null', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, null, mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(mockSetSavedAlbums).not.toHaveBeenCalled();
    });

    it('does not load when already loading', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();

      mockGetValidToken.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ token: 'valid_token', user: testUser }), 50)
          )
      );

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      act(() => {
        result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockGetValidToken).toHaveBeenCalledTimes(1);
    });

    it('does not load when hasMoreSavedAlbums is false', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      act(() => {
        result.current.updateHasMoreFlags(10, 10, 10, 25, 15); // Set albums to false
      });

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(mockGetValidToken).not.toHaveBeenCalled();
      expect(result.current.hasMoreSavedAlbums).toBe(false);
    });

    it('handles TOKEN_EXPIRED error for saved albums', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const moreAlbums = createMockSavedAlbums(5, 5);
      const mockSetSavedAlbums = jest.fn();
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockSpotifyApi.getMoreSavedAlbums.mockRejectedValue(tokenExpiredError);
      mockHandleTokenExpiredError.mockResolvedValue(moreAlbums);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(mockHandleTokenExpiredError).toHaveBeenCalled();
      expect(mockSetSavedAlbums).toHaveBeenCalled();
    });

    it('filters out duplicate saved albums', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const duplicateAlbums = [
        initialAlbums[0], // Duplicate by album_id
        ...createMockSavedAlbums(5, 5),
      ];
      const mockSetSavedAlbums = jest.fn();

      mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue(duplicateAlbums);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      const setterFunction = mockSetSavedAlbums.mock.calls[0][0];
      const newAlbums = setterFunction(initialAlbums);

      expect(newAlbums.length).toBe(10);
    });

    it('sets hasMoreSavedAlbums to false when no new albums after filtering', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const duplicateAlbums = [...initialAlbums];
      const mockSetSavedAlbums = jest.fn();

      mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue(duplicateAlbums);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(result.current.hasMoreSavedAlbums).toBe(false);
    });

    it('sets hasMoreSavedAlbums to false when less than 20 albums returned', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(10);
      const fewAlbums = createMockSavedAlbums(15, 10); // Only 15 albums
      const mockSetSavedAlbums = jest.fn();

      mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue(fewAlbums);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(result.current.hasMoreSavedAlbums).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const originalDev = (global as { __DEV__?: boolean }).__DEV__;
      (global as { __DEV__?: boolean }).__DEV__ = true;

      mockSpotifyApi.getMoreSavedAlbums.mockRejectedValue(new Error('Network Error'));
      mockHandleTokenExpiredError.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading more saved albums:',
        expect.any(Error)
      );
      expect(result.current.hasMoreSavedAlbums).toBe(false);
      expect(result.current.isLoadingMoreSavedAlbums).toBe(false);

      consoleSpy.mockRestore();
      (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    it('handles null getValidToken result', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();

      mockGetValidToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(mockSpotifyApi.getMoreSavedAlbums).not.toHaveBeenCalled();
      expect(mockSetSavedAlbums).not.toHaveBeenCalled();
      expect(result.current.isLoadingMoreSavedAlbums).toBe(false);
    });

    it('handles empty API responses', async () => {
      const testUser = createMockUser(1);
      const initialAlbums = createMockSavedAlbums(5);
      const mockSetSavedAlbums = jest.fn();

      mockSpotifyApi.getMoreSavedAlbums.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreSavedAlbums(initialAlbums, mockSetSavedAlbums);
      });

      expect(result.current.hasMoreSavedAlbums).toBe(false);
      expect(mockSetSavedAlbums).not.toHaveBeenCalled();
    });
  });

  describe('State management utilities', () => {
    it('resets all pagination states', () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      // Manually set some states to non-default values
      act(() => {
        result.current.updateHasMoreFlags(5, 5, 5, 5, 5); // Set all to false
      });

      expect(result.current.hasMoreTracks).toBe(false);
      expect(result.current.hasMoreTopTracks).toBe(false);
      expect(result.current.hasMoreSavedTracks).toBe(false);
      expect(result.current.hasMoreSavedPlaylists).toBe(false);
      expect(result.current.hasMoreSavedAlbums).toBe(false);

      // Reset
      act(() => {
        result.current.resetPaginationStates();
      });

      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.isLoadingMoreTopTracks).toBe(false);
      expect(result.current.isLoadingMoreSavedTracks).toBe(false);
      expect(result.current.isLoadingMoreSavedPlaylists).toBe(false);
      expect(result.current.isLoadingMoreSavedAlbums).toBe(false);
      expect(result.current.hasMoreTracks).toBe(true);
      expect(result.current.hasMoreTopTracks).toBe(true);
      expect(result.current.hasMoreSavedTracks).toBe(true);
      expect(result.current.hasMoreSavedPlaylists).toBe(true);
      expect(result.current.hasMoreSavedAlbums).toBe(true);
    });

    it('updates hasMore flags based on track counts', () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      // Test with different track counts
      act(() => {
        result.current.updateHasMoreFlags(5, 10, 15, 25, 30);
      });

      expect(result.current.hasMoreTracks).toBe(false); // < 10
      expect(result.current.hasMoreTopTracks).toBe(true); // >= 10
      expect(result.current.hasMoreSavedTracks).toBe(true); // >= 10
      expect(result.current.hasMoreSavedPlaylists).toBe(true); // >= 20
      expect(result.current.hasMoreSavedAlbums).toBe(true); // >= 20

      // Test with all below threshold
      act(() => {
        result.current.updateHasMoreFlags(3, 7, 2, 15, 10);
      });

      expect(result.current.hasMoreTracks).toBe(false);
      expect(result.current.hasMoreTopTracks).toBe(false);
      expect(result.current.hasMoreSavedTracks).toBe(false);
      expect(result.current.hasMoreSavedPlaylists).toBe(false);
      expect(result.current.hasMoreSavedAlbums).toBe(false);

      // Test with all above threshold
      act(() => {
        result.current.updateHasMoreFlags(15, 12, 20, 25, 30);
      });

      expect(result.current.hasMoreTracks).toBe(true);
      expect(result.current.hasMoreTopTracks).toBe(true);
      expect(result.current.hasMoreSavedTracks).toBe(true);
      expect(result.current.hasMoreSavedPlaylists).toBe(true);
      expect(result.current.hasMoreSavedAlbums).toBe(true);
    });

    it('handles optional playlist and album parameters in updateHasMoreFlags', () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      // Test without optional parameters
      act(() => {
        result.current.updateHasMoreFlags(15, 12, 20);
      });

      // Should not change playlist/album states when not provided
      expect(result.current.hasMoreTracks).toBe(true);
      expect(result.current.hasMoreTopTracks).toBe(true);
      expect(result.current.hasMoreSavedTracks).toBe(true);
      expect(result.current.hasMoreSavedPlaylists).toBe(true); // Should remain default
      expect(result.current.hasMoreSavedAlbums).toBe(true); // Should remain default

      // Test with only playlist parameter
      act(() => {
        result.current.updateHasMoreFlags(15, 12, 20, 15);
      });

      expect(result.current.hasMoreSavedPlaylists).toBe(false); // < 20
      expect(result.current.hasMoreSavedAlbums).toBe(true); // Still default

      // Test with both optional parameters
      act(() => {
        result.current.updateHasMoreFlags(15, 12, 20, 25, 15);
      });

      expect(result.current.hasMoreSavedPlaylists).toBe(true); // >= 20
      expect(result.current.hasMoreSavedAlbums).toBe(false); // < 20
    });
  });

  describe('Edge cases', () => {
    it('handles empty track arrays', async () => {
      const testUser = createMockUser(1);
      const emptyTracks: RecentTrack[] = [];
      const moreTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      mockSpotifyApi.getMoreRecentTracks.mockResolvedValue(moreTracks);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(emptyTracks, mockSetRecentTracks);
      });

      expect(mockSpotifyApi.getMoreRecentTracks).toHaveBeenCalledWith(
        'valid_token',
        undefined // no before timestamp for empty array
      );
    });

    it('handles null getValidToken result', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      mockGetValidToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(mockSpotifyApi.getMoreRecentTracks).not.toHaveBeenCalled();
      expect(mockSetRecentTracks).not.toHaveBeenCalled();
      expect(result.current.isLoadingMore).toBe(false);
    });

    it('handles empty API responses', async () => {
      const testUser = createMockUser(1);
      const initialTracks = createMockRecentTracks(5);
      const mockSetRecentTracks = jest.fn();

      mockSpotifyApi.getMoreRecentTracks.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useSpotifyPagination(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await result.current.loadMoreRecentTracks(initialTracks, mockSetRecentTracks);
      });

      expect(result.current.hasMoreTracks).toBe(false);
      expect(mockSetRecentTracks).not.toHaveBeenCalled();
    });
  });
});
