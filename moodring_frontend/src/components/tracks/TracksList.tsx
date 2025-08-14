import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { RecentTrack, TopTrack, SavedTrack } from '../../types';
import { TrackCard } from './TrackCard';
import { theme } from '../../styles/theme';

// Union type for all track types
type Track = RecentTrack | TopTrack | SavedTrack;

interface TracksListProps {
  tracks: Track[];
  onLoadMore?: () => Promise<void>;
  hasMoreTracks?: boolean;
  isLoadingMore?: boolean;
  title?: string;
  emptyMessage?: string;
}

export const TracksList: React.FC<TracksListProps> = ({
  tracks,
  onLoadMore,
  hasMoreTracks = false,
  isLoadingMore = false,
  title,
  emptyMessage = 'No tracks available',
}) => {
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const prevTracksRef = useRef<Track[]>([]);

  const INITIAL_DISPLAY_COUNT = 10;

  // Helper function to get track identifier for comparison
  const getTrackId = (track: Track): string => {
    if ('played_at' in track) {
      // RecentTrack - use played_at for uniqueness
      return track.played_at;
    } else {
      // TopTrack or SavedTrack - use song_id
      return track.song_id || `${track.name}-${track.artist}`;
    }
  };

  // Reset showAll when tracks change due to refresh
  useEffect(() => {
    const prevTracks = prevTracksRef.current;
    const currentTracks = tracks;

    // Check if this looks like a refresh (tracks replaced rather than appended)
    if (prevTracks.length > 0 && currentTracks.length > 0) {
      // If the first track changed, it's likely a refresh
      const firstTrackChanged = getTrackId(prevTracks[0]) !== getTrackId(currentTracks[0]);
      // Or if we have fewer tracks than before (but more than 0)
      const tracksDecreased = currentTracks.length < prevTracks.length;

      if (firstTrackChanged || tracksDecreased) {
        setShowAll(false);
      }
    }

    // Update the ref with current tracks
    prevTracksRef.current = currentTracks;
  }, [tracks]);

  const handleToggleExpansion = (index: number) => {
    setExpandedTrack(expandedTrack === index ? null : index);
  };

  const displayedTracks = showAll ? tracks : tracks.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = tracks.length > INITIAL_DISPLAY_COUNT;
  const showSeeMore = hasMore && !showAll && !isLoadingMore;
  const showLoadMore = showAll && hasMoreTracks && onLoadMore && !isLoadingMore;

  if (tracks.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {displayedTracks.map((track, index) => (
        <TrackCard
          key={getTrackId(track)}
          track={track}
          _index={index}
          isExpanded={expandedTrack === index}
          onToggleExpansion={handleToggleExpansion}
        />
      ))}

      {showSeeMore && (
        <TouchableOpacity style={styles.seeMoreButton} onPress={() => setShowAll(true)}>
          <Text style={styles.seeMoreText}>
            See More ({tracks.length - INITIAL_DISPLAY_COUNT} more)
          </Text>
        </TouchableOpacity>
      )}

      {showAll && !showLoadMore && tracks.length > INITIAL_DISPLAY_COUNT && (
        <TouchableOpacity style={styles.seeMoreButton} onPress={() => setShowAll(false)}>
          <Text style={styles.seeMoreText}>Show Less</Text>
        </TouchableOpacity>
      )}

      {showLoadMore && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      )}

      {isLoadingMore && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent.purple} />
          <Text style={styles.loadingText}>Loading more tracks...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: theme.spacing.xl,
  },
  seeMoreButton: {
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent.purple,
  },
  seeMoreText: {
    color: theme.colors.accent.purple,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: theme.colors.accent.purple,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    alignSelf: 'center',
  },
  loadMoreText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.sm,
  },
});
