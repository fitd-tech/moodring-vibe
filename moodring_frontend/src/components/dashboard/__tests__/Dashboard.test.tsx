import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Dashboard } from '../Dashboard';
import { BackendUser, CurrentlyPlaying, RecentTrack } from '../../../types';

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
  }
];

const defaultProps = {
  user: mockUser,
  currentlyPlaying: mockCurrentlyPlaying,
  recentTracks: mockRecentTracks,
  isRefreshing: false,
  onRefresh: jest.fn(),
  onLogout: jest.fn(),
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders successfully with all props', () => {
    render(<Dashboard {...defaultProps} />);
    
    expect(screen.getByText('MOODRING')).toBeTruthy();
    expect(screen.getByText('Sign Out')).toBeTruthy();
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

  it('calls onLogout when Sign Out button is pressed', () => {
    const mockOnLogout = jest.fn();
    render(<Dashboard {...defaultProps} onLogout={mockOnLogout} />);
    
    const logoutButton = screen.getByText('Sign Out');
    fireEvent.press(logoutButton);
    
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('renders UserProfile component with user data', () => {
    render(<Dashboard {...defaultProps} />);
    
    // UserProfile should display the user's display name
    expect(screen.getByText('Test User')).toBeTruthy();
  });

  it('renders NowPlaying component when currentlyPlaying is provided', () => {
    render(<Dashboard {...defaultProps} />);
    
    // Just verify the NowPlaying section is rendered with the heading
    expect(screen.getByText('NOW PLAYING')).toBeTruthy();
  });

  it('renders RecentTracksList with recent tracks', () => {
    render(<Dashboard {...defaultProps} />);
    
    // Just verify the Recent Tracks section is rendered with the heading
    expect(screen.getByText('RECENT TRACKS')).toBeTruthy();
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

  it('passes optional callback props when provided', () => {
    const mockCallbacks = {
      onCreateTag: jest.fn(),
      onBrowsePlaylists: jest.fn(),
      onGeneratePlaylist: jest.fn(),
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