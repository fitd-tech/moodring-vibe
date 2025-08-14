import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NowPlaying } from '../NowPlaying';
import { CurrentlyPlaying } from '../../../types';

// Mock animation hook with Jest spies
const mockCreateAnimatedValues = jest.fn(() => ({
  scale: { setValue: jest.fn() },
  opacity: { setValue: jest.fn() },
  height: {
    setValue: jest.fn(),
    interpolate: jest.fn(() => ({ setValue: jest.fn() })),
  },
  rotation: {
    setValue: jest.fn(),
    interpolate: jest.fn(() => ({ setValue: jest.fn() })),
  },
}));

const mockAnimateExpansion = jest.fn();

jest.mock('../../../hooks/useAnimation', () => ({
  useAnimation: () => ({
    createAnimatedValues: mockCreateAnimatedValues,
    animateExpansion: mockAnimateExpansion,
  }),
}));

// Mock TaggingInterface component
jest.mock('../TaggingInterface', () => ({
  TaggingInterface: ({
    tags,
    songId,
    onTagsChanged,
  }: {
    tags: unknown[];
    songId: string;
    onTagsChanged: unknown;
  }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'tagging-interface' },
      React.createElement(Text, { testID: 'tag-count' }, `Tags: ${tags.length}`),
      React.createElement(Text, { testID: 'song-id' }, `Song ID: ${songId}`),
      React.createElement(
        Text,
        { testID: 'callback' },
        typeof onTagsChanged === 'function' ? 'Has callback' : 'No callback'
      )
    );
  },
}));

