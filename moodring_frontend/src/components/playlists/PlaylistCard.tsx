import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SavedPlaylist } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { theme } from '../../styles/theme';

interface PlaylistCardProps {
  playlist: SavedPlaylist;
  _index: number;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, _index }) => {
  const formatTrackCount = (count: number) => {
    return count === 1 ? '1 track' : `${count} tracks`;
  };

  const truncateDescription = (description?: string, maxLength: number = 100) => {
    if (!description) return 'No description';
    return description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;
  };

  return (
    <View style={styles.container} testID={`playlist-card-${_index}`}>
      <GradientCard colors={theme.colors.gradients.track}>
        <View style={styles.header}>
          <View style={styles.playlistArt}>
            {playlist.image_url ? (
              <Image source={{ uri: playlist.image_url }} style={styles.playlistImage} />
            ) : (
              <View style={styles.playlistPlaceholder} />
            )}
          </View>
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName}>{playlist.name}</Text>
            <Text style={styles.playlistDescription}>
              {truncateDescription(playlist.description)}
            </Text>
            <Text style={styles.trackCount}>{formatTrackCount(playlist.track_count)}</Text>
          </View>
        </View>
      </GradientCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistArt: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.lg,
    overflow: 'hidden',
  },
  playlistImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  playlistPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.sm,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  playlistDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  trackCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});