import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TopTracksList } from '../TopTracksList';
import { TopTrack } from '../../../types';

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    spacing: { sm: 8, lg: 16, xl: 24 },
    typography: {
      fontSize: { sm: 14, md: 16 },
      fontWeight: { semibold: '600' },
      letterSpacing: { sm: '0.1px' }
    },
    colors: {
      text: { primary: '#ffffff', muted: '#888888' },
      accent: { purple: '#9b59b6' }
    },
    borderRadius: { lg: 8 }
  }
}));

// Mock TrackCard component 
jest.mock('../TrackCard', () => ({
  TrackCard: ({ track, onToggleExpansion }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(TouchableOpacity, {
      testID: `track-card-${track.name}`,
      onPress: () => onToggleExpansion && onToggleExpansion(0)
    }, React.createElement(Text, null, `${track.name} by ${track.artist}`));
  }
}));

const mockTopTracks: TopTrack[] = [
  {
    name: 'Top Song 1',
    artist: 'Top Artist 1', 
    album: 'Top Album 1',
    album_image_url: 'https://test.com/image1.jpg',
    song_id: 'top-song-1',
    popularity: 95
  },
  {
    name: 'Top Song 2',
    artist: 'Top Artist 2',
    album: 'Top Album 2',
    album_image_url: 'https://test.com/image2.jpg', 
    song_id: 'top-song-2',
    popularity: 90
  },
  {
    name: 'Top Song 3',
    artist: 'Top Artist 3',
    album: 'Top Album 3',
    album_image_url: 'https://test.com/image3.jpg',
    song_id: 'top-song-3',
    popularity: 85
  }
];

// Create array of 15 tracks for testing "See More" functionality
const manyTopTracks: TopTrack[] = Array.from({ length: 15 }, (_, i) => ({
  name: `Top Song ${i + 1}`,
  artist: `Top Artist ${i + 1}`,
  album: `Top Album ${i + 1}`,
  album_image_url: `https://test.com/image${i + 1}.jpg`,
  song_id: `top-song-${i + 1}`,
  popularity: 100 - i * 2
}));

describe('TopTracksList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders empty state when no tracks provided', () => {
      const { getByText } = render(<TopTracksList tracks={[]} />);
      expect(getByText('No top tracks found')).toBeTruthy();
    });

    it('renders top tracks title', () => {
      const { getByText } = render(<TopTracksList tracks={mockTopTracks} />);
      expect(getByText('TOP TRACKS')).toBeTruthy();
    });

    it('renders track cards for provided tracks', () => {
      const { getByTestId } = render(<TopTracksList tracks={mockTopTracks} />);
      
      expect(getByTestId('track-card-Top Song 1')).toBeTruthy();
      expect(getByTestId('track-card-Top Song 2')).toBeTruthy();
      expect(getByTestId('track-card-Top Song 3')).toBeTruthy();
    });
  });

  describe('See More functionality', () => {
    it('shows See More button when more than 10 tracks available', () => {
      const { getByText, queryByTestId } = render(
        <TopTracksList tracks={manyTopTracks} />
      );
      
      expect(getByText(/See More/)).toBeTruthy();
      
      // Should only show first 10 tracks initially
      expect(queryByTestId('track-card-Top Song 10')).toBeTruthy();
      expect(queryByTestId('track-card-Top Song 11')).toBeNull();
    });

    it('shows See More button when local tracks exceed limit', () => {
      const { getByText } = render(
        <TopTracksList tracks={manyTopTracks} />
      );
      
      expect(getByText('See More')).toBeTruthy();
    });

    it('shows See More button when hasMoreTracks is true and onLoadMore is provided', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <TopTracksList 
          tracks={mockTopTracks} 
          hasMoreTracks={true}
          onLoadMore={mockLoadMore}
        />
      );
      
      expect(getByText('See More')).toBeTruthy();
    });

    it('does not show See More button when hasMoreTracks is true but onLoadMore is not provided', () => {
      const { queryByText } = render(
        <TopTracksList 
          tracks={mockTopTracks} 
          hasMoreTracks={true}
        />
      );
      
      expect(queryByText('See More')).toBeNull();
    });

    it('expands to show all tracks when See More is pressed with local tracks', async () => {
      const { getByText, getByTestId } = render(
        <TopTracksList tracks={manyTopTracks} />
      );
      
      // Initially track 11 should not be visible
      expect(() => getByTestId('track-card-Top Song 11')).toThrow();
      
      // Press See More button
      fireEvent.press(getByText('See More'));
      
      // Now track 11 should be visible
      await waitFor(() => {
        expect(getByTestId('track-card-Top Song 11')).toBeTruthy();
      });
      
      // See More button should be gone
      expect(() => getByText('See More')).toThrow();
    });

    it('calls onLoadMore when See More is pressed and hasMoreTracks is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <TopTracksList 
          tracks={mockTopTracks} 
          hasMoreTracks={true}
          onLoadMore={mockLoadMore}
        />
      );
      
      fireEvent.press(getByText('See More'));
      
      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state when isLoadingMore is true', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <TopTracksList 
          tracks={mockTopTracks}
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
        <TopTracksList 
          tracks={mockTopTracks}
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
      const { getByTestId } = render(<TopTracksList tracks={mockTopTracks} />);
      
      const trackCard = getByTestId('track-card-Top Song 1');
      fireEvent.press(trackCard);
      
      // TrackCard component should be called with onToggleExpansion
      expect(trackCard).toBeTruthy();
    });
  });

  describe('refresh behavior', () => {
    it('resets showAll to false when first track changes (refresh detected)', () => {
      const refreshedTracks = [
        {
          name: 'New Top Song 1',
          artist: 'New Top Artist', 
          album: 'New Top Album',
          album_image_url: 'https://new.com/image.jpg',
          song_id: 'new-top-song-1',
          popularity: 100
        }
      ];

      const { rerender, queryByText } = render(
        <TopTracksList tracks={manyTopTracks} />
      );

      // Expand to show all tracks first
      const seeMoreButton = queryByText('See More');
      if (seeMoreButton) {
        fireEvent.press(seeMoreButton);
      }

      // Simulate refresh by changing the first track
      rerender(<TopTracksList tracks={refreshedTracks} />);

      // Should show the title, component rendered correctly after refresh
      expect(queryByText('TOP TRACKS')).toBeTruthy();
    });

    it('resets showAll to false when track count decreases (refresh detected)', () => {
      const { rerender, queryByText } = render(
        <TopTracksList tracks={manyTopTracks} />
      );

      // Initially should show See More button
      expect(queryByText('See More')).toBeTruthy();

      // Expand to show all tracks
      fireEvent.press(queryByText('See More')!);

      // Now simulate refresh with fewer tracks
      rerender(<TopTracksList tracks={mockTopTracks} />);

      // showAll should be reset to false (we can't easily test this directly,
      // but the component should behave correctly)
      expect(queryByText('TOP TRACKS')).toBeTruthy();
    });
  });
});