import { Tag, NewTag, SongTag, NewSongTag, EntityTag, NewEntityTag } from '../types';

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

  // Entity tagging methods (new)
  async getEntityTags(entityType: 'track' | 'album' | 'playlist', entityId: string, userId: number): Promise<Tag[]> {
    const url = `${this.getBackendUrl()}/entities/${entityType}/${encodeURIComponent(entityId)}/tags?user_id=${userId}`;
    return this.makeApiCall<Tag[]>(url);
  }

  async addTagToEntity(
    entityType: 'track' | 'album' | 'playlist',
    entityId: string,
    userId: number,
    tagId: number,
    spotifyId: string
  ): Promise<EntityTag> {
    const url = `${this.getBackendUrl()}/entities/${entityType}/${encodeURIComponent(entityId)}/tags`;
    const entityTagData: NewEntityTag = {
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      tag_id: tagId,
      spotify_id: spotifyId,
    };

    return this.makeApiCall<EntityTag>(url, {
      method: 'POST',
      body: JSON.stringify(entityTagData),
    });
  }

  async removeTagFromEntity(entityType: 'track' | 'album' | 'playlist', entityId: string, userId: number, tagId: number): Promise<void> {
    const url = `${this.getBackendUrl()}/entities/${entityType}/${encodeURIComponent(entityId)}/tags/${tagId}?user_id=${userId}`;
    await this.makeApiCall<void>(url, {
      method: 'DELETE',
    });
  }

  async getSpotifyIdsWithTag(userId: number, tagId: number, entityType: 'track' | 'album' | 'playlist'): Promise<string[]> {
    const url = `${this.getBackendUrl()}/users/${userId}/tags/${tagId}/spotify-ids/${entityType}`;
    return this.makeApiCall<string[]>(url);
  }

  // Song tagging methods (backward compatibility)
  async getSongTags(songId: string, userId: number): Promise<Tag[]> {
    // Redirect to entity tags for tracks
    return this.getEntityTags('track', songId, userId);
  }

  async addTagToSong(
    songId: string,
    userId: number,
    tagId: number,
    spotifyTrackId?: string
  ): Promise<SongTag> {
    // Backward compatibility - redirect to entity tagging
    const spotifyId = spotifyTrackId || songId;
    const entityTag = await this.addTagToEntity('track', songId, userId, tagId, spotifyId);
    
    // Convert EntityTag back to SongTag format for backward compatibility
    return {
      id: entityTag.id,
      user_id: entityTag.user_id,
      song_id: entityTag.entity_id,
      tag_id: entityTag.tag_id,
      created_at: entityTag.created_at,
      spotify_track_id: entityTag.spotify_id,
    };
  }

  async removeTagFromSong(songId: string, userId: number, tagId: number): Promise<void> {
    // Backward compatibility - redirect to entity tagging
    return this.removeTagFromEntity('track', songId, userId, tagId);
  }

  // Get songs that have a specific tag
  async getSongsWithTag(userId: number, tagId: number): Promise<string[]> {
    const url = `${this.getBackendUrl()}/users/${userId}/tags/${tagId}/songs`;
    return this.makeApiCall<string[]>(url);
  }

  // Get Spotify IDs for entities of a specific type that have specific tags
  async getSpotifyIdsWithTags(userId: number, tagIds: number[], entityType: 'track' | 'album' | 'playlist'): Promise<string[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      // Get all entity IDs for the specified tags
      const allSpotifyIds: string[] = [];

      for (const tagId of tagIds) {
        try {
          const spotifyIds = await this.getSpotifyIdsWithTag(userId, tagId, entityType);
          allSpotifyIds.push(...spotifyIds);
        } catch (error) {
          if (__DEV__) {
            console.warn(
              `[TaggingService] Failed to get ${entityType} IDs for tag ${tagId}:`, error
            );
          }
        }
      }

      // Remove duplicates
      return [...new Set(allSpotifyIds.filter(id => id && id.length > 0))];
    } catch (error) {
      if (__DEV__) {
        console.error(`[TaggingService] Error getting Spotify ${entityType} IDs with tags:`, error);
      }
      return [];
    }
  }

  // Get Spotify track IDs for songs that have specific tags (backward compatibility)
  async getSpotifyTrackIdsWithTags(userId: number, tagIds: number[]): Promise<string[]> {
    return this.getSpotifyIdsWithTags(userId, tagIds, 'track');
  }

  // Utility method to generate a song ID from track information (backward compatibility)
  generateSongId(trackName: string, artist: string): string {
    return this.generateEntityId(trackName, artist);
  }

  // Utility method to generate an entity ID from entity information
  generateEntityId(entityName: string, contextInfo: string): string {
    // Create a consistent identifier from entity name and context (artist, owner, etc.)
    return `${entityName.toLowerCase().trim()}__${contextInfo.toLowerCase().trim()}`.replace(
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
