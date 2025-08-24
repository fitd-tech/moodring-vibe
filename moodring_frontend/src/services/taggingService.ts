import { Tag, NewTag, SongTag, NewSongTag } from '../types';

export class TaggingService {
  private getBackendUrl(): string {
    return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  }

  private async makeApiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    // Handle 204 No Content responses (successful DELETE operations)
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  }

  // Tag management methods
  async getUserTags(userId: number): Promise<Tag[]> {
    const url = `${this.getBackendUrl()}/users/${userId}/tags`;
    return this.makeApiCall<Tag[]>(url);
  }

  async createTag(userId: number, tagData: NewTag): Promise<Tag> {
    const url = `${this.getBackendUrl()}/users/${userId}/tags`;
    const tagWithUser = { ...tagData, user_id: userId };

    return this.makeApiCall<Tag>(url, {
      method: 'POST',
      body: JSON.stringify(tagWithUser),
    });
  }

  async deleteTag(userId: number, tagId: number): Promise<void> {
    const url = `${this.getBackendUrl()}/users/${userId}/tags/${tagId}`;
    await this.makeApiCall<void>(url, {
      method: 'DELETE',
    });
  }

  // Song tagging methods
  async getSongTags(songId: string, userId: number): Promise<Tag[]> {
    const url = `${this.getBackendUrl()}/songs/${encodeURIComponent(songId)}/tags?user_id=${userId}`;
    return this.makeApiCall<Tag[]>(url);
  }

  async addTagToSong(
    songId: string,
    userId: number,
    tagId: number,
    spotifyTrackId?: string
  ): Promise<SongTag> {
    const url = `${this.getBackendUrl()}/songs/${encodeURIComponent(songId)}/tags`;
    const songTagData: NewSongTag = {
      user_id: userId,
      tag_id: tagId,
      song_id: songId,
      spotify_track_id: spotifyTrackId,
    };

    return this.makeApiCall<SongTag>(url, {
      method: 'POST',
      body: JSON.stringify(songTagData),
    });
  }

  async removeTagFromSong(songId: string, userId: number, tagId: number): Promise<void> {
    const url = `${this.getBackendUrl()}/songs/${encodeURIComponent(songId)}/tags/${tagId}?user_id=${userId}`;
    await this.makeApiCall<void>(url, {
      method: 'DELETE',
    });
  }

  // Get songs that have a specific tag
  async getSongsWithTag(userId: number, tagId: number): Promise<string[]> {
    const url = `${this.getBackendUrl()}/users/${userId}/tags/${tagId}/songs`;
    return this.makeApiCall<string[]>(url);
  }

  // Get Spotify track IDs for songs that have specific tags
  async getSpotifyTrackIdsWithTags(userId: number, tagIds: number[]): Promise<string[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      // Get all song tag entries for the specified tags
      const allSpotifyTrackIds: string[] = [];

      for (const tagId of tagIds) {
        const url = `${this.getBackendUrl()}/users/${userId}/tags/${tagId}/spotify-tracks`;
        try {
          const spotifyTrackIds = await this.makeApiCall<string[]>(url);
          allSpotifyTrackIds.push(...spotifyTrackIds);
        } catch {
          // If endpoint doesn't exist yet, fallback to getting normalized IDs
          // and skip this tag (TODO: TEMP - Remove when backend supports spotify-tracks endpoint)
          if (__DEV__) {
            console.warn(
              `[TaggingService] spotify-tracks endpoint not implemented for tag ${tagId}, skipping`
            );
          }
        }
      }

      // Remove duplicates
      return [...new Set(allSpotifyTrackIds.filter(id => id && id.length > 0))];
    } catch (error) {
      if (__DEV__) {
        console.error('[TaggingService] Error getting Spotify track IDs with tags:', error);
      }
      return [];
    }
  }

  // Utility method to generate a song ID from track information
  generateSongId(trackName: string, artist: string): string {
    // Create a consistent identifier from track name and artist
    return `${trackName.toLowerCase().trim()}__${artist.toLowerCase().trim()}`.replace(
      /[^a-z0-9_]/g,
      '_'
    );
  }

  // Utility method to generate a playlist ID from playlist information
  generatePlaylistId(playlistName: string, playlistId: string): string {
    // Create a consistent identifier from playlist name and Spotify playlist ID
    return `playlist_${playlistId}_${playlistName.toLowerCase().trim()}`.replace(
      /[^a-z0-9_]/g,
      '_'
    );
  }

  // Utility method to generate an album ID from album information
  generateAlbumId(albumName: string, albumId: string): string {
    // Create a consistent identifier from album name and Spotify album ID
    return `album_${albumId}_${albumName.toLowerCase().trim()}`.replace(/[^a-z0-9_]/g, '_');
  }
}

export const taggingService = new TaggingService();
