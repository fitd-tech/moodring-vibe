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

  async addTagToSong(songId: string, userId: number, tagId: number): Promise<SongTag> {
    const url = `${this.getBackendUrl()}/songs/${encodeURIComponent(songId)}/tags`;
    const songTagData: NewSongTag = {
      user_id: userId,
      tag_id: tagId,
      song_id: songId,
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

  // Utility method to generate a song ID from track information
  generateSongId(trackName: string, artist: string): string {
    // Create a consistent identifier from track name and artist
    return `${trackName.toLowerCase().trim()}__${artist.toLowerCase().trim()}`.replace(/[^a-z0-9_]/g, '_');
  }
}

export const taggingService = new TaggingService();