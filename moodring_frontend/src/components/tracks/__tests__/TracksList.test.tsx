import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { TracksList } from '../TracksList';
import { RecentTrack, TopTrack, SavedTrack } from '../../../types';

// Mock TrackCard component
jest.mock('../TrackCard', () => ({
  TrackCard: ({
    track,
    _index,
    isExpanded,
    onToggleExpansion,
  }: {
    track: import('../../../types').Track;
    _index: number;
    isExpanded: boolean;
    onToggleExpansion: (_index: number) => void;
  }) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return React.createElement(
      View,
      { testID: `track-card-${_index}` },
      React.createElement(
        TouchableOpacity,
        {
          testID: `track-card-header-${_index}`,
          onPress: () => onToggleExpansion(_index),
        },
        React.createElement(Text, { testID: `track-name-${_index}` }, track.name),
        React.createElement(Text, { testID: `track-artist-${_index}` }, track.artist)
      ),
      isExpanded &&
        React.createElement(
          View,
          { testID: `track-expanded-${_index}` },
          React.createElement(Text, null, 'Expanded Content')
        )
    );
  },
}));

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    colors: {
      text: {
        primary: '#ffffff',
        muted: 'rgba(255, 255, 255, 0.6)',
      },
      ui: { overlay: 'rgba(255, 255, 255, 0.1)' },
      accent: { purple: '#8a2be2' },
    },
    spacing: { sm: 8, md: 16, lg: 20, xl: 24 },
    borderRadius: { lg: 12 },
    typography: {
      fontSize: { sm: 14, md: 16, lg: 18 },
      fontWeight: { medium: '500', bold: '700' },
    },
  },
}));

