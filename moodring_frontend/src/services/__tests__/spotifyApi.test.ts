import { spotifyApi } from '../spotifyApi';

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('spotifyApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentlyPlaying', () => {
    const mockToken = 'test-access-token';

    it('returns currently playing track when API responds with data', async () => {
      const mockResponse = {
        is_playing: true,
        item: {
          name: 'Test Song',
          artists: [{ name: 'Test Artist' }],
          album: {
            name: 'Test Album',
            images: [
              { url: 'https://example.com/image-large.jpg' },
              { url: 'https://example.com/image-medium.jpg' },
              { url: 'https://example.com/image-small.jpg' },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);

      expect(result).toEqual({
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        album_image_url: 'https://example.com/image-large.jpg',
        is_playing: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns null when no track is currently playing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);

      expect(result).toBeNull();
    });

    it('returns null when API returns empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);

      expect(result).toBeNull();
    });

    it('handles missing artist data gracefully', async () => {
      const mockResponse = {
        is_playing: true,
        item: {
          name: 'Test Song',
          artists: [],
          album: {
            name: 'Test Album',
            images: [{ url: 'https://example.com/image.jpg' }],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);

      expect(result).toEqual({
        name: 'Test Song',
        artist: 'Unknown Artist',
        album: 'Test Album',
        album_image_url: 'https://example.com/image.jpg',
        is_playing: true,
      });
    });

    it('handles empty album images array', async () => {
      const mockResponse = {
        is_playing: true,
        item: {
          name: 'Test Song',
          artists: [{ name: 'Test Artist' }],
          album: {
            name: 'Test Album',
            images: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);

      expect(result).toEqual({
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        album_image_url: undefined,
        is_playing: true,
      });
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getCurrentlyPlaying(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('throws error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);
      expect(result).toBeNull();
    });

    it('handles malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const result = await spotifyApi.getCurrentlyPlaying(mockToken);
      expect(result).toBeNull();
    });
  });

  describe('getRecentTracks', () => {
    const mockToken = 'test-access-token';

    it('returns recent tracks when API responds with data', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              name: 'Recent Song 1',
              artists: [{ name: 'Recent Artist 1' }],
              album: {
                name: 'Recent Album 1',
                images: [{ url: 'https://example.com/recent1.jpg' }],
              },
            },
            played_at: '2025-08-08T01:00:00Z',
          },
          {
            track: {
              name: 'Recent Song 2',
              artists: [{ name: 'Recent Artist 2' }],
              album: {
                name: 'Recent Album 2',
                images: [{ url: 'https://example.com/recent2.jpg' }],
              },
            },
            played_at: '2025-08-08T02:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getRecentTracks(mockToken);

      expect(result).toEqual([
        {
          name: 'Recent Song 1',
          artist: 'Recent Artist 1',
          album: 'Recent Album 1',
          album_image_url: 'https://example.com/recent1.jpg',
          played_at: '2025-08-08T01:00:00Z',
        },
        {
          name: 'Recent Song 2',
          artist: 'Recent Artist 2',
          album: 'Recent Album 2',
          album_image_url: 'https://example.com/recent2.jpg',
          played_at: '2025-08-08T02:00:00Z',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/player/recently-played?limit=10',
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns empty array when no recent tracks', async () => {
      const mockResponse = {
        items: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getRecentTracks(mockToken);

      expect(result).toEqual([]);
    });

    it('handles missing artist data in recent tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              name: 'Recent Song',
              artists: [],
              album: {
                name: 'Recent Album',
                images: [{ url: 'https://example.com/recent.jpg' }],
              },
            },
            played_at: '2025-08-08T01:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getRecentTracks(mockToken);

      expect(result[0].artist).toBe('Unknown Artist');
    });

    it('handles empty album images in recent tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              name: 'Recent Song',
              artists: [{ name: 'Recent Artist' }],
              album: {
                name: 'Recent Album',
                images: [],
              },
            },
            played_at: '2025-08-08T01:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getRecentTracks(mockToken);

      expect(result[0].album_image_url).toBeUndefined();
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getRecentTracks(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('throws error on 429 rate limit response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const result = await spotifyApi.getRecentTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('throws error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getRecentTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getRecentTracks(mockToken);

      expect(result).toEqual([]);
    });
  });
});