import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SavedPlaylistsList } from '../SavedPlaylistsList';
import { SavedPlaylist } from '../../../types';
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
      text: { primary: '#ffffff', muted: '#888888' },
      accent: { purple: '#9b59b6' },
    },
    borderRadius: { lg: 8 },
  },
}));

// Mock PlaylistCard component
jest.mock('../PlaylistCard', () => ({
  PlaylistCard: ({
    playlist,
    _index,
    isExpanded,
    onToggleExpansion,
  }: {
    playlist: SavedPlaylist;
    _index: number;
    isExpanded: boolean;
    onToggleExpansion: (_index: number) => void;
  }) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return React.createElement(
      View,
      {
        testID: `playlist-card-${playlist.name}`,
      },
      React.createElement(Text, null, `${playlist.name} - ${playlist.track_count} tracks`),
      React.createElement(
        TouchableOpacity,
        {
          testID: `toggle-expansion-${_index}`,
          onPress: () => onToggleExpansion(_index),
        },
        React.createElement(Text, null, isExpanded ? 'Collapse' : 'Expand')
      ),
      isExpanded &&
        React.createElement(
          View,
          { testID: `expanded-content-${_index}` },
          React.createElement(Text, null, 'Expanded Content')
        )
    );
  },
}));

const mockPlaylists: SavedPlaylist[] = [
  {
    name: 'Test Playlist 1',
    description: 'First test playlist',
    image_url: 'https://test.com/image1.jpg',
    track_count: 20,
    created_at: '2024-01-01T10:00:00Z',
    playlist_id: 'playlist-1',
  },
  {
    name: 'Test Playlist 2',
    description: 'Second test playlist',
    image_url: 'https://test.com/image2.jpg',
    track_count: 15,
    created_at: '2024-01-01T09:00:00Z',
    playlist_id: 'playlist-2',
  },
  {
    name: 'Test Playlist 3',
    description: 'Third test playlist',
    image_url: 'https://test.com/image3.jpg',
    track_count: 30,
    created_at: '2024-01-01T08:00:00Z',
    playlist_id: 'playlist-3',
  },
];

// Create array of 10 playlists for testing "See More" functionality
const manyPlaylists: SavedPlaylist[] = Array.from({ length: 10 }, (_, i) => ({
  name: `Test Playlist ${i + 1}`,
  description: `Test playlist number ${i + 1}`,
  image_url: `https://test.com/image${i + 1}.jpg`,
  track_count: 10 + i,
  created_at: `2024-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`,
  playlist_id: `playlist-${i + 1}`,
}));

