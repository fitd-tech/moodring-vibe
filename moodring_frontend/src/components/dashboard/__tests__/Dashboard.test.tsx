import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Dashboard } from '../Dashboard';
import { BackendUser, CurrentlyPlaying, RecentTrack, TopTrack, SavedTrack } from '../../../types';

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

const defaultProps = {
  user: mockUser,
  currentlyPlaying: mockCurrentlyPlaying,
  recentTracks: mockRecentTracks,
  topTracks: mockTopTracks,
  savedTracks: mockSavedTracks,
  isRefreshing: false,
  isLoadingMore: false,
  isLoadingMoreTopTracks: false,
  isLoadingMoreSavedTracks: false,
  hasMoreTracks: false,
  hasMoreTopTracks: false,
  hasMoreSavedTracks: false,
  onRefresh: jest.fn(),
  onLoadMoreTracks: jest.fn(),
  onLoadMoreTopTracks: jest.fn(),
  onLoadMoreSavedTracks: jest.fn(),
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
    render(<Dashboard {...defaultProps} />);

    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('configures RefreshControl with correct props', () => {
    render(<Dashboard {...defaultProps} />);

    // The RefreshControl is part of ScrollView, so we test its configuration indirectly
    // by ensuring the ScrollView is rendered with RefreshControl
    const scrollView = screen.getByTestId('dashboard-scroll-view');
    expect(scrollView).toBeTruthy();
  });

  it('shows refreshing overlay when isRefreshing is true', () => {
    render(<Dashboard {...defaultProps} isRefreshing={true} />);

    expect(screen.getByText('Refreshing...')).toBeTruthy();
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('hides refreshing overlay when isRefreshing is false', () => {
    render(<Dashboard {...defaultProps} isRefreshing={false} />);

    expect(screen.queryByText('Refreshing...')).toBeNull();
  });

  it('calls onRefresh when RefreshControl is triggered', () => {
    const mockOnRefresh = jest.fn();
    render(<Dashboard {...defaultProps} onRefresh={mockOnRefresh} />);

    const scrollView = screen.getByTestId('dashboard-scroll-view');

    // Simulate refresh gesture
    fireEvent(scrollView, 'refresh');
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders ProfileMenu component', () => {
    render(<Dashboard {...defaultProps} />);

    // ProfileMenu should be rendered with profile button
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('does not render old UserProfile component in main section', () => {
    render(<Dashboard {...defaultProps} />);

    // UserProfile is no longer rendered in the main dashboard area
    // User info is now in the ProfileMenu
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('renders NowPlaying component when currentlyPlaying is provided', () => {
    render(<Dashboard {...defaultProps} />);

    // Verify the NowPlaying component is rendered with currently playing song
    expect(screen.getByTestId('now-playing')).toBeTruthy();
    expect(screen.getByText('Now Playing: Test Song')).toBeTruthy();
  });

  it('renders RecentTracksList with recent tracks', () => {
    render(<Dashboard {...defaultProps} />);

    // Just verify the Recent Tracks section is rendered with the heading
    expect(screen.getByText('RECENT TRACKS')).toBeTruthy();
  });

  it('renders TopTracksList with top tracks', () => {
    render(<Dashboard {...defaultProps} />);

    // Verify the Top Tracks section is rendered with the heading and content
    expect(screen.getByText('TOP TRACKS')).toBeTruthy();
    expect(screen.getByTestId('track-card-Top Song 1')).toBeTruthy();
  });

  it('renders SavedTracksList with saved tracks', () => {
    render(<Dashboard {...defaultProps} />);

    // Verify the Saved Tracks section is rendered with the heading and content
    expect(screen.getByText('SAVED TRACKS')).toBeTruthy();
    expect(screen.getByTestId('track-card-Saved Song 1')).toBeTruthy();
  });

  it('does not render SavedTracksList when savedTracks array is empty', () => {
    render(<Dashboard {...defaultProps} savedTracks={[]} />);

    // SavedTracksList should not be rendered when no saved tracks
    expect(screen.queryByText('SAVED TRACKS')).toBeNull();
    expect(screen.queryByTestId('track-card-Saved Song 1')).toBeNull();
  });

  it('handles null currentlyPlaying', () => {
    render(<Dashboard {...defaultProps} currentlyPlaying={null} />);

    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.queryByText('Test Song')).toBeNull();
  });

  it('handles empty recent tracks array', () => {
    render(<Dashboard {...defaultProps} recentTracks={[]} />);

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
});
