import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchSection } from '../SearchSection';
import { useSearch } from '../../../hooks/useSearch';
import { SearchResult } from '../../../types';

// Mock the useSearch hook
jest.mock('../../../hooks/useSearch');
const mockUseSearch = useSearch as jest.MockedFunction<typeof useSearch>;

// Mock the SearchResults component
jest.mock('../SearchResults', () => ({
  SearchResults: ({ results, onLoadMore, canLoadMore }: {
    results: SearchResult[];
    onLoadMore: () => void;
    canLoadMore: boolean;
  }) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <>
        <Text testID="search-results">Results: {results.length}</Text>
        {canLoadMore && (
          <TouchableOpacity onPress={onLoadMore} testID="mock-load-more">
            <Text>Load More</Text>
          </TouchableOpacity>
        )}
      </>
    );
  },
}));

describe('SearchSection', () => {
  const mockSearchResults: SearchResult[] = [
    {
      type: 'track',
      id: '1',
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      album_image_url: 'test-image.jpg',
      song_id: '1',
      popularity: 80,
    },
    {
      type: 'album',
      id: '2',
      name: 'Test Album',
      artist: 'Test Artist',
      image_url: 'test-album.jpg',
      release_date: '2023-01-01',
      track_count: 12,
      album_id: '2',
    },
  ];

  const defaultMockReturn = {
    searchState: {
      query: '',
      results: [],
      isLoading: false,
      error: null,
      hasMore: false,
      offset: 0,
      totalResults: 0,
    },
    updateQuery: jest.fn(),
    loadMore: jest.fn(),
    clearSearch: jest.fn(),
    isSearching: false,
    hasResults: false,
    canLoadMore: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearch.mockReturnValue(defaultMockReturn);
  });

  it('should render search section with title and input', () => {
    const { getByText, getByTestId } = render(<SearchSection />);

    expect(getByText('Search')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByTestId('search-input')).toHaveProp(
      'placeholder',
      'Search songs, artists, albums, playlists...'
    );
  });

  it('should call updateQuery when text input changes', () => {
    const updateQueryMock = jest.fn();
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      updateQuery: updateQueryMock,
    });

    const { getByTestId } = render(<SearchSection />);
    const searchInput = getByTestId('search-input');

    fireEvent.changeText(searchInput, 'test query');

    expect(updateQueryMock).toHaveBeenCalledWith('test query');
  });

  it('should show clear button when query exists', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        query: 'test query',
      },
    });

    const { getByTestId } = render(<SearchSection />);
    expect(getByTestId('clear-search-button')).toBeTruthy();
  });

  it('should not show clear button when query is empty', () => {
    const { queryByTestId } = render(<SearchSection />);
    expect(queryByTestId('clear-search-button')).toBeFalsy();
  });

  it('should call clearSearch when clear button is pressed', () => {
    const clearSearchMock = jest.fn();
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        query: 'test query',
      },
      clearSearch: clearSearchMock,
    });

    const { getByTestId } = render(<SearchSection />);
    const clearButton = getByTestId('clear-search-button');

    fireEvent.press(clearButton);

    expect(clearSearchMock).toHaveBeenCalled();
  });

  it('should show loading spinner when searching', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      isSearching: true,
      searchState: {
        ...defaultMockReturn.searchState,
        isLoading: true,
      },
    });

    const { getByText } = render(<SearchSection />);
    expect(getByText('Searching...')).toBeTruthy();
  });

  it('should show error message when there is an error', () => {
    const errorMessage = 'Search failed. Please try again.';
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        error: errorMessage,
      },
    });

    const { getByText } = render(<SearchSection />);
    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('should show search results when available', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        results: mockSearchResults,
        totalResults: 2,
      },
      hasResults: true,
    });

    const { getByTestId } = render(<SearchSection />);
    expect(getByTestId('search-results')).toBeTruthy();
  });

  it('should show no results message when query exists but no results found', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        query: 'test query',
        results: [],
      },
    });

    const { getByText } = render(<SearchSection />);
    expect(getByText('No results found for "test query"')).toBeTruthy();
    expect(getByText('Try searching with different keywords')).toBeTruthy();
  });

  it('should not show no results message when query is empty', () => {
    const { queryByText } = render(<SearchSection />);
    expect(queryByText(/No results found/)).toBeFalsy();
  });

  it('should not show no results message when loading', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      isSearching: true,
      searchState: {
        ...defaultMockReturn.searchState,
        query: 'test query',
        isLoading: true,
      },
    });

    const { queryByText } = render(<SearchSection />);
    expect(queryByText(/No results found/)).toBeFalsy();
  });

  it('should not show no results message when there is an error', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        query: 'test query',
        error: 'Some error',
      },
    });

    const { queryByText } = render(<SearchSection />);
    expect(queryByText(/No results found/)).toBeFalsy();
  });

  it('should pass correct props to SearchResults component', () => {
    const loadMoreMock = jest.fn();
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        results: mockSearchResults,
        totalResults: 10,
      },
      hasResults: true,
      canLoadMore: true,
      loadMore: loadMoreMock,
    });

    const { getByTestId } = render(<SearchSection />);
    
    // SearchResults should be rendered
    expect(getByTestId('search-results')).toBeTruthy();
    
    // Load more button should be available and functional
    const loadMoreButton = getByTestId('mock-load-more');
    fireEvent.press(loadMoreButton);
    expect(loadMoreMock).toHaveBeenCalled();
  });

  it('should have correct accessibility properties', () => {
    const { getByTestId } = render(<SearchSection testID="test-search-section" />);
    
    expect(getByTestId('test-search-section')).toBeTruthy();
    
    const searchInput = getByTestId('search-input');
    expect(searchInput).toHaveProp('returnKeyType', 'search');
    expect(searchInput).toHaveProp('autoCapitalize', 'none');
    expect(searchInput).toHaveProp('autoCorrect', false);
  });

  it('should handle input field properties correctly', () => {
    mockUseSearch.mockReturnValue({
      ...defaultMockReturn,
      searchState: {
        ...defaultMockReturn.searchState,
        query: 'current query',
      },
    });

    const { getByTestId } = render(<SearchSection />);
    const searchInput = getByTestId('search-input');

    expect(searchInput).toHaveProp('value', 'current query');
  });
});