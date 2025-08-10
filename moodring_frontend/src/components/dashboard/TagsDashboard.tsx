import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackendUser, Tag } from '../../types';
import { ProfileMenu } from './ProfileMenu';
import { TagCard } from '../tracks/TagCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';

interface TagsDashboardProps {
  user: BackendUser;
  onLogout: () => void;
  onCreatePlaylist?: () => void;
  onHome?: () => void;
  onSettings?: () => void;
}

export const TagsDashboard: React.FC<TagsDashboardProps> = ({
  user,
  onLogout,
  onCreatePlaylist,
  onHome,
  onSettings,
}) => {
  const insets = useSafeAreaInsets();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedTagIndex, setExpandedTagIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, [user]);

  const loadTags = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const userTags = await taggingService.getUserTags(user.id);
      setTags(userTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('Failed to load tags. Please try again.');
      setTags([]);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadTags(true);
  };

  const handleToggleExpansion = (index: number) => {
    setExpandedTagIndex(expandedTagIndex === index ? null : index);
  };

  const handleTagRemoved = (_tagId: number, _songId: string) => {
    // This callback is called when a tag is removed from a song
    // We can use this to trigger any necessary refreshes or updates
    console.log(`Tag ${_tagId} removed from song ${_songId}`);
    // Optionally refresh tags if needed to update counts, etc.
    // loadTags(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Loading your tags..." />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]}
        testID="tags-dashboard-scroll-view"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent.purple}
            colors={[
              theme.colors.accent.purple,
              theme.colors.accent.pink,
              theme.colors.accent.cyan,
            ]}
            progressBackgroundColor={theme.colors.background.card}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>BROWSE TAGS</Text>
          <Text style={styles.subtitle}>Organize your music collection</Text>
        </View>

        <View style={styles.dashboardContainer}>
          {isRefreshing && (
            <View style={[styles.refreshingOverlay, { top: insets.top + theme.spacing.md }]}>
              <LoadingSpinner text="Refreshing tags..." size="small" compact />
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : tags.length > 0 ? (
            <View style={styles.tagsListContainer}>
              <Text style={styles.tagsCount}>
                {tags.length} tag{tags.length !== 1 ? 's' : ''} found
              </Text>
              {tags.map((tag, index) => (
                <TagCard
                  key={tag.id}
                  tag={tag}
                  index={index}
                  isExpanded={expandedTagIndex === index}
                  onToggleExpansion={handleToggleExpansion}
                  onTagRemoved={handleTagRemoved}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No tags yet</Text>
              <Text style={styles.emptyText}>
                Start tagging your favorite songs to organize your music collection
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed position ProfileMenu outside ScrollView */}
      <View
        style={[
          styles.fixedProfileMenuContainer,
          {
            top: insets.top + theme.spacing.sm,
            right: theme.spacing.xl,
          },
        ]}
      >
        <ProfileMenu
          user={user}
          onCreatePlaylist={onCreatePlaylist}
          onHome={onHome}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.letterSpacing.md,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
  tagsListContainer: {
    flex: 1,
  },
  tagsCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.accent.pink,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
