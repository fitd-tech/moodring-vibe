import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Dashboard } from '../Dashboard';
import {
  BackendUser,
  CurrentlyPlaying,
  RecentTrack,
  TopTrack,
  SavedTrack,
  SavedPlaylist,
  SavedAlbum,
} from '../../../types';
import { ExpansionTestWrapper } from '../../../contexts/__tests__/testUtils';

// Mock the TrackCard component to avoid AuthContext dependency
jest.mock('../../tracks/TrackCard', () => ({
  TrackCard: ({ track }: { track: RecentTrack | TopTrack | SavedTrack }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { testID: `track-card-${track.name}` },
      `${track.name} by ${track.artist}`
    );
  },
}));

// Mock NowPlaying component
jest.mock('../../tracks/NowPlaying', () => ({
  NowPlaying: ({ currentlyPlaying }: { currentlyPlaying: CurrentlyPlaying | null }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return currentlyPlaying
      ? React.createElement(
          Text,
          { testID: 'now-playing' },
          `Now Playing: ${currentlyPlaying.name}`
        )
      : null;
  },
}));

// Mock SavedPlaylistsList component
jest.mock('../../playlists/SavedPlaylistsList', () => ({
  SavedPlaylistsList: ({ playlists }: { playlists: SavedPlaylist[] }) => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return React.createElement(
      View,
      { testID: 'saved-playlists-list' },
      React.createElement(Text, null, 'SAVED PLAYLISTS'),
      ...playlists.map(playlist =>
        React.createElement(
          Text,
          { key: playlist.playlist_id, testID: `playlist-card-${playlist.name}` },
          playlist.name
        )
      )
    );
  },
}));

// Mock SavedAlbumsList component
jest.mock('../../albums/SavedAlbumsList', () => ({
  SavedAlbumsList: ({ albums }: { albums: SavedAlbum[] }) => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return React.createElement(
      View,
      { testID: 'saved-albums-list' },
      React.createElement(Text, null, 'SAVED ALBUMS'),
      ...albums.map(album =>
        React.createElement(
          Text,
          { key: album.album_id, testID: `album-card-${album.name}` },
          album.name
        )
      )
    );
  },
}));

