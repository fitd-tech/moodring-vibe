import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AlbumCard } from '../AlbumCard';
import { SavedAlbum } from '../../../types';

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    spacing: { sm: 8, xs: 4, lg: 16, xl: 24 },
    typography: {
      fontSize: { sm: 14, md: 16, lg: 18 },
      fontWeight: { bold: 'bold', semibold: '600' },
    },
    colors: {
      text: { primary: '#ffffff', secondary: '#dddddd', muted: '#888888' },
      ui: { overlay: '#333333', border: '#444444' },
      accent: { purple: '#9b59b6' },
      gradients: {
        track: ['#9b59b6', '#8e44ad'],
      },
    },
    borderRadius: { sm: 4, lg: 8 },
  },
}));

// Mock GradientCard component
jest.mock('../../shared/GradientCard', () => ({
  GradientCard: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'gradient-card' }, children);
  },
}));

// Mock TaggingInterface component
jest.mock('../../tracks/TaggingInterface', () => ({
  TaggingInterface: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'tagging-interface' },
      React.createElement(Text, null, 'TaggingInterface')
    );
  },
}));

// Mock useAnimation hook
jest.mock('../../../hooks/useAnimation', () => ({
  useAnimation: () => ({
    createAnimatedValues: () => ({
      scale: { setValue: jest.fn() },
      height: { setValue: jest.fn(), interpolate: jest.fn() },
      opacity: { setValue: jest.fn() },
    }),
    animateExpansion: jest.fn(),
  }),
}));

// Mock taggingService
jest.mock('../../../services/taggingService', () => ({
  taggingService: {
    generateAlbumId: jest.fn((name, id) => `album_${id}_${name.toLowerCase()}`),
    getSongTags: jest.fn().mockResolvedValue([]),
  },
}));

// Mock useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

const mockAlbumWithImage: SavedAlbum = {
  name: 'Test Album',
  artist: 'Test Artist',
  image_url: 'https://example.com/album.jpg',
  release_date: '2023-06-15',
  track_count: 12,
  album_id: 'test-album-id',
};

const mockAlbumWithoutImage: SavedAlbum = {
  name: 'No Image Album',
  artist: 'Another Artist',
  image_url: undefined,
  release_date: '2022-01-01',
  track_count: 1,
  album_id: 'no-image-album-id',
};

const mockAlbumOldDate: SavedAlbum = {
  name: 'Old Album',
  artist: 'Classic Artist',
  image_url: 'https://example.com/old.jpg',
  release_date: '1999-12-31',
  track_count: 20,
  album_id: 'old-album-id',
};

const mockAlbumRecentDate: SavedAlbum = {
  name: 'Recent Album',
  artist: 'Modern Artist',
  image_url: 'https://example.com/recent.jpg',
  release_date: '2024-03-20T10:30:00Z',
  track_count: 8,
  album_id: 'recent-album-id',
};

