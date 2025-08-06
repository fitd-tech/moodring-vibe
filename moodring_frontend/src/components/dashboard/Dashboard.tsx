import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BackendUser, CurrentlyPlaying, RecentTrack } from '../../types';
import { UserProfile } from './UserProfile';
import { QuickActions } from './QuickActions';
import { NowPlaying } from '../tracks/NowPlaying';
import { RecentTracksList } from '../tracks/RecentTracksList';
import { theme } from '../../styles/theme';

interface DashboardProps {
  user: BackendUser;
  currentlyPlaying: CurrentlyPlaying | null;
  recentTracks: RecentTrack[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onCreateTag?: () => void;
  onBrowsePlaylists?: () => void;
  onGeneratePlaylist?: () => void;
  onTrackTagRemove?: (_trackIndex: number, _tagId: string) => void;
  onTrackTagAdd?: (_trackIndex: number) => void;
  onNowPlayingTagRemove?: (_tagId: string) => void;
  onNowPlayingTagAdd?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  currentlyPlaying,
  recentTracks,
  isRefreshing,
  onRefresh,
  onLogout,
  onCreateTag,
  onBrowsePlaylists,
  onGeneratePlaylist,
  onTrackTagRemove,
  onTrackTagAdd,
  onNowPlayingTagRemove,
  onNowPlayingTagAdd,
}) => {
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.accent.purple}
          colors={[theme.colors.accent.purple]}
          progressBackgroundColor={theme.colors.background.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>MOODRING</Text>
      </View>

      <View style={styles.dashboardContainer}>
        <UserProfile user={user} />

        <NowPlaying 
          currentlyPlaying={currentlyPlaying}
          onTagRemove={onNowPlayingTagRemove}
          onTagAdd={onNowPlayingTagAdd}
        />

        <RecentTracksList 
          tracks={recentTracks}
          onTrackTagRemove={onTrackTagRemove}
          onTrackTagAdd={onTrackTagAdd}
        />

        <QuickActions
          onCreateTag={onCreateTag}
          onBrowsePlaylists={onBrowsePlaylists}
          onGeneratePlaylist={onGeneratePlaylist}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.letterSpacing.md,
    marginBottom: theme.spacing.sm,
  },
  dashboardContainer: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: theme.colors.ui.overlay,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 30,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  logoutButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    opacity: 0.8,
  },
});