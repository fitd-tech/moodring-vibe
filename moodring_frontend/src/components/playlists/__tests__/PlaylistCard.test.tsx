import React from 'react';
import { render } from '@testing-library/react-native';
import { PlaylistCard } from '../PlaylistCard';
import { SavedPlaylist } from '../../../types';

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
    return React.createElement(View, { testID: 'tagging-interface' }, 
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
    generatePlaylistId: jest.fn((name, id) => `playlist_${id}_${name.toLowerCase()}`),
    getSongTags: jest.fn().mockResolvedValue([]),
  },
}));

// Mock useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

const mockPlaylistWithImage: SavedPlaylist = {
  name: 'Test Playlist',
  description: 'This is a test playlist description',
  image_url: 'https://example.com/playlist.jpg',
  track_count: 25,
  created_at: '2024-01-01T00:00:00Z',
  playlist_id: 'test-playlist-id',
};

const mockPlaylistWithoutImage: SavedPlaylist = {
  name: 'No Image Playlist',
  description: 'This playlist has no image',
  image_url: undefined,
  track_count: 1,
  created_at: '2024-01-01T00:00:00Z',
  playlist_id: 'no-image-playlist-id',
};

const mockPlaylistWithoutDescription: SavedPlaylist = {
  name: 'No Description Playlist',
  description: undefined,
  image_url: 'https://example.com/playlist2.jpg',
  track_count: 10,
  created_at: '2024-01-01T00:00:00Z',
  playlist_id: 'no-desc-playlist-id',
};

const mockPlaylistWithLongDescription: SavedPlaylist = {
  name: 'Long Description Playlist',
  description: 'This is a very long description that should be truncated because it exceeds the maximum length limit that we have set for playlist descriptions in the UI to maintain clean formatting',
  image_url: 'https://example.com/playlist3.jpg',
  track_count: 50,
  created_at: '2024-01-01T00:00:00Z',
  playlist_id: 'long-desc-playlist-id',
};

describe('PlaylistCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders playlist information correctly', () => {
      const { getByText } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('Test Playlist')).toBeTruthy();
      expect(getByText('This is a test playlist description')).toBeTruthy();
      expect(getByText('25 tracks')).toBeTruthy();
    });

    it('renders with correct testID', () => {
      const { getByTestId } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={5} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByTestId('playlist-card-5')).toBeTruthy();
    });

    it('renders playlist without image (shows placeholder)', () => {
      const { getByText, queryByRole } = render(<PlaylistCard playlist={mockPlaylistWithoutImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('No Image Playlist')).toBeTruthy();
      expect(getByText('This playlist has no image')).toBeTruthy();
      // The placeholder should be rendered as a View, not an Image
      expect(queryByRole('image')).toBeNull();
    });

    it('renders playlist image when provided', () => {
      const { UNSAFE_getByType } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source.uri).toBe('https://example.com/playlist.jpg');
    });
  });

  describe('track count formatting', () => {
    it('formats singular track count correctly', () => {
      const { getByText } = render(<PlaylistCard playlist={mockPlaylistWithoutImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('1 track')).toBeTruthy();
    });

    it('formats plural track count correctly', () => {
      const { getByText } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('25 tracks')).toBeTruthy();
    });

    it('formats zero tracks correctly', () => {
      const zeroTracksPlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        track_count: 0,
      };

      const { getByText } = render(<PlaylistCard playlist={zeroTracksPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('0 tracks')).toBeTruthy();
    });

    it('formats large track count correctly', () => {
      const { getByText } = render(<PlaylistCard playlist={mockPlaylistWithLongDescription} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('50 tracks')).toBeTruthy();
    });
  });

  describe('description handling', () => {
    it('shows "No description" when description is undefined', () => {
      const { getByText } = render(<PlaylistCard playlist={mockPlaylistWithoutDescription} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('No description')).toBeTruthy();
    });

    it('shows "No description" when description is empty string', () => {
      const emptyDescPlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        description: '',
      };

      const { getByText } = render(<PlaylistCard playlist={emptyDescPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('No description')).toBeTruthy();
    });

    it('truncates long descriptions properly', () => {
      const { getByText, queryByText } = render(<PlaylistCard playlist={mockPlaylistWithLongDescription} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      // Should show truncated version with ellipsis
      const truncatedText = getByText(/This is a very long description that should be truncated because it exceeds the maximum length.../);
      expect(truncatedText).toBeTruthy();
      
      // Should not show the full original text
      expect(queryByText(mockPlaylistWithLongDescription.description!)).toBeNull();
    });

    it('does not truncate short descriptions', () => {
      const { getByText } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('This is a test playlist description')).toBeTruthy();
    });

    it('handles exactly 100 character descriptions', () => {
      const exactLengthPlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        description: 'A'.repeat(100),
      };

      const { getByText } = render(<PlaylistCard playlist={exactLengthPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('A'.repeat(100))).toBeTruthy();
    });

    it('truncates descriptions longer than 100 characters', () => {
      const longPlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        description: 'A'.repeat(101),
      };

      const { getByText } = render(<PlaylistCard playlist={longPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('A'.repeat(100) + '...')).toBeTruthy();
    });
  });

  describe('component structure', () => {
    it('renders within GradientCard', () => {
      const { getByTestId } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByTestId('gradient-card')).toBeTruthy();
    });

    it('handles all required props correctly', () => {
      const { getByText, getByTestId } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={3} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByTestId('playlist-card-3')).toBeTruthy();
      expect(getByText('Test Playlist')).toBeTruthy();
    });

    it('renders without errors with minimum required data', () => {
      const minimalPlaylist: SavedPlaylist = {
        name: 'Minimal',
        description: undefined,
        image_url: undefined,
        track_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        playlist_id: 'minimal-id',
      };

      const { getByText } = render(<PlaylistCard playlist={minimalPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('Minimal')).toBeTruthy();
      expect(getByText('No description')).toBeTruthy();
      expect(getByText('0 tracks')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('includes testID for testing accessibility', () => {
      const { getByTestId } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={7} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByTestId('playlist-card-7')).toBeTruthy();
    });

    it('handles different index values correctly', () => {
      const { getByTestId } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);
      expect(getByTestId('playlist-card-0')).toBeTruthy();

      const { getByTestId: getByTestId2 } = render(<PlaylistCard playlist={mockPlaylistWithImage} _index={99} isExpanded={false} onToggleExpansion={jest.fn()} />);
      expect(getByTestId2('playlist-card-99')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles special characters in playlist name', () => {
      const specialCharPlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        name: 'Test & Special "Characters" [2024]',
      };

      const { getByText } = render(<PlaylistCard playlist={specialCharPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('Test & Special "Characters" [2024]')).toBeTruthy();
    });

    it('handles very long playlist names', () => {
      const longNamePlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        name: 'This is a very long playlist name that might cause layout issues in some cases',
      };

      const { getByText } = render(<PlaylistCard playlist={longNamePlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('This is a very long playlist name that might cause layout issues in some cases')).toBeTruthy();
    });

    it('handles negative track count gracefully', () => {
      const negativeTracksPlaylist: SavedPlaylist = {
        ...mockPlaylistWithImage,
        track_count: -1,
      };

      const { getByText } = render(<PlaylistCard playlist={negativeTracksPlaylist} _index={0} isExpanded={false} onToggleExpansion={jest.fn()} />);

      expect(getByText('-1 tracks')).toBeTruthy();
    });
  });
});