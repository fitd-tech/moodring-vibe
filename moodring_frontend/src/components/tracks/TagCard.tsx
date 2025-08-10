import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Tag } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { useAnimation } from '../../hooks/useAnimation';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';
import { useAuth } from '../../contexts/AuthContext';

interface TagCardProps {
  tag: Tag;
  index: number;
  isExpanded: boolean;
  onToggleExpansion: (_index: number) => void;
  onTagRemoved?: (_tagId: number, _songId: string) => void;
}

export const TagCard: React.FC<TagCardProps> = ({
  tag,
  index: _index,
  isExpanded,
  onToggleExpansion,
  onTagRemoved,
}) => {
  const { user } = useAuth();
  const animatedValues = useRef(useAnimation().createAnimatedValues()).current;
  const { animateExpansion } = useAnimation();
  const [songs, setSongs] = useState<string[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [removingSongs, setRemovingSongs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isExpanded && user) {
      loadTaggedSongs();
    }
  }, [isExpanded, user]);

  const loadTaggedSongs = async () => {
    if (!user) return;

    setIsLoadingSongs(true);
    try {
      const taggedSongs = await taggingService.getSongsWithTag(user.id, tag.id);
      setSongs(taggedSongs);
    } catch (error) {
      console.error('Failed to load tagged songs:', error);
      setSongs([]);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  React.useEffect(() => {
    animateExpansion(animatedValues, isExpanded);
  }, [isExpanded]);

  const formatSongId = (songId: string) => {
    // Convert song ID back to readable format (reverse of generateSongId)
    const parts = songId.split('__');
    if (parts.length >= 2) {
      const trackName = parts[0].replace(/_/g, ' ');
      const artist = parts[1].replace(/_/g, ' ');
      return `${trackName} - ${artist}`;
    }
    return songId.replace(/_/g, ' ');
  };

  const handleRemoveTag = async (songId: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Tag',
      `Remove "${tag.name}" tag from "${formatSongId(songId)}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeTagFromSong(songId),
        },
      ],
    );
  };

  const removeTagFromSong = async (songId: string) => {
    if (!user) return;

    setRemovingSongs(prev => new Set(prev).add(songId));

    try {
      await taggingService.removeTagFromSong(songId, user.id, tag.id);
      
      // Update local state by removing the song from the list
      setSongs(prevSongs => prevSongs.filter(id => id !== songId));
      
      // Notify parent component if callback provided
      if (onTagRemoved) {
        onTagRemoved(tag.id, songId);
      }
    } catch (error) {
      console.error('Failed to remove tag from song:', error);
      Alert.alert(
        'Error',
        'Failed to remove tag from song. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setRemovingSongs(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: animatedValues.scale }],
        },
      ]}
    >
      <GradientCard colors={theme.colors.gradients.features}>
        <TouchableOpacity style={styles.header} onPress={() => onToggleExpansion(_index)}>
          <View style={styles.tagIcon}>
            <Text style={styles.tagIconText}>#</Text>
          </View>
          <View style={styles.tagInfo}>
            <Text style={styles.tagName}>{tag.name}</Text>
            <Text style={styles.tagMeta}>
              Created: {new Date(tag.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.actions}>
            <Text style={styles.songCount}>
              {isExpanded && !isLoadingSongs ? `${songs.length} songs` : 'Tap to view'}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedContent,
              {
                maxHeight: animatedValues.height.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                opacity: animatedValues.opacity,
              },
            ]}
          >
            {isLoadingSongs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent.purple} />
                <Text style={styles.loadingText}>Loading songs...</Text>
              </View>
            ) : (
              <View style={styles.songsContainer}>
                {songs.length > 0 ? (
                  <>
                    <Text style={styles.songsHeader}>Tagged Songs ({songs.length})</Text>
                    {songs.map((songId, _songIndex) => {
                      const isRemoving = removingSongs.has(songId);
                      return (
                        <View key={songId} style={styles.songItem}>
                          <View style={styles.songContent}>
                            <Text style={styles.songText}>{formatSongId(songId)}</Text>
                            {isRemoving ? (
                              <ActivityIndicator 
                                size="small" 
                                color={theme.colors.accent.pink} 
                                style={styles.removeLoader}
                              />
                            ) : (
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemoveTag(songId)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Text style={styles.removeButtonText}>×</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <View style={styles.emptySongs}>
                    <Text style={styles.emptySongsText}>No songs tagged with "{tag.name}" yet</Text>
                  </View>
                )}
              </View>
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
  tagIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.lg,
    backgroundColor: theme.colors.accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagIconText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  tagMeta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  actions: {
    alignItems: 'flex-end',
  },
  songCount: {
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
    overflow: 'hidden',
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
  songsContainer: {
    paddingTop: theme.spacing.lg,
  },
  songsHeader: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  songItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.cyan,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.pink,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  removeButtonText: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  removeLoader: {
    width: 24,
    height: 24,
  },
  emptySongs: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptySongsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
