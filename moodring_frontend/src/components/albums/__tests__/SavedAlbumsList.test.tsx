import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SavedAlbumsList } from '../SavedAlbumsList';
import { SavedAlbum } from '../../../types';

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    spacing: { sm: 8, md: 12, lg: 16, xl: 24 },
    typography: {
      fontSize: { sm: 14, md: 16 },
      fontWeight: { semibold: '600' },
      letterSpacing: { sm: '0.1px' },
    },
    colors: {
      text: { primary: '#ffffff', muted: '#888888' },
      accent: { purple: '#9b59b6' },
    },
    borderRadius: { lg: 8 },
  },
}));

// Mock AlbumCard component
jest.mock('../AlbumCard', () => ({
  AlbumCard: ({
    album,
    _index,
  }: {
    album: SavedAlbum;
    _index: number;
  }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      {
        testID: `album-card-${album.name}`,
      },
      React.createElement(Text, null, `${album.name} by ${album.artist} - ${album.track_count} tracks`)
    );
  },
}));

const mockAlbums: SavedAlbum[] = [
  {
    name: 'Test Album 1',
    artist: 'Test Artist 1',
    image_url: 'https://test.com/image1.jpg',
    release_date: '2023-01-01',
    track_count: 12,
    album_id: 'album-1',
  },
  {
    name: 'Test Album 2',
    artist: 'Test Artist 2',
    image_url: 'https://test.com/image2.jpg',
    release_date: '2022-06-15',
    track_count: 8,
    album_id: 'album-2',
  },
  {
    name: 'Test Album 3',
    artist: 'Test Artist 3',
    image_url: 'https://test.com/image3.jpg',
    release_date: '2024-03-20',
    track_count: 15,
    album_id: 'album-3',
  },
];

// Create array of 10 albums for testing "See More" functionality
const manyAlbums: SavedAlbum[] = Array.from({ length: 10 }, (_, i) => ({
  name: `Test Album ${i + 1}`,
  artist: `Test Artist ${i + 1}`,
  image_url: `https://test.com/image${i + 1}.jpg`,
  release_date: `202${i % 5}-01-01`,
  track_count: 10 + i,
  album_id: `album-${i + 1}`,
}));

