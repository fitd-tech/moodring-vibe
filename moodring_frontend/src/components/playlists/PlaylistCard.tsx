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
import { SavedPlaylist, Tag } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { TaggingInterface } from '../tracks/TaggingInterface';
import { useAnimation } from '../../hooks/useAnimation';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';
import { useAuth } from '../../contexts/AuthContext';

interface PlaylistCardProps {
  playlist: SavedPlaylist;
  _index: number;
  isExpanded: boolean;
  onToggleExpansion: (_index: number) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  _index,
  isExpanded,
  onToggleExpansion,
}) => {
  const { user } = useAuth();
  const animatedValues = useRef(useAnimation().createAnimatedValues()).current;
  const { animateExpansion } = useAnimation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [playlistTagId, setPlaylistTagId] = useState<string>('');

  useEffect(() => {
    // Generate a consistent playlist ID from playlist information
    const generatedPlaylistId = taggingService.generatePlaylistId(
      playlist.name,
      playlist.playlist_id
    );
    setPlaylistTagId(generatedPlaylistId);
  }, [playlist.name, playlist.playlist_id]);

  useEffect(() => {
    if (isExpanded && user && playlistTagId) {
      loadPlaylistTags();
    }
  }, [isExpanded, user, playlistTagId]);

  const loadPlaylistTags = async () => {
    if (!user || !playlistTagId) return;

    setIsLoadingTags(true);
    try {
      const playlistTags = await taggingService.getSongTags(playlistTagId, user.id);
      setTags(playlistTags);
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

  const truncateDescription = (description?: string, maxLength: number = 100) => {
    if (!description) return 'No description';
    return description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: animatedValues.scale }],
        },
      ]}
      testID={`playlist-card-${_index}`}
    >
      <GradientCard colors={theme.colors.gradients.track}>
        <TouchableOpacity style={styles.header} onPress={() => onToggleExpansion(_index)}>
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
          <View style={styles.actions}>
            <Text style={styles.playlistDate}>{formatDate(playlist.created_at)}</Text>
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
              <TaggingInterface
                tags={tags}
                songId={playlistTagId}
                onTagsChanged={loadPlaylistTags}
              />
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
  actions: {
    alignItems: 'flex-end',
  },
  playlistDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
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
