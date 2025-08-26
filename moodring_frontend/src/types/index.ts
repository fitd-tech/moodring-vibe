export interface BackendUser {
  id: number;
  spotify_id: string;
  email: string;
  display_name: string | null;
  spotify_access_token: string | null;
  spotify_refresh_token: string | null;
  token_expires_at: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendAuthResponse {
  user: BackendUser;
  access_token: string;
}

export interface RecentTrack {
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  played_at: string;
  song_id?: string;
}

export interface TopTrack {
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  song_id?: string;
  popularity: number;
}

export interface SavedTrack {
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  song_id?: string;
  added_at: string;
}

export interface SavedPlaylist {
  name: string;
  description?: string;
  image_url?: string;
  track_count: number;
  created_at: string;
  playlist_id: string;
}

export interface SavedAlbum {
  name: string;
  artist: string;
  image_url?: string;
  release_date: string;
  track_count: number;
  album_id: string;
}

export interface CurrentlyPlaying {
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  is_playing: boolean;
  song_id?: string;
  progress_ms?: number;
  duration_ms?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

export interface SpotifyCurrentlyPlayingResponse {
  item: SpotifyTrack;
  is_playing: boolean;
}

export interface SpotifyRecentTrackItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface SpotifyRecentTracksResponse {
  items: SpotifyRecentTrackItem[];
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifySavedTrackItem {
  track: SpotifyTrack;
  added_at: string;
}

export interface SpotifySavedTracksResponse {
  items: SpotifySavedTrackItem[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  owner: {
    display_name: string;
    id: string;
  };
  public: boolean;
  collaborative: boolean;
}

export interface SpotifyPlaylistItem {
  added_at: string;
  playlist: SpotifyPlaylist;
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  release_date: string;
  total_tracks: number;
}

export interface SpotifyAlbumItem {
  added_at: string;
  album: SpotifyAlbum;
}

export interface SpotifyAlbumsResponse {
  items: SpotifyAlbumItem[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface NewTag {
  name: string;
  color?: string;
  user_id?: number;
}

export interface SongTag {
  id: number;
  user_id: number;
  song_id: string;
  tag_id: number;
  created_at: string;
  spotify_track_id?: string;
}

export interface NewSongTag {
  user_id: number;
  tag_id: number;
  song_id?: string;
  spotify_track_id?: string;
}

export interface AnimatedValues {
  height: import('react-native').Animated.Value;
  opacity: import('react-native').Animated.Value;
  scale: import('react-native').Animated.Value;
  rotation: import('react-native').Animated.Value;
}

// Union type for tracks that can be displayed in TracksList
export type Track = RecentTrack | TopTrack | SavedTrack;

// Playlist generation and filtering interfaces
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

export interface TagSelectionState {
  id: number;
  name: string;
  color: string;
  selectionState: 'none' | 'include' | 'exclude';
}

// Search-related types and interfaces

export interface SearchResultTrack {
  type: 'track';
  id: string;
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  song_id: string;
  popularity: number;
}

export interface SearchResultAlbum {
  type: 'album';
  id: string;
  name: string;
  artist: string;
  image_url?: string;
  release_date: string;
  track_count: number;
  album_id: string;
}

export interface SearchResultPlaylist {
  type: 'playlist';
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  track_count: number;
  playlist_id: string;
  owner: string;
}


export type SearchResult = SearchResultTrack | SearchResultAlbum | SearchResultPlaylist;

export interface SpotifySearchResponse {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
  };
  albums?: {
    items: SpotifyAlbum[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
  };
  playlists?: {
    items: SpotifyPlaylist[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
  };
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  totalResults: number;
}
