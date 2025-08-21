import { Tag, Track, SavedPlaylist, SavedAlbum } from '../types';
import { taggingService } from './taggingService';
import { spotifyApi } from './spotifyApi';

export interface FilteredContent {
  songs: Track[];
  albums: SavedAlbum[];
  playlists: SavedPlaylist[];
}

export interface PlaylistGenerationRequest {
  name: string;
  userId: number;
  selectedTagIds: number[];
  contentTypes: ('songs' | 'albums' | 'playlists')[];
}

export interface PlaylistGenerationResponse {
  playlistId: string;
  name: string;
  trackCount: number;
  tracks: Track[];
}

export interface TagPaginationResponse {
  tags: Tag[];
  hasMore: boolean;
  total: number;
}

export class PlaylistService {
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

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  }

  // Tag loading with pagination
  async getUserTagsPaginated(
    userId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<TagPaginationResponse> {
    try {
      // Get all tags first to calculate pagination
      const allTags = await taggingService.getUserTags(userId);
      
      // Apply pagination
      const paginatedTags = allTags.slice(offset, offset + limit);
      const hasMore = offset + limit < allTags.length;

      return {
        tags: paginatedTags,
        hasMore,
        total: allTags.length,
      };
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error loading paginated tags:', error);
      }
      throw error;
    }
  }

  // Get songs with specific tags for filtering
  async getSongsWithTags(
    userId: number,
    tagIds: number[],
    spotifyToken: string
  ): Promise<Track[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      // Get all song IDs that have any of the specified tags
      const songIdSets = await Promise.all(
        tagIds.map(tagId => taggingService.getSongsWithTag(userId, tagId))
      );

      // Combine all song IDs and remove duplicates
      const allSongIds = [...new Set(songIdSets.flat())];

      if (allSongIds.length === 0) {
        return [];
      }

      // We need to get track details from Spotify for these song IDs
      // Since we store song IDs in a custom format, we need to fetch user's library
      // and match against our stored IDs
      const savedTracks = await spotifyApi.getSavedTracks(spotifyToken, 50);
      
      // Filter tracks that match our tagged song IDs
      const filteredTracks = savedTracks.filter(track => {
        const generatedId = taggingService.generateSongId(track.name, track.artist);
        return allSongIds.includes(generatedId);
      });

      return filteredTracks;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error getting songs with tags:', error);
      }
      throw error;
    }
  }

  // Get albums with specific tags
  async getAlbumsWithTags(
    userId: number,
    tagIds: number[],
    spotifyToken: string
  ): Promise<SavedAlbum[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      // Get all album IDs that have any of the specified tags
      const albumIdSets = await Promise.all(
        tagIds.map(tagId => taggingService.getSongsWithTag(userId, tagId))
      );

      // Get album IDs (filter for entries that start with 'album_')
      const allAlbumIds = [...new Set(albumIdSets.flat().filter(id => id.startsWith('album_')))];

      if (allAlbumIds.length === 0) {
        return [];
      }

      // Get user's saved albums and filter
      const savedAlbums = await spotifyApi.getSavedAlbums(spotifyToken, 50);
      
      const filteredAlbums = savedAlbums.filter(album => {
        const generatedId = taggingService.generateAlbumId(album.name, album.album_id);
        return allAlbumIds.includes(generatedId);
      });

      return filteredAlbums;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error getting albums with tags:', error);
      }
      throw error;
    }
  }

  // Get playlists with specific tags
  async getPlaylistsWithTags(
    userId: number,
    tagIds: number[],
    spotifyToken: string
  ): Promise<SavedPlaylist[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      // Get all playlist IDs that have any of the specified tags
      const playlistIdSets = await Promise.all(
        tagIds.map(tagId => taggingService.getSongsWithTag(userId, tagId))
      );

      // Get playlist IDs (filter for entries that start with 'playlist_')
      const allPlaylistIds = [...new Set(playlistIdSets.flat().filter(id => id.startsWith('playlist_')))];

      if (allPlaylistIds.length === 0) {
        return [];
      }

      // Get user's saved playlists and filter
      const savedPlaylists = await spotifyApi.getSavedPlaylists(spotifyToken, 50);
      
      const filteredPlaylists = savedPlaylists.filter(playlist => {
        const generatedId = taggingService.generatePlaylistId(playlist.name, playlist.playlist_id);
        return allPlaylistIds.includes(generatedId);
      });

      return filteredPlaylists;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error getting playlists with tags:', error);
      }
      throw error;
    }
  }

  // Get all songs from tagged albums
  async getSongsFromTaggedAlbums(
    userId: number,
    tagIds: number[],
    spotifyToken: string
  ): Promise<Track[]> {
    try {
      const taggedAlbums = await this.getAlbumsWithTags(userId, tagIds, spotifyToken);
      
      if (taggedAlbums.length === 0) {
        return [];
      }

      // For now, we'll return placeholder tracks since getting album tracks
      // requires additional Spotify API calls
      const albumTracks: Track[] = taggedAlbums.map(album => ({
        name: `${album.name} (Album)`,
        artist: album.artist,
        album: album.name,
        album_image_url: album.image_url,
        played_at: new Date().toISOString(),
      }));

      return albumTracks;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error getting songs from tagged albums:', error);
      }
      throw error;
    }
  }

  // Get all songs from tagged playlists
  async getSongsFromTaggedPlaylists(
    userId: number,
    tagIds: number[],
    spotifyToken: string
  ): Promise<Track[]> {
    try {
      const taggedPlaylists = await this.getPlaylistsWithTags(userId, tagIds, spotifyToken);
      
      if (taggedPlaylists.length === 0) {
        return [];
      }

      // For now, we'll return placeholder tracks since getting playlist tracks
      // requires additional Spotify API calls
      const playlistTracks: Track[] = taggedPlaylists.map(playlist => ({
        name: `${playlist.name} (Playlist)`,
        artist: 'Various Artists',
        album: playlist.name,
        album_image_url: playlist.image_url,
        played_at: new Date().toISOString(),
      }));

      return playlistTracks;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error getting songs from tagged playlists:', error);
      }
      throw error;
    }
  }

  // Filter content based on selected tags and content types
  async getFilteredContent(
    userId: number,
    tagIds: number[],
    contentTypes: ('songs' | 'albums' | 'playlists')[],
    spotifyToken: string
  ): Promise<Track[]> {
    try {
      if (tagIds.length === 0 || contentTypes.length === 0) {
        return [];
      }

      const allTracks: Track[] = [];

      // Get songs if requested
      if (contentTypes.includes('songs')) {
        const taggedSongs = await this.getSongsWithTags(userId, tagIds, spotifyToken);
        allTracks.push(...taggedSongs);
      }

      // Get songs from albums if requested
      if (contentTypes.includes('albums')) {
        const albumSongs = await this.getSongsFromTaggedAlbums(userId, tagIds, spotifyToken);
        allTracks.push(...albumSongs);
      }

      // Get songs from playlists if requested
      if (contentTypes.includes('playlists')) {
        const playlistSongs = await this.getSongsFromTaggedPlaylists(userId, tagIds, spotifyToken);
        allTracks.push(...playlistSongs);
      }

      // Remove duplicates based on name and artist
      const uniqueTracks = allTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.name === track.name && t.artist === track.artist)
      );

      return uniqueTracks;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error filtering content:', error);
      }
      throw error;
    }
  }

  // Create playlist on Spotify (placeholder for future implementation)
  async createPlaylistOnSpotify(
    request: PlaylistGenerationRequest,
    spotifyToken: string
  ): Promise<PlaylistGenerationResponse> {
    try {
      // For now, return a mock response
      // In a full implementation, this would:
      // 1. Create a new playlist on Spotify
      // 2. Add the filtered tracks to the playlist
      // 3. Return the created playlist details

      const filteredTracks = await this.getFilteredContent(
        request.userId,
        request.selectedTagIds,
        request.contentTypes,
        spotifyToken
      );

      return {
        playlistId: `generated_${Date.now()}`,
        name: request.name,
        trackCount: filteredTracks.length,
        tracks: filteredTracks.slice(0, 20), // Limit preview to 20 tracks
      };
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error creating playlist on Spotify:', error);
      }
      throw error;
    }
  }
}

export const playlistService = new PlaylistService();