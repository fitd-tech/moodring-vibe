import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SavedAlbum } from '../../types';
import { AlbumCard } from './AlbumCard';
import { theme } from '../../styles/theme';
import { useExpansion } from '../../contexts/ExpansionContext';

interface SavedAlbumsListProps {
  albums: SavedAlbum[];
  onLoadMore?: () => Promise<void>;
  hasMoreAlbums?: boolean;
  isLoadingMore?: boolean;
}

export const SavedAlbumsList: React.FC<SavedAlbumsListProps> = ({
  albums,
  onLoadMore,
  hasMoreAlbums = false,
  isLoadingMore = false,
}) => {
  const { isExpanded, toggleExpansion } = useExpansion();
  const [showAll, setShowAll] = useState(false);
  const prevAlbumsRef = useRef<SavedAlbum[]>([]);

  const INITIAL_DISPLAY_COUNT = 5;

  // Reset showAll when albums change due to refresh (simplified logic)
  useEffect(() => {
    const prevAlbums = prevAlbumsRef.current;
    const currentAlbums = albums;

    if (prevAlbums.length > 0 && currentAlbums.length > 0) {
      const firstAlbumChanged = prevAlbums[0]?.album_id !== currentAlbums[0]?.album_id;
      const albumsDecreased = currentAlbums.length < prevAlbums.length;

      if (firstAlbumChanged || albumsDecreased) {
        setShowAll(false);
      }
    }

    prevAlbumsRef.current = currentAlbums;
  }, [albums]);

  const handleToggleExpansion = (index: number) => {
    toggleExpansion('saved-albums', 'album', index);
  };

  const handleSeeMore = async () => {
    if (albums.length > INITIAL_DISPLAY_COUNT && !showAll) {
      setShowAll(true);
    } else if (onLoadMore && hasMoreAlbums) {
      await onLoadMore();
      setShowAll(true);
    }
  };

  const displayedAlbums = showAll ? albums : albums.slice(0, INITIAL_DISPLAY_COUNT);
  const shouldShowSeeMoreButton =
    (albums.length > INITIAL_DISPLAY_COUNT && !showAll) || (hasMoreAlbums && onLoadMore);

  if (albums.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No saved albums found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAVED ALBUMS</Text>
      {displayedAlbums.map((album, index) => (
        <AlbumCard
          key={`${album.album_id}-${index}`}
          album={album}
          _index={index}
          isExpanded={isExpanded('saved-albums', 'album', index)}
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
