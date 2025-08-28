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

  // Helper method to fetch ALL saved tracks from Spotify with pagination
  private async getAllSavedTracks(spotifyToken: string): Promise<Track[]> {
    try {
      const allTracks: Track[] = [];
      let offset = 0;
      const limit = 50; // Spotify API limit per request
      let hasMore = true;

      while (hasMore) {
        const tracks =
          offset === 0
            ? await spotifyApi.getSavedTracks(spotifyToken, limit)
            : await spotifyApi.getMoreSavedTracks(spotifyToken, offset);

        if (!tracks || tracks.length === 0) {
          hasMore = false;
        } else {
          allTracks.push(
            ...tracks.map(savedTrack => ({
              name: savedTrack.name,
              artist: savedTrack.artist,
              album: savedTrack.album,
              album_image_url: savedTrack.album_image_url,
              played_at: savedTrack.added_at, // Use added_at as played_at for consistency
            }))
          );

          offset += limit;

          // Stop if we got fewer tracks than requested (last page)
          if (tracks.length < limit) {
            hasMore = false;
          }
        }
      }

      if (__DEV__) {
        console.log(
          `[PlaylistService] Fetched ${allTracks.length} total saved tracks from Spotify`
        );
      }

      return allTracks;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error fetching all saved tracks:', error);
      }
      throw error;
    }
  }

  // Helper method to fetch ALL saved albums from Spotify with pagination
  private async getAllSavedAlbums(spotifyToken: string): Promise<SavedAlbum[]> {
    try {
      const allAlbums: SavedAlbum[] = [];
      let offset = 0;
      const limit = 20; // Spotify API limit per request for albums
      let hasMore = true;

      while (hasMore) {
        const albums =
          offset === 0
            ? await spotifyApi.getSavedAlbums(spotifyToken, limit)
            : await spotifyApi.getMoreSavedAlbums(spotifyToken, offset);

        if (!albums || albums.length === 0) {
          hasMore = false;
        } else {
          allAlbums.push(...albums);
          offset += limit;

          // Stop if we got fewer albums than requested (last page)
          if (albums.length < limit) {
            hasMore = false;
          }
        }
      }

      if (__DEV__) {
        console.log(
          `[PlaylistService] Fetched ${allAlbums.length} total saved albums from Spotify`
        );
      }

      return allAlbums;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error fetching all saved albums:', error);
      }
      throw error;
    }
  }

  // Helper method to fetch ALL saved playlists from Spotify with pagination
  private async getAllSavedPlaylists(spotifyToken: string): Promise<SavedPlaylist[]> {
    try {
      const allPlaylists: SavedPlaylist[] = [];
      let offset = 0;
      const limit = 20; // Spotify API limit per request for playlists
      let hasMore = true;

      while (hasMore) {
        const playlists =
          offset === 0
            ? await spotifyApi.getSavedPlaylists(spotifyToken, limit)
            : await spotifyApi.getMoreSavedPlaylists(spotifyToken, offset);

        if (!playlists || playlists.length === 0) {
          hasMore = false;
        } else {
          allPlaylists.push(...playlists);
          offset += limit;

          // Stop if we got fewer playlists than requested (last page)
          if (playlists.length < limit) {
            hasMore = false;
          }
        }
      }

      if (__DEV__) {
        console.log(
          `[PlaylistService] Fetched ${allPlaylists.length} total saved playlists from Spotify`
        );
      }

      return allPlaylists;
    } catch (error) {
      if (__DEV__) {
        console.error('[PlaylistService] Error fetching all saved playlists:', error);
      }
      throw error;
    }
  }


  // Get songs with specific tags for filtering
  async getSongsWithTags(userId: number, tagIds: number[], spotifyToken: string): Promise<Track[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      if (__DEV__) {
        console.log(`[PlaylistService] Getting songs for tags:`, tagIds);
      }

      // First, try to get Spotify track IDs for the tagged songs
      const spotifyTrackIds = await taggingService.getSpotifyIdsWithTags(userId, tagIds, 'track');

      if (spotifyTrackIds.length > 0) {
        if (__DEV__) {
          console.log(
            `[PlaylistService] Found ${spotifyTrackIds.length} Spotify track IDs, fetching directly from Spotify API`
          );
        }

        // Fetch tracks directly from Spotify API using track IDs
        const tracksFromSpotify = await spotifyApi.getTracksByIds(spotifyToken, spotifyTrackIds);

        // Convert to Track format for consistency with the rest of the system
        const convertedTracks: Track[] = tracksFromSpotify.map(track => ({
          name: track.name,
          artist: track.artist,
          album: track.album,
          album_image_url: track.album_image_url,
          played_at: track.added_at,
        }));

        if (__DEV__) {
          console.log(
            `[PlaylistService] Successfully fetched ${convertedTracks.length} tracks from Spotify API`
          );
        }

        return convertedTracks;
      }

      // Fallback to old method if no Spotify track IDs are available
      if (__DEV__) {
        console.log(
          `[PlaylistService] No Spotify track IDs found, falling back to search through local tracks`
        );
      }

      // Get all song IDs that have any of the specified tags (normalized IDs)
      const songIdSets = await Promise.all(
        tagIds.map(tagId => taggingService.getSpotifyIdsWithTag(userId, tagId, 'track'))
      );

      // Combine and deduplicate track Spotify IDs
      const allSongIds = Array.from(new Set(songIdSets.flat()));

      if (allSongIds.length === 0) {
        return [];
      }

      if (__DEV__) {
        console.log(
          `[PlaylistService] Found ${allSongIds.length} Spotify track IDs with tags`
        );
      }

      // Fetch tracks directly from Spotify API using track IDs
      const tracksFromSpotify = await spotifyApi.getTracksByIds(spotifyToken, allSongIds);

      // Convert to Track format for consistency with the rest of the system
      const filteredTracks: Track[] = tracksFromSpotify.map(track => ({
        name: track.name,
        artist: track.artist,
        album: track.album,
        album_image_url: track.album_image_url,
        played_at: track.added_at,
      }));

      if (__DEV__) {
        console.log(
          `[PlaylistService] Successfully fetched ${filteredTracks.length} tracks from Spotify API`
        );
      }

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
        tagIds.map(tagId => taggingService.getSpotifyIdsWithTag(userId, tagId, 'album'))
      );

      // Combine and deduplicate album Spotify IDs
      const allAlbumIds = Array.from(new Set(albumIdSets.flat()));

      if (allAlbumIds.length === 0) {
        return [];
      }

      if (__DEV__) {
        console.log(`[PlaylistService] Found ${allAlbumIds.length} Spotify album IDs with tags`);
      }

      // Fetch ALL saved albums from Spotify (fallback approach)
      const allSavedAlbums = await this.getAllSavedAlbums(spotifyToken);

      if (__DEV__) {
        console.log(
          `[PlaylistService] Searching through ${allSavedAlbums.length} total saved albums`
        );
      }

      // Filter albums that match our Spotify IDs
      const filteredAlbums = allSavedAlbums.filter(album => {
        return allAlbumIds.includes(album.album_id);
      });

      if (__DEV__) {
        console.log(
          `[PlaylistService] Found ${filteredAlbums.length} matching albums for selected tags`
        );
      }

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
        tagIds.map(tagId => taggingService.getSpotifyIdsWithTag(userId, tagId, 'playlist'))
      );

      // Get all playlist IDs that have any of the specified tags
      const allPlaylistIds = Array.from(new Set(playlistIdSets.flat()));

      if (allPlaylistIds.length === 0) {
        return [];
      }

      if (__DEV__) {
        console.log(`[PlaylistService] Looking for ${allPlaylistIds.length} tagged playlist IDs`);
      }

      // Fetch ALL saved playlists from Spotify (not just first 20)
      const allSavedPlaylists = await this.getAllSavedPlaylists(spotifyToken);

      if (__DEV__) {
        console.log(
          `[PlaylistService] Searching through ${allSavedPlaylists.length} total saved playlists`
        );
      }

      // Filter playlists that match our Spotify IDs
      const filteredPlaylists = allSavedPlaylists.filter(playlist => {
        return allPlaylistIds.includes(playlist.playlist_id);
      });

      if (__DEV__) {
        console.log(
          `[PlaylistService] Found ${filteredPlaylists.length} matching playlists for selected tags`
        );
      }

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
      const uniqueTracks = allTracks.filter(
        (track, index, self) =>
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
