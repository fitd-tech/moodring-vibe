import { useState, useCallback, useRef, useEffect } from 'react';
import { SearchState } from '../types';
import { spotifyApi } from '../services/spotifyApi';
import { useAuth } from '../contexts/AuthContext';

interface UseSearchOptions {
  debounceMs?: number;
  searchTypes?: ('track' | 'album' | 'playlist' | 'artist')[];
  limit?: number;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 500,
    searchTypes = ['track', 'album', 'playlist', 'artist'],
    limit = 10,
  } = options;

  const { user } = useAuth();
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    hasMore: false,
    offset: 0,
    totalResults: 0,
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string>('');

  const performSearch = useCallback(
    async (query: string, offset: number = 0, append: boolean = false) => {
      if (!user?.spotify_access_token || !query.trim()) {
        if (!query.trim()) {
          setSearchState(prev => ({
            ...prev,
            results: [],
            isLoading: false,
            error: null,
            hasMore: false,
            offset: 0,
            totalResults: 0,
          }));
        }
        return;
      }

      // Create a unique request ID to handle race conditions
      const requestId = `${query}-${offset}-${Date.now()}`;
      currentRequestRef.current = requestId;

      try {
        setSearchState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const response = await spotifyApi.searchContent(
          user.spotify_access_token,
          query,
          searchTypes,
          limit,
          offset
        );

        // Check if this request is still current (not stale)
        if (currentRequestRef.current !== requestId) {
          return;
        }

        setSearchState(prev => ({
          ...prev,
          results: append ? [...prev.results, ...response.results] : response.results,
          isLoading: false,
          hasMore: response.hasMore,
          offset: append ? prev.offset + limit : limit,
          totalResults: response.totalResults,
        }));
      } catch (error) {
        // Check if this request is still current
        if (currentRequestRef.current !== requestId) {
          return;
        }

        if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
          setSearchState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Your session has expired. Please refresh the page.',
          }));
        } else {
          setSearchState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to search. Please try again.',
          }));
        }

        if (__DEV__) {
          console.error('[useSearch] Search error:', error);
        }
      }
    },
    [user?.spotify_access_token, searchTypes, limit]
  );

  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear any existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If query is empty, clear results immediately
      if (!query.trim()) {
        setSearchState(prev => ({
          ...prev,
          query,
          results: [],
          isLoading: false,
          error: null,
          hasMore: false,
          offset: 0,
          totalResults: 0,
        }));
        return;
      }

      // Set the query immediately for UI feedback
      setSearchState(prev => ({ ...prev, query }));

      // Debounce the actual search
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(query, 0, false);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  const loadMore = useCallback(() => {
    if (!searchState.isLoading && searchState.hasMore && searchState.query.trim()) {
      performSearch(searchState.query, searchState.offset, true);
    }
  }, [performSearch, searchState.isLoading, searchState.hasMore, searchState.query, searchState.offset]);

  const clearSearch = useCallback(() => {
    // Clear any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel any current request
    currentRequestRef.current = '';

    setSearchState({
      query: '',
      results: [],
      isLoading: false,
      error: null,
      hasMore: false,
      offset: 0,
      totalResults: 0,
    });
  }, []);

  const updateQuery = useCallback(
    (query: string) => {
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchState,
    updateQuery,
    loadMore,
    clearSearch,
    isSearching: searchState.isLoading,
    hasResults: searchState.results.length > 0,
    canLoadMore: searchState.hasMore && !searchState.isLoading,
  };
};