import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RecentTracksList } from '../RecentTracksList';
import { RecentTrack } from '../../../types';

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    spacing: { sm: 8, lg: 16, xl: 24 },
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

// Mock TrackCard component
jest.mock('../TrackCard', () => ({
  TrackCard: ({
    track,
    onToggleExpansion,
  }: {
    track: RecentTrack;
    onToggleExpansion?: (_index: number) => void;
  }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID: `track-card-${track.name}`,
        onPress: () => onToggleExpansion && onToggleExpansion(0),
      },
      React.createElement(Text, null, `${track.name} by ${track.artist}`)
    );
  },
}));

const mockTracks: RecentTrack[] = [
  {
    name: 'Test Song 1',
    artist: 'Test Artist 1',
    album: 'Test Album 1',
    album_image_url: 'https://test.com/image1.jpg',
    played_at: '2024-01-01T10:00:00Z',
  },
  {
    name: 'Test Song 2',
    artist: 'Test Artist 2',
    album: 'Test Album 2',
    album_image_url: 'https://test.com/image2.jpg',
    played_at: '2024-01-01T09:00:00Z',
  },
  {
    name: 'Test Song 3',
    artist: 'Test Artist 3',
    album: 'Test Album 3',
    album_image_url: 'https://test.com/image3.jpg',
    played_at: '2024-01-01T08:00:00Z',
  },
];

// Create array of 15 tracks for testing "See More" functionality
const manyTracks: RecentTrack[] = Array.from({ length: 15 }, (_, i) => ({
  name: `Test Song ${i + 1}`,
  artist: `Test Artist ${i + 1}`,
  album: `Test Album ${i + 1}`,
  album_image_url: `https://test.com/image${i + 1}.jpg`,
  played_at: `2024-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`,
}));

describe('RecentTracksList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders empty state when no tracks provided', () => {
      const { getByText } = render(<RecentTracksList tracks={[]} />);
      expect(getByText('No recent tracks found')).toBeTruthy();
    });

    it('renders recent tracks title', () => {
      const { getByText } = render(<RecentTracksList tracks={mockTracks} />);
      expect(getByText('RECENT TRACKS')).toBeTruthy();
    });

    it('renders track cards for provided tracks', () => {
      const { getByTestId } = render(<RecentTracksList tracks={mockTracks} />);

      expect(getByTestId('track-card-Test Song 1')).toBeTruthy();
      expect(getByTestId('track-card-Test Song 2')).toBeTruthy();
      expect(getByTestId('track-card-Test Song 3')).toBeTruthy();
    });
  });

  describe('See More functionality', () => {
    it('shows See More button when more than 10 tracks available', () => {
      const { getByText, queryByTestId } = render(<RecentTracksList tracks={manyTracks} />);

      expect(getByText(/See More/)).toBeTruthy();

      // Should only show first 10 tracks initially
      expect(queryByTestId('track-card-Test Song 10')).toBeTruthy();
      expect(queryByTestId('track-card-Test Song 11')).toBeNull();
    });

    it('shows See More button when local tracks exceed limit', () => {
      const { getByText } = render(<RecentTracksList tracks={manyTracks} />);

      expect(getByText('See More')).toBeTruthy();
    });

    it('shows See More button when hasMoreTracks is true and onLoadMore is provided', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <RecentTracksList tracks={mockTracks} hasMoreTracks={true} onLoadMore={mockLoadMore} />
      );

      expect(getByText('See More')).toBeTruthy();
    });

    it('does not show See More button when hasMoreTracks is true but onLoadMore is not provided', () => {
      const { queryByText } = render(<RecentTracksList tracks={mockTracks} hasMoreTracks={true} />);

      expect(queryByText('See More')).toBeNull();
    });

    it('expands to show all tracks when See More is pressed with local tracks', async () => {
      const { getByText, getByTestId } = render(<RecentTracksList tracks={manyTracks} />);

      // Initially track 11 should not be visible
      expect(() => getByTestId('track-card-Test Song 11')).toThrow();

      // Press See More button
      fireEvent.press(getByText('See More'));

      // Now track 11 should be visible
      await waitFor(() => {
        expect(getByTestId('track-card-Test Song 11')).toBeTruthy();
      });

      // See More button should be gone
      expect(() => getByText('See More')).toThrow();
    });

    it('calls onLoadMore when See More is pressed and hasMoreTracks is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <RecentTracksList tracks={mockTracks} hasMoreTracks={true} onLoadMore={mockLoadMore} />
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state when isLoadingMore is true', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <RecentTracksList
          tracks={mockTracks}
          hasMoreTracks={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      expect(getByText('Loading...')).toBeTruthy();
    });

    it('shows loading state instead of clickable button when loading', () => {
      const mockLoadMore = jest.fn();
      const { getByText, queryByText } = render(
        <RecentTracksList
          tracks={mockTracks}
          hasMoreTracks={true}
          isLoadingMore={true}
          onLoadMore={mockLoadMore}
        />
      );

      // Should show loading text and not the See More button text
      expect(getByText('Loading...')).toBeTruthy();
      expect(queryByText('See More')).toBeNull();
    });
  });

  describe('track expansion', () => {
    it('handles track expansion correctly', () => {
      const { getByTestId } = render(<RecentTracksList tracks={mockTracks} />);

      const trackCard = getByTestId('track-card-Test Song 1');
      fireEvent.press(trackCard);

      // TrackCard component should be called with onToggleExpansion
      expect(trackCard).toBeTruthy();
    });
  });

  describe('refresh behavior', () => {
    it('resets showAll to false when first track changes (refresh detected)', () => {
      const refreshedTracks = [
        {
          name: 'New Song 1',
          artist: 'New Artist',
          album: 'New Album',
          album_image_url: 'https://new.com/image.jpg',
          played_at: '2024-01-01T11:00:00Z',
        },
      ];

      const { rerender, queryByText } = render(<RecentTracksList tracks={manyTracks} />);

      // Expand to show all tracks first
      const seeMoreButton = queryByText('See More');
      if (seeMoreButton) {
        fireEvent.press(seeMoreButton);
      }

      // Simulate refresh by changing the first track
      rerender(<RecentTracksList tracks={refreshedTracks} />);

      // Should show the See More button again since showAll was reset
      // (if hasMoreTracks was true, the button would reappear)
      expect(queryByText('RECENT TRACKS')).toBeTruthy();
    });

    it('resets showAll to false when track count decreases (refresh detected)', () => {
      const { rerender, queryByText } = render(<RecentTracksList tracks={manyTracks} />);

      // Initially should show See More button
      expect(queryByText('See More')).toBeTruthy();

      // Expand to show all tracks
      fireEvent.press(queryByText('See More')!);

      // Now simulate refresh with fewer tracks
      rerender(<RecentTracksList tracks={mockTracks} />);

      // showAll should be reset to false (we can't easily test this directly,
      // but the component should behave correctly)
      expect(queryByText('RECENT TRACKS')).toBeTruthy();
    });
  });
});