describe('TracksList', () => {
  const mockRecentTracks: RecentTrack[] = Array.from({ length: 15 }, (_, i) => ({
    name: `Recent Track ${i + 1}`,
    artist: `Recent Artist ${i + 1}`,
    album: `Recent Album ${i + 1}`,
    album_image_url: `https://example.com/album${i + 1}.jpg`,
    played_at: new Date(Date.now() - i * 60000).toISOString(),
  }));

  const mockTopTracks: TopTrack[] = Array.from({ length: 12 }, (_, i) => ({
    song_id: `top_track_${i + 1}`,
    name: `Top Track ${i + 1}`,
    artist: `Top Artist ${i + 1}`,
    album: `Top Album ${i + 1}`,
    album_image_url: `https://example.com/top${i + 1}.jpg`,
    popularity: 90 - i,
  }));

  const mockSavedTracks: SavedTrack[] = Array.from({ length: 8 }, (_, i) => ({
    song_id: `saved_track_${i + 1}`,
    name: `Saved Track ${i + 1}`,
    artist: `Saved Artist ${i + 1}`,
    album: `Saved Album ${i + 1}`,
    album_image_url: `https://example.com/saved${i + 1}.jpg`,
    added_at: new Date(Date.now() - i * 60000).toISOString(),
  }));

  const mockOnLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders tracks correctly', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 5)} />);

      expect(screen.getByTestId('track-card-0')).toBeTruthy();
      expect(screen.getByTestId('track-name-0')).toBeTruthy();
      expect(screen.getByText('Recent Track 1')).toBeTruthy();
      expect(screen.getByText('Recent Artist 1')).toBeTruthy();
    });

    it('renders with title when provided', () => {
      render(
        <TracksList
          tracks={mockRecentTracks.slice(0, 5)}
          title="Recent Tracks"
        />
      );

      expect(screen.getByText('Recent Tracks')).toBeTruthy();
    });

    it('renders empty message when no tracks', () => {
      render(<TracksList tracks={[]} />);

      expect(screen.getByText('No tracks available')).toBeTruthy();
    });

    it('renders custom empty message', () => {
      render(
        <TracksList
          tracks={[]}
          emptyMessage="No recent tracks found"
        />
      );

      expect(screen.getByText('No recent tracks found')).toBeTruthy();
    });
  });

  describe('Track Expansion', () => {
    it('handles track expansion correctly', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 3)} />);

      const trackHeader = screen.getByTestId('track-card-header-0');
      fireEvent.press(trackHeader);

      expect(screen.getByTestId('track-expanded-0')).toBeTruthy();
      expect(screen.getByText('Expanded Content')).toBeTruthy();
    });

    it('collapses expanded track when pressed again', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 3)} />);

      const trackHeader = screen.getByTestId('track-card-header-0');
      
      // Expand
      fireEvent.press(trackHeader);
      expect(screen.getByTestId('track-expanded-0')).toBeTruthy();

      // Collapse
      fireEvent.press(trackHeader);
      expect(screen.queryByTestId('track-expanded-0')).toBeNull();
    });

    it('only allows one track expanded at a time', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 3)} />);

      // Expand first track
      fireEvent.press(screen.getByTestId('track-card-header-0'));
      expect(screen.getByTestId('track-expanded-0')).toBeTruthy();

      // Expand second track
      fireEvent.press(screen.getByTestId('track-card-header-1'));
      expect(screen.queryByTestId('track-expanded-0')).toBeNull();
      expect(screen.getByTestId('track-expanded-1')).toBeTruthy();
    });
  });

  describe('See More / Show Less Functionality', () => {
    it('shows "See More" button when tracks exceed initial limit', () => {
      render(<TracksList tracks={mockRecentTracks} />);

      expect(screen.getByText('See More (5 more)')).toBeTruthy();
      // Should only show first 10 tracks initially
      expect(screen.getByTestId('track-card-9')).toBeTruthy();
      expect(screen.queryByTestId('track-card-10')).toBeNull();
    });

    it('expands to show all tracks when "See More" is pressed', () => {
      render(<TracksList tracks={mockRecentTracks} />);

      fireEvent.press(screen.getByText('See More (5 more)'));

      // Should now show all tracks
      expect(screen.getByTestId('track-card-14')).toBeTruthy();
      expect(screen.getByText('Show Less')).toBeTruthy();
    });

    it('collapses to initial view when "Show Less" is pressed', () => {
      render(<TracksList tracks={mockRecentTracks} />);

      // Expand
      fireEvent.press(screen.getByText('See More (5 more)'));
      expect(screen.getByTestId('track-card-14')).toBeTruthy();

      // Collapse
      fireEvent.press(screen.getByText('Show Less'));
      expect(screen.queryByTestId('track-card-10')).toBeNull();
      expect(screen.getByText('See More (5 more)')).toBeTruthy();
    });

    it('does not show "See More" when tracks are exactly at limit', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 10)} />);

      expect(screen.queryByText(/See More/)).toBeNull();
      expect(screen.queryByText('Show Less')).toBeNull();
    });

    it('does not show "See More" when tracks are below limit', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 5)} />);

      expect(screen.queryByText(/See More/)).toBeNull();
    });
  });

  describe('Load More Functionality', () => {
    it('shows "Load More" button when expanded and has more tracks', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
        />
      );

      // Expand to show all
      fireEvent.press(screen.getByText('See More (5 more)'));

      expect(screen.getByText('Load More')).toBeTruthy();
    });

    it('calls onLoadMore when "Load More" is pressed', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
        />
      );

      // Expand first
      fireEvent.press(screen.getByText('See More (5 more)'));
      
      // Press load more
      fireEvent.press(screen.getByText('Load More'));

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    it('does not show "Load More" when not expanded', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
        />
      );

      expect(screen.queryByText('Load More')).toBeNull();
    });

    it('does not show "Load More" when hasMoreTracks is false', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={false}
        />
      );

      // Expand first
      fireEvent.press(screen.getByText('See More (5 more)'));

      expect(screen.queryByText('Load More')).toBeNull();
    });

    it('does not show "Load More" when onLoadMore is not provided', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          hasMoreTracks={true}
        />
      );

      // Expand first
      fireEvent.press(screen.getByText('See More (5 more)'));

      expect(screen.queryByText('Load More')).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when isLoadingMore is true', () => {
      render(
        <TracksList
          tracks={mockRecentTracks.slice(0, 5)}
          isLoadingMore={true}
        />
      );

      expect(screen.getByText('Loading more tracks...')).toBeTruthy();
    });

    it('does not show "See More" when loading', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          isLoadingMore={true}
        />
      );

      expect(screen.queryByText(/See More/)).toBeNull();
    });

    it('does not show "Load More" when loading', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
          isLoadingMore={true}
        />
      );

      // Expand first (though See More won't show due to loading)
      // Manually trigger expanded state for this test
      const { rerender } = render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
          isLoadingMore={false}
        />
      );

      fireEvent.press(screen.getByText('See More (5 more)'));

      rerender(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
          isLoadingMore={true}
        />
      );

      expect(screen.queryByText('Load More')).toBeNull();
      expect(screen.getByText('Loading more tracks...')).toBeTruthy();
    });
  });

  describe('Track Type Handling', () => {
    it('handles RecentTrack type correctly', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 3)} />);

      expect(screen.getByText('Recent Track 1')).toBeTruthy();
      expect(screen.getByText('Recent Artist 1')).toBeTruthy();
    });

    it('handles TopTrack type correctly', () => {
      render(<TracksList tracks={mockTopTracks.slice(0, 3)} />);

      expect(screen.getByText('Top Track 1')).toBeTruthy();
      expect(screen.getByText('Top Artist 1')).toBeTruthy();
    });

    it('handles SavedTrack type correctly', () => {
      render(<TracksList tracks={mockSavedTracks.slice(0, 3)} />);

      expect(screen.getByText('Saved Track 1')).toBeTruthy();
      expect(screen.getByText('Saved Artist 1')).toBeTruthy();
    });

    it('handles mixed track types correctly', () => {
      const mixedTracks = [
        mockRecentTracks[0],
        mockTopTracks[0],
        mockSavedTracks[0],
      ];

      render(<TracksList tracks={mixedTracks} />);

      expect(screen.getByText('Recent Track 1')).toBeTruthy();
      expect(screen.getByText('Top Track 1')).toBeTruthy();
      expect(screen.getByText('Saved Track 1')).toBeTruthy();
    });
  });

  describe('Track Refresh Detection', () => {
    it('resets showAll when tracks change (refresh detected)', async () => {
      const initialTracks = mockRecentTracks.slice(0, 15);
      const refreshedTracks = [
        {
          name: 'New Track 1',
          artist: 'New Artist 1',
          album: 'New Album 1',
          played_at: new Date().toISOString(),
        },
        ...mockRecentTracks.slice(1, 14),
      ] as RecentTrack[];

      const { rerender } = render(<TracksList tracks={initialTracks} />);

      // Expand to show all
      fireEvent.press(screen.getByText('See More (5 more)'));
      expect(screen.getByTestId('track-card-14')).toBeTruthy();

      // Simulate refresh with new first track
      rerender(<TracksList tracks={refreshedTracks} />);

      // Should reset to collapsed state
      await waitFor(() => {
        expect(screen.queryByTestId('track-card-10')).toBeNull();
      });
    });

    it('resets showAll when track count decreases', async () => {
      const initialTracks = mockRecentTracks.slice(0, 15);
      const fewerTracks = mockRecentTracks.slice(0, 8);

      const { rerender } = render(<TracksList tracks={initialTracks} />);

      // Expand to show all
      fireEvent.press(screen.getByText('See More (5 more)'));
      expect(screen.getByTestId('track-card-14')).toBeTruthy();

      // Simulate refresh with fewer tracks
      rerender(<TracksList tracks={fewerTracks} />);

      // Should reset to collapsed state (though all tracks fit in initial display now)
      await waitFor(() => {
        expect(screen.queryByText(/See More/)).toBeNull();
      });
    });

    it('does not reset showAll when tracks are appended (load more)', () => {
      const initialTracks = mockRecentTracks.slice(0, 15);
      const appendedTracks = [...initialTracks, ...mockRecentTracks.slice(15, 20)];

      const { rerender } = render(<TracksList tracks={initialTracks} />);

      // Expand to show all
      fireEvent.press(screen.getByText('See More (5 more)'));
      expect(screen.getByTestId('track-card-14')).toBeTruthy();

      // Simulate load more (tracks appended)
      rerender(<TracksList tracks={appendedTracks} />);

      // Should still be expanded
      expect(screen.getByTestId('track-card-14')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty track names gracefully', () => {
      const tracksWithEmptyNames = [
        { ...mockRecentTracks[0], name: '' },
        { ...mockRecentTracks[1], artist: '' },
      ];

      render(<TracksList tracks={tracksWithEmptyNames} />);

      expect(screen.getByTestId('track-card-0')).toBeTruthy();
      expect(screen.getByTestId('track-card-1')).toBeTruthy();
    });

    it('handles tracks without song_id correctly', () => {
      const tracksWithoutIds = mockRecentTracks.slice(0, 3).map(track => ({
        ...track,
        song_id: undefined,
      }));

      render(<TracksList tracks={tracksWithoutIds} />);

      expect(screen.getByTestId('track-card-0')).toBeTruthy();
      expect(screen.getByTestId('track-card-1')).toBeTruthy();
      expect(screen.getByTestId('track-card-2')).toBeTruthy();
    });

    it('handles exactly 10 tracks (boundary case)', () => {
      const exactlyTenTracks = mockRecentTracks.slice(0, 10);

      render(<TracksList tracks={exactlyTenTracks} />);

      expect(screen.getByTestId('track-card-0')).toBeTruthy();
      expect(screen.getByTestId('track-card-9')).toBeTruthy();
      expect(screen.queryByText(/See More/)).toBeNull();
    });

    it('handles 11 tracks (just over boundary)', () => {
      const elevenTracks = mockRecentTracks.slice(0, 11);

      render(<TracksList tracks={elevenTracks} />);

      expect(screen.getByTestId('track-card-9')).toBeTruthy();
      expect(screen.queryByTestId('track-card-10')).toBeNull();
      expect(screen.getByText('See More (1 more)')).toBeTruthy();
    });
  });

  describe('Props Validation', () => {
    it('renders with minimal required props', () => {
      render(<TracksList tracks={mockRecentTracks.slice(0, 3)} />);

      expect(screen.getByTestId('track-card-0')).toBeTruthy();
    });

    it('handles all optional props correctly', () => {
      render(
        <TracksList
          tracks={mockRecentTracks}
          onLoadMore={mockOnLoadMore}
          hasMoreTracks={true}
          isLoadingMore={false}
          title="Custom Title"
          emptyMessage="Custom Empty Message"
        />
      );

      expect(screen.getByText('Custom Title')).toBeTruthy();
      expect(screen.getByTestId('track-card-0')).toBeTruthy();
    });

    it('handles boolean prop edge cases', () => {
      render(
        <TracksList
          tracks={[]}
          hasMoreTracks={false}
          isLoadingMore={false}
        />
      );

      expect(screen.getByText('No tracks available')).toBeTruthy();
    });
  });
});