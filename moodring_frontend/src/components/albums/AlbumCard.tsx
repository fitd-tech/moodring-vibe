import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SavedAlbum, Tag } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { TaggingInterface } from '../tracks/TaggingInterface';
import { useAnimation } from '../../hooks/useAnimation';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';
import { useAuth } from '../../contexts/AuthContext';

interface AlbumCardProps {
  album: SavedAlbum;
  _index: number;
  isExpanded: boolean;
  onToggleExpansion: (_index: number) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  _index,
  isExpanded,
  onToggleExpansion,
}) => {
  const { user } = useAuth();
  const animatedValues = useRef(useAnimation().createAnimatedValues()).current;
  const { animateExpansion } = useAnimation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [albumTagId, setAlbumTagId] = useState<string>('');

  useEffect(() => {
    // Generate a consistent album ID from album information
    const generatedAlbumId = taggingService.generateAlbumId(album.name, album.album_id);
    setAlbumTagId(generatedAlbumId);
  }, [album.name, album.album_id]);

  useEffect(() => {
    if (isExpanded && user && albumTagId) {
      loadAlbumTags();
    }
  }, [isExpanded, user, albumTagId]);

  const loadAlbumTags = async () => {
    if (!user || !albumTagId) return;

    setIsLoadingTags(true);
    try {
      const albumTags = await taggingService.getSongTags(albumTagId, user.id);
      setTags(albumTags);
    } catch {
      setTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  React.useEffect(() => {
    animateExpansion(animatedValues, isExpanded);
  }, [isExpanded]);
  const formatTrackCount = (count: number) => {
    return count === 1 ? '1 track' : `${count} tracks`;
  };

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: animatedValues.scale }],
        },
      ]}
      testID={`album-card-${_index}`}
    >
      <GradientCard colors={theme.colors.gradients.track}>
        <TouchableOpacity style={styles.header} onPress={() => onToggleExpansion(_index)}>
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
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedContent,
              {
                maxHeight: animatedValues.height.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500],
                }),
                opacity: animatedValues.opacity,
              },
            ]}
          >
            {isLoadingTags ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent.purple} />
                <Text style={styles.loadingText}>Loading tags...</Text>
              </View>
            ) : (
              <TaggingInterface tags={tags} songId={albumTagId} onTagsChanged={loadAlbumTags} />
            )}
          </Animated.View>
        )}
      </GradientCard>
    </Animated.View>
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
  expandedContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
});
