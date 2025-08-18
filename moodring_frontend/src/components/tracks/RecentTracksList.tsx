import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { RecentTrack } from '../../types';
import { TrackCard } from './TrackCard';
import { theme } from '../../styles/theme';
import { useExpansion } from '../../contexts/ExpansionContext';

interface RecentTracksListProps {
  tracks: RecentTrack[];
  onLoadMore?: () => Promise<void>;
  hasMoreTracks?: boolean;
  isLoadingMore?: boolean;
}

export const RecentTracksList: React.FC<RecentTracksListProps> = ({
  tracks,
  onLoadMore,
  hasMoreTracks = false,
  isLoadingMore = false,
}) => {
  const { isExpanded, toggleExpansion } = useExpansion();
  const [showAll, setShowAll] = useState(false);
  const prevTracksRef = useRef<RecentTrack[]>([]);

  const INITIAL_DISPLAY_COUNT = 10;

  // Reset showAll when tracks change due to refresh (simplified logic)
  useEffect(() => {
    const prevTracks = prevTracksRef.current;
    const currentTracks = tracks;

    if (prevTracks.length > 0 && currentTracks.length > 0) {
      const firstTrackChanged = prevTracks[0]?.played_at !== currentTracks[0]?.played_at;
      const tracksDecreased = currentTracks.length < prevTracks.length;

      if (firstTrackChanged || tracksDecreased) {
        setShowAll(false);
      }
    }

    prevTracksRef.current = currentTracks;
  }, [tracks]);

  const handleToggleExpansion = (index: number) => {
    toggleExpansion('recent-tracks', 'track', index);
  };

  const handleSeeMore = async () => {
    if (tracks.length > INITIAL_DISPLAY_COUNT && !showAll) {
      setShowAll(true);
    } else if (onLoadMore && hasMoreTracks) {
      await onLoadMore();
      setShowAll(true);
    }
  };

  const displayedTracks = showAll ? tracks : tracks.slice(0, INITIAL_DISPLAY_COUNT);
  const shouldShowSeeMoreButton =
    (tracks.length > INITIAL_DISPLAY_COUNT && !showAll) || (hasMoreTracks && onLoadMore);

  if (tracks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recent tracks found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RECENT TRACKS</Text>
      {displayedTracks.map((track, index) => (
        <TrackCard
          key={`${track.name}-${track.played_at}-${index}`}
          track={track}
          _index={index}
          isExpanded={isExpanded('recent-tracks', 'track', index)}
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
