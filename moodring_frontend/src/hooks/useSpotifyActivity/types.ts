import { CurrentlyPlaying, RecentTrack, TopTrack, SavedTrack, BackendUser } from '../../types';

export interface SpotifyActivityState {
  currentlyPlaying: CurrentlyPlaying | null;
  recentTracks: RecentTrack[];
  topTracks: TopTrack[];
  savedTracks: SavedTrack[];
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isLoadingMoreTopTracks: boolean;
  isLoadingMoreSavedTracks: boolean;
  hasMoreTracks: boolean;
  hasMoreTopTracks: boolean;
  hasMoreSavedTracks: boolean;
}

export interface LoadActivityParams {
  token?: string;
  userOverride?: BackendUser;
  preserveAdditionalTracks?: boolean;
}

export interface SpotifyTokenResult {
  user: BackendUser;
  token: string;
}