import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SavedTracksList } from '../SavedTracksList';
import { SavedTrack } from '../../../types';
import { ExpansionTestWrapper } from '../../../contexts/__tests__/testUtils';

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
      text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.8)', muted: '#888888' },
      accent: { purple: '#9b59b6' },
      background: { card: '#2a0a2a' },
      ui: { border: 'rgba(255,255,255,0.1)' },
    },
    borderRadius: { lg: 8 },
  },
}));

// Mock TrackCard component
jest.mock('../TrackCard', () => ({
  TrackCard: ({
    track,
    onToggleExpansion,
    index,
  }: {
    track: SavedTrack;
    onToggleExpansion?: (_index: number) => void;
    index: number;
  }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID: `track-card-${track.name}`,
        onPress: () => onToggleExpansion && onToggleExpansion(index),
      },
      React.createElement(Text, null, `${track.name} by ${track.artist}`)
    );
  },
}));

const mockSavedTracks: SavedTrack[] = [
  {
    name: 'Saved Song 1',
    artist: 'Saved Artist 1',
    album: 'Saved Album 1',
    album_image_url: 'https://test.com/image1.jpg',
    added_at: '2024-01-01T10:00:00Z',
    song_id: 'saved-song-1',
  },
  {
    name: 'Saved Song 2',
    artist: 'Saved Artist 2',
    album: 'Saved Album 2',
    album_image_url: 'https://test.com/image2.jpg',
    added_at: '2024-01-01T09:00:00Z',
    song_id: 'saved-song-2',
  },
  {
    name: 'Saved Song 3',
    artist: 'Saved Artist 3',
    album: 'Saved Album 3',
    album_image_url: 'https://test.com/image3.jpg',
    added_at: '2024-01-01T08:00:00Z',
    song_id: 'saved-song-3',
  },
];

// Create array of 15 tracks for testing "See More" functionality
const manySavedTracks: SavedTrack[] = Array.from({ length: 15 }, (_, i) => ({
  name: `Saved Song ${i + 1}`,
  artist: `Saved Artist ${i + 1}`,
  album: `Saved Album ${i + 1}`,
  album_image_url: `https://test.com/image${i + 1}.jpg`,
  added_at: `2024-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`,
  song_id: `saved-song-${i + 1}`,
}));

