import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackendUser, CurrentlyPlaying, RecentTrack } from '../../types';
import { ProfileMenu } from './ProfileMenu';
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
  onCreatePlaylist?: () => void;
  onBrowseTags?: () => void;
  onSettings?: () => void;
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
  onCreatePlaylist,
  onBrowseTags,
  onSettings,
  onTrackTagRemove,
  onTrackTagAdd,
  onNowPlayingTagRemove,
  onNowPlayingTagAdd,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.wrapper}>
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
        </View>
      </ScrollView>

      {/* Fixed position ProfileMenu outside ScrollView */}
      <View style={[styles.fixedProfileMenuContainer, { 
        top: insets.top + theme.spacing.sm,
        right: theme.spacing.xl 
      }]}>
        <ProfileMenu
          user={user}
          onCreatePlaylist={onCreatePlaylist}
          onBrowseTags={onBrowseTags}
          onSettings={onSettings}
          onLogout={onLogout}
        />
      </View>

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    position: 'relative',
  },
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
  fixedProfileMenuContainer: {
    position: 'absolute',
    zIndex: 1000,
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
});