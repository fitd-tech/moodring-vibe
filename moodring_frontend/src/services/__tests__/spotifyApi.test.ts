import { spotifyApi } from '../spotifyApi';

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('SpotifyApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTracksByIds', () => {
    it('should fetch tracks using Spotify track IDs', async () => {
      const mockTrackIds = ['4iV5W9uYEdYUVa79Axb7Rh', '0VjIjW4GlULA4PmvEZMxfL'];
      const token = 'test-token';

      const mockResponse = {
        tracks: [
          {
            id: '4iV5W9uYEdYUVa79Axb7Rh',
            name: 'Test Track 1',
            artists: [{ name: 'Test Artist 1' }],
            album: {
              name: 'Test Album 1',
              images: [{ url: 'test-image-1.jpg' }],
            },
            duration_ms: 180000,
          },
          {
            id: '0VjIjW4GlULA4PmvEZMxfL',
            name: 'Test Track 2',
            artists: [{ name: 'Test Artist 2' }],
            album: {
              name: 'Test Album 2',
              images: [{ url: 'test-image-2.jpg' }],
            },
            duration_ms: 210000,
          },
        ],
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getTracksByIds(token, mockTrackIds);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/tracks?ids=4iV5W9uYEdYUVa79Axb7Rh%2C0VjIjW4GlULA4PmvEZMxfL',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Test Track 1',
        artist: 'Test Artist 1',
        album: 'Test Album 1',
        album_image_url: 'test-image-1.jpg',
        song_id: '4iV5W9uYEdYUVa79Axb7Rh',
        added_at: expect.any(String),
      });
    });

    it('should handle batching of more than 50 track IDs', async () => {
      const mockTrackIds = Array.from({ length: 75 }, (_, i) => `track_id_${i}`);
      const token = 'test-token';

      const mockResponse1 = {
        tracks: Array.from({ length: 50 }, (_, i) => ({
          id: `track_id_${i}`,
          name: `Track ${i}`,
          artists: [{ name: `Artist ${i}` }],
          album: {
            name: `Album ${i}`,
            images: [{ url: `image_${i}.jpg` }],
          },
          duration_ms: 180000,
        })),
      };

      const mockResponse2 = {
        tracks: Array.from({ length: 25 }, (_, i) => ({
          id: `track_id_${i + 50}`,
          name: `Track ${i + 50}`,
          artists: [{ name: `Artist ${i + 50}` }],
          album: {
            name: `Album ${i + 50}`,
            images: [{ url: `image_${i + 50}.jpg` }],
          },
          duration_ms: 180000,
        })),
      };

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        } as Response);

      const result = await spotifyApi.getTracksByIds(token, mockTrackIds);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(75);
    });

    it('should handle empty track IDs array', async () => {
      const token = 'test-token';
      const result = await spotifyApi.getTracksByIds(token, []);

      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should filter out null tracks from Spotify response', async () => {
      const mockTrackIds = ['valid_id', 'invalid_id'];
      const token = 'test-token';

      const mockResponse = {
        tracks: [
          {
            id: 'valid_id',
            name: 'Valid Track',
            artists: [{ name: 'Valid Artist' }],
            album: {
              name: 'Valid Album',
              images: [{ url: 'valid-image.jpg' }],
            },
            duration_ms: 180000,
          },
          null, // Invalid/removed track
        ],
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getTracksByIds(token, mockTrackIds);

      expect(result).toHaveLength(1);
      expect(result[0].song_id).toBe('valid_id');
    });

    it('should handle API errors gracefully', async () => {
      const mockTrackIds = ['test_id'];
      const token = 'test-token';

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getTracksByIds(token, mockTrackIds)).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const mockTrackIds = ['test_id'];
      const token = 'test-token';

      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      // The actual implementation catches errors and returns empty array in DEV mode
      const result = await spotifyApi.getTracksByIds(token, mockTrackIds);
      expect(result).toEqual([]);
    });
  });
});