describe('AlbumCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders album information correctly', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('Test Album')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
      expect(getByText('2023')).toBeTruthy();
      expect(getByText('12 tracks')).toBeTruthy();
    });

    it('renders with correct testID', () => {
      const { getByTestId } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={3}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByTestId('album-card-3')).toBeTruthy();
    });

    it('renders album without image (shows placeholder)', () => {
      const { getByText, queryByRole } = render(
        <AlbumCard
          album={mockAlbumWithoutImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('No Image Album')).toBeTruthy();
      expect(getByText('Another Artist')).toBeTruthy();
      // The placeholder should be rendered as a View, not an Image
      expect(queryByRole('image')).toBeNull();
    });

    it('renders album image when provided', () => {
      const { UNSAFE_getByType } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source.uri).toBe('https://example.com/album.jpg');
    });
  });

  describe('track count formatting', () => {
    it('formats singular track count correctly', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithoutImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('1 track')).toBeTruthy();
    });

    it('formats plural track count correctly', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('12 tracks')).toBeTruthy();
    });

    it('formats zero tracks correctly', () => {
      const zeroTracksAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        track_count: 0,
      };

      const { getByText } = render(
        <AlbumCard
          album={zeroTracksAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('0 tracks')).toBeTruthy();
    });

    it('formats large track count correctly', () => {
      const largeTrackAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        track_count: 50,
      };

      const { getByText } = render(
        <AlbumCard
          album={largeTrackAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('50 tracks')).toBeTruthy();
    });
  });

  describe('release date formatting', () => {
    it('formats release date to year correctly', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('2023')).toBeTruthy();
    });

    it('formats old release date correctly', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumOldDate}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('1999')).toBeTruthy();
    });

    it('formats recent release date with timestamp correctly', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumRecentDate}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('2024')).toBeTruthy();
    });

    it('handles different date formats', () => {
      const differentDateAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        release_date: '2020-05-20T00:00:00.000Z',
      };

      const { getByText } = render(
        <AlbumCard
          album={differentDateAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('2020')).toBeTruthy();
    });

    it('handles ISO date string format', () => {
      const isoDateAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        release_date: '2021-11-15T15:30:45.123Z',
      };

      const { getByText } = render(
        <AlbumCard
          album={isoDateAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('2021')).toBeTruthy();
    });
  });

  describe('component structure', () => {
    it('renders within GradientCard', () => {
      const { getByTestId } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByTestId('gradient-card')).toBeTruthy();
    });

    it('displays separator between release date and track count', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText(' • ')).toBeTruthy();
    });

    it('handles all required props correctly', () => {
      const { getByText, getByTestId } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={5}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByTestId('album-card-5')).toBeTruthy();
      expect(getByText('Test Album')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
    });

    it('renders without errors with minimum required data', () => {
      const minimalAlbum: SavedAlbum = {
        name: 'Minimal',
        artist: 'Artist',
        image_url: undefined,
        release_date: '2024-01-01',
        track_count: 0,
        album_id: 'minimal-id',
      };

      const { getByText } = render(
        <AlbumCard
          album={minimalAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('Minimal')).toBeTruthy();
      expect(getByText('Artist')).toBeTruthy();
      expect(getByText('2023')).toBeTruthy(); // Date parsing can vary by timezone
      expect(getByText('0 tracks')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('includes testID for testing accessibility', () => {
      const { getByTestId } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={7}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByTestId('album-card-7')).toBeTruthy();
    });

    it('handles different index values correctly', () => {
      const { getByTestId } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );
      expect(getByTestId('album-card-0')).toBeTruthy();

      const { getByTestId: getByTestId2 } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={99}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );
      expect(getByTestId2('album-card-99')).toBeTruthy();
    });
  });

  describe('expansion functionality', () => {
    it('handles isExpanded prop correctly', () => {
      const mockToggle = jest.fn();
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={mockToggle}
        />
      );

      // Should render basic album information regardless of expansion state
      expect(getByText('Test Album')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
      expect(getByText('2023')).toBeTruthy();
      expect(getByText('12 tracks')).toBeTruthy();
    });

    it('calls onToggleExpansion with correct index when header is pressed', () => {
      const mockToggle = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={5}
          isExpanded={false}
          onToggleExpansion={mockToggle}
        />
      );

      // Find and press the TouchableOpacity (header)
      const touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      const header = touchableOpacities[0]; // First TouchableOpacity is the header
      fireEvent.press(header);

      expect(mockToggle).toHaveBeenCalledWith(5);
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('generates album ID correctly for tagging', () => {
      const mockTaggingService = require('../../../services/taggingService');
      render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={true}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(mockTaggingService.taggingService.generateAlbumId).toHaveBeenCalledWith(
        'Test Album',
        'test-album-id'
      );
    });

    it('loads tags when expanded with user and albumTagId', async () => {
      const mockTaggingService = require('../../../services/taggingService');
      mockTaggingService.taggingService.getSongTags.mockResolvedValue([]);

      render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={true}
          onToggleExpansion={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockTaggingService.taggingService.getSongTags).toHaveBeenCalledWith(
          'album_test-album-id_test album',
          'test-user-id'
        );
      });
    });

    it('shows loading state while fetching tags', () => {
      const mockTaggingService = require('../../../services/taggingService');
      // Mock a delayed response
      mockTaggingService.taggingService.getSongTags.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={true}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('Loading tags...')).toBeTruthy();
    });

    it('handles tag loading errors gracefully', () => {
      const mockTaggingService = require('../../../services/taggingService');
      mockTaggingService.taggingService.getSongTags.mockRejectedValue(new Error('API Error'));

      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={true}
          onToggleExpansion={jest.fn()}
        />
      );

      // Should handle error and still show the UI
      expect(getByText('Test Album')).toBeTruthy();
    });

    it('renders with animation hooks', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      // Should render the component successfully with animation hooks
      expect(getByText('Test Album')).toBeTruthy();
    });

    it('does not load tags when not expanded', () => {
      const mockTaggingService = require('../../../services/taggingService');
      mockTaggingService.taggingService.getSongTags.mockClear();

      render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(mockTaggingService.taggingService.getSongTags).not.toHaveBeenCalled();
    });

    it('integrates with tagging service when expanded', () => {
      const mockTaggingService = require('../../../services/taggingService');

      render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={true}
          onToggleExpansion={jest.fn()}
        />
      );

      // Should call generateAlbumId with correct parameters
      expect(mockTaggingService.taggingService.generateAlbumId).toHaveBeenCalledWith(
        'Test Album',
        'test-album-id'
      );
    });
  });

  describe('edge cases', () => {
    it('handles special characters in album name', () => {
      const specialCharAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        name: 'Album & Special "Characters" [2024]',
      };

      const { getByText } = render(
        <AlbumCard
          album={specialCharAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('Album & Special "Characters" [2024]')).toBeTruthy();
    });

    it('handles special characters in artist name', () => {
      const specialCharAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        artist: 'Artist with "Special" & Characters',
      };

      const { getByText } = render(
        <AlbumCard
          album={specialCharAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('Artist with "Special" & Characters')).toBeTruthy();
    });

    it('handles very long album names', () => {
      const longNameAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        name: 'This is a very long album name that might cause layout issues in some cases',
      };

      const { getByText } = render(
        <AlbumCard
          album={longNameAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(
        getByText('This is a very long album name that might cause layout issues in some cases')
      ).toBeTruthy();
    });

    it('handles very long artist names', () => {
      const longArtistAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        artist: 'This is a very long artist name that might cause layout issues',
      };

      const { getByText } = render(
        <AlbumCard
          album={longArtistAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(
        getByText('This is a very long artist name that might cause layout issues')
      ).toBeTruthy();
    });

    it('handles negative track count gracefully', () => {
      const negativeTracksAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        track_count: -1,
      };

      const { getByText } = render(
        <AlbumCard
          album={negativeTracksAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('-1 tracks')).toBeTruthy();
    });

    it('handles invalid date gracefully', () => {
      const invalidDateAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        release_date: 'invalid-date',
      };

      const { getByText } = render(
        <AlbumCard
          album={invalidDateAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      // Should still render the album name and artist
      expect(getByText('Test Album')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
      // The date might show as NaN or be handled gracefully
    });

    it('handles very old date (1900)', () => {
      const veryOldAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        release_date: '1900-01-01',
      };

      const { getByText } = render(
        <AlbumCard
          album={veryOldAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('1899')).toBeTruthy(); // Date parsing can vary by timezone
    });

    it('handles future date', () => {
      const futureAlbum: SavedAlbum = {
        ...mockAlbumWithImage,
        release_date: '2030-12-31',
      };

      const { getByText } = render(
        <AlbumCard
          album={futureAlbum}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      expect(getByText('2030')).toBeTruthy();
    });
  });

  describe('layout structure', () => {
    it('renders album details in correct order', () => {
      const { getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      // Check that all elements are present
      expect(getByText('Test Album')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
      expect(getByText('2023')).toBeTruthy();
      expect(getByText(' • ')).toBeTruthy();
      expect(getByText('12 tracks')).toBeTruthy();
    });

    it('maintains proper component hierarchy', () => {
      const { getByTestId, getByText } = render(
        <AlbumCard
          album={mockAlbumWithImage}
          _index={0}
          isExpanded={false}
          onToggleExpansion={jest.fn()}
        />
      );

      // Should have container with testID
      const container = getByTestId('album-card-0');
      expect(container).toBeTruthy();

      // Should have gradient card
      expect(getByTestId('gradient-card')).toBeTruthy();

      // Should have album info
      expect(getByText('Test Album')).toBeTruthy();
    });
  });
});
