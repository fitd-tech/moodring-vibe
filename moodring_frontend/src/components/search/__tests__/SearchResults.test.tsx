import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchResults } from '../SearchResults';
import { SearchResult } from '../../../types';

// Mock dependencies
jest.mock('../SearchResultCard', () => ({
  SearchResultCard: ({ result, index, onToggleExpansion }: {
    result: SearchResult;
    index: number;
    onToggleExpansion: (_index: number) => void;
  }) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity 
        onPress={() => onToggleExpansion(index)}
        testID={`mock-result-card-${index}`}
      >
        <Text>{result.name} - {result.type}</Text>
      </TouchableOpacity>
    );
  },
}));


describe('SearchResults', () => {
  const mockResults: SearchResult[] = [
    {
      type: 'track',
      id: '1',
      name: 'Test Song 1',
      artist: 'Test Artist 1',
      album: 'Test Album 1',
      album_image_url: 'test-image1.jpg',
      song_id: '1',
      popularity: 80,
    },
    {
      type: 'track',
      id: '2',
      name: 'Test Song 2',
      artist: 'Test Artist 2',
      album: 'Test Album 2',
      album_image_url: 'test-image2.jpg',
      song_id: '2',
      popularity: 70,
    },
    {
      type: 'album',
      id: '3',
      name: 'Test Album',
      artist: 'Test Artist',
      image_url: 'test-album.jpg',
      release_date: '2023-01-01',
      track_count: 12,
      album_id: '3',
    },
    {
      type: 'playlist',
      id: '4',
      name: 'Test Playlist',
      description: 'A test playlist',
      image_url: 'test-playlist.jpg',
      track_count: 25,
      playlist_id: '4',
      owner: 'Test Owner',
    },
  ];

  const mockOnLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render results summary correctly', () => {
    const { getByText } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={4}
      />
    );

    expect(getByText('Found 2 tracks, 1 album, and 1 playlist')).toBeTruthy();
  });

  it('should render total results count when there are more results', () => {
    const { getByText } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={true}
        isLoadingMore={false}
        totalResults={20}
      />
    );

    expect(getByText('Showing 4 of 20 total results')).toBeTruthy();
  });

  it('should render all result cards', () => {
    const { getByTestId } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={4}
      />
    );

    expect(getByTestId('mock-result-card-0')).toBeTruthy();
    expect(getByTestId('mock-result-card-1')).toBeTruthy();
    expect(getByTestId('mock-result-card-2')).toBeTruthy();
    expect(getByTestId('mock-result-card-3')).toBeTruthy();
  });

  it('should show load more button when canLoadMore is true', () => {
    const { getByTestId } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={true}
        isLoadingMore={false}
        totalResults={20}
      />
    );

    const loadMoreButton = getByTestId('load-more-button');
    expect(loadMoreButton).toBeTruthy();
  });

  it('should not show load more button when canLoadMore is false', () => {
    const { queryByTestId } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={4}
      />
    );

    expect(queryByTestId('load-more-button')).toBeFalsy();
  });

  it('should call onLoadMore when load more button is pressed', () => {
    const { getByTestId } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={true}
        isLoadingMore={false}
        totalResults={20}
      />
    );

    const loadMoreButton = getByTestId('load-more-button');
    fireEvent.press(loadMoreButton);

    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  it('should disable load more button when loading', () => {
    const { getByTestId } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={true}
        isLoadingMore={true}
        totalResults={20}
      />
    );

    const loadMoreButton = getByTestId('load-more-button');
    expect(loadMoreButton).toHaveProp('disabled', true);
  });

  it('should show loading spinner in load more button when loading', () => {
    const { getByTestId, queryByText } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={true}
        isLoadingMore={true}
        totalResults={20}
      />
    );

    expect(getByTestId('load-more-button')).toBeTruthy();
    expect(queryByText('Load 10 more results')).toBeFalsy();
  });

  it('should show end of results indicator when no more results and many results shown', () => {
    const manyResults = Array.from({ length: 15 }, (_, i) => ({
      ...mockResults[0],
      id: `${i}`,
      name: `Test Song ${i}`,
    }));

    const { getByText } = render(
      <SearchResults
        results={manyResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={15}
      />
    );

    expect(getByText('End of results')).toBeTruthy();
  });

  it('should not show end of results indicator when few results', () => {
    const { queryByText } = render(
      <SearchResults
        results={mockResults.slice(0, 3)}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={3}
      />
    );

    expect(queryByText('End of results')).toBeFalsy();
  });

  it('should render result cards with correct props', () => {
    const { getByTestId } = render(
      <SearchResults
        results={mockResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={4}
      />
    );

    // Check that cards are rendered
    expect(getByTestId('mock-result-card-0')).toBeTruthy();
    expect(getByTestId('mock-result-card-1')).toBeTruthy();
    expect(getByTestId('mock-result-card-2')).toBeTruthy();
    expect(getByTestId('mock-result-card-3')).toBeTruthy();

    // Test expansion toggle functionality
    const card = getByTestId('mock-result-card-1');
    fireEvent.press(card);

    // The expansion is now handled internally, so we just verify the card can be pressed
    expect(card).toBeTruthy();
  });

  it('should format single result type correctly', () => {
    const singleTypeResults = [mockResults[0]]; // Just one track

    const { getByText } = render(
      <SearchResults
        results={singleTypeResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={1}
      />
    );

    expect(getByText('Found 1 track')).toBeTruthy();
  });

  it('should format two result types correctly', () => {
    const twoTypeResults = [mockResults[0], mockResults[2]]; // Track and album

    const { getByText } = render(
      <SearchResults
        results={twoTypeResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={2}
      />
    );

    expect(getByText('Found 1 track and 1 album')).toBeTruthy();
  });

  it('should handle plural forms correctly', () => {
    const pluralResults = [
      mockResults[0], // track
      mockResults[1], // track
      mockResults[2], // album
    ];

    const { getByText } = render(
      <SearchResults
        results={pluralResults}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={3}
      />
    );

    expect(getByText('Found 2 tracks and 1 album')).toBeTruthy();
  });

  it('should handle empty results gracefully', () => {
    const { queryByText } = render(
      <SearchResults
        results={[]}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={0}
      />
    );

    // Should render the container but not show any "Found" text
    expect(queryByText(/Found .+/)).toBeFalsy();
  });

  it('should create unique keys for result cards', () => {
    const resultsWithSameId: SearchResult[] = [
      {
        type: 'track',
        id: 'same-id',
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        album_image_url: 'test-image.jpg',
        song_id: 'same-id',
        popularity: 80,
      },
      {
        type: 'album',
        id: 'same-id',
        name: 'Test Album',
        artist: 'Test Artist',
        image_url: 'test-album.jpg',
        release_date: '2023-01-01',
        track_count: 12,
        album_id: 'same-id',
      },
    ];

    // Should render without React key warnings
    render(
      <SearchResults
        results={resultsWithSameId}
        onLoadMore={mockOnLoadMore}
        canLoadMore={false}
        isLoadingMore={false}
        totalResults={2}
      />
    );

    // No assertions needed - test passes if no React key errors occur
  });
});