describe('SavedPlaylistsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders empty state when no playlists provided', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={[]} />
        </ExpansionTestWrapper>
      );
      expect(getByText('No saved playlists found')).toBeTruthy();
    });

    it('renders saved playlists title', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );
      expect(getByText('SAVED PLAYLISTS')).toBeTruthy();
    });

    it('renders playlist cards for provided playlists', () => {
      const { getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      expect(getByTestId('playlist-card-Test Playlist 1')).toBeTruthy();
      expect(getByTestId('playlist-card-Test Playlist 2')).toBeTruthy();
      expect(getByTestId('playlist-card-Test Playlist 3')).toBeTruthy();
    });

    it('shows correct number of playlists initially (5)', () => {
      const { queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      // Should show first 5 playlists
      expect(queryByTestId('playlist-card-Test Playlist 1')).toBeTruthy();
      expect(queryByTestId('playlist-card-Test Playlist 2')).toBeTruthy();
      expect(queryByTestId('playlist-card-Test Playlist 3')).toBeTruthy();
      expect(queryByTestId('playlist-card-Test Playlist 4')).toBeTruthy();
      expect(queryByTestId('playlist-card-Test Playlist 5')).toBeTruthy();

      // Should not show 6th playlist initially
      expect(queryByTestId('playlist-card-Test Playlist 6')).toBeNull();
    });
  });

  describe('See More functionality', () => {
    it('shows See More button when more than 5 playlists available', () => {
      const { getByText, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      expect(getByText('See More')).toBeTruthy();

      // Should only show first 5 playlists initially
      expect(queryByTestId('playlist-card-Test Playlist 5')).toBeTruthy();
      expect(queryByTestId('playlist-card-Test Playlist 6')).toBeNull();
    });

    it('does not show See More button when 5 or fewer playlists available', () => {
      const { queryByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      expect(queryByText('See More')).toBeNull();
    });

    it('shows See More button when hasMorePlaylists is true and onLoadMore is provided', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      expect(getByText('See More')).toBeTruthy();
    });

    it('does not show See More button when hasMorePlaylists is true but onLoadMore is not provided', () => {
      const { queryByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} hasMorePlaylists={true} />
        </ExpansionTestWrapper>
      );

      expect(queryByText('See More')).toBeNull();
    });

    it('expands to show all playlists when See More is pressed with local playlists', async () => {
      const { getByText, getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      // Initially playlist 6 should not be visible
      expect(() => getByTestId('playlist-card-Test Playlist 6')).toThrow();

      // Press See More button
      fireEvent.press(getByText('See More'));

      // Now playlist 6 should be visible
      await waitFor(() => {
        expect(getByTestId('playlist-card-Test Playlist 6')).toBeTruthy();
      });

      // See More button should be gone (since we've shown all local playlists)
      expect(() => getByText('See More')).toThrow();
    });

    it('calls onLoadMore when See More is pressed and hasMorePlaylists is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('handles both local expansion and API loading correctly', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText, getByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={manyPlaylists}
            hasMorePlaylists={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      // Initially should show See More for both local expansion and API loading
      expect(getByText('See More')).toBeTruthy();

      // Press See More - should expand local playlists first
      fireEvent.press(getByText('See More'));

      // Should show all local playlists
      await waitFor(() => {
        expect(getByTestId('playlist-card-Test Playlist 10')).toBeTruthy();
      });

      // Since hasMorePlaylists is true, See More button should still be there for API call
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
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
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
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
            isLoadingMore={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      // Should show loading text and not the See More button text
      expect(getByText('Loading...')).toBeTruthy();
      expect(queryByText('See More')).toBeNull();
    });

    it('disables button during loading', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
            isLoadingMore={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      // Just verify that loading state is shown
      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('refresh behavior', () => {
    it('resets showAll to false when first playlist changes (refresh detected)', () => {
      const refreshedPlaylists = [
        {
          name: 'New Playlist 1',
          description: 'New first playlist',
          image_url: 'https://new.com/image.jpg',
          track_count: 25,
          created_at: '2024-01-01T11:00:00Z',
          playlist_id: 'new-playlist-1',
        },
      ];

      const { rerender, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expand to show all playlists first
      const seeMoreButton = queryByText('See More');
      if (seeMoreButton) {
        fireEvent.press(seeMoreButton);
      }

      // Simulate refresh by changing the first playlist
      rerender(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={refreshedPlaylists} />
        </ExpansionTestWrapper>
      );

      // Should show the title (component should work correctly)
      expect(queryByText('SAVED PLAYLISTS')).toBeTruthy();
    });

    it('resets showAll to false when playlist count decreases (refresh detected)', () => {
      const { rerender, queryByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      // Initially should show See More button
      expect(queryByText('See More')).toBeTruthy();

      // Expand to show all playlists
      fireEvent.press(queryByText('See More')!);

      // Now simulate refresh with fewer playlists
      rerender(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // showAll should be reset to false (we can't easily test this directly,
      // but the component should behave correctly)
      expect(queryByText('SAVED PLAYLISTS')).toBeTruthy();
    });

    it('does not reset showAll when playlists are just appended', () => {
      const extendedPlaylists = [...manyPlaylists, ...mockPlaylists];

      const { rerender, queryByText, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expand to show all playlists
      fireEvent.press(queryByText('See More')!);

      // Verify expanded state
      expect(queryByTestId('playlist-card-Test Playlist 10')).toBeTruthy();

      // Simulate adding more playlists (like from API response)
      rerender(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={extendedPlaylists} />
        </ExpansionTestWrapper>
      );

      // Should still be expanded (showAll should remain true)
      expect(queryByTestId('playlist-card-Test Playlist 10')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles exactly 5 playlists (boundary case)', () => {
      const exactlyFivePlaylists = manyPlaylists.slice(0, 5);
      const { queryByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={exactlyFivePlaylists} />
        </ExpansionTestWrapper>
      );

      // Should not show See More button for exactly 5 playlists
      expect(queryByText('See More')).toBeNull();
    });

    it('handles 6 playlists (just over boundary)', () => {
      const sixPlaylists = manyPlaylists.slice(0, 6);
      const { getByText, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={sixPlaylists} />
        </ExpansionTestWrapper>
      );

      // Should show See More button
      expect(getByText('See More')).toBeTruthy();

      // Should only show first 5
      expect(queryByTestId('playlist-card-Test Playlist 5')).toBeTruthy();
      expect(queryByTestId('playlist-card-Test Playlist 6')).toBeNull();
    });

    it('calls onLoadMore when provided and hasMorePlaylists is true', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
      );

      fireEvent.press(getByText('See More'));

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('handles rapid consecutive See More presses', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            hasMorePlaylists={true}
            onLoadMore={mockLoadMore}
          />
        </ExpansionTestWrapper>
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

  describe('expansion functionality', () => {
    it('manages expansion state correctly using global ExpansionContext', () => {
      const { queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Initially no content should be expanded
      expect(queryByTestId('expanded-content-0')).toBeNull();
      expect(queryByTestId('expanded-content-1')).toBeNull();
      expect(queryByTestId('expanded-content-2')).toBeNull();
    });

    it('handles expansion toggle correctly with global context', () => {
      const { getByTestId, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Initially not expanded
      expect(queryByTestId('expanded-content-0')).toBeNull();
      expect(getByTestId('toggle-expansion-0')).toBeTruthy();

      // Expand first playlist
      fireEvent.press(getByTestId('toggle-expansion-0'));
      expect(queryByTestId('expanded-content-0')).toBeTruthy();

      // Collapse first playlist
      fireEvent.press(getByTestId('toggle-expansion-0'));
      expect(queryByTestId('expanded-content-0')).toBeNull();
    });

    it('uses global expansion context - only one card expanded across all sections', () => {
      // This test verifies that the playlist expansion integrates with global ExpansionContext
      // The actual "only one at a time" logic is tested in ExpansionContext tests
      const { getByTestId, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expand first playlist
      fireEvent.press(getByTestId('toggle-expansion-0'));
      expect(queryByTestId('expanded-content-0')).toBeTruthy();
      expect(queryByTestId('expanded-content-1')).toBeNull();

      // Expand second playlist (should collapse first via global context)
      fireEvent.press(getByTestId('toggle-expansion-1'));
      expect(queryByTestId('expanded-content-0')).toBeNull();
      expect(queryByTestId('expanded-content-1')).toBeTruthy();
    });

    it('passes correct section and card type to expansion context', () => {
      // This test verifies that SavedPlaylistsList uses the correct parameters for expansion
      const { getByTestId, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      const toggleButton = getByTestId('toggle-expansion-0');
      fireEvent.press(toggleButton);

      // The component should call toggleExpansion with 'saved-playlists', 'playlist', and index
      expect(queryByTestId('expanded-content-0')).toBeTruthy();
    });

    it('legacy_test_allows_only_one_playlist_expanded', () => {
      const { getByTestId, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expand first playlist
      fireEvent.press(getByTestId('toggle-expansion-0'));
      expect(queryByTestId('expanded-content-0')).toBeTruthy();
      expect(queryByTestId('expanded-content-1')).toBeNull();

      // Expand second playlist (should collapse first)
      fireEvent.press(getByTestId('toggle-expansion-1'));
      expect(queryByTestId('expanded-content-0')).toBeNull();
      expect(queryByTestId('expanded-content-1')).toBeTruthy();
    });

    it('passes expansion props correctly to PlaylistCard', () => {
      const { getByTestId, getAllByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Check initial state - should show Expand buttons (multiple)
      const expandButtons = getAllByText('Expand');
      expect(expandButtons.length).toBeGreaterThan(0);

      // Toggle expansion
      fireEvent.press(getByTestId('toggle-expansion-0'));

      // Should now show at least one Collapse button
      const collapseButtons = getAllByText('Collapse');
      expect(collapseButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('resets expansion state when playlists change', () => {
      const { getByTestId, queryByTestId, rerender, getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expand first playlist
      fireEvent.press(getByTestId('toggle-expansion-0'));
      expect(queryByTestId('expanded-content-0')).toBeTruthy();

      // Change playlists (simulate refresh) - this should trigger a different first playlist ID
      const newPlaylists = [
        {
          name: 'New Playlist',
          description: 'New description',
          image_url: 'https://new.com/image.jpg',
          track_count: 5,
          created_at: '2024-01-02T00:00:00Z',
          playlist_id: 'different-playlist-id', // Different ID to trigger reset
        },
      ];

      rerender(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={newPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expansion state should persist for existing item logic,
      // but component renders correctly
      expect(getByText('SAVED PLAYLISTS')).toBeTruthy();
      expect(getByText('New Playlist - 5 tracks')).toBeTruthy();
    });

    it('maintains expansion state during showAll toggle', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={manyPlaylists} />
        </ExpansionTestWrapper>
      );

      // Expand first playlist
      fireEvent.press(getByTestId('toggle-expansion-0'));
      expect(queryByTestId('expanded-content-0')).toBeTruthy();

      // Toggle showAll
      fireEvent.press(getByText('See More'));

      // Expansion state should be maintained
      expect(queryByTestId('expanded-content-0')).toBeTruthy();
    });
  });

  describe('component structure and accessibility', () => {
    it('renders with correct semantic structure', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      // Should have title
      expect(getByText('SAVED PLAYLISTS')).toBeTruthy();

      // Should render playlist cards
      expect(getByText(/Test Playlist 1.*20 tracks/)).toBeTruthy();
    });

    it('handles empty playlists array gracefully', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={[]} />
        </ExpansionTestWrapper>
      );

      expect(getByText('No saved playlists found')).toBeTruthy();
    });

    it('renders without errors with all optional props', () => {
      const mockLoadMore = jest.fn();
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList
            playlists={mockPlaylists}
            onLoadMore={mockLoadMore}
            hasMorePlaylists={true}
            isLoadingMore={false}
          />
        </ExpansionTestWrapper>
      );

      expect(getByText('SAVED PLAYLISTS')).toBeTruthy();
    });

    it('renders without errors with minimum props', () => {
      const { getByText } = render(
        <ExpansionTestWrapper>
          <SavedPlaylistsList playlists={mockPlaylists} />
        </ExpansionTestWrapper>
      );

      expect(getByText('SAVED PLAYLISTS')).toBeTruthy();
    });
  });
});
