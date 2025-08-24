import { taggingService } from '../taggingService';

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('TaggingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSpotifyTrackIdsWithTags', () => {
    it('should fetch Spotify track IDs for given tag IDs', async () => {
      const tagIds = [1, 2];
      const userId = 42;

      const mockResponse1 = ['4iV5W9uYEdYUVa79Axb7Rh', '0VjIjW4GlULA4PmvEZMxfL'];
      const mockResponse2 = ['6rqhFgbbKwnb9MLmUQDhG6'];

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        } as Response);

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/users/42/tags/1/spotify-tracks', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/users/42/tags/2/spotify-tracks', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual([
        '4iV5W9uYEdYUVa79Axb7Rh',
        '0VjIjW4GlULA4PmvEZMxfL',
        '6rqhFgbbKwnb9MLmUQDhG6',
      ]);
    });

    it('should handle empty tag IDs array', async () => {
      const result = await taggingService.getSpotifyTrackIdsWithTags(1, []);

      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle single tag ID', async () => {
      const tagIds = [5];
      const userId = 1;

      const mockResponse = ['4iV5W9uYEdYUVa79Axb7Rh'];

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/users/1/tags/5/spotify-tracks', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(['4iV5W9uYEdYUVa79Axb7Rh']);
    });

    it('should deduplicate returned track IDs', async () => {
      const tagIds = [1, 2, 3];
      const userId = 1;

      // Mock responses with overlapping tracks
      const mockResponse1 = ['4iV5W9uYEdYUVa79Axb7Rh', '0VjIjW4GlULA4PmvEZMxfL'];
      const mockResponse2 = ['4iV5W9uYEdYUVa79Axb7Rh', '6rqhFgbbKwnb9MLmUQDhG6']; // Duplicate
      const mockResponse3 = ['0VjIjW4GlULA4PmvEZMxfL']; // Duplicate

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse3,
        } as Response);

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(result).toEqual([
        '4iV5W9uYEdYUVa79Axb7Rh',
        '0VjIjW4GlULA4PmvEZMxfL',
        '6rqhFgbbKwnb9MLmUQDhG6',
      ]);
    });

    it('should handle API errors by returning empty array', async () => {
      const tagIds = [1];
      const userId = 1;

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(result).toEqual([]);
    });

    it('should handle network errors by returning empty array', async () => {
      const tagIds = [1];
      const userId = 1;

      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(result).toEqual([]);
    });

    it('should handle empty response from API', async () => {
      const tagIds = [999]; // Non-existent tag
      const userId = 1;

      const mockResponse: string[] = [];

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(result).toEqual([]);
    });

    it('should handle malformed JSON response', async () => {
      const tagIds = [1];
      const userId = 1;

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      const result = await taggingService.getSpotifyTrackIdsWithTags(userId, tagIds);

      expect(result).toEqual([]);
    });
  });

  describe('addTagToSong', () => {
    it('should include spotify_track_id when provided', async () => {
      const songId = 'spotify:track:test123';
      const userId = 1;
      const tagId = 5;
      const spotifyTrackId = '4iV5W9uYEdYUVa79Axb7Rh';

      const mockResponse = {
        id: 1,
        user_id: userId,
        song_id: songId,
        tag_id: tagId,
        spotify_track_id: spotifyTrackId,
        created_at: '2023-01-01T00:00:00Z',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await taggingService.addTagToSong(songId, userId, tagId, spotifyTrackId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:8000/songs/${encodeURIComponent(songId)}/tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            tag_id: tagId,
            song_id: songId,
            spotify_track_id: spotifyTrackId,
          }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should work without spotify_track_id for backwards compatibility', async () => {
      const songId = 'spotify:track:test123';
      const userId = 1;
      const tagId = 5;

      const mockResponse = {
        id: 1,
        user_id: userId,
        song_id: songId,
        tag_id: tagId,
        spotify_track_id: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await taggingService.addTagToSong(songId, userId, tagId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:8000/songs/${encodeURIComponent(songId)}/tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            tag_id: tagId,
            song_id: songId,
            spotify_track_id: undefined,
          }),
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
