import {
  SpotifyCurrentlyPlayingResponse,
  SpotifyRecentTracksResponse,
  SpotifyTopTracksResponse,
  SpotifySavedTracksResponse,
  SpotifyPlaylistsResponse,
  SpotifyAlbumsResponse,
  SpotifyTrack,
  SpotifySearchResponse,
  CurrentlyPlaying,
  RecentTrack,
  TopTrack,
  SavedTrack,
  SavedPlaylist,
  SavedAlbum,
  SearchResult,
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
        // Make all scope test requests in parallel to avoid token state issues
        const scopeTestPromises = [
          fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ];

        const [userLibraryResponse, playlistsResponse] = await Promise.allSettled(scopeTestPromises);

        const scopes: string[] = ['user-read-private', 'user-read-email'];

        // Handle user library scope check
        if (userLibraryResponse.status === 'fulfilled') {
          if (userLibraryResponse.value.status === 200) {
            scopes.push('user-library-read');
          } else if (userLibraryResponse.value.status === 403) {
            if (__DEV__) {
              console.warn('[SpotifyApi] Token missing user-library-read scope');
            }
          } else if (userLibraryResponse.value.status === 401) {
            if (__DEV__) {
              console.warn('[SpotifyApi] Token expired during user library scope check');
            }
            throw new Error('TOKEN_EXPIRED');
          }
        } else {
          if (__DEV__) {
            console.warn('[SpotifyApi] User library scope check failed:', userLibraryResponse.reason);
          }
        }

        // Handle playlists scope check
        if (playlistsResponse.status === 'fulfilled') {
          if (playlistsResponse.value.status === 200) {
            scopes.push('playlist-read-private');
            scopes.push('playlist-read-collaborative'); // Assume collaborative access if playlists are accessible
          } else if (playlistsResponse.value.status === 403) {
            if (__DEV__) {
              console.warn('[SpotifyApi] Token missing playlist-read-private scope');
            }
          } else if (playlistsResponse.value.status === 401) {
            if (__DEV__) {
              console.warn('[SpotifyApi] Token expired during playlist scope check');
            }
            throw new Error('TOKEN_EXPIRED');
          }
        } else {
          if (__DEV__) {
            console.warn('[SpotifyApi] Playlist scope check failed:', playlistsResponse.reason);
          }
        }

        if (__DEV__) {
          console.log('[SpotifyApi] Verified token scopes successfully:', scopes);
        }

        return scopes;
      } else if (response.status === 401) {
        if (__DEV__) {
          console.warn('[SpotifyApi] Token expired during scope verification');
        }
        throw new Error('TOKEN_EXPIRED');
      } else {
        if (__DEV__) {
          console.warn('[SpotifyApi] Failed to verify token scopes:', response.status);
        }
        return [];
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
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
          song_id: item.track.id,
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
          song_id: item.track.id,
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

  async getSavedPlaylists(token: string, limit: number = 20): Promise<SavedPlaylist[]> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as SpotifyPlaylistsResponse;

        if (__DEV__) {
          console.log('[SpotifyApi] getSavedPlaylists response:', {
            total: data.total,
            limit: data.limit,
            offset: data.offset,
            itemsLength: data.items.length,
            items: data.items.map(playlist => ({
              name: playlist.name,
              id: playlist.id,
              owner: playlist.owner.display_name,
              owner_id: playlist.owner.id,
              public: playlist.public,
              collaborative: playlist.collaborative,
            })),
          });
        }

        return data.items.map(playlist => ({
          name: playlist.name,
          description: playlist.description || undefined,
          image_url: this.getImageUrl(playlist.images),
          track_count: playlist.tracks.total,
          created_at: new Date().toISOString(), // Spotify API doesn't provide creation date for playlists
          playlist_id: playlist.id,
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
        console.warn('Saved playlists fetch error:', error);
      }
      return [];
    }
  }

  async getMoreSavedPlaylists(token: string, offset: number): Promise<SavedPlaylist[]> {
    try {
      // Load 20 additional playlists at a time with offset
      const response = await fetch(
        `https://api.spotify.com/v1/me/playlists?limit=20&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as SpotifyPlaylistsResponse;

        if (__DEV__) {
          console.log('[SpotifyApi] getMoreSavedPlaylists response:', {
            total: data.total,
            limit: data.limit,
            offset: data.offset,
            itemsLength: data.items.length,
            items: data.items.map(playlist => ({
              name: playlist.name,
              id: playlist.id,
              owner: playlist.owner.display_name,
              owner_id: playlist.owner.id,
              public: playlist.public,
              collaborative: playlist.collaborative,
            })),
          });
        }

        return data.items.map(playlist => ({
          name: playlist.name,
          description: playlist.description || undefined,
          image_url: this.getImageUrl(playlist.images),
          track_count: playlist.tracks.total,
          created_at: new Date().toISOString(), // Spotify API doesn't provide creation date for playlists
          playlist_id: playlist.id,
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
        console.warn('More saved playlists fetch error:', error);
      }
      return [];
    }
  }

  async getSavedAlbums(token: string, limit: number = 20): Promise<SavedAlbum[]> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/albums?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as SpotifyAlbumsResponse;

        return data.items.map(item => ({
          name: item.album.name,
          artist: item.album.artists[0]?.name || 'Unknown Artist',
          image_url: this.getImageUrl(item.album.images),
          release_date: item.album.release_date,
          track_count: item.album.total_tracks,
          album_id: item.album.id,
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
        console.warn('Saved albums fetch error:', error);
      }
      return [];
    }
  }

  async getMoreSavedAlbums(token: string, offset: number): Promise<SavedAlbum[]> {
    try {
      // Load 20 additional albums at a time with offset
      const response = await fetch(
        `https://api.spotify.com/v1/me/albums?limit=20&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as SpotifyAlbumsResponse;
        return data.items.map(item => ({
          name: item.album.name,
          artist: item.album.artists[0]?.name || 'Unknown Artist',
          image_url: this.getImageUrl(item.album.images),
          release_date: item.album.release_date,
          track_count: item.album.total_tracks,
          album_id: item.album.id,
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
        console.warn('More saved albums fetch error:', error);
      }
      return [];
    }
  }

  // Fetch tracks by their Spotify IDs (for tagged songs with stored Spotify IDs)
  async getTracksByIds(token: string, trackIds: string[]): Promise<SavedTrack[]> {
    try {
      if (trackIds.length === 0) {
        return [];
      }

      // Spotify API allows up to 50 tracks per request
      const batches: string[][] = [];
      for (let i = 0; i < trackIds.length; i += 50) {
        batches.push(trackIds.slice(i, i + 50));
      }

      const allTracks: SavedTrack[] = [];

      for (const batch of batches) {
        const idsParam = batch.join(',');
        const response = await fetch(
          `https://api.spotify.com/v1/tracks?ids=${encodeURIComponent(idsParam)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { tracks: SpotifyTrack[] };

          // Filter out null tracks (removed from Spotify)
          const validTracks = data.tracks.filter(track => track !== null);

          const mappedTracks = validTracks.map(track => ({
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown Artist',
            album: track.album.name,
            album_image_url: this.getImageUrl(track.album.images),
            song_id: track.id,
            added_at: new Date().toISOString(), // Default since we don't have actual added_at
          }));

          allTracks.push(...mappedTracks);
        } else if (response.status === 401) {
          throw new Error('TOKEN_EXPIRED');
        } else {
          if (__DEV__) {
            console.warn(`[SpotifyApi] Failed to fetch tracks batch: ${response.status}`);
          }
        }
      }

      if (__DEV__) {
        console.log(`[SpotifyApi] Fetched ${allTracks.length}/${trackIds.length} tracks by IDs`);
      }

      return allTracks;
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.error('[SpotifyApi] Error fetching tracks by IDs:', error);
      }
      return [];
    }
  }

  // Search Spotify content (tracks, albums, playlists, artists)
  async searchContent(
    token: string,
    query: string,
    types: ('track' | 'album' | 'playlist' | 'artist')[],
    limit: number = 10,
    offset: number = 0
  ): Promise<{ results: SearchResult[]; hasMore: boolean; totalResults: number }> {
    try {
      if (!query.trim()) {
        return { results: [], hasMore: false, totalResults: 0 };
      }

      const encodedQuery = encodeURIComponent(query.trim());
      const typesParam = types.join(',');
      const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=${typesParam}&limit=${limit}&offset=${offset}`;

      if (__DEV__) {
        console.log(`[SpotifyApi] Searching: "${query}" for types: ${typesParam}`);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as SpotifySearchResponse;
        const results: SearchResult[] = [];
        let totalResults = 0;
        let hasMore = false;

        // Process tracks
        if (data.tracks && types.includes('track')) {
          const trackResults = data.tracks.items.map(track => ({
            type: 'track' as const,
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown Artist',
            album: track.album.name,
            album_image_url: this.getImageUrl(track.album.images),
            song_id: track.id,
            popularity: track.popularity,
          }));
          results.push(...trackResults);
          totalResults += data.tracks.total;
          hasMore = hasMore || data.tracks.next !== null;
        }

        // Process albums
        if (data.albums && types.includes('album')) {
          const albumResults = data.albums.items.map(album => ({
            type: 'album' as const,
            id: album.id,
            name: album.name,
            artist: album.artists[0]?.name || 'Unknown Artist',
            image_url: this.getImageUrl(album.images),
            release_date: album.release_date,
            track_count: album.total_tracks,
            album_id: album.id,
          }));
          results.push(...albumResults);
          totalResults += data.albums.total;
          hasMore = hasMore || data.albums.next !== null;
        }

        // Process playlists
        if (data.playlists && types.includes('playlist')) {
          const playlistResults = data.playlists.items.map(playlist => ({
            type: 'playlist' as const,
            id: playlist.id,
            name: playlist.name,
            description: playlist.description || undefined,
            image_url: this.getImageUrl(playlist.images),
            track_count: playlist.tracks.total,
            playlist_id: playlist.id,
            owner: playlist.owner.display_name || playlist.owner.id,
          }));
          results.push(...playlistResults);
          totalResults += data.playlists.total;
          hasMore = hasMore || data.playlists.next !== null;
        }

        // Process artists
        if (data.artists && types.includes('artist')) {
          const artistResults = data.artists.items.map(artist => ({
            type: 'artist' as const,
            id: artist.id,
            name: artist.name,
            image_url: this.getImageUrl(artist.images),
            followers: artist.followers.total,
            genres: artist.genres,
            popularity: artist.popularity,
            artist_id: artist.id,
          }));
          results.push(...artistResults);
          totalResults += data.artists.total;
          hasMore = hasMore || data.artists.next !== null;
        }

        if (__DEV__) {
          console.log(`[SpotifyApi] Search results: ${results.length} items, hasMore: ${hasMore}`);
        }

        return { results, hasMore, totalResults };
      } else if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      } else {
        if (__DEV__) {
          console.warn(`[SpotifyApi] Search failed with status: ${response.status}`);
        }
        return { results: [], hasMore: false, totalResults: 0 };
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      if (__DEV__) {
        console.error('[SpotifyApi] Search error:', error);
      }
      return { results: [], hasMore: false, totalResults: 0 };
    }
  }
}

export const spotifyApi = new SpotifyApiService();
