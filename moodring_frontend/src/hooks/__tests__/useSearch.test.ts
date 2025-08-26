import { renderHook, act } from '@testing-library/react-native';
import { useSearch } from '../useSearch';
import { spotifyApi } from '../../services/spotifyApi';
import { useAuth } from '../../contexts/AuthContext';
import { SearchResult } from '../../types';

// Mock the dependencies
jest.mock('../../services/spotifyApi');
jest.mock('../../contexts/AuthContext');

const mockSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useSearch', () => {
  const mockUser = {
    id: 1,
    spotify_id: 'test-spotify-id',
    email: 'test@example.com',
    display_name: 'Test User',
    spotify_access_token: 'valid-token',
    spotify_refresh_token: 'refresh-token',
    token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    profile_image_url: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockSearchResults = [
    {
      type: 'track' as const,
      id: '1',
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      album_image_url: 'test-image.jpg',
      song_id: '1',
      popularity: 80,
    },
    {
      type: 'album' as const,
      id: '2',
      name: 'Test Album',
      artist: 'Test Artist',
      image_url: 'test-album.jpg',
      release_date: '2023-01-01',
      track_count: 12,
      album_id: '2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      authToken: 'valid-token',
      isLoading: false,
      error: null,
      setUser: jest.fn(),
      setAuthToken: jest.fn(),
      setError: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: jest.fn(),
    });

    mockSpotifyApi.searchContent.mockResolvedValue({
      results: mockSearchResults,
      hasMore: false,
      totalResults: 2,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty search state', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchState).toEqual({
      query: '',
      results: [],
      isLoading: false,
      error: null,
      hasMore: false,
      offset: 0,
      totalResults: 0,
    });
  });

  it('should update query immediately and debounce search', async () => {
    const { result } = renderHook(() => useSearch({ debounceMs: 300 }));

    act(() => {
      result.current.updateQuery('test query');
    });

    // Query should be updated immediately
    expect(result.current.searchState.query).toBe('test query');
    expect(mockSpotifyApi.searchContent).not.toHaveBeenCalled();

    // After debounce delay, search should be called
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Allow microtasks to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSpotifyApi.searchContent).toHaveBeenCalledWith(
      'valid-token',
      'test query',
      ['track', 'album', 'playlist'],
      10,
      0
    );
  });

  it('should perform search with correct parameters', async () => {
    const { result } = renderHook(() => 
      useSearch({ 
        searchTypes: ['track', 'album'], 
        limit: 5 
      })
    );

    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSpotifyApi.searchContent).toHaveBeenCalledWith(
      'valid-token',
      'test',
      ['track', 'album'],
      5,
      0
    );
  });

  it('should update search state with results', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.searchState.results).toEqual(mockSearchResults);
    expect(result.current.searchState.totalResults).toBe(2);
    expect(result.current.searchState.isLoading).toBe(false);
    expect(result.current.hasResults).toBe(true);
  });

  it('should handle load more functionality', async () => {
    mockSpotifyApi.searchContent
      .mockResolvedValueOnce({
        results: mockSearchResults,
        hasMore: true,
        totalResults: 4,
      })
      .mockResolvedValueOnce({
        results: [mockSearchResults[0]],
        hasMore: false,
        totalResults: 4,
      });

    const { result } = renderHook(() => useSearch());

    // Initial search
    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.searchState.hasMore).toBe(true);
    expect(result.current.canLoadMore).toBe(true);

    // Load more
    await act(async () => {
      result.current.loadMore();
      await Promise.resolve();
    });

    expect(mockSpotifyApi.searchContent).toHaveBeenCalledWith(
      'valid-token',
      'test',
      ['track', 'album', 'playlist'],
      10,
      10
    );

    expect(result.current.searchState.results).toHaveLength(3);
    expect(result.current.searchState.hasMore).toBe(false);
  });

  it('should clear search results and query', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchState).toEqual({
      query: '',
      results: [],
      isLoading: false,
      error: null,
      hasMore: false,
      offset: 0,
      totalResults: 0,
    });
  });

  it('should clear results immediately when query is empty', () => {
    const { result } = renderHook(() => useSearch());

    // Set initial query
    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    // Clear query
    act(() => {
      result.current.updateQuery('');
    });

    expect(result.current.searchState.query).toBe('');
    expect(result.current.searchState.results).toEqual([]);
    expect(mockSpotifyApi.searchContent).toHaveBeenCalledTimes(1); // Only called once for 'test'
  });

  it('should handle search errors', async () => {
    mockSpotifyApi.searchContent.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.searchState.error).toBe('Failed to search. Please try again.');
    expect(result.current.searchState.isLoading).toBe(false);
  });

  it('should handle token expired error', async () => {
    const tokenExpiredError = new Error('TOKEN_EXPIRED');
    mockSpotifyApi.searchContent.mockRejectedValueOnce(tokenExpiredError);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.searchState.error).toBe('Your session has expired. Please refresh the page.');
  });

  it('should handle race conditions correctly', async () => {
    let resolveFirst: (_value: unknown) => void;
    let resolveSecond: (_value: unknown) => void;

    const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
    const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

    mockSpotifyApi.searchContent
      .mockReturnValueOnce(firstPromise as Promise<{ results: SearchResult[]; hasMore: boolean; totalResults: number }>)
      .mockReturnValueOnce(secondPromise as Promise<{ results: SearchResult[]; hasMore: boolean; totalResults: number }>);

    const { result } = renderHook(() => useSearch());

    // Start first search
    act(() => {
      result.current.updateQuery('first');
      jest.advanceTimersByTime(500);
    });

    // Start second search before first completes
    act(() => {
      result.current.updateQuery('second');
      jest.advanceTimersByTime(500);
    });

    // Resolve first search (should be ignored)
    resolveFirst!({
      results: [mockSearchResults[0]],
      hasMore: false,
      totalResults: 1,
    });

    // Resolve second search
    resolveSecond!({
      results: mockSearchResults,
      hasMore: false,
      totalResults: 2,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.searchState.results).toEqual(mockSearchResults);
    expect(result.current.searchState.totalResults).toBe(2);
  });

  it('should not search when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      authToken: null,
      isLoading: false,
      error: null,
      setUser: jest.fn(),
      setAuthToken: jest.fn(),
      setError: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: jest.fn(),
    });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateQuery('test');
      jest.advanceTimersByTime(500);
    });

    expect(mockSpotifyApi.searchContent).not.toHaveBeenCalled();
  });
});