import { SpotifyCurrentlyPlayingResponse, SpotifyRecentTracksResponse, CurrentlyPlaying, RecentTrack } from '../types';

export class SpotifyApiService {
  private getImageUrl(images: Array<{ url: string; height: number; width: number }>): string | undefined {
    return images && images.length > 0 ? images[0].url : undefined;
  }

  async getCurrentlyPlaying(token: string): Promise<CurrentlyPlaying | null> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const data = await response.json() as SpotifyCurrentlyPlayingResponse;
        if (data && data.item && data.is_playing) {
          return {
            name: data.item.name,
            artist: data.item.artists[0]?.name || 'Unknown Artist',
            album: data.item.album.name,
            album_image_url: this.getImageUrl(data.item.album.images),
            is_playing: data.is_playing
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
      const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as SpotifyRecentTracksResponse;
        return data.items.map((item) => ({
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
}

export const spotifyApi = new SpotifyApiService();