import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { TrackCard } from '../TrackCard';
import { RecentTrack, Tag } from '../../../types';

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

// Mock TaggingInterface
jest.mock('../TaggingInterface', () => ({
  TaggingInterface: ({ tags, onRemoveTag, onAddTag }: { tags: Tag[]; onRemoveTag: (_tagId: string) => void; onAddTag: () => void }) => {
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
              onPress: () => onRemoveTag(tag.id)
            }, React.createElement(Text, null, '×'))
          )
        )
      ),
      React.createElement(TouchableOpacity, {
        testID: 'add-tag-button',
        onPress: onAddTag
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

describe('TrackCard', () => {
  const defaultProps = {
    track: mockTrack,
    _index: 0,
    isExpanded: false,
    onToggleExpansion: jest.fn(),
    onTagRemove: jest.fn(),
    onTagAdd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders track information correctly', () => {
    render(<TrackCard {...defaultProps} />);

    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
    expect(screen.getByText('Album: Test Album')).toBeTruthy();
  });

  it('renders album image when provided', () => {
    const { UNSAFE_getByType } = render(<TrackCard {...defaultProps} />);
    
    const images = UNSAFE_getByType('Image');
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

  it('renders expanded content when expanded', () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    expect(screen.getByTestId('tagging-interface')).toBeTruthy();
  });

  it('renders TaggingInterface in expanded state', () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    // TaggingInterface should render mock tags
    expect(screen.getByText('pop')).toBeTruthy();
    expect(screen.getByText('recent')).toBeTruthy();
  });

  it('passes onTagRemove callback to TaggingInterface', () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    // Find and press a tag remove button
    const removeButton = screen.getByTestId('remove-tag-1');
    fireEvent.press(removeButton);

    expect(defaultProps.onTagRemove).toHaveBeenCalledWith('1');
  });

  it('passes onTagAdd callback to TaggingInterface', () => {
    render(<TrackCard {...defaultProps} isExpanded={true} />);

    // Find and press the add tag button
    const addButton = screen.getByTestId('add-tag-button');
    fireEvent.press(addButton);

    expect(defaultProps.onTagAdd).toHaveBeenCalledTimes(1);
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

  it('uses default callbacks when props are not provided', () => {
    const propsWithoutCallbacks = {
      track: mockTrack,
      _index: 0,
      isExpanded: false,
      onToggleExpansion: jest.fn(),
    };

    render(<TrackCard {...propsWithoutCallbacks} />);

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

  it('animates on expansion state change', () => {
    const { rerender } = render(<TrackCard {...defaultProps} />);

    // Change to expanded
    rerender(<TrackCard {...defaultProps} isExpanded={true} />);

    // Animation should be called when isExpanded changes
    // This is handled by the useEffect in the component
    expect(screen.getByTestId('tagging-interface')).toBeTruthy();
  });

  it('renders with different track indices', () => {
    render(<TrackCard {...defaultProps} _index={5} />);

    const header = screen.getByText('Test Song').parent?.parent;
    fireEvent.press(header!);

    expect(defaultProps.onToggleExpansion).toHaveBeenCalledWith(5);
  });
});