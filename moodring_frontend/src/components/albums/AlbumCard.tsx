import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SavedAlbum } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { theme } from '../../styles/theme';

interface AlbumCardProps {
  album: SavedAlbum;
  _index: number;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, _index }) => {
  const formatTrackCount = (count: number) => {
    return count === 1 ? '1 track' : `${count} tracks`;
  };

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  return (
    <View style={styles.container} testID={`album-card-${_index}`}>
      <GradientCard colors={theme.colors.gradients.track}>
        <View style={styles.header}>
          <View style={styles.albumArt}>
            {album.image_url ? (
              <Image source={{ uri: album.image_url }} style={styles.albumImage} />
            ) : (
              <View style={styles.albumPlaceholder} />
            )}
          </View>
          <View style={styles.albumInfo}>
            <Text style={styles.albumName}>{album.name}</Text>
            <Text style={styles.albumArtist}>{album.artist}</Text>
            <View style={styles.albumDetails}>
              <Text style={styles.releaseDate}>{formatReleaseDate(album.release_date)}</Text>
              <Text style={styles.separator}> • </Text>
              <Text style={styles.trackCount}>{formatTrackCount(album.track_count)}</Text>
            </View>
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
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.lg,
    overflow: 'hidden',
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  albumPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.sm,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  albumArtist: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  albumDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  releaseDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  separator: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  trackCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});