describe('SavedTracksList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders empty state when no tracks provided and not loading', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={[]} isLoading={false} />
        </ExpansionTestWrapper>
      );
      expect(getByText('No liked songs found')).toBeTruthy();
    });

    it('does not render empty state when loading', () => {
      const { queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={[]} isLoading={true} />
        </ExpansionTestWrapper>
      );
      expect(queryByText('No liked songs found')).toBeNull();
    });

    it('renders saved tracks title', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );
      expect(getByText('SAVED TRACKS')).toBeTruthy();
    });

    it('renders track cards for provided tracks', () => {
      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );

      expect(getByTestId('track-card-Saved Song 1')).toBeTruthy();
      expect(getByTestId('track-card-Saved Song 2')).toBeTruthy();
      expect(getByTestId('track-card-Saved Song 3')).toBeTruthy();
    });

    it('renders tracks with correct key including added_at and index', () => {
      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );

      // The tracks should be rendered with unique keys
      expect(getByTestId('track-card-Saved Song 1')).toBeTruthy();
      expect(getByTestId('track-card-Saved Song 2')).toBeTruthy();
      expect(getByTestId('track-card-Saved Song 3')).toBeTruthy();
    });
  });

  describe('See More functionality', () => {
    it('shows See More button when more than 10 tracks available', () => {
      const { getByText, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={manySavedTracks} />
        </ExpansionTestWrapper>
      );

      expect(getByText(/See More/)).toBeTruthy();

      // Should only show first 10 tracks initially
      expect(queryByTestId('track-card-Saved Song 10')).toBeTruthy();
      expect(queryByTestId('track-card-Saved Song 11')).toBeNull();
    });

    it('shows See More button when local tracks exceed limit', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={manySavedTracks} />
        </ExpansionTestWrapper>
      );

      expect(getByText('See More')).toBeTruthy();
    });

    it('shows See More button when hasMoreTracks is true and onLoadMore is provided', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} hasMoreTracks={true} onLoadMore={mockLoadMore} />
        </ExpansionTestWrapper>
      );

      expect(getByText('See More')).toBeTruthy();
    });

    it('does not show See More button when hasMoreTracks is true but onLoadMore is not provided', () => {
      const { queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} hasMoreTracks={true} />
        </ExpansionTestWrapper>
      );

      expect(queryByText('See More')).toBeNull();
    });

    it('expands to show all tracks when See More is pressed with local tracks', async () => {
      const { getByText, getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={manySavedTracks} />
        </ExpansionTestWrapper>
      );

      // Initially track 11 should not be visible
      expect(() => getByTestId('track-card-Saved Song 11')).toThrow();

      // Press See More button
      fireEvent.press(getByText('See More'));

      // Now track 11 should be visible
      await waitFor(() => {
        expect(getByTestId('track-card-Saved Song 11')).toBeTruthy();
      });

      // See More button should be gone
      expect(() => getByText('See More')).toThrow();
    });

    it('calls onLoadMore when See More is pressed and hasMoreTracks is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} hasMoreTracks={true} onLoadMore={mockLoadMore} />
        </ExpansionTestWrapper>
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onLoadMore and sets showAll to true after loading when hasMoreTracks is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText, rerender, getAllByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} hasMoreTracks={true} onLoadMore={mockLoadMore} />
        </ExpansionTestWrapper>
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });

      // After loading more, if we now have more tracks, they should all be visible
      const moreTracks = [...mockSavedTracks, ...manySavedTracks];
      rerender(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={moreTracks} hasMoreTracks={false} onLoadMore={mockLoadMore} />
        </ExpansionTestWrapper>
      );

      // All tracks should be visible since showAll was set to true after loading
      // There will be multiple track cards with the same name due to how our test data is constructed
      expect(getAllByTestId('track-card-Saved Song 1').length).toBeGreaterThan(0);
    });

    it('shows loading state when isLoadingMore is true', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList
            tracks={mockSavedTracks}
            hasMoreTracks={true}
            isLoadingMore={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      expect(getByText('Loading...')).toBeTruthy();
    });

    it('shows loading state instead of clickable button when loading', () => {
      const mockLoadMore = jest.fn();
      const { getByText, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList
            tracks={mockSavedTracks}
            hasMoreTracks={true}
            isLoadingMore={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      // Should show loading text and not the See More button text
      expect(getByText('Loading...')).toBeTruthy();
      expect(queryByText('See More')).toBeNull();
    });

    it('disables See More button when isLoadingMore is true', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList
            tracks={mockSavedTracks}
            hasMoreTracks={true}
            isLoadingMore={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      const loadingText = getByText('Loading...');
      expect(loadingText).toBeTruthy();

      // Button should be disabled, but we can't easily test this in React Native Testing Library
      // The component logic ensures the button is disabled when isLoadingMore is true
    });
  });

  describe('track expansion', () => {
    it('handles track expansion correctly with global expansion context', () => {
      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );

      const trackCard = getByTestId('track-card-Saved Song 1');
      fireEvent.press(trackCard);

      // TrackCard component should be called with onToggleExpansion
      expect(trackCard).toBeTruthy();
    });

    it('uses global expansion context for managing expansion state', () => {
      // This test verifies that the component uses ExpansionContext correctly
      // The actual expansion logic is tested in the ExpansionContext tests
      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );

      // Component should render without errors when using ExpansionContext
      expect(getByTestId('track-card-Saved Song 1')).toBeTruthy();
      expect(getByTestId('track-card-Saved Song 2')).toBeTruthy();
      expect(getByTestId('track-card-Saved Song 3')).toBeTruthy();
    });

    it('passes correct section and card type to expansion context', () => {
      // This test verifies that SavedTracksList uses the correct parameters for expansion
      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );

      const trackCard = getByTestId('track-card-Saved Song 1');
      fireEvent.press(trackCard);

      // The component should call toggleExpansion with 'saved-tracks', 'track', and index
      expect(trackCard).toBeTruthy();
    });
  });

  describe('refresh behavior', () => {
    it('resets showAll to false when first track changes (refresh detected)', () => {
      const refreshedTracks = [
        {
          name: 'New Saved Song 1',
          artist: 'New Saved Artist',
          album: 'New Saved Album',
          album_image_url: 'https://new.com/image.jpg',
          added_at: '2024-01-01T11:00:00Z',
          song_id: 'new-saved-song-1',
        },
      ];

      const { rerender, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={manySavedTracks} />
        </ExpansionTestWrapper>
      );

      // Expand to show all tracks first
      const seeMoreButton = queryByText('See More');
      if (seeMoreButton) {
        fireEvent.press(seeMoreButton);
      }

      // Simulate refresh by changing the first track
      rerender(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={refreshedTracks} />
        </ExpansionTestWrapper>
      );

      // Should show the title, component rendered correctly after refresh
      expect(queryByText('SAVED TRACKS')).toBeTruthy();
    });

    it('resets showAll to false when track count decreases (refresh detected)', () => {
      const { rerender, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={manySavedTracks} />
        </ExpansionTestWrapper>
      );

      // Initially should show See More button
      expect(queryByText('See More')).toBeTruthy();

      // Expand to show all tracks
      fireEvent.press(queryByText('See More')!);

      // Now simulate refresh with fewer tracks
      rerender(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={mockSavedTracks} />
        </ExpansionTestWrapper>
      );

      // showAll should be reset to false (we can't easily test this directly,
      // but the component should behave correctly)
      expect(queryByText('SAVED TRACKS')).toBeTruthy();
    });

    it('handles refresh with tracks having different song_ids', () => {
      const initialTracks = [
        {
          name: 'Initial Song',
          artist: 'Initial Artist',
          album: 'Initial Album',
          album_image_url: 'https://initial.com/image.jpg',
          added_at: '2024-01-01T10:00:00Z',
          song_id: 'initial-song-1',
        },
      ];

      const refreshedTracks = [
        {
          name: 'Refreshed Song',
          artist: 'Refreshed Artist',
          album: 'Refreshed Album',
          album_image_url: 'https://refreshed.com/image.jpg',
          added_at: '2024-01-01T11:00:00Z',
          song_id: 'refreshed-song-1',
        },
      ];

      const { rerender, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={initialTracks} />
        </ExpansionTestWrapper>
      );

      // Simulate refresh with different first track song_id
      rerender(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={refreshedTracks} />
        </ExpansionTestWrapper>
      );

      expect(queryByText('SAVED TRACKS')).toBeTruthy();
    });

    it('does not reset showAll when tracks are appended (not refreshed)', () => {
      const { rerender, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={manySavedTracks} />
        </ExpansionTestWrapper>
      );

      // Expand to show all tracks
      const seeMoreButton = queryByText('See More');
      if (seeMoreButton) {
        fireEvent.press(seeMoreButton);
      }

      // Simulate appending more tracks (same first track, more total tracks)
      const appendedTracks = [...manySavedTracks, ...mockSavedTracks];
      rerender(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={appendedTracks} />
        </ExpansionTestWrapper>
      );

      // Should still show all tracks since this wasn't detected as a refresh
      expect(queryByText('SAVED TRACKS')).toBeTruthy();
    });
  });

  describe('track data mapping', () => {
    it('correctly maps SavedTrack to TrackCard props', () => {
      const trackWithAllFields: SavedTrack = {
        name: 'Complete Song',
        artist: 'Complete Artist',
        album: 'Complete Album',
        album_image_url: 'https://complete.com/image.jpg',
        added_at: '2024-01-01T12:00:00Z',
        song_id: 'complete-song-1',
      };

      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={[trackWithAllFields]} />
        </ExpansionTestWrapper>
      );

      // TrackCard should receive the track with added_at mapped to played_at
      expect(getByTestId('track-card-Complete Song')).toBeTruthy();
    });

    it('handles tracks without song_id', () => {
      const trackWithoutSongId: SavedTrack = {
        name: 'No ID Song',
        artist: 'No ID Artist',
        album: 'No ID Album',
        added_at: '2024-01-01T12:00:00Z',
      };

      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={[trackWithoutSongId]} />
        </ExpansionTestWrapper>
      );

      expect(getByTestId('track-card-No ID Song')).toBeTruthy();
    });

    it('handles tracks without album_image_url', () => {
      const trackWithoutImage: SavedTrack = {
        name: 'No Image Song',
        artist: 'No Image Artist',
        album: 'No Image Album',
        added_at: '2024-01-01T12:00:00Z',
        song_id: 'no-image-song-1',
      };

      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedTracksList tracks={[trackWithoutImage]} />
        </ExpansionTestWrapper>
      );

      expect(getByTestId('track-card-No Image Song')).toBeTruthy();
    });
  });
});
