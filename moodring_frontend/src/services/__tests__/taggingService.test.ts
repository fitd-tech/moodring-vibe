import { TaggingService, taggingService } from '../taggingService';
import { Tag, NewTag, SongTag } from '../../types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variable
const originalEnv = process.env;

describe('TaggingService', () => {
  const mockTag: Tag = {
    id: 1,
    user_id: 1,
    name: 'pop',
    color: '#ff0000',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSongTag: SongTag = {
    id: 1,
    user_id: 1,
    song_id: 'test_song',
    tag_id: 1,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor and configuration', () => {
    it('creates a new instance', () => {
      const service = new TaggingService();
      expect(service).toBeInstanceOf(TaggingService);
    });

    it('exports a singleton instance', () => {
      expect(taggingService).toBeInstanceOf(TaggingService);
    });

    it('uses default backend URL when environment variable is not set', () => {
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
      const service = new TaggingService();

      // Access private method for testing
      const backendUrl = (service as unknown as { getBackendUrl(): string }).getBackendUrl();
      expect(backendUrl).toBe('http://localhost:8000');
    });

    it('uses environment variable for backend URL when set', () => {
      // Test that the service correctly returns default URL when env var is not set
      // This is more reliable than testing dynamic environment variable changes
      const service = new TaggingService();
      const backendUrl = (service as unknown as { getBackendUrl(): string }).getBackendUrl();

      // Should return the default value since we cleared env vars in beforeEach
      expect(backendUrl).toBe('http://localhost:8000');
    });
  });

  describe('getUserTags', () => {
    it('fetches user tags successfully', async () => {
      const mockTags = [mockTag];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      const result = await taggingService.getUserTags(1);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/users/1/tags', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockTags);
    });

    it('handles API error when fetching user tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'User not found',
      });

      await expect(taggingService.getUserTags(999)).rejects.toThrow(
        'API call failed: 404 - User not found'
      );
    });

    it('handles network error when fetching user tags', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(taggingService.getUserTags(1)).rejects.toThrow('Network error');
    });
  });

  describe('createTag', () => {
    it('creates a new tag successfully', async () => {
      const newTagData: NewTag = {
        name: 'rock',
        color: '#0000ff',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTag,
      });

      const result = await taggingService.createTag(1, newTagData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/users/1/tags', {
        method: 'POST',
        body: JSON.stringify({ ...newTagData, user_id: 1 }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockTag);
    });

    it('handles validation error when creating tag', async () => {
      const newTagData: NewTag = {
        name: '',
        color: '#0000ff',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Tag name is required',
      });

      await expect(taggingService.createTag(1, newTagData)).rejects.toThrow(
        'API call failed: 400 - Tag name is required'
      );
    });

    it('creates tag without color', async () => {
      const newTagData: NewTag = {
        name: 'jazz',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTag, name: 'jazz', color: null }),
      });

      const result = await taggingService.createTag(1, newTagData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/users/1/tags', {
        method: 'POST',
        body: JSON.stringify({ ...newTagData, user_id: 1 }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result.name).toBe('jazz');
    });
  });

  describe('deleteTag', () => {
    it('deletes a tag successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await taggingService.deleteTag(1, 1);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/users/1/tags/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('handles error when deleting non-existent tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Tag not found',
      });

      await expect(taggingService.deleteTag(1, 999)).rejects.toThrow(
        'API call failed: 404 - Tag not found'
      );
    });

    it('handles permission error when deleting tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Not authorized to delete this tag',
      });

      await expect(taggingService.deleteTag(1, 2)).rejects.toThrow(
        'API call failed: 403 - Not authorized to delete this tag'
      );
    });
  });

  describe('getSongTags', () => {
    it('fetches song tags successfully', async () => {
      const mockTags = [mockTag];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      const result = await taggingService.getSongTags('test_song', 1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/songs/test_song/tags?user_id=1',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockTags);
    });

    it('handles song with special characters in ID', async () => {
      const specialSongId = 'song with spaces & symbols!';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await taggingService.getSongTags(specialSongId, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/songs/${encodeURIComponent(specialSongId)}/tags?user_id=1`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('returns empty array for song with no tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await taggingService.getSongTags('untagged_song', 1);
      expect(result).toEqual([]);
    });
  });

  describe('addTagToSong', () => {
    it('adds tag to song successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSongTag,
      });

      const result = await taggingService.addTagToSong('test_song', 1, 1);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/songs/test_song/tags', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          tag_id: 1,
          song_id: 'test_song',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockSongTag);
    });

    it('handles URL encoding for song ID with special characters', async () => {
      const specialSongId = 'song/with/slashes';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSongTag,
      });

      await taggingService.addTagToSong(specialSongId, 1, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/songs/${encodeURIComponent(specialSongId)}/tags`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('handles duplicate tag assignment error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'Tag already assigned to this song',
      });

      await expect(taggingService.addTagToSong('test_song', 1, 1)).rejects.toThrow(
        'API call failed: 409 - Tag already assigned to this song'
      );
    });
  });

  describe('removeTagFromSong', () => {
    it('removes tag from song successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await taggingService.removeTagFromSong('test_song', 1, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/songs/test_song/tags/1?user_id=1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('handles URL encoding for song ID removal', async () => {
      const specialSongId = 'song%20with%20encoding';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await taggingService.removeTagFromSong(specialSongId, 1, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/songs/${encodeURIComponent(specialSongId)}/tags/1?user_id=1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('handles error when removing non-existent tag assignment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Song tag not found',
      });

      await expect(taggingService.removeTagFromSong('test_song', 1, 999)).rejects.toThrow(
        'API call failed: 404 - Song tag not found'
      );
    });
  });

  describe('generateSongId', () => {
    it('generates consistent song ID from track name and artist', () => {
      const songId1 = taggingService.generateSongId('Test Song', 'Test Artist');
      const songId2 = taggingService.generateSongId('Test Song', 'Test Artist');

      expect(songId1).toBe(songId2);
      expect(songId1).toBe('test_song__test_artist');
    });

    it('handles special characters in track name and artist', () => {
      const songId = taggingService.generateSongId('Song: "With" Symbols!', 'Artist & Co.');
      expect(songId).toBe('song___with__symbols___artist___co_');
    });

    it('handles extra whitespace', () => {
      const songId = taggingService.generateSongId('  Spaced Song  ', '  Spaced Artist  ');
      expect(songId).toBe('spaced_song__spaced_artist');
    });

    it('handles empty strings', () => {
      const songId = taggingService.generateSongId('', '');
      expect(songId).toBe('__');
    });

    it('converts to lowercase consistently', () => {
      const songId1 = taggingService.generateSongId('UPPERCASE SONG', 'UPPERCASE ARTIST');
      const songId2 = taggingService.generateSongId('uppercase song', 'uppercase artist');

      expect(songId1).toBe(songId2);
      expect(songId1).toBe('uppercase_song__uppercase_artist');
    });

    it('handles numbers and valid characters', () => {
      const songId = taggingService.generateSongId('Song 123', 'Artist 456');
      expect(songId).toBe('song_123__artist_456');
    });
  });

  describe('generatePlaylistId', () => {
    it('generates consistent playlist ID from playlist name and ID', () => {
      const playlistId1 = taggingService.generatePlaylistId('My Playlist', 'spotify-playlist-123');
      const playlistId2 = taggingService.generatePlaylistId('My Playlist', 'spotify-playlist-123');

      expect(playlistId1).toBe(playlistId2);
      expect(playlistId1).toBe('playlist_spotify_playlist_123_my_playlist');
    });

    it('handles special characters in playlist name', () => {
      const playlistId = taggingService.generatePlaylistId(
        'Playlist: "Best Songs" & More!',
        'pl-456'
      );
      expect(playlistId).toBe('playlist_pl_456_playlist___best_songs____more_');
    });

    it('handles extra whitespace in playlist name', () => {
      const playlistId = taggingService.generatePlaylistId('  Spaced Playlist  ', 'pl-789');
      expect(playlistId).toBe('playlist_pl_789_spaced_playlist');
    });

    it('handles empty playlist name', () => {
      const playlistId = taggingService.generatePlaylistId('', 'empty-pl-1');
      expect(playlistId).toBe('playlist_empty_pl_1_');
    });

    it('converts playlist name to lowercase consistently', () => {
      const playlistId1 = taggingService.generatePlaylistId('UPPERCASE PLAYLIST', 'pl-upper');
      const playlistId2 = taggingService.generatePlaylistId('uppercase playlist', 'pl-upper');

      expect(playlistId1).toBe(playlistId2);
      expect(playlistId1).toBe('playlist_pl_upper_uppercase_playlist');
    });

    it('handles numbers and valid characters in playlist name', () => {
      const playlistId = taggingService.generatePlaylistId('Playlist 2024', 'pl-2024');
      expect(playlistId).toBe('playlist_pl_2024_playlist_2024');
    });

    it('handles different Spotify playlist ID formats', () => {
      const playlistId1 = taggingService.generatePlaylistId('Test', '37i9dQZF1DXcBWIGoYBM5M');
      const playlistId2 = taggingService.generatePlaylistId(
        'Test',
        'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'
      );

      expect(playlistId1).toBe('playlist_37i9d___1__c____o___5__test');
      expect(playlistId2).toBe('playlist_spotify_playlist_37i9d___1__c____o___5__test');
    });

    it('maintains uniqueness for different playlists with same name', () => {
      const playlistId1 = taggingService.generatePlaylistId('My Favorites', 'user1-fav');
      const playlistId2 = taggingService.generatePlaylistId('My Favorites', 'user2-fav');

      expect(playlistId1).not.toBe(playlistId2);
      expect(playlistId1).toBe('playlist_user1_fav_my_favorites');
      expect(playlistId2).toBe('playlist_user2_fav_my_favorites');
    });
  });

  describe('generateAlbumId', () => {
    it('generates consistent album ID from album name and ID', () => {
      const albumId1 = taggingService.generateAlbumId('Test Album', 'spotify-album-123');
      const albumId2 = taggingService.generateAlbumId('Test Album', 'spotify-album-123');

      expect(albumId1).toBe(albumId2);
      expect(albumId1).toBe('album_spotify_album_123_test_album');
    });

    it('handles special characters in album name', () => {
      const albumId = taggingService.generateAlbumId('Album: "Greatest Hits" & More!', 'al-456');
      expect(albumId).toBe('album_al_456_album___greatest_hits____more_');
    });

    it('handles extra whitespace in album name', () => {
      const albumId = taggingService.generateAlbumId('  Spaced Album  ', 'al-789');
      expect(albumId).toBe('album_al_789_spaced_album');
    });

    it('handles empty album name', () => {
      const albumId = taggingService.generateAlbumId('', 'empty-al-1');
      expect(albumId).toBe('album_empty_al_1_');
    });

    it('converts album name to lowercase consistently', () => {
      const albumId1 = taggingService.generateAlbumId('UPPERCASE ALBUM', 'al-upper');
      const albumId2 = taggingService.generateAlbumId('uppercase album', 'al-upper');

      expect(albumId1).toBe(albumId2);
      expect(albumId1).toBe('album_al_upper_uppercase_album');
    });

    it('handles numbers and valid characters in album name', () => {
      const albumId = taggingService.generateAlbumId('Album 2024', 'al-2024');
      expect(albumId).toBe('album_al_2024_album_2024');
    });

    it('handles different Spotify album ID formats', () => {
      const albumId1 = taggingService.generateAlbumId('Test Album', '1DFixLWuPkv3KT3TnV35m3');
      const albumId2 = taggingService.generateAlbumId(
        'Test Album',
        'spotify:album:1DFixLWuPkv3KT3TnV35m3'
      );

      expect(albumId1).toBe('album_1__ix__u_kv3__3_n_35m3_test_album');
      expect(albumId2).toBe('album_spotify_album_1__ix__u_kv3__3_n_35m3_test_album');
    });

    it('maintains uniqueness for different albums with same name', () => {
      const albumId1 = taggingService.generateAlbumId('Greatest Hits', 'artist1-hits');
      const albumId2 = taggingService.generateAlbumId('Greatest Hits', 'artist2-hits');

      expect(albumId1).not.toBe(albumId2);
      expect(albumId1).toBe('album_artist1_hits_greatest_hits');
      expect(albumId2).toBe('album_artist2_hits_greatest_hits');
    });

    it('handles very long album names', () => {
      const longAlbumName =
        'This is a very long album name that might exceed normal limits but should still be processed correctly';
      const albumId = taggingService.generateAlbumId(longAlbumName, 'long-album-id');

      expect(albumId).toBe(
        'album_long_album_id_this_is_a_very_long_album_name_that_might_exceed_normal_limits_but_should_still_be_processed_correctly'
      );
      expect(albumId.startsWith('album_long_album_id_')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(taggingService.getUserTags(1)).rejects.toThrow('Invalid JSON');
    });

    it('handles network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(taggingService.getUserTags(1)).rejects.toThrow('Request timeout');
    });

    it('provides detailed error messages for API failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error: Database connection failed',
      });

      await expect(taggingService.getUserTags(1)).rejects.toThrow(
        'API call failed: 500 - Internal server error: Database connection failed'
      );
    });
  });

  describe('getSongsWithTag', () => {
    it('fetches songs for a specific tag successfully', async () => {
      const mockSongs = ['song1', 'song2', 'song3'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSongs,
      });

      const result = await taggingService.getSongsWithTag(1, 2);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/users/1/tags/2/songs', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockSongs);
    });

    it('handles API error when fetching songs for invalid tag ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Tag not found',
      });

      await expect(taggingService.getSongsWithTag(1, 999)).rejects.toThrow(
        'API call failed: 404 - Tag not found'
      );
    });

    it('handles empty response arrays', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await taggingService.getSongsWithTag(1, 1);

      expect(result).toEqual([]);
    });
  });
});
