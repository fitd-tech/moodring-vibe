import { TaggingService, taggingService } from '../taggingService';
import { Tag, NewTag, SongTag, NewSongTag } from '../../types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variable
const originalEnv = process.env;

describe('TaggingService', () => {
  const mockUser = {
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
  };

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
    process.env.EXPO_PUBLIC_BACKEND_URL = 'http://localhost:8000';
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
      const backendUrl = (service as any).getBackendUrl();
      expect(backendUrl).toBe('http://localhost:8000');
    });

    it('uses environment variable for backend URL when set', () => {
      process.env.EXPO_PUBLIC_BACKEND_URL = 'https://api.example.com';
      const service = new TaggingService();
      
      const backendUrl = (service as any).getBackendUrl();
      expect(backendUrl).toBe('https://api.example.com');
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
        json: async () => ({}),
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
        json: async () => ({}),
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
        json: async () => ({}),
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
      expect(songId).toBe('song____with__symbols___artist___co_');
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
});