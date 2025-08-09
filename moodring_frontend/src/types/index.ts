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

export interface CurrentlyPlaying {
  name: string;
  artist: string;
  album: string;
  album_image_url?: string;
  is_playing: boolean;
  song_id?: string;
}

export interface SpotifyTrack {
  name: string;
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
}

export interface NewSongTag {
  user_id: number;
  tag_id: number;
  song_id?: string;
}

export interface AnimatedValues {
  height: import('react-native').Animated.Value;
  opacity: import('react-native').Animated.Value;
  scale: import('react-native').Animated.Value;
  rotation: import('react-native').Animated.Value;
}