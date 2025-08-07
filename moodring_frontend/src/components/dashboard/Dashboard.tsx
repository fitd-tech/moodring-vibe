import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackendUser, CurrentlyPlaying, RecentTrack } from '../../types';
import { UserProfile } from './UserProfile';
import { QuickActions } from './QuickActions';
import { NowPlaying } from '../tracks/NowPlaying';
import { RecentTracksList } from '../tracks/RecentTracksList';
import { LoadingSpinner } from '../shared/LoadingSpinner';
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
  const insets = useSafeAreaInsets();
  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]}
      testID="dashboard-scroll-view"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.accent.purple}
          colors={[theme.colors.accent.purple, theme.colors.accent.pink, theme.colors.accent.cyan]}
          progressBackgroundColor={theme.colors.background.card}
          progressViewOffset={insets.top}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>MOODRING</Text>
      </View>

      <View style={styles.dashboardContainer}>
        {isRefreshing && (
          <View style={[styles.refreshingOverlay, { top: insets.top + theme.spacing.md }]}>
            <LoadingSpinner text="Refreshing..." size="small" compact />
          </View>
        )}
        
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
    position: 'relative',
  },
  refreshingOverlay: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1000,
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow.default,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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