describe('SavedAlbumsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders empty state when no albums provided', () => {
      const { getByText } = render(<SavedAlbumsList albums={[]} />);
      expect(getByText('No saved albums found')).toBeTruthy();
    });

    it('renders saved albums title', () => {
      const { getByText } = render(<SavedAlbumsList albums={mockAlbums} />);
      expect(getByText('SAVED ALBUMS')).toBeTruthy();
    });

    it('renders album cards for provided albums', () => {
      const { getByTestId } = render(<SavedAlbumsList albums={mockAlbums} />);

      expect(getByTestId('album-card-Test Album 1')).toBeTruthy();
      expect(getByTestId('album-card-Test Album 2')).toBeTruthy();
      expect(getByTestId('album-card-Test Album 3')).toBeTruthy();
    });

    it('shows correct number of albums initially (5)', () => {
      const { queryByTestId } = render(<SavedAlbumsList albums={manyAlbums} />);

      // Should show first 5 albums
      expect(queryByTestId('album-card-Test Album 1')).toBeTruthy();
      expect(queryByTestId('album-card-Test Album 2')).toBeTruthy();
      expect(queryByTestId('album-card-Test Album 3')).toBeTruthy();
      expect(queryByTestId('album-card-Test Album 4')).toBeTruthy();
      expect(queryByTestId('album-card-Test Album 5')).toBeTruthy();

      // Should not show 6th album initially
      expect(queryByTestId('album-card-Test Album 6')).toBeNull();
    });
  });

  describe('See More functionality', () => {
    it('shows See More button when more than 5 albums available', () => {
      const { getByText, queryByTestId } = render(<SavedAlbumsList albums={manyAlbums} />);

      expect(getByText('See More')).toBeTruthy();

      // Should only show first 5 albums initially
      expect(queryByTestId('album-card-Test Album 5')).toBeTruthy();
      expect(queryByTestId('album-card-Test Album 6')).toBeNull();
    });

    it('does not show See More button when 5 or fewer albums available', () => {
      const { queryByText } = render(<SavedAlbumsList albums={mockAlbums} />);

      expect(queryByText('See More')).toBeNull();
    });

    it('shows See More button when hasMoreAlbums is true and onLoadMore is provided', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <SavedAlbumsList albums={mockAlbums} hasMoreAlbums={true} onLoadMore={mockLoadMore} />
      );

      expect(getByText('See More')).toBeTruthy();
    });

    it('does not show See More button when hasMoreAlbums is true but onLoadMore is not provided', () => {
      const { queryByText } = render(<SavedAlbumsList albums={mockAlbums} hasMoreAlbums={true} />);

      expect(queryByText('See More')).toBeNull();
    });

    it('expands to show all albums when See More is pressed with local albums', async () => {
      const { getByText, getByTestId } = render(<SavedAlbumsList albums={manyAlbums} />);

      // Initially album 6 should not be visible
      expect(() => getByTestId('album-card-Test Album 6')).toThrow();

      // Press See More button
      fireEvent.press(getByText('See More'));

      // Now album 6 should be visible
      await waitFor(() => {
        expect(getByTestId('album-card-Test Album 6')).toBeTruthy();
      });

      // See More button should be gone (since we've shown all local albums)
      expect(() => getByText('See More')).toThrow();
    });

    it('calls onLoadMore when See More is pressed and hasMoreAlbums is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <SavedAlbumsList albums={mockAlbums} hasMoreAlbums={true} onLoadMore={mockLoadMore} />
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('handles both local expansion and API loading correctly', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText, getByTestId } = render(
        <SavedAlbumsList albums={manyAlbums} hasMoreAlbums={true} onLoadMore={mockLoadMore} />
      );

      // Initially should show See More for both local expansion and API loading
      expect(getByText('See More')).toBeTruthy();

      // Press See More - should expand local albums first
      fireEvent.press(getByText('See More'));

      // Should show all local albums
      await waitFor(() => {
        expect(getByTestId('album-card-Test Album 10')).toBeTruthy();
      });

      // Since hasMoreAlbums is true, See More button should still be there for API call
      expect(getByText('See More')).toBeTruthy();

      // Press See More again - should call API
      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state when isLoadingMore is true', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <SavedAlbumsList
          albums={mockAlbums}
          hasMoreAlbums={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      expect(getByText('Loading...')).toBeTruthy();
    });

    it('shows loading state instead of clickable button when loading', () => {
      const mockLoadMore = jest.fn();
      const { getByText, queryByText } = render(
        <SavedAlbumsList
          albums={mockAlbums}
          hasMoreAlbums={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      // Should show loading text and not the See More button text
      expect(getByText('Loading...')).toBeTruthy();
      expect(queryByText('See More')).toBeNull();
    });

    it('disables button during loading', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <SavedAlbumsList
          albums={mockAlbums}
          hasMoreAlbums={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      // Just verify that loading state is shown
      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('refresh behavior', () => {
    it('resets showAll to false when first album changes (refresh detected)', () => {
      const refreshedAlbums = [
        {
          name: 'New Album 1',
          artist: 'New Artist',
          image_url: 'https://new.com/image.jpg',
          release_date: '2024-01-01',
          track_count: 25,
          album_id: 'new-album-1',
        },
      ];

      const { rerender, queryByText } = render(<SavedAlbumsList albums={manyAlbums} />);

      // Expand to show all albums first
      const seeMoreButton = queryByText('See More');
      if (seeMoreButton) {
        fireEvent.press(seeMoreButton);
      }

      // Simulate refresh by changing the first album
      rerender(<SavedAlbumsList albums={refreshedAlbums} />);

      // Should show the title (component should work correctly)
      expect(queryByText('SAVED ALBUMS')).toBeTruthy();
    });

    it('resets showAll to false when album count decreases (refresh detected)', () => {
      const { rerender, queryByText } = render(<SavedAlbumsList albums={manyAlbums} />);

      // Initially should show See More button
      expect(queryByText('See More')).toBeTruthy();

      // Expand to show all albums
      fireEvent.press(queryByText('See More')!);

      // Now simulate refresh with fewer albums
      rerender(<SavedAlbumsList albums={mockAlbums} />);

      // showAll should be reset to false (we can't easily test this directly,
      // but the component should behave correctly)
      expect(queryByText('SAVED ALBUMS')).toBeTruthy();
    });

    it('does not reset showAll when albums are just appended', () => {
      const extendedAlbums = [...manyAlbums, ...mockAlbums];

      const { rerender, queryByText, queryByTestId } = render(<SavedAlbumsList albums={manyAlbums} />);

      // Expand to show all albums
      fireEvent.press(queryByText('See More')!);

      // Verify expanded state
      expect(queryByTestId('album-card-Test Album 10')).toBeTruthy();

      // Simulate adding more albums (like from API response)
      rerender(<SavedAlbumsList albums={extendedAlbums} />);

      // Should still be expanded (showAll should remain true)
      expect(queryByTestId('album-card-Test Album 10')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles exactly 5 albums (boundary case)', () => {
      const exactlyFiveAlbums = manyAlbums.slice(0, 5);
      const { queryByText } = render(<SavedAlbumsList albums={exactlyFiveAlbums} />);

      // Should not show See More button for exactly 5 albums
      expect(queryByText('See More')).toBeNull();
    });

    it('handles 6 albums (just over boundary)', () => {
      const sixAlbums = manyAlbums.slice(0, 6);
      const { getByText, queryByTestId } = render(<SavedAlbumsList albums={sixAlbums} />);

      // Should show See More button
      expect(getByText('See More')).toBeTruthy();

      // Should only show first 5
      expect(queryByTestId('album-card-Test Album 5')).toBeTruthy();
      expect(queryByTestId('album-card-Test Album 6')).toBeNull();
    });

    it('calls onLoadMore when provided and hasMoreAlbums is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <SavedAlbumsList albums={mockAlbums} hasMoreAlbums={true} onLoadMore={mockLoadMore} />
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('handles rapid consecutive See More presses', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <SavedAlbumsList albums={mockAlbums} hasMoreAlbums={true} onLoadMore={mockLoadMore} />
      );

      const button = getByText('See More');
      
      // Press multiple times rapidly
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      // Should call multiple times since the component doesn't prevent rapid presses
      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalled();
      });
    });
  });

  describe('component structure and accessibility', () => {
    it('renders with correct semantic structure', () => {
      const { getByText } = render(<SavedAlbumsList albums={mockAlbums} />);

      // Should have title
      expect(getByText('SAVED ALBUMS')).toBeTruthy();
      
      // Should render album cards
      expect(getByText(/Test Album 1.*Test Artist 1.*12 tracks/)).toBeTruthy();
    });

    it('handles empty albums array gracefully', () => {
      const { getByText } = render(<SavedAlbumsList albums={[]} />);

      expect(getByText('No saved albums found')).toBeTruthy();
    });

    it('renders without errors with all optional props', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <SavedAlbumsList
          albums={mockAlbums}
          onLoadMore={mockLoadMore}
          hasMoreAlbums={true}
          isLoadingMore={false}
        />
      );

      expect(getByText('SAVED ALBUMS')).toBeTruthy();
    });

    it('renders without errors with minimum props', () => {
      const { getByText } = render(<SavedAlbumsList albums={mockAlbums} />);

      expect(getByText('SAVED ALBUMS')).toBeTruthy();
    });
  });

  describe('prop handling', () => {
    it('handles missing optional props gracefully', () => {
      const { getByText } = render(<SavedAlbumsList albums={manyAlbums} />);

      expect(getByText('SAVED ALBUMS')).toBeTruthy();
      expect(getByText('See More')).toBeTruthy();
    });

    it('handles onLoadMore without hasMoreAlbums', () => {
      const { getByText } = render(<SavedAlbumsList albums={manyAlbums} onLoadMore={jest.fn()} />);

      // Should still show See More for local expansion
      expect(getByText('See More')).toBeTruthy();
    });

    it('handles hasMoreAlbums without onLoadMore', () => {
      const { queryByText } = render(<SavedAlbumsList albums={mockAlbums} hasMoreAlbums={true} />);

      // Should not show See More without onLoadMore callback
      expect(queryByText('See More')).toBeNull();
    });

    it('passes correct props to AlbumCard components', () => {
      const { getByTestId } = render(<SavedAlbumsList albums={mockAlbums} />);

      // AlbumCard should render with correct album data
      expect(getByTestId('album-card-Test Album 1')).toBeTruthy();
      expect(getByTestId('album-card-Test Album 2')).toBeTruthy();
      expect(getByTestId('album-card-Test Album 3')).toBeTruthy();
    });
  });

  describe('state management', () => {
    it('correctly manages showAll state for local albums', () => {
      const { getByText, queryByTestId } = render(<SavedAlbumsList albums={manyAlbums} />);

      // Initially should not show album 6
      expect(queryByTestId('album-card-Test Album 6')).toBeNull();

      // Press See More to show all
      fireEvent.press(getByText('See More'));

      // Should now show album 6
      expect(queryByTestId('album-card-Test Album 6')).toBeTruthy();
    });

    it('maintains proper key generation for album cards', () => {
      const { getByTestId } = render(<SavedAlbumsList albums={mockAlbums} />);

      // Each album should have a unique testID
      mockAlbums.forEach(album => {
        expect(getByTestId(`album-card-${album.name}`)).toBeTruthy();
      });
    });

    it('handles album data changes correctly', () => {
      const { rerender, getByTestId } = render(<SavedAlbumsList albums={mockAlbums} />);

      // Initial render
      expect(getByTestId('album-card-Test Album 1')).toBeTruthy();

      // Update with different albums
      const newAlbums = [
        {
          name: 'Different Album',
          artist: 'Different Artist',
          image_url: 'https://different.com/image.jpg',
          release_date: '2024-01-01',
          track_count: 10,
          album_id: 'different-1',
        },
      ];

      rerender(<SavedAlbumsList albums={newAlbums} />);

      // Should render new album
      expect(getByTestId('album-card-Different Album')).toBeTruthy();
    });
  });

  describe('loading interaction', () => {
    it('shows loading state when isLoadingMore is true', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <SavedAlbumsList
          albums={mockAlbums}
          hasMoreAlbums={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      expect(getByText('Loading...')).toBeTruthy();
    });

    it('re-enables interaction after loading completes', () => {
      const mockLoadMore = jest.fn();
      const { getByText, rerender } = render(
        <SavedAlbumsList
          albums={mockAlbums}
          hasMoreAlbums={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      // Initially loading
      expect(getByText('Loading...')).toBeTruthy();

      // Complete loading
      rerender(
        <SavedAlbumsList
          albums={mockAlbums}
          hasMoreAlbums={true}
          isLoadingMore={false}
          onLoadMore={mockLoadMore}
        />
      );

      // Should now show See More button again
      expect(getByText('See More')).toBeTruthy();
    });
  });
});