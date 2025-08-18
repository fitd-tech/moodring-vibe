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
            Authorization: `Bearer ${mockToken}`,
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
      } as unknown as Response);

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
            Authorization: `Bearer ${mockToken}`,
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

  describe('getTopTracks', () => {
    const mockToken = 'test-access-token';

    it('returns top tracks when API responds with data', async () => {
      const mockResponse = {
        items: [
          {
            id: 'top-track-1',
            name: 'Top Song 1',
            popularity: 95,
            artists: [{ name: 'Top Artist 1' }],
            album: {
              name: 'Top Album 1',
              images: [{ url: 'https://example.com/top1.jpg' }],
            },
          },
          {
            id: 'top-track-2',
            name: 'Top Song 2',
            popularity: 90,
            artists: [{ name: 'Top Artist 2' }],
            album: {
              name: 'Top Album 2',
              images: [{ url: 'https://example.com/top2.jpg' }],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getTopTracks(mockToken);

      expect(result).toEqual([
        {
          name: 'Top Song 1',
          artist: 'Top Artist 1',
          album: 'Top Album 1',
          album_image_url: 'https://example.com/top1.jpg',
          song_id: 'top-track-1',
          popularity: 95,
        },
        {
          name: 'Top Song 2',
          artist: 'Top Artist 2',
          album: 'Top Album 2',
          album_image_url: 'https://example.com/top2.jpg',
          song_id: 'top-track-2',
          popularity: 90,
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('uses custom time range and limit parameters', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await spotifyApi.getTopTracks(mockToken, 'short_term', 20);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=20',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns empty array when no top tracks', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getTopTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('handles missing artist data in top tracks', async () => {
      const mockResponse = {
        items: [
          {
            id: 'top-track-1',
            name: 'Top Song',
            popularity: 95,
            artists: [],
            album: {
              name: 'Top Album',
              images: [{ url: 'https://example.com/top.jpg' }],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getTopTracks(mockToken);
      expect(result[0].artist).toBe('Unknown Artist');
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getTopTracks(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('returns empty array on 500 server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getTopTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getTopTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getTopTracks(mockToken);
      expect(result).toEqual([]);
    });
  });

  describe('getMoreTopTracks', () => {
    const mockToken = 'test-access-token';

    it('returns more top tracks with offset pagination', async () => {
      const mockResponse = {
        items: [
          {
            id: 'top-track-11',
            name: 'Top Song 11',
            popularity: 75,
            artists: [{ name: 'Top Artist 11' }],
            album: {
              name: 'Top Album 11',
              images: [{ url: 'https://example.com/top11.jpg' }],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreTopTracks(mockToken, 10, 'long_term');

      expect(result).toEqual([
        {
          name: 'Top Song 11',
          artist: 'Top Artist 11',
          album: 'Top Album 11',
          album_image_url: 'https://example.com/top11.jpg',
          song_id: 'top-track-11',
          popularity: 75,
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=10&offset=10',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns empty array when no more tracks available', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreTopTracks(mockToken, 40);
      expect(result).toEqual([]);
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getMoreTopTracks(mockToken, 10)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('returns empty array on 500 server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getMoreTopTracks(mockToken, 10);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure with dev logging', async () => {
      // Mock __DEV__ to true for this test
      const originalDev = (global as { __DEV__?: boolean }).__DEV__;
      (global as { __DEV__?: boolean }).__DEV__ = true;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getMoreTopTracks(mockToken, 10);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('More top tracks fetch error:', expect.any(Error));

      consoleSpy.mockRestore();
      (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getMoreTopTracks(mockToken, 10);
      expect(result).toEqual([]);
    });
  });

  describe('getSavedTracks', () => {
    const mockToken = 'test-access-token';

    it('returns saved tracks when API responds with data', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'saved-track-1',
              name: 'Saved Song 1',
              artists: [{ name: 'Saved Artist 1' }],
              album: {
                name: 'Saved Album 1',
                images: [{ url: 'https://example.com/saved1.jpg' }],
              },
            },
            added_at: '2024-01-01T10:00:00Z',
          },
          {
            track: {
              id: 'saved-track-2',
              name: 'Saved Song 2',
              artists: [{ name: 'Saved Artist 2' }],
              album: {
                name: 'Saved Album 2',
                images: [{ url: 'https://example.com/saved2.jpg' }],
              },
            },
            added_at: '2024-01-01T09:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedTracks(mockToken);

      expect(result).toEqual([
        {
          name: 'Saved Song 1',
          artist: 'Saved Artist 1',
          album: 'Saved Album 1',
          album_image_url: 'https://example.com/saved1.jpg',
          song_id: 'saved-track-1',
          added_at: '2024-01-01T10:00:00Z',
        },
        {
          name: 'Saved Song 2',
          artist: 'Saved Artist 2',
          album: 'Saved Album 2',
          album_image_url: 'https://example.com/saved2.jpg',
          song_id: 'saved-track-2',
          added_at: '2024-01-01T09:00:00Z',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/tracks?limit=10', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('uses custom limit parameter', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await spotifyApi.getSavedTracks(mockToken, 20);

      expect(mockFetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/tracks?limit=20', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('returns empty array when no saved tracks', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('handles missing artist data in saved tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'saved-track-1',
              name: 'Saved Song',
              artists: [],
              album: {
                name: 'Saved Album',
                images: [{ url: 'https://example.com/saved.jpg' }],
              },
            },
            added_at: '2024-01-01T10:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedTracks(mockToken);
      expect(result[0].artist).toBe('Unknown Artist');
    });

    it('handles empty album images in saved tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'saved-track-1',
              name: 'Saved Song',
              artists: [{ name: 'Saved Artist' }],
              album: {
                name: 'Saved Album',
                images: [],
              },
            },
            added_at: '2024-01-01T10:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedTracks(mockToken);
      expect(result[0].album_image_url).toBeUndefined();
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getSavedTracks(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('throws error on 403 permission denied response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      await expect(spotifyApi.getSavedTracks(mockToken)).rejects.toThrow('PERMISSION_DENIED');
    });

    it('returns empty array on 429 rate limit response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const result = await spotifyApi.getSavedTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getSavedTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getSavedTracks(mockToken);
      expect(result).toEqual([]);
    });
  });

  describe('getMoreRecentTracks', () => {
    const mockToken = 'test-access-token';

    it('returns more recent tracks with before parameter', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              name: 'More Recent Song 1',
              artists: [{ name: 'More Recent Artist 1' }],
              album: {
                name: 'More Recent Album 1',
                images: [{ url: 'https://example.com/more-recent1.jpg' }],
              },
            },
            played_at: '2025-08-07T23:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreRecentTracks(mockToken, '1691449200000');

      expect(result).toEqual([
        {
          name: 'More Recent Song 1',
          artist: 'More Recent Artist 1',
          album: 'More Recent Album 1',
          album_image_url: 'https://example.com/more-recent1.jpg',
          played_at: '2025-08-07T23:00:00Z',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/player/recently-played?limit=10&before=1691449200000',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns more recent tracks without before parameter', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await spotifyApi.getMoreRecentTracks(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/player/recently-played?limit=10',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getMoreRecentTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await spotifyApi.getMoreRecentTracks(mockToken);
      expect(result).toEqual([]);
    });

    it('throws TOKEN_EXPIRED on 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getMoreRecentTracks(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });
  });

  describe('getMoreSavedTracks', () => {
    const mockToken = 'test-access-token';

    it('returns more saved tracks with offset pagination', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'saved-track-11',
              name: 'Saved Song 11',
              artists: [{ name: 'Saved Artist 11' }],
              album: {
                name: 'Saved Album 11',
                images: [{ url: 'https://example.com/saved11.jpg' }],
              },
            },
            added_at: '2024-01-01T08:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 10);

      expect(result).toEqual([
        {
          name: 'Saved Song 11',
          artist: 'Saved Artist 11',
          album: 'Saved Album 11',
          album_image_url: 'https://example.com/saved11.jpg',
          song_id: 'saved-track-11',
          added_at: '2024-01-01T08:00:00Z',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/tracks?limit=10&offset=10',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns empty array when no more saved tracks available', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 40);
      expect(result).toEqual([]);
    });

    it('handles missing artist data in more saved tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'saved-track-11',
              name: 'Saved Song 11',
              artists: [],
              album: {
                name: 'Saved Album 11',
                images: [{ url: 'https://example.com/saved11.jpg' }],
              },
            },
            added_at: '2024-01-01T08:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 10);
      expect(result[0].artist).toBe('Unknown Artist');
    });

    it('handles empty album images in more saved tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'saved-track-11',
              name: 'Saved Song 11',
              artists: [{ name: 'Saved Artist 11' }],
              album: {
                name: 'Saved Album 11',
                images: [],
              },
            },
            added_at: '2024-01-01T08:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 10);
      expect(result[0].album_image_url).toBeUndefined();
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getMoreSavedTracks(mockToken, 10)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('returns empty array on 429 rate limit response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 10);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 10);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getMoreSavedTracks(mockToken, 10);
      expect(result).toEqual([]);
    });
  });

  describe('getSavedPlaylists', () => {
    const mockToken = 'test-access-token';

    it('returns saved playlists when API responds with data', async () => {
      const mockResponse = {
        total: 2,
        limit: 20,
        offset: 0,
        items: [
          {
            id: 'playlist-1',
            name: 'My Awesome Playlist',
            description: 'A great collection of songs',
            images: [{ url: 'https://example.com/playlist1.jpg', height: 300, width: 300 }],
            tracks: { total: 25 },
            owner: { display_name: 'Test User', id: 'user-1' },
            public: true,
            collaborative: false,
          },
          {
            id: 'playlist-2',
            name: 'Workout Hits',
            description: null,
            images: [],
            tracks: { total: 15 },
            owner: { display_name: 'Other User', id: 'user-2' },
            public: false,
            collaborative: true,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedPlaylists(mockToken);

      expect(result).toEqual([
        {
          name: 'My Awesome Playlist',
          description: 'A great collection of songs',
          image_url: 'https://example.com/playlist1.jpg',
          track_count: 25,
          created_at: expect.any(String),
          playlist_id: 'playlist-1',
        },
        {
          name: 'Workout Hits',
          description: undefined,
          image_url: undefined,
          track_count: 15,
          created_at: expect.any(String),
          playlist_id: 'playlist-2',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('uses custom limit parameter', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await spotifyApi.getSavedPlaylists(mockToken, 50);

      expect(mockFetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('returns empty array when no saved playlists', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedPlaylists(mockToken);
      expect(result).toEqual([]);
    });

    it('handles empty playlist images array', async () => {
      const mockResponse = {
        total: 1,
        limit: 20,
        offset: 0,
        items: [
          {
            id: 'playlist-1',
            name: 'No Image Playlist',
            description: 'A playlist without images',
            images: [],
            tracks: { total: 10 },
            owner: { display_name: 'Test User', id: 'user-1' },
            public: true,
            collaborative: false,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedPlaylists(mockToken);
      expect(result[0].image_url).toBeUndefined();
    });

    it('handles null description', async () => {
      const mockResponse = {
        total: 1,
        limit: 20,
        offset: 0,
        items: [
          {
            id: 'playlist-1',
            name: 'No Description Playlist',
            description: null,
            images: [{ url: 'https://example.com/playlist.jpg', height: 300, width: 300 }],
            tracks: { total: 5 },
            owner: { display_name: 'Test User', id: 'user-1' },
            public: true,
            collaborative: false,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedPlaylists(mockToken);
      expect(result[0].description).toBeUndefined();
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getSavedPlaylists(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('throws error on 403 permission denied response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      await expect(spotifyApi.getSavedPlaylists(mockToken)).rejects.toThrow('PERMISSION_DENIED');
    });

    it('returns empty array on 500 server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getSavedPlaylists(mockToken);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getSavedPlaylists(mockToken);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getSavedPlaylists(mockToken);
      expect(result).toEqual([]);
    });
  });

  describe('getMoreSavedPlaylists', () => {
    const mockToken = 'test-access-token';

    it('returns more saved playlists with offset pagination', async () => {
      const mockResponse = {
        total: 1,
        limit: 20,
        offset: 20,
        items: [
          {
            id: 'playlist-21',
            name: 'More Playlist 21',
            description: 'Another great playlist',
            images: [{ url: 'https://example.com/playlist21.jpg', height: 300, width: 300 }],
            tracks: { total: 18 },
            owner: { display_name: 'Test User', id: 'user-1' },
            public: true,
            collaborative: false,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedPlaylists(mockToken, 20);

      expect(result).toEqual([
        {
          name: 'More Playlist 21',
          description: 'Another great playlist',
          image_url: 'https://example.com/playlist21.jpg',
          track_count: 18,
          created_at: expect.any(String),
          playlist_id: 'playlist-21',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/playlists?limit=20&offset=20',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns empty array when no more playlists available', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedPlaylists(mockToken, 100);
      expect(result).toEqual([]);
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getMoreSavedPlaylists(mockToken, 20)).rejects.toThrow(
        'TOKEN_EXPIRED'
      );
    });

    it('returns empty array on 500 server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getMoreSavedPlaylists(mockToken, 20);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getMoreSavedPlaylists(mockToken, 20);
      expect(result).toEqual([]);
    });
  });

  describe('getSavedAlbums', () => {
    const mockToken = 'test-access-token';

    it('returns saved albums when API responds with data', async () => {
      const mockResponse = {
        items: [
          {
            album: {
              id: 'album-1',
              name: 'Amazing Album',
              artists: [{ name: 'Great Artist' }],
              images: [{ url: 'https://example.com/album1.jpg' }],
              release_date: '2023-05-15',
              total_tracks: 12,
            },
          },
          {
            album: {
              id: 'album-2',
              name: 'Another Album',
              artists: [{ name: 'Another Artist' }],
              images: [],
              release_date: '2023-01-01',
              total_tracks: 8,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedAlbums(mockToken);

      expect(result).toEqual([
        {
          name: 'Amazing Album',
          artist: 'Great Artist',
          image_url: 'https://example.com/album1.jpg',
          release_date: '2023-05-15',
          track_count: 12,
          album_id: 'album-1',
        },
        {
          name: 'Another Album',
          artist: 'Another Artist',
          image_url: undefined,
          release_date: '2023-01-01',
          track_count: 8,
          album_id: 'album-2',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/albums?limit=20', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('uses custom limit parameter', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await spotifyApi.getSavedAlbums(mockToken, 50);

      expect(mockFetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/albums?limit=50', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('returns empty array when no saved albums', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedAlbums(mockToken);
      expect(result).toEqual([]);
    });

    it('handles missing artist data in saved albums', async () => {
      const mockResponse = {
        items: [
          {
            album: {
              id: 'album-1',
              name: 'No Artist Album',
              artists: [],
              images: [{ url: 'https://example.com/album.jpg' }],
              release_date: '2023-01-01',
              total_tracks: 10,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedAlbums(mockToken);
      expect(result[0].artist).toBe('Unknown Artist');
    });

    it('handles empty album images array', async () => {
      const mockResponse = {
        items: [
          {
            album: {
              id: 'album-1',
              name: 'No Image Album',
              artists: [{ name: 'Album Artist' }],
              images: [],
              release_date: '2023-01-01',
              total_tracks: 10,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getSavedAlbums(mockToken);
      expect(result[0].image_url).toBeUndefined();
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getSavedAlbums(mockToken)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('throws error on 403 permission denied response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      await expect(spotifyApi.getSavedAlbums(mockToken)).rejects.toThrow('PERMISSION_DENIED');
    });

    it('returns empty array on 500 server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getSavedAlbums(mockToken);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getSavedAlbums(mockToken);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getSavedAlbums(mockToken);
      expect(result).toEqual([]);
    });
  });

  describe('getMoreSavedAlbums', () => {
    const mockToken = 'test-access-token';

    it('returns more saved albums with offset pagination', async () => {
      const mockResponse = {
        items: [
          {
            album: {
              id: 'album-21',
              name: 'More Album 21',
              artists: [{ name: 'More Artist 21' }],
              images: [{ url: 'https://example.com/album21.jpg' }],
              release_date: '2023-03-15',
              total_tracks: 14,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 20);

      expect(result).toEqual([
        {
          name: 'More Album 21',
          artist: 'More Artist 21',
          image_url: 'https://example.com/album21.jpg',
          release_date: '2023-03-15',
          track_count: 14,
          album_id: 'album-21',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/albums?limit=20&offset=20',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('returns empty array when no more albums available', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 100);
      expect(result).toEqual([]);
    });

    it('handles missing artist data in more saved albums', async () => {
      const mockResponse = {
        items: [
          {
            album: {
              id: 'album-21',
              name: 'More Album 21',
              artists: [],
              images: [{ url: 'https://example.com/album21.jpg' }],
              release_date: '2023-03-15',
              total_tracks: 14,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 20);
      expect(result[0].artist).toBe('Unknown Artist');
    });

    it('handles empty album images in more saved albums', async () => {
      const mockResponse = {
        items: [
          {
            album: {
              id: 'album-21',
              name: 'More Album 21',
              artists: [{ name: 'More Artist 21' }],
              images: [],
              release_date: '2023-03-15',
              total_tracks: 14,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 20);
      expect(result[0].image_url).toBeUndefined();
    });

    it('throws error on 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(spotifyApi.getMoreSavedAlbums(mockToken, 20)).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('returns empty array on 500 server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 20);
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 20);
      expect(result).toEqual([]);
    });

    it('handles malformed response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }),
      } as Response);

      const result = await spotifyApi.getMoreSavedAlbums(mockToken, 20);
      expect(result).toEqual([]);
    });
  });
});