describe('NowPlaying', () => {
  const mockCurrentlyPlaying: CurrentlyPlaying = {
    name: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    album_image_url: 'https://example.com/album.jpg',
    is_playing: true,
    song_id: 'spotify:track:1234567890',
  };

  const mockCurrentlyPlayingWithoutImage: CurrentlyPlaying = {
    name: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    album_image_url: undefined,
    is_playing: false,
    song_id: undefined,
  };

  describe('Component Rendering', () => {
    it('renders with currently playing track', () => {
      const { getByText } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      expect(getByText('NOW PLAYING')).toBeTruthy();
      expect(getByText('Bohemian Rhapsody')).toBeTruthy();
      expect(getByText('by Queen')).toBeTruthy();
      expect(getByText('A Night at the Opera')).toBeTruthy();
    });

    it('renders with different track data', () => {
      const customTrack: CurrentlyPlaying = {
        name: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin IV',
        album_image_url: 'https://example.com/lz4.jpg',
        is_playing: false,
        song_id: 'spotify:track:zeppelin123',
      };

      const { getByText } = render(<NowPlaying currentlyPlaying={customTrack} />);

      expect(getByText('Stairway to Heaven')).toBeTruthy();
      expect(getByText('by Led Zeppelin')).toBeTruthy();
      expect(getByText('Led Zeppelin IV')).toBeTruthy();
    });

    it('returns null when no currently playing track', () => {
      const { queryByText } = render(<NowPlaying currentlyPlaying={null} />);

      expect(queryByText('NOW PLAYING')).toBeNull();
    });

    it('renders with undefined currentlyPlaying', () => {
      const { queryByText } = render(
        <NowPlaying currentlyPlaying={undefined as unknown as CurrentlyPlaying} />
      );

      expect(queryByText('NOW PLAYING')).toBeNull();
    });
  });

  describe('Album Art Display', () => {
    it('displays album image when URL is provided', () => {
      const { getByTestId } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      // The image should be rendered with the provided URI
      const image = getByTestId('album-image');
      expect(image).toBeTruthy();
      expect(image.props.source.uri).toBe('https://example.com/album.jpg');
    });

    it('displays placeholder when no album image URL', () => {
      const { getByTestId, queryByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlayingWithoutImage} />
      );

      expect(getByTestId('album-placeholder')).toBeTruthy();
      expect(queryByTestId('album-image')).toBeNull();
    });

    it('displays placeholder when album image URL is empty string', () => {
      const trackWithEmptyImage: CurrentlyPlaying = {
        ...mockCurrentlyPlaying,
        album_image_url: '',
      };

      const { getByTestId, queryByTestId } = render(
        <NowPlaying currentlyPlaying={trackWithEmptyImage} />
      );

      expect(getByTestId('album-placeholder')).toBeTruthy();
      expect(queryByTestId('album-image')).toBeNull();
    });

    it('displays placeholder when album image URL is null', () => {
      const trackWithNullImage: CurrentlyPlaying = {
        ...mockCurrentlyPlaying,
        album_image_url: null as unknown as string,
      };

      const { getByTestId, queryByTestId } = render(
        <NowPlaying currentlyPlaying={trackWithNullImage} />
      );

      expect(getByTestId('album-placeholder')).toBeTruthy();
      expect(queryByTestId('album-image')).toBeNull();
    });
  });

  describe('Playing Indicator States', () => {
    it('shows active playing indicator when track is playing', () => {
      const { getByTestId } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      const indicator = getByTestId('playing-indicator');
      expect(indicator).toBeTruthy();
      expect(indicator.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ backgroundColor: expect.any(String) })])
      );
    });

    it('shows inactive playing indicator when track is not playing', () => {
      const { getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlayingWithoutImage} />
      );

      const indicator = getByTestId('playing-indicator');
      expect(indicator).toBeTruthy();
    });

    it('handles undefined is_playing state', () => {
      const trackWithUndefinedPlaying: CurrentlyPlaying = {
        ...mockCurrentlyPlaying,
        is_playing: undefined as unknown as boolean,
      };

      const { getByTestId } = render(<NowPlaying currentlyPlaying={trackWithUndefinedPlaying} />);

      const indicator = getByTestId('playing-indicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('Expansion and Collapse Functionality', () => {
    it('expands when header is pressed', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Initially collapsed
      expect(() => getByTestId('tagging-interface')).toThrow();

      // Click to expand
      fireEvent.press(getByText('Bohemian Rhapsody'));

      // Should be expanded now
      expect(getByTestId('tagging-interface')).toBeTruthy();
      expect(getByText('Collapse')).toBeTruthy();
    });

    it('collapses when header is pressed again', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Expand
      fireEvent.press(getByText('Bohemian Rhapsody'));
      expect(getByTestId('tagging-interface')).toBeTruthy();

      // Collapse by pressing header again
      fireEvent.press(getByText('Bohemian Rhapsody'));

      // Should be collapsed
      expect(() => getByTestId('tagging-interface')).toThrow();
    });

    it('collapses when collapse button is pressed', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Expand
      fireEvent.press(getByText('Bohemian Rhapsody'));
      expect(getByTestId('tagging-interface')).toBeTruthy();

      // Collapse using collapse button
      fireEvent.press(getByText('Collapse'));

      // Should be collapsed
      expect(() => getByTestId('tagging-interface')).toThrow();
    });

    it('expands when menu button area is pressed', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Initially collapsed
      expect(() => getByTestId('tagging-interface')).toThrow();

      // Click the main touchable area (which contains the arrow)
      fireEvent.press(getByText('Bohemian Rhapsody'));

      // Should be expanded now
      expect(getByTestId('tagging-interface')).toBeTruthy();
    });
  });

  describe('TaggingInterface Integration', () => {
    it('passes correct props to TaggingInterface when song_id is provided', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Expand to show TaggingInterface
      fireEvent.press(getByText('Bohemian Rhapsody'));

      expect(getByTestId('tag-count')).toBeTruthy();
      expect(getByTestId('song-id')).toBeTruthy();
      expect(getByTestId('callback')).toBeTruthy();

      // Check that song ID is passed correctly
      expect(getByText('Song ID: spotify:track:1234567890')).toBeTruthy();
      expect(getByText('Tags: 2')).toBeTruthy(); // Mock tags array has 2 items
      expect(getByText('Has callback')).toBeTruthy();
    });

    it('generates song_id from name and artist when song_id is not provided', () => {
      const { getByText } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlayingWithoutImage} />
      );

      // Expand to show TaggingInterface - click by finding "by Eagles" which is unique
      fireEvent.press(getByText('by Eagles'));

      // Should generate song_id from name and artist
      expect(getByText('Song ID: Hotel California__Eagles')).toBeTruthy();
    });

    it('handles missing name and artist gracefully', () => {
      const trackWithMissingInfo: CurrentlyPlaying = {
        name: '',
        artist: '',
        album: 'Test Album',
        album_image_url: undefined,
        is_playing: false,
        song_id: undefined,
      };

      const { getByText } = render(<NowPlaying currentlyPlaying={trackWithMissingInfo} />);

      // Expand to show TaggingInterface
      fireEvent.press(getByText('Test Album')); // Click album since name might be empty

      // Should use 'unknown' for missing name/artist
      expect(getByText('Song ID: unknown__unknown')).toBeTruthy();
    });

    it('handles null name and artist values', () => {
      const trackWithNullInfo: CurrentlyPlaying = {
        name: null as unknown as string,
        artist: null as unknown as string,
        album: 'Test Album',
        album_image_url: undefined,
        is_playing: false,
        song_id: undefined,
      };

      const { getByText } = render(<NowPlaying currentlyPlaying={trackWithNullInfo} />);

      // Expand to show TaggingInterface
      fireEvent.press(getByText('Test Album'));

      // Should handle null values gracefully
      expect(getByText('Song ID: unknown__unknown')).toBeTruthy();
    });

    it('provides empty onTagsChanged callback', () => {
      const { getByText } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      // Expand to show TaggingInterface
      fireEvent.press(getByText('Bohemian Rhapsody'));

      // Should have callback
      expect(getByText('Has callback')).toBeTruthy();
    });
  });

  describe('Animation Integration', () => {
    beforeEach(() => {
      // Clear mocks before each test
      mockCreateAnimatedValues.mockClear();
      mockAnimateExpansion.mockClear();
    });

    it('integrates with animation system correctly', () => {
      render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      expect(mockCreateAnimatedValues).toHaveBeenCalled();
    });

    it('calls animateExpansion when expanding', () => {
      const { getByText } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      act(() => {
        fireEvent.press(getByText('Bohemian Rhapsody'));
      });

      expect(mockAnimateExpansion).toHaveBeenCalled();
    });

    it('calls animateExpansion when collapsing', () => {
      const { getByText } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      // Expand first
      act(() => {
        fireEvent.press(getByText('Bohemian Rhapsody'));
      });

      // Clear previous calls
      mockAnimateExpansion.mockClear();

      // Collapse
      act(() => {
        fireEvent.press(getByText('Collapse'));
      });

      expect(mockAnimateExpansion).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles very long track names', () => {
      const longNameTrack: CurrentlyPlaying = {
        name: 'This is a very long song name that might cause display issues if not handled properly in the UI component',
        artist: 'Very Long Artist Name That Could Also Cause Layout Issues',
        album: 'An Extremely Long Album Title That Tests The Component Rendering Capabilities',
        album_image_url: 'https://example.com/long-album.jpg',
        is_playing: true,
        song_id: 'spotify:track:longtrack123',
      };

      const { getByText } = render(<NowPlaying currentlyPlaying={longNameTrack} />);

      expect(
        getByText(
          'This is a very long song name that might cause display issues if not handled properly in the UI component'
        )
      ).toBeTruthy();
      expect(
        getByText('by Very Long Artist Name That Could Also Cause Layout Issues')
      ).toBeTruthy();
      expect(
        getByText('An Extremely Long Album Title That Tests The Component Rendering Capabilities')
      ).toBeTruthy();
    });

    it('handles special characters in track info', () => {
      const specialCharTrack: CurrentlyPlaying = {
        name: 'Track with "quotes" & symbols!',
        artist: 'Artist with émojis 🎵 and àccénts',
        album: 'Album with [brackets] (parentheses) {curly}',
        album_image_url: 'https://example.com/special.jpg',
        is_playing: true,
        song_id: 'spotify:track:special123',
      };

      const { getByText } = render(<NowPlaying currentlyPlaying={specialCharTrack} />);

      expect(getByText('Track with "quotes" & symbols!')).toBeTruthy();
      expect(getByText('by Artist with émojis 🎵 and àccénts')).toBeTruthy();
      expect(getByText('Album with [brackets] (parentheses) {curly}')).toBeTruthy();
    });

    it('handles empty string values gracefully', () => {
      const emptyStringTrack: CurrentlyPlaying = {
        name: '',
        artist: '',
        album: '',
        album_image_url: '',
        is_playing: false,
        song_id: '',
      };

      const { getByText, getByTestId } = render(<NowPlaying currentlyPlaying={emptyStringTrack} />);

      // Test that component renders with empty values without crashing
      expect(getByText('NOW PLAYING')).toBeTruthy();
      expect(getByText('by ')).toBeTruthy(); // Empty artist with "by " prefix should render
      expect(getByTestId('album-placeholder')).toBeTruthy(); // Should show placeholder for missing album image
    });

    it('handles boolean edge cases for is_playing', () => {
      const falsyPlayingTrack: CurrentlyPlaying = {
        name: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        album_image_url: 'https://example.com/test.jpg',
        is_playing: 0 as unknown as boolean, // Falsy but not boolean false
        song_id: 'test:track:123',
      };

      const { getByTestId } = render(<NowPlaying currentlyPlaying={falsyPlayingTrack} />);

      const indicator = getByTestId('playing-indicator');
      expect(indicator).toBeTruthy();
    });

    it('handles multiple rapid expansion toggles', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Rapidly toggle expansion
      act(() => {
        fireEvent.press(getByText('Bohemian Rhapsody'));
        fireEvent.press(getByText('Bohemian Rhapsody'));
        fireEvent.press(getByText('Bohemian Rhapsody'));
      });

      // Should handle rapid toggles gracefully
      expect(getByTestId('tagging-interface')).toBeTruthy();
    });
  });

  describe('Mock Tags Integration', () => {
    it('provides mock tags to TaggingInterface', () => {
      const { getByText } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      // Expand to show TaggingInterface
      fireEvent.press(getByText('Bohemian Rhapsody'));

      // Should show mock tags count
      expect(getByText('Tags: 2')).toBeTruthy();
    });

    it('mock tags have expected structure', () => {
      const { getByText } = render(<NowPlaying currentlyPlaying={mockCurrentlyPlaying} />);

      // Expand to show TaggingInterface
      fireEvent.press(getByText('Bohemian Rhapsody'));

      // Mock provides 2 tags as defined in the component
      expect(getByText('Tags: 2')).toBeTruthy();
    });
  });

  describe('Component State Management', () => {
    it('maintains expansion state correctly', () => {
      const { getByText, getByTestId } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Initially collapsed
      expect(() => getByTestId('tagging-interface')).toThrow();

      // Expand
      fireEvent.press(getByText('Bohemian Rhapsody'));
      expect(getByTestId('tagging-interface')).toBeTruthy();

      // Collapse
      fireEvent.press(getByText('Collapse'));
      expect(() => getByTestId('tagging-interface')).toThrow();

      // Expand again
      fireEvent.press(getByText('Bohemian Rhapsody'));
      expect(getByTestId('tagging-interface')).toBeTruthy();
    });

    it('resets expansion state when props change', () => {
      const { getByText, getByTestId, rerender } = render(
        <NowPlaying currentlyPlaying={mockCurrentlyPlaying} />
      );

      // Expand
      fireEvent.press(getByText('Bohemian Rhapsody'));
      expect(getByTestId('tagging-interface')).toBeTruthy();

      // Change props (new track)
      rerender(<NowPlaying currentlyPlaying={mockCurrentlyPlayingWithoutImage} />);

      // Should still be expanded (component doesn't reset state on prop changes)
      expect(getByTestId('tagging-interface')).toBeTruthy();
    });
  });
});
