import {
  SpotifyCurrentlyPlayingResponse,
  SpotifyRecentTracksResponse,
  SpotifyTopTracksResponse,
  SpotifySavedTracksResponse,
  CurrentlyPlaying,
  RecentTrack,
  TopTrack,
  SavedTrack,
} from '../types';

export class SpotifyApiService {
  private getImageUrl(
    images: Array<{ url: string; height: number; width: number }>
  ): string | undefined {
    return images && images.length > 0 ? images[0].url : undefined;
  }

  async verifyTokenScopes(token: string): Promise<string[]> {
    try {
      if (__DEV__) {
        console.log('[SpotifyApi] Verifying token scopes...');
      }

      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Unfortunately, Spotify doesn't directly return scopes in the user profile
        // But we can test specific endpoints to verify scopes
        const userLibraryResponse = await fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const scopes: string[] = ['user-read-private', 'user-read-email'];
        
        if (userLibraryResponse.status === 200) {
          scopes.push('user-library-read');
        } else if (userLibraryResponse.status === 403) {
          if (__DEV__) {
            console.warn('[SpotifyApi] Token missing user-library-read scope');
          }
        }

        if (__DEV__) {
          console.log('[SpotifyApi] Verified token scopes:', scopes);
        }
        
        return scopes;
      } else {
        if (__DEV__) {
          console.warn('[SpotifyApi] Failed to verify token scopes:', response.status);
        }
        return [];
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[SpotifyApi] Error verifying token scopes:', error);
      }
      return [];
    }
  }

  async getCurrentlyPlaying(token: string): Promise<CurrentlyPlaying | null> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const data = (await response.json()) as SpotifyCurrentlyPlayingResponse;
        if (data && data.item && data.is_playing) {
          return {
            name: data.item.name,
            artist: data.item.artists[0]?.name || 'Unknown Artist',
            album: data.item.album.name,
            album_image_url: this.getImageUrl(data.item.album.images),
            is_playing: data.is_playing,
          };
        }
      } else if (response.status === 204) {
        return null;
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.warn('Currently playing fetch error:', error);
      }
      return null;
    }
  }

  async getRecentTracks(token: string, limit: number = 10): Promise<RecentTrack[]> {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as SpotifyRecentTracksResponse;
        return data.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album.name,
          album_image_url: this.getImageUrl(item.track.album.images),
          played_at: item.played_at,
        }));
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.warn('Recent tracks fetch error:', error);
      }
      return [];
    }
  }

  async getMoreRecentTracks(token: string, before?: string): Promise<RecentTrack[]> {
    try {
      // Load 10 additional tracks at a time
      const url = before
        ? `https://api.spotify.com/v1/me/player/recently-played?limit=10&before=${before}`
        : `https://api.spotify.com/v1/me/player/recently-played?limit=10`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as SpotifyRecentTracksResponse;
        return data.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album.name,
          album_image_url: this.getImageUrl(item.track.album.images),
          played_at: item.played_at,
        }));
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.warn('More recent tracks fetch error:', error);
      }
      return [];
    }
  }

  async getTopTracks(
    token: string,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 10
  ): Promise<TopTrack[]> {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as SpotifyTopTracksResponse;
        return data.items.map(track => ({
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: track.album.name,
          album_image_url: this.getImageUrl(track.album.images),
          song_id: track.id,
          popularity: track.popularity,
        }));
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.warn('Top tracks fetch error:', error);
      }
      return [];
    }
  }

  async getMoreTopTracks(
    token: string,
    offset: number,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Promise<TopTrack[]> {
    try {
      // Load 10 additional tracks at a time with offset
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=10&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as SpotifyTopTracksResponse;
        return data.items.map(track => ({
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: track.album.name,
          album_image_url: this.getImageUrl(track.album.images),
          song_id: track.id,
          popularity: track.popularity,
        }));
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.warn('More top tracks fetch error:', error);
      }
      return [];
    }
  }

  async getSavedTracks(token: string, limit: number = 10): Promise<SavedTrack[]> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as SpotifySavedTracksResponse;
        
        return data.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album.name,
          album_image_url: this.getImageUrl(item.track.album.images),
          song_id: item.track.id,
          added_at: item.added_at,
        }));
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      } else if (response.status === 403) {
        throw new Error('PERMISSION_DENIED');
      }

      return [];
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'TOKEN_EXPIRED' || error.message === 'PERMISSION_DENIED')
      ) {
        throw error;
      }
      if (__DEV__) {
        console.warn('Saved tracks fetch error:', error);
      }
      return [];
    }
  }

  async getMoreSavedTracks(token: string, offset: number): Promise<SavedTrack[]> {
    try {
      // Load 10 additional tracks at a time with offset
      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks?limit=10&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as SpotifySavedTracksResponse;
        return data.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album.name,
          album_image_url: this.getImageUrl(item.track.album.images),
          song_id: item.track.id,
          added_at: item.added_at,
        }));
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.warn('More saved tracks fetch error:', error);
      }
      return [];
    }
  }
}

export const spotifyApi = new SpotifyApiService();
