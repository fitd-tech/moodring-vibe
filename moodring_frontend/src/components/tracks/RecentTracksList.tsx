import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecentTrack } from '../../types';
import { TrackCard } from './TrackCard';
import { theme } from '../../styles/theme';

interface RecentTracksListProps {
  tracks: RecentTrack[];
  onTrackTagRemove?: (_trackIndex: number, _tagId: string) => void;
  onTrackTagAdd?: (_trackIndex: number) => void;
}

export const RecentTracksList: React.FC<RecentTracksListProps> = ({
  tracks,
  onTrackTagRemove = () => {},
  onTrackTagAdd = () => {},
}) => {
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);

  const handleToggleExpansion = (index: number) => {
    setExpandedTrack(expandedTrack === index ? null : index);
  };

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
      {tracks.map((track, index) => (
        <TrackCard
          key={`${track.name}-${track.played_at}-${index}`}
          track={track}
          _index={index}
          isExpanded={expandedTrack === index}
          onToggleExpansion={handleToggleExpansion}
          onTagRemove={(tagId) => onTrackTagRemove(index, tagId)}
          onTagAdd={() => onTrackTagAdd(index)}
        />
      ))}
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
});