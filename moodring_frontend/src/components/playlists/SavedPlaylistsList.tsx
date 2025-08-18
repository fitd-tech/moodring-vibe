import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SavedPlaylist } from '../../types';
import { PlaylistCard } from './PlaylistCard';
import { theme } from '../../styles/theme';

interface SavedPlaylistsListProps {
  playlists: SavedPlaylist[];
  onLoadMore?: () => Promise<void>;
  hasMorePlaylists?: boolean;
  isLoadingMore?: boolean;
}

export const SavedPlaylistsList: React.FC<SavedPlaylistsListProps> = ({
  playlists,
  onLoadMore,
  hasMorePlaylists = false,
  isLoadingMore = false,
}) => {
  const [expandedPlaylist, setExpandedPlaylist] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const prevPlaylistsRef = useRef<SavedPlaylist[]>([]);

  const INITIAL_DISPLAY_COUNT = 5;

  // Reset showAll when playlists change due to refresh (simplified logic)
  useEffect(() => {
    const prevPlaylists = prevPlaylistsRef.current;
    const currentPlaylists = playlists;

    if (prevPlaylists.length > 0 && currentPlaylists.length > 0) {
      const firstPlaylistChanged =
        prevPlaylists[0]?.playlist_id !== currentPlaylists[0]?.playlist_id;
      const playlistsDecreased = currentPlaylists.length < prevPlaylists.length;

      if (firstPlaylistChanged || playlistsDecreased) {
        setShowAll(false);
      }
    }

    prevPlaylistsRef.current = currentPlaylists;
  }, [playlists]);

  const handleToggleExpansion = (index: number) => {
    setExpandedPlaylist(expandedPlaylist === index ? null : index);
  };

  const handleSeeMore = async () => {
    if (playlists.length > INITIAL_DISPLAY_COUNT && !showAll) {
      setShowAll(true);
    } else if (onLoadMore && hasMorePlaylists) {
      await onLoadMore();
      setShowAll(true);
    }
  };

  const displayedPlaylists = showAll ? playlists : playlists.slice(0, INITIAL_DISPLAY_COUNT);
  const shouldShowSeeMoreButton =
    (playlists.length > INITIAL_DISPLAY_COUNT && !showAll) || (hasMorePlaylists && onLoadMore);

  if (playlists.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No saved playlists found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAVED PLAYLISTS</Text>
      {displayedPlaylists.map((playlist, index) => (
        <PlaylistCard
          key={`${playlist.playlist_id}-${index}`}
          playlist={playlist}
          _index={index}
          isExpanded={expandedPlaylist === index}
          onToggleExpansion={handleToggleExpansion}
        />
      ))}
      {shouldShowSeeMoreButton && (
        <View style={styles.seeMoreContainer}>
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={handleSeeMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.text.primary} />
                <Text style={styles.seeMoreText}>Loading...</Text>
              </View>
            ) : (
              <Text style={styles.seeMoreText}>See More</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: theme.typography.letterSpacing.sm,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.md,
    fontStyle: 'italic',
  },
  seeMoreContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  seeMoreButton: {
    backgroundColor: theme.colors.accent.purple,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    opacity: 0.8,
  },
  seeMoreText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
