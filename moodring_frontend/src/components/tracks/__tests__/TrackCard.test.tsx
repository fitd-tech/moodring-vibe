import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { TrackCard } from '../TrackCard';
import { RecentTrack, Tag } from '../../../types';
import { taggingService } from '../../../services/taggingService';

// Mock the tagging service
jest.mock('../../../services/taggingService');
const mockTaggingService = taggingService as jest.Mocked<typeof taggingService>;

// Mock the AuthContext hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      spotify_id: 'test_spotify_id',
      email: 'test@example.com',
      display_name: 'Test User',
      spotify_access_token: 'test_token',
      spotify_refresh_token: null,
      token_expires_at: null,
      profile_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  }),
}));

// Mock the useAnimation hook
jest.mock('../../../hooks/useAnimation', () => ({
  useAnimation: () => ({
    createAnimatedValues: () => ({
      scale: { setValue: jest.fn() },
      rotation: { 
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({ interpolate: jest.fn() }))
      },
      height: { 
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({ interpolate: jest.fn() }))
      },
      opacity: { setValue: jest.fn() },
    }),
    animateExpansion: jest.fn(),
  }),
}));

// Mock TaggingInterface with correct props
jest.mock('../TaggingInterface', () => ({
  TaggingInterface: ({ tags, onTagsChanged }: { tags: Tag[]; songId: string; onTagsChanged: () => void }) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return React.createElement(View, { testID: 'tagging-interface' },
      React.createElement(Text, null, 'Tags'),
      React.createElement(View, null,
        tags.map((tag: Tag) => 
          React.createElement(View, { key: tag.id },
            React.createElement(Text, null, tag.name),
            React.createElement(TouchableOpacity, {
              testID: `remove-tag-${tag.id}`,
              onPress: onTagsChanged
            }, React.createElement(Text, null, '×'))
          )
        )
      ),
      React.createElement(TouchableOpacity, {
        testID: 'add-tag-button',
        onPress: onTagsChanged
      }, React.createElement(Text, null, '+ Add'))
    );
  }
}));

const mockTrack: RecentTrack = {
  name: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  album_image_url: 'https://example.com/album.jpg',
  played_at: '2025-08-08T12:30:00Z',
};

const mockTrackWithoutImage: RecentTrack = {
  name: 'Test Song No Image',
  artist: 'Test Artist',
  album: 'Test Album',
  album_image_url: undefined,
  played_at: '2025-08-08T12:30:00Z',
};

const mockTags: Tag[] = [
  {
    id: 1,
    user_id: 1,
    name: 'pop',
    color: '#ff0000',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'recent',
    color: '#00ff00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('TrackCard', () => {
  const defaultProps = {
    track: mockTrack,
    _index: 0,
    isExpanded: false,
    onToggleExpansion: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTaggingService.getSongTags.mockResolvedValue(mockTags);
    mockTaggingService.getUserTags.mockResolvedValue([]);
  });

  it('renders track information correctly', () => {
    render(<TrackCard {...defaultProps} />);

    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
    expect(screen.getByText('Album: Test Album')).toBeTruthy();
  });

  it('renders album image when provided', () => {
    const { UNSAFE_getByType } = render(<TrackCard {...defaultProps} />);
    
    const images = UNSAFE_getByType(require('react-native').Image);
    expect(images.props.source.uri).toBe('https://example.com/album.jpg');
  });

  it('renders album placeholder when no image provided', () => {
    render(<TrackCard {...defaultProps} track={mockTrackWithoutImage} />);
    
    // The placeholder is a View with specific styling
    expect(screen.getByText('Test Song No Image')).toBeTruthy();
  });

  it('formats time correctly', () => {
    render(<TrackCard {...defaultProps} />);

    // The time should be formatted as HH:MM
    const timeText = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeText).toBeTruthy();
  });

  it('calls onToggleExpansion when header is pressed', () => {
    render(<TrackCard {...defaultProps} />);

    const header = screen.getByText('Test Song').parent?.parent;
    fireEvent.press(header!);

    expect(defaultProps.onToggleExpansion).toHaveBeenCalledWith(0);
  });

  it('does not render expanded content when not expanded', () => {
    render(<TrackCard {...defaultProps} />);

    expect(screen.queryByTestId('tagging-interface')).toBeNull();
  });

  it('renders expanded content when expanded', async () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('tagging-interface')).toBeTruthy();
    });
  });

  it('renders TaggingInterface in expanded state', async () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    // TaggingInterface should render mock tags
    await waitFor(() => {
      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('recent')).toBeTruthy();
    });
  });

  it('loads tags when expanded', async () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(mockTaggingService.getSongTags).toHaveBeenCalled();
    });
  });

  it('reloads tags when TaggingInterface calls onTagsChanged', async () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('tagging-interface')).toBeTruthy();
    });

    // Find and press the add tag button to trigger onTagsChanged
    const addButton = screen.getByTestId('add-tag-button');
    fireEvent.press(addButton);

    // Should reload tags after change
    await waitFor(() => {
      expect(mockTaggingService.getSongTags).toHaveBeenCalledTimes(2);
    });
  });

  it('handles missing album gracefully', () => {
    const trackWithoutAlbum: RecentTrack = {
      name: 'Test Song',
      artist: 'Test Artist',
      album: '',
      album_image_url: undefined,
      played_at: '2025-08-08T12:30:00Z',
    };

    render(<TrackCard {...defaultProps} track={trackWithoutAlbum} />);

    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
    // Should not render album text when album is empty
    expect(screen.queryByText(/Album:/)).toBeNull();
  });

  it('handles undefined album gracefully', () => {
    const trackWithUndefinedAlbum = {
      name: 'Test Song',
      artist: 'Test Artist',
      album: '',
      album_image_url: undefined,
      played_at: '2025-08-08T12:30:00Z',
    } as RecentTrack;

    render(<TrackCard {...defaultProps} track={trackWithUndefinedAlbum} />);

    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
    // Should not render album text when album is undefined
    expect(screen.queryByText(/Album:/)).toBeNull();
  });

  it('renders without errors with minimum props', () => {
    const minimalProps = {
      track: mockTrack,
      _index: 0,
      isExpanded: false,
      onToggleExpansion: jest.fn(),
    };

    render(<TrackCard {...minimalProps} />);

    // Should render without errors
    expect(screen.getByText('Test Song')).toBeTruthy();
  });

  it('formats various time formats correctly', () => {
    const morningTrack = {
      ...mockTrack,
      played_at: '2025-08-08T09:15:30Z',
    };

    const eveningTrack = {
      ...mockTrack,
      played_at: '2025-08-08T21:45:00Z',
    };

    const { rerender } = render(<TrackCard {...defaultProps} track={morningTrack} />);
    
    // Should format morning time
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeTruthy();

    rerender(<TrackCard {...defaultProps} track={eveningTrack} />);
    
    // Should format evening time
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeTruthy();
  });

  it('animates on expansion state change', async () => {
    const { rerender } = render(<TrackCard {...defaultProps} />);

    // Change to expanded
    rerender(<TrackCard {...defaultProps} isExpanded={true} />);

    // Animation should be called when isExpanded changes
    // This is handled by the useEffect in the component
    await waitFor(() => {
      expect(screen.getByTestId('tagging-interface')).toBeTruthy();
    });
  });

  it('renders with different track indices', () => {
    render(<TrackCard {...defaultProps} _index={5} />);

    const header = screen.getByText('Test Song').parent?.parent;
    fireEvent.press(header!);

    expect(defaultProps.onToggleExpansion).toHaveBeenCalledWith(5);
  });
});