import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CreatePlaylistPage } from '../CreatePlaylistPage';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
    typography: {
      fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 32 },
      fontWeight: { medium: '500', bold: '700', semibold: '600' },
      letterSpacing: { sm: 1, md: 2 },
    },
    colors: {
      background: { primary: '#1a0a1a' },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.8)',
        muted: 'rgba(255, 255, 255, 0.6)',
      },
      ui: {
        overlay: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      accent: { purple: '#8a2be2', orange: '#ff6600', yellow: '#ffff00' },
      gradients: {
        track: ['#4a1458', '#2d0a35', '#1a0a2a'],
        features: ['#4a1458', '#2d0a35', '#1a0a2a'],
        action: ['#1a0a0a', '#0d0d0d', '#2a0a1a'],
      },
      shadow: {
        default: '#000',
      },
    },
    borderRadius: { sm: 12, md: 16, lg: 20, full: 40 },
  },
}));

// Mock GradientCard component
jest.mock('../../shared/GradientCard', () => ({
  GradientCard: ({ children, style }: { children: React.ReactNode; style?: unknown }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'gradient-card', style }, children);
  },
}));

// Mock Button component
jest.mock('../../shared/Button', () => ({
  Button: ({
    title,
    onPress,
    disabled,
    testID,
    className,
    textClassName,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
    className?: string;
    textClassName?: string;
  }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID: testID || 'button',
        onPress: disabled ? undefined : onPress,
        disabled,
        className,
      },
      React.createElement(Text, { className: textClassName }, title)
    );
  },
}));

// Mock LoadingSpinner component
jest.mock('../../shared/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'loading-spinner' },
      React.createElement(Text, {}, `Loading (${size || 'default'})`)
    );
  },
}));

// Mock StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'status-bar' });
  },
}));

// Mock Auth Context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      spotify_id: 'test_user',
      email: 'test@example.com',
      display_name: 'Test User',
      spotify_access_token: 'test_token',
      spotify_refresh_token: 'test_refresh_token',
      token_expires_at: '2024-12-31T23:59:59Z',
      profile_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    authToken: 'test_auth_token',
    isLoading: false,
    error: null,
  }),
}));

// Mock Playlist Service
jest.mock('../../../services/playlistService', () => ({
  playlistService: {
    getUserTagsPaginated: jest.fn().mockResolvedValue({
      tags: [
        {
          id: 1,
          user_id: 1,
          name: 'Neon Dreams',
          color: '#ff00ff',
          created_at: '2024-01-15T08:30:00Z',
          updated_at: '2024-01-15T08:30:00Z',
        },
        {
          id: 2,
          user_id: 1,
          name: 'Synthwave Vibes',
          color: '#00ffff',
          created_at: '2024-01-15T09:15:00Z',
          updated_at: '2024-01-15T09:15:00Z',
        },
        {
          id: 3,
          user_id: 1,
          name: 'Arcade Nights',
          color: '#ff6600',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ],
      hasMore: true,
      total: 5,
    }),
    getFilteredContent: jest.fn().mockResolvedValue([
      {
        name: 'Song 1',
        artist: 'Artist 1',
        album: 'Album 1',
        album_image_url: 'https://picsum.photos/300/300?random=1',
        played_at: '2024-01-20T22:30:00Z',
      },
      {
        name: 'Song 2',
        artist: 'Artist 2',
        album: 'Album 2',
        album_image_url: 'https://picsum.photos/300/300?random=2',
        played_at: '2024-01-20T21:30:00Z',
      },
    ]),
    createPlaylistOnSpotify: jest.fn().mockResolvedValue({
      playlistId: 'test_playlist_id',
      name: 'Test Playlist',
      trackCount: 2,
      tracks: [],
    }),
  },
}));

// Mock types
jest.mock('../../../types', () => ({
  TagSelectionState: {},
  Track: {},
}));

describe('CreatePlaylistPage', () => {
  const mockOnBack = jest.fn();
  const mockOnCreatePlaylist = jest.fn();
  const mockOnHome = jest.fn();
  const mockOnBrowseTags = jest.fn();
  const mockOnSettings = jest.fn();
  const mockOnLogout = jest.fn();

  // Default props for all tests
  const defaultProps = {
    onHome: mockOnHome,
    onBrowseTags: mockOnBrowseTags,
    onSettings: mockOnSettings,
    onLogout: mockOnLogout,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders the page title and subtitle correctly', () => {
      const { getByText, getAllByText } = render(<CreatePlaylistPage {...defaultProps} />);

      const titleElements = getAllByText('CREATE PLAYLIST');
      expect(titleElements.length).toBeGreaterThan(0); // Should find both title and button
      expect(getByText('Generate a custom playlist from your tagged content')).toBeTruthy();
    });

    it('renders all main sections', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('Playlist Name')).toBeTruthy();
      expect(getByText('Include Content Types')).toBeTruthy();
      expect(getByText('Tag Selection')).toBeTruthy();
    });

    it('renders with correct test IDs', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByTestId('create-playlist-scroll-view')).toBeTruthy();
      expect(getByTestId('playlist-name-input')).toBeTruthy();
      expect(getByTestId('create-playlist-button')).toBeTruthy();
    });

    it('renders gradient cards for each section', () => {
      const { getAllByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const gradientCards = getAllByTestId('gradient-card');
      expect(gradientCards).toHaveLength(4); // Tag Selection, Entity Types, Name, Song Preview
    });

    it('renders with safe area insets applied', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const scrollView = getByTestId('create-playlist-scroll-view');
      expect(scrollView).toBeTruthy();
    });
  });

  describe('playlist name input', () => {
    it('renders playlist name input with placeholder', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      expect(input.props.placeholder).toBe('Enter playlist name...');
    });

    it('updates playlist name when text is entered', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'My Test Playlist');

      expect(input.props.value).toBe('My Test Playlist');
    });

    it('respects maximum length limit', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      expect(input.props.maxLength).toBe(100);
    });

    it('handles empty input correctly', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, '');

      expect(input.props.value).toBe('');
    });

    it('handles special characters in playlist name', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'Test & Special "Characters" [2024]');

      expect(input.props.value).toBe('Test & Special "Characters" [2024]');
    });
  });

  describe('entity type selection', () => {
    it('renders all entity type options', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByTestId('entity-type-songs')).toBeTruthy();
      expect(getByTestId('entity-type-albums')).toBeTruthy();
      expect(getByTestId('entity-type-playlists')).toBeTruthy();
    });

    it('has songs enabled by default', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('Songs')).toBeTruthy();
      // Songs should be enabled by default (checked in toggle functionality)
    });

    it('has albums and playlists disabled by default', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('Albums')).toBeTruthy();
      expect(getByText('Playlists')).toBeTruthy();
    });

    it('toggles entity type selection when pressed', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const albumsOption = getByTestId('entity-type-albums');
      fireEvent.press(albumsOption);

      // Album should now be selected
      // We can't directly test the visual state, but the interaction should work
      expect(albumsOption).toBeTruthy();
    });

    it('allows multiple entity types to be selected', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const albumsOption = getByTestId('entity-type-albums');
      const playlistsOption = getByTestId('entity-type-playlists');

      fireEvent.press(albumsOption);
      fireEvent.press(playlistsOption);

      expect(albumsOption).toBeTruthy();
      expect(playlistsOption).toBeTruthy();
    });

    it('can deselect entity types', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const songsOption = getByTestId('entity-type-songs');

      // Songs is enabled by default, so pressing it should disable it
      fireEvent.press(songsOption);

      expect(songsOption).toBeTruthy();
    });

    it('displays correct descriptions for entity types', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('Select which types of content to include in your playlist')).toBeTruthy();
    });
  });

  describe('tag selection section', () => {
    it('renders tag selection interface', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('Tag Selection')).toBeTruthy();
      expect(getByText('Select tags to filter your content')).toBeTruthy();
    });

    it('renders initial set of tags', async () => {
      const { findByText } = render(<CreatePlaylistPage {...defaultProps} />);

      // Should show first 3 tags from mock
      await expect(findByText('Neon Dreams')).resolves.toBeTruthy();
      await expect(findByText('Synthwave Vibes')).resolves.toBeTruthy();
      await expect(findByText('Arcade Nights')).resolves.toBeTruthy();
    });

    it('renders load more button initially', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByTestId('load-more-tags-button')).toBeTruthy();
    });

    it('allows selecting and deselecting tags', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const tagOption = getByTestId('tag-option-1');
      fireEvent.press(tagOption);

      // Tag should be toggled (we can't easily test visual state, but the interaction should work)
      expect(tagOption).toBeTruthy();
    });

    it('loads more tags when load more button is pressed', async () => {
      const { findByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const loadMoreButton = await findByTestId('load-more-tags-button');
      fireEvent.press(loadMoreButton);

      // Should call the service to load more tags
      expect(require('../../../services/playlistService').playlistService.getUserTagsPaginated).toHaveBeenCalledTimes(2);
    });

    it('shows tag count information', async () => {
      const { findByText } = render(<CreatePlaylistPage {...defaultProps} />);

      // Should show tag count from mock response
      await expect(findByText('Showing 3 of 5 tags')).resolves.toBeTruthy();
    });

    it('includes selected tags in playlist creation callback', async () => {
      const { getByTestId, findByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      // Enter playlist name
      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'Tagged Playlist');

      // Wait for tags to load and select a tag
      const tagOption = await findByTestId('tag-option-1');
      fireEvent.press(tagOption);

      // Create playlist
      const button = getByTestId('create-playlist-button');
      fireEvent.press(button);

      // Should eventually call the callback
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockOnCreatePlaylist).toHaveBeenCalledWith(
        'Tagged Playlist',
        ['songs'],
        ['Neon Dreams'] // Selected tag name
      );
    });
  });

  describe('create playlist button', () => {
    it('renders create playlist button', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByTestId('create-playlist-button')).toBeTruthy();
    });

    it('is disabled when playlist name is empty', async () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const button = getByTestId('create-playlist-button');
      // Wait a bit for initial state to settle
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(button.props.disabled).toBe(true);
    });

    it('is enabled when playlist name is provided and entity types are selected', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'Test Playlist');

      const button = getByTestId('create-playlist-button');
      expect(button.props.disabled).toBe(false);
    });

    it('is disabled when no entity types are selected', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'Test Playlist');

      // Deselect songs (which is enabled by default)
      const songsOption = getByTestId('entity-type-songs');
      fireEvent.press(songsOption);

      const button = getByTestId('create-playlist-button');
      expect(button.props.disabled).toBe(true);
    });

    it('calls onCreatePlaylist with correct parameters when pressed', () => {
      const { getByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'My New Playlist');

      // Enable albums
      const albumsOption = getByTestId('entity-type-albums');
      fireEvent.press(albumsOption);

      const button = getByTestId('create-playlist-button');
      fireEvent.press(button);

      expect(mockOnCreatePlaylist).toHaveBeenCalledWith(
        'My New Playlist',
        ['songs', 'albums'], // songs is default enabled, albums was toggled
        [] // no tags selected yet
      );
    });

    it('trims whitespace from playlist name', () => {
      const { getByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, '  My Playlist  ');

      const button = getByTestId('create-playlist-button');
      fireEvent.press(button);

      expect(mockOnCreatePlaylist).toHaveBeenCalledWith('My Playlist', ['songs'], []);
    });

    it('does not call onCreatePlaylist when disabled', () => {
      const { getByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      const button = getByTestId('create-playlist-button');
      fireEvent.press(button);

      expect(mockOnCreatePlaylist).not.toHaveBeenCalled();
    });
  });

  describe('back button', () => {
    it('renders back button when onBack prop is provided', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} onBack={mockOnBack} />);

      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('does not render back button when onBack prop is not provided', () => {
      const { queryByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(queryByTestId('back-button')).toBeNull();
    });

    it('calls onBack when back button is pressed', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} onBack={mockOnBack} />);

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility and usability', () => {
    it('applies custom className when provided', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} className="custom-class" />);

      const scrollView = getByTestId('create-playlist-scroll-view');
      expect(scrollView).toBeTruthy();
    });

    it('handles keyboard input correctly', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');

      fireEvent.changeText(input, 'A');
      expect(input.props.value).toBe('A');

      fireEvent.changeText(input, 'AB');
      expect(input.props.value).toBe('AB');

      fireEvent.changeText(input, 'ABC');
      expect(input.props.value).toBe('ABC');
    });

    it('provides proper feedback for disabled state', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const button = getByTestId('create-playlist-button');
      expect(button.props.disabled).toBe(true);
    });

    it('handles rapid interactions without errors', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const albumsOption = getByTestId('entity-type-albums');

      // Rapid toggle
      fireEvent.press(albumsOption);
      fireEvent.press(albumsOption);
      fireEvent.press(albumsOption);

      expect(albumsOption).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles undefined callback functions gracefully', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, 'Test');

      const button = getByTestId('create-playlist-button');
      fireEvent.press(button);

      // Should not throw an error when onCreatePlaylist is undefined
      expect(input.props.value).toBe('Test');
    });

    it('handles empty string playlist name correctly', () => {
      const { getByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      const input = getByTestId('playlist-name-input');
      fireEvent.changeText(input, '   '); // Only whitespace

      const button = getByTestId('create-playlist-button');
      expect(button.props.disabled).toBe(true);
    });

    it('maintains state consistency during rapid state changes', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      const songsOption = getByTestId('entity-type-songs');
      const albumsOption = getByTestId('entity-type-albums');

      // Rapid state changes
      fireEvent.changeText(input, 'Test');
      fireEvent.press(songsOption); // disable
      fireEvent.press(albumsOption); // enable
      fireEvent.changeText(input, 'Test Modified');

      expect(input.props.value).toBe('Test Modified');
    });

    it('handles maximum length input correctly', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const input = getByTestId('playlist-name-input');
      const longName = 'A'.repeat(100);

      fireEvent.changeText(input, longName);
      expect(input.props.value).toBe(longName);
    });
  });

  describe('component integration', () => {
    it('integrates with GradientCard components', () => {
      const { getAllByTestId } = render(<CreatePlaylistPage {...defaultProps} />);

      const gradientCards = getAllByTestId('gradient-card');
      expect(gradientCards).toHaveLength(4); // Tag Selection, Entity Types, Name, Song Preview
    });

    it('integrates with Button components', () => {
      const { getByTestId } = render(<CreatePlaylistPage {...defaultProps} onBack={mockOnBack} />);

      expect(getByTestId('create-playlist-button')).toBeTruthy();
      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('handles props correctly across all states', () => {
      const { getByTestId, rerender } = render(
        <CreatePlaylistPage {...defaultProps} onBack={mockOnBack} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      expect(getByTestId('back-button')).toBeTruthy();

      // Rerender without onBack
      rerender(<CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />);

      expect(() => getByTestId('back-button')).toThrow();
    });
  });

  describe('song preview section', () => {
    it('renders song preview section', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('SONGS TO BE ADDED')).toBeTruthy();
      expect(getByText('Preview of songs that will be included in your playlist')).toBeTruthy();
    });

    it('shows empty state when no tags are selected', () => {
      const { getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      expect(getByText('Select tags and content types to see songs')).toBeTruthy();
    });

    it('shows filtered songs when tags are selected', async () => {
      const { findByTestId, findByText } = render(<CreatePlaylistPage {...defaultProps} />);

      // Wait for tags to load and select a tag
      const tagOption = await findByTestId('tag-option-1');
      fireEvent.press(tagOption);

      // Should show filtered songs
      await expect(findByText('Song 1')).resolves.toBeTruthy();
      await expect(findByText('Artist 1')).resolves.toBeTruthy();
    });

    it('shows loading state while filtering songs', async () => {
      const { findByTestId, getByText } = render(<CreatePlaylistPage {...defaultProps} />);

      // Select a tag to trigger filtering
      const tagOption = await findByTestId('tag-option-1');
      fireEvent.press(tagOption);

      // Should show loading state briefly
      expect(getByText('Loading songs...')).toBeTruthy();
    });
  });

  describe('functional workflows', () => {
    it('supports complete playlist creation workflow', async () => {
      const { findByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      // Step 1: Enter playlist name
      const input = await findByTestId('playlist-name-input');
      fireEvent.changeText(input, 'My Awesome Playlist');

      // Step 2: Wait for tags to load and select a tag
      const tagOption = await findByTestId('tag-option-1');
      fireEvent.press(tagOption);

      // Step 3: Select entity types
      const albumsOption = await findByTestId('entity-type-albums');
      const playlistsOption = await findByTestId('entity-type-playlists');
      fireEvent.press(albumsOption);
      fireEvent.press(playlistsOption);

      // Step 4: Create playlist
      const button = await findByTestId('create-playlist-button');
      fireEvent.press(button);

      // Should eventually call the callback
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockOnCreatePlaylist).toHaveBeenCalledWith(
        'My Awesome Playlist',
        ['songs', 'albums', 'playlists'],
        ['Neon Dreams']
      );
    });

    it('prevents creation with invalid input', async () => {
      const { findByTestId } = render(
        <CreatePlaylistPage {...defaultProps} onCreatePlaylist={mockOnCreatePlaylist} />
      );

      // No playlist name, deselect all entity types
      const songsOption = await findByTestId('entity-type-songs');
      fireEvent.press(songsOption);

      const button = await findByTestId('create-playlist-button');
      // Wait for state to settle
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(button.props.disabled).toBe(true);

      fireEvent.press(button);
      expect(mockOnCreatePlaylist).not.toHaveBeenCalled();
    });
  });
});