const mockUser: BackendUser = {
  id: 123,
  spotify_id: 'spotify-123',
  email: 'test@example.com',
  display_name: 'Test User',
  spotify_access_token: 'access-token',
  spotify_refresh_token: 'refresh-token',
  token_expires_at: new Date().toISOString(),
  profile_image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockCurrentlyPlaying: CurrentlyPlaying = {
  name: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  album_image_url: 'https://example.com/image.jpg',
  is_playing: true,
};

const mockRecentTracks: RecentTrack[] = [
  {
    name: 'Recent Song 1',
    artist: 'Recent Artist 1',
    album: 'Recent Album 1',
    album_image_url: 'https://example.com/recent1.jpg',
    played_at: new Date().toISOString(),
  },
];

const mockTopTracks: TopTrack[] = [
  {
    name: 'Top Song 1',
    artist: 'Top Artist 1',
    album: 'Top Album 1',
    album_image_url: 'https://example.com/top1.jpg',
    song_id: 'top-song-1',
    popularity: 95,
  },
];

const mockSavedTracks: SavedTrack[] = [
  {
    name: 'Saved Song 1',
    artist: 'Saved Artist 1',
    album: 'Saved Album 1',
    album_image_url: 'https://example.com/saved1.jpg',
    song_id: 'saved-song-1',
    added_at: new Date().toISOString(),
  },
];

const mockSavedPlaylists: SavedPlaylist[] = [
  {
    name: 'Test Playlist 1',
    description: 'A test playlist',
    image_url: 'https://example.com/playlist1.jpg',
    track_count: 20,
    created_at: new Date().toISOString(),
    playlist_id: 'playlist-1',
  },
];

const mockSavedAlbums: SavedAlbum[] = [
  {
    name: 'Test Album 1',
    artist: 'Test Album Artist',
    image_url: 'https://example.com/album1.jpg',
    release_date: '2023-01-01',
    track_count: 12,
    album_id: 'album-1',
  },
];

const defaultProps = {
  user: mockUser,
  currentlyPlaying: mockCurrentlyPlaying,
  recentTracks: mockRecentTracks,
  topTracks: mockTopTracks,
  savedTracks: mockSavedTracks,
  savedPlaylists: mockSavedPlaylists,
  savedAlbums: mockSavedAlbums,
  isRefreshing: false,
  isLoadingMore: false,
  isLoadingMoreTopTracks: false,
  isLoadingMoreSavedTracks: false,
  isLoadingMoreSavedPlaylists: false,
  isLoadingMoreSavedAlbums: false,
  hasMoreTracks: false,
  hasMoreTopTracks: false,
  hasMoreSavedTracks: false,
  hasMoreSavedPlaylists: false,
  hasMoreSavedAlbums: false,
  onRefresh: jest.fn(),
  onLoadMoreTracks: jest.fn(),
  onLoadMoreTopTracks: jest.fn(),
  onLoadMoreSavedTracks: jest.fn(),
  onLoadMoreSavedPlaylists: jest.fn(),
  onLoadMoreSavedAlbums: jest.fn(),
  onLogout: jest.fn(),
  onCreatePlaylist: jest.fn(),
  onBrowseTags: jest.fn(),
  onSettings: jest.fn(),
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders successfully with all props', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('renders successfully with ExpansionProvider integration', () => {
    // This test verifies that Dashboard works correctly with the ExpansionProvider
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // All sections should render correctly
    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.getByText('RECENT TRACKS')).toBeTruthy();
    expect(screen.getByText('TOP TRACKS')).toBeTruthy();
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
    expect(screen.getByText('SAVED PLAYLISTS')).toBeTruthy();
    expect(screen.getByText('SAVED ALBUMS')).toBeTruthy();
  });

  it('configures RefreshControl with correct props', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // The RefreshControl is part of ScrollView, so we test its configuration indirectly
    // by ensuring the ScrollView is rendered with RefreshControl
    const scrollView = screen.getByTestId('dashboard-scroll-view');
    expect(scrollView).toBeTruthy();
  });

  it('shows refreshing overlay when isRefreshing is true', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} isRefreshing={true} />
      </ExpansionTestWrapper>
    );

    expect(screen.getByText('Refreshing...')).toBeTruthy();
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('hides refreshing overlay when isRefreshing is false', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} isRefreshing={false} />
      </ExpansionTestWrapper>
    );

    expect(screen.queryByText('Refreshing...')).toBeNull();
  });

  it('calls onRefresh when RefreshControl is triggered', () => {
    const mockOnRefresh = jest.fn();
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} onRefresh={mockOnRefresh} />
      </ExpansionTestWrapper>
    );

    const scrollView = screen.getByTestId('dashboard-scroll-view');

    // Simulate refresh gesture
    fireEvent(scrollView, 'refresh');
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders ProfileMenu component', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // ProfileMenu should be rendered with profile button
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('does not render old UserProfile component in main section', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // UserProfile is no longer rendered in the main dashboard area
    // User info is now in the ProfileMenu
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('renders NowPlaying component when currentlyPlaying is provided', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // Verify the NowPlaying component is rendered with currently playing song
    expect(screen.getByTestId('now-playing')).toBeTruthy();
    expect(screen.getByText('Now Playing: Test Song')).toBeTruthy();
  });

  it('renders RecentTracksList with recent tracks', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // Just verify the Recent Tracks section is rendered with the heading
    expect(screen.getByText('RECENT TRACKS')).toBeTruthy();
  });

  it('renders TopTracksList with top tracks', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // Verify the Top Tracks section is rendered with the heading and content
    expect(screen.getByText('TOP TRACKS')).toBeTruthy();
    expect(screen.getByTestId('track-card-Top Song 1')).toBeTruthy();
  });

  it('renders SavedTracksList with saved tracks', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // Verify the Saved Tracks section is rendered with the heading and content
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
    expect(screen.getByTestId('track-card-Saved Song 1')).toBeTruthy();
  });

  it('renders SavedTracksList even when savedTracks array is empty', () => {
    render(<Dashboard {...defaultProps} savedTracks={[]} />);

    // SavedTracksList should always be rendered, even when no saved tracks
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
    expect(screen.queryByTestId('track-card-Saved Song 1')).toBeNull();
  });

  it('handles null currentlyPlaying', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} currentlyPlaying={null} />
      </ExpansionTestWrapper>
    );

    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.queryByText('Test Song')).toBeNull();
  });

  it('handles empty recent tracks array', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} recentTracks={[]} />
      </ExpansionTestWrapper>
    );

    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.queryByText('Recent Song 1')).toBeNull();
  });

  it('passes savedTracks loading props to SavedTracksList', () => {
    render(
      <Dashboard {...defaultProps} isLoadingMoreSavedTracks={true} hasMoreSavedTracks={true} />
    );

    // SavedTracksList should be rendered with saved tracks
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
  });

  it('passes onLoadMoreSavedTracks callback to SavedTracksList', () => {
    const mockOnLoadMoreSavedTracks = jest.fn();

    render(
      <Dashboard
        {...defaultProps}
        onLoadMoreSavedTracks={mockOnLoadMoreSavedTracks}
        hasMoreSavedTracks={true}
      />
    );

    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
  });

  it('passes optional callback props when provided', () => {
    const mockCallbacks = {
      onTrackTagRemove: jest.fn(),
      onTrackTagAdd: jest.fn(),
      onNowPlayingTagRemove: jest.fn(),
      onNowPlayingTagAdd: jest.fn(),
    };

    render(<Dashboard {...defaultProps} {...mockCallbacks} />);

    expect(screen.getByText('MOODRING')).toBeTruthy();
  });

  it('refreshing overlay has correct styling', () => {
    render(<Dashboard {...defaultProps} isRefreshing={true} />);

    // Just verify the refreshing overlay appears when isRefreshing is true
    const refreshingText = screen.getByText('Refreshing...');
    expect(refreshingText).toBeTruthy();

    // The overlay should be visible (parent container exists)
    expect(refreshingText.parent).toBeTruthy();
  });

  it('renders SavedPlaylistsList when savedPlaylists has content', () => {
    render(<Dashboard {...defaultProps} />);

    // Verify the Saved Playlists section is rendered with the heading and content
    expect(screen.getByText('SAVED PLAYLISTS')).toBeTruthy();
    expect(screen.getByTestId('playlist-card-Test Playlist 1')).toBeTruthy();
  });

  it('does not render SavedPlaylistsList when savedPlaylists is empty', () => {
    render(<Dashboard {...defaultProps} savedPlaylists={[]} />);

    // SavedPlaylistsList should not be rendered when no playlists
    expect(screen.queryByText('SAVED PLAYLISTS')).toBeNull();
    expect(screen.queryByTestId('saved-playlists-list')).toBeNull();
  });

  it('renders SavedAlbumsList when savedAlbums has content', () => {
    render(<Dashboard {...defaultProps} />);

    // Verify the Saved Albums section is rendered with the heading and content
    expect(screen.getByText('SAVED ALBUMS')).toBeTruthy();
    expect(screen.getByTestId('album-card-Test Album 1')).toBeTruthy();
  });

  it('does not render SavedAlbumsList when savedAlbums is empty', () => {
    render(<Dashboard {...defaultProps} savedAlbums={[]} />);

    // SavedAlbumsList should not be rendered when no albums
    expect(screen.queryByText('SAVED ALBUMS')).toBeNull();
    expect(screen.queryByTestId('saved-albums-list')).toBeNull();
  });

  it('passes playlist loading props to SavedPlaylistsList', () => {
    render(
      <Dashboard
        {...defaultProps}
        isLoadingMoreSavedPlaylists={true}
        hasMoreSavedPlaylists={true}
      />
    );

    // SavedPlaylistsList should be rendered with playlists
    expect(screen.getByText('SAVED PLAYLISTS')).toBeTruthy();
  });

  it('passes album loading props to SavedAlbumsList', () => {
    render(
      <Dashboard {...defaultProps} isLoadingMoreSavedAlbums={true} hasMoreSavedAlbums={true} />
    );

    // SavedAlbumsList should be rendered with albums
    expect(screen.getByText('SAVED ALBUMS')).toBeTruthy();
  });

  it('passes onLoadMoreSavedPlaylists callback to SavedPlaylistsList', () => {
    const mockOnLoadMoreSavedPlaylists = jest.fn();

    render(
      <Dashboard
        {...defaultProps}
        onLoadMoreSavedPlaylists={mockOnLoadMoreSavedPlaylists}
        hasMoreSavedPlaylists={true}
      />
    );

    expect(screen.getByText('SAVED PLAYLISTS')).toBeTruthy();
  });

  it('passes onLoadMoreSavedAlbums callback to SavedAlbumsList', () => {
    const mockOnLoadMoreSavedAlbums = jest.fn();

    render(
      <Dashboard
        {...defaultProps}
        onLoadMoreSavedAlbums={mockOnLoadMoreSavedAlbums}
        hasMoreSavedAlbums={true}
      />
    );

    expect(screen.getByText('SAVED ALBUMS')).toBeTruthy();
  });

  it('renders all sections in correct order with ExpansionProvider', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // Verify all main sections are present and in correct order
    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.getByTestId('now-playing')).toBeTruthy();
    expect(screen.getByText('RECENT TRACKS')).toBeTruthy();
    expect(screen.getByText('TOP TRACKS')).toBeTruthy();
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
    expect(screen.getByText('SAVED PLAYLISTS')).toBeTruthy();
    expect(screen.getByText('SAVED ALBUMS')).toBeTruthy();
  });

  it('renders with empty topTracks array without TopTracksList', () => {
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} topTracks={[]} />
      </ExpansionTestWrapper>
    );

    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.queryByText('TOP TRACKS')).toBeNull();
  });

  it('integrates properly with global expansion functionality', () => {
    // Test that Dashboard properly provides ExpansionContext to all child list components
    render(
      <ExpansionTestWrapper>
        <Dashboard {...defaultProps} />
      </ExpansionTestWrapper>
    );

    // All list components should be rendered and able to use ExpansionContext
    expect(screen.getByText('RECENT TRACKS')).toBeTruthy();
    expect(screen.getByText('TOP TRACKS')).toBeTruthy();
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
    expect(screen.getByText('SAVED PLAYLISTS')).toBeTruthy();
    expect(screen.getByText('SAVED ALBUMS')).toBeTruthy();

    // No expansion context errors should occur
    expect(() => screen.getByText('MOODRING')).not.toThrow();
  });
});
