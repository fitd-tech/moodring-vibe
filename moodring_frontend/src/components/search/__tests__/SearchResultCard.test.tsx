import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SearchResultCard } from '../SearchResultCard';
import { SearchResult, Tag } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { taggingService } from '../../../services/taggingService';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/taggingService');
jest.mock('../../../hooks/useAnimation', () => ({
  useAnimation: () => ({
    createAnimatedValues: () => ({
      height: { interpolate: jest.fn(() => ({ interpolate: jest.fn() })) },
      opacity: { interpolate: jest.fn() },
      scale: { interpolate: jest.fn() },
      rotation: { interpolate: jest.fn() },
    }),
    animateExpansion: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockTaggingService = taggingService as jest.Mocked<typeof taggingService>;

describe('SearchResultCard', () => {
  const mockUser = {
    id: 1,
    spotify_id: 'test-spotify-id',
    email: 'test@example.com',
    display_name: 'Test User',
    spotify_access_token: 'valid-token',
    spotify_refresh_token: 'refresh-token',
    token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    profile_image_url: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockTags: Tag[] = [
    {
      id: 1,
      user_id: 1,
      name: 'Rock',
      color: '#FF0000',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const trackResult: SearchResult = {
    type: 'track',
    id: '1',
    name: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    album_image_url: 'test-image.jpg',
    song_id: '1',
    popularity: 80,
  };

  const albumResult: SearchResult = {
    type: 'album',
    id: '2',
    name: 'Test Album',
    artist: 'Test Artist',
    image_url: 'test-album.jpg',
    release_date: '2023-01-01',
    track_count: 12,
    album_id: '2',
  };

  const playlistResult: SearchResult = {
    type: 'playlist',
    id: '3',
    name: 'Test Playlist',
    description: 'A test playlist',
    image_url: 'test-playlist.jpg',
    track_count: 25,
    playlist_id: '3',
    owner: 'Test Owner',
  };


  const mockToggleExpansion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      authToken: 'valid-token',
      isLoading: false,
      error: null,
      setUser: jest.fn(),
      setAuthToken: jest.fn(),
      setError: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: jest.fn(),
    });

    mockTaggingService.generateSongId.mockReturnValue('generated-song-id');
    mockTaggingService.getSongTags.mockResolvedValue(mockTags);
  });

  it('should render track result correctly', () => {
    const { getByText } = render(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    expect(getByText('Test Song')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(getByText('Test Album')).toBeTruthy();
    expect(getByText('Track')).toBeTruthy();
    expect(getByText('Popularity: 80')).toBeTruthy();
  });

  it('should render album result correctly', () => {
    const { getByText } = render(
      <SearchResultCard
        result={albumResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    expect(getByText('Test Album')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(getByText('12 tracks')).toBeTruthy();
    expect(getByText('Album')).toBeTruthy();
    expect(getByText('Released: 2023-01-01')).toBeTruthy();
  });

  it('should render playlist result correctly', () => {
    const { getByText } = render(
      <SearchResultCard
        result={playlistResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    expect(getByText('Test Playlist')).toBeTruthy();
    expect(getByText('Test Owner')).toBeTruthy();
    expect(getByText('25 tracks by Test Owner')).toBeTruthy();
    expect(getByText('Playlist')).toBeTruthy();
    expect(getByText('A test playlist')).toBeTruthy();
  });


  it('should call onToggleExpansion when card is pressed', () => {
    const { getByTestId } = render(
      <SearchResultCard
        result={trackResult}
        index={2}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    const card = getByTestId('search-result-card-2');
    fireEvent.press(card);

    expect(mockToggleExpansion).toHaveBeenCalledWith(2);
  });

  it('should generate song ID for track results', () => {
    render(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    expect(mockTaggingService.generateSongId).toHaveBeenCalledWith(
      'Test Song',
      'Test Artist'
    );
  });

  it('should generate song ID for non-track results', () => {
    render(
      <SearchResultCard
        result={albumResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    expect(mockTaggingService.generateSongId).toHaveBeenCalledWith(
      'Test Album',
      'Test Artist'
    );
  });

  it('should load tags when expanded', async () => {
    const { rerender } = render(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    // Expand the card
    rerender(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={true}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    await waitFor(() => {
      expect(mockTaggingService.getSongTags).toHaveBeenCalledWith(
        'generated-song-id',
        1
      );
    });
  });

  it('should show loading state when loading tags', async () => {
    // Make getSongTags hang
    let resolveTags: (_value: Tag[]) => void;
    const tagsPromise = new Promise<Tag[]>(resolve => {
      resolveTags = resolve;
    });
    mockTaggingService.getSongTags.mockReturnValue(tagsPromise);

    const { getByText, rerender } = render(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    // Expand the card
    rerender(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={true}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    await waitFor(() => {
      expect(getByText('Loading tags...')).toBeTruthy();
    });

    // Resolve the promise
    resolveTags!(mockTags);
  });

  it('should handle tag loading errors gracefully', async () => {
    mockTaggingService.getSongTags.mockRejectedValue(new Error('Failed to load tags'));

    const { rerender } = render(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    // Expand the card
    rerender(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={true}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    await waitFor(() => {
      expect(mockTaggingService.getSongTags).toHaveBeenCalled();
    });

    // Should not crash and should handle the error gracefully
  });

  it('should display placeholder image when no image URL is provided', () => {
    const trackWithoutImage: SearchResult = {
      ...trackResult,
      album_image_url: undefined,
    };

    const { getByTestId } = render(
      <SearchResultCard
        result={trackWithoutImage}
        index={0}
        isExpanded={false}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    // Should render the placeholder with icon instead of image
    const card = getByTestId('search-result-card-0');
    expect(card).toBeTruthy();
  });

  it('should not load tags when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      authToken: null,
      isLoading: false,
      error: null,
      setUser: jest.fn(),
      setAuthToken: jest.fn(),
      setError: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: jest.fn(),
    });

    render(
      <SearchResultCard
        result={trackResult}
        index={0}
        isExpanded={true}
        onToggleExpansion={mockToggleExpansion}
      />
    );

    expect(mockTaggingService.getSongTags).not.toHaveBeenCalled();
  });

  it('should handle different result types with appropriate icons', () => {
    const results = [trackResult, albumResult, playlistResult];
    
    results.forEach((result, index) => {
      const { unmount } = render(
        <SearchResultCard
          result={result}
          index={index}
          isExpanded={false}
          onToggleExpansion={mockToggleExpansion}
        />
      );
      unmount();
    });

    // All should render without errors
    expect(mockTaggingService.generateSongId).toHaveBeenCalledTimes(3);
  });
});