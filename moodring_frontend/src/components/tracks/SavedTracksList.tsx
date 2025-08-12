import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SavedTrack } from '../../types';
import { TrackCard } from './TrackCard';
import { theme } from '../../styles/theme';

interface SavedTracksListProps {
  tracks: SavedTrack[];
  onLoadMore?: () => Promise<void>;
  hasMoreTracks?: boolean;
  isLoadingMore?: boolean;
}

export const SavedTracksList: React.FC<SavedTracksListProps> = ({
  tracks,
  onLoadMore,
  hasMoreTracks = false,
  isLoadingMore = false,
}) => {
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const prevTracksRef = useRef<SavedTrack[]>([]);

  const INITIAL_DISPLAY_COUNT = 10;

  // Reset showAll when tracks change due to refresh
  useEffect(() => {
    const prevTracks = prevTracksRef.current;
    const currentTracks = tracks;

    // Check if this looks like a refresh (tracks replaced rather than appended)
    if (prevTracks.length > 0 && currentTracks.length > 0) {
      // If the first track changed, it's likely a refresh
      const firstTrackChanged = prevTracks[0]?.song_id !== currentTracks[0]?.song_id;
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

  const handleSeeMore = async () => {
    if (tracks.length > INITIAL_DISPLAY_COUNT && !showAll) {
      // If we have more than 10 tracks locally and not showing all, expand them
      setShowAll(true);
    } else if (onLoadMore && hasMoreTracks) {
      // Otherwise, load more tracks from API
      await onLoadMore();
      // After loading new tracks, show all available tracks
      setShowAll(true);
    }
  };

  const displayedTracks = showAll ? tracks : tracks.slice(0, INITIAL_DISPLAY_COUNT);
  const shouldShowSeeMoreButton =
    (tracks.length > INITIAL_DISPLAY_COUNT && !showAll) || (hasMoreTracks && onLoadMore);

  if (tracks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No saved tracks found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAVED TRACKS</Text>
      {displayedTracks.map((track, index) => (
        <TrackCard
          key={`${track.song_id || track.name}-${track.added_at}-${index}`}
          track={{
            name: track.name,
            artist: track.artist,
            album: track.album,
            album_image_url: track.album_image_url,
            played_at: track.added_at, // Use added_at for saved tracks
            song_id: track.song_id,
          }}
          _index={index}
          isExpanded={expandedTrack === index}
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
