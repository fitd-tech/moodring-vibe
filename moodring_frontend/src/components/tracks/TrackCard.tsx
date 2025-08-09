import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { RecentTrack, Tag } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { TaggingInterface } from './TaggingInterface';
import { useAnimation } from '../../hooks/useAnimation';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';
import { useAuth } from '../../contexts/AuthContext';

interface TrackCardProps {
  track: RecentTrack;
  _index: number;
  isExpanded: boolean;
  onToggleExpansion: (_index: number) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  _index,
  isExpanded,
  onToggleExpansion,
}) => {
  const { user } = useAuth();
  const animatedValues = useRef(useAnimation().createAnimatedValues()).current;
  const { animateExpansion } = useAnimation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [songId, setSongId] = useState<string>('');

  useEffect(() => {
    // Generate a consistent song ID from track information
    const generatedSongId = taggingService.generateSongId(track.name, track.artist);
    setSongId(generatedSongId);
  }, [track.name, track.artist]);

  useEffect(() => {
    if (isExpanded && user && songId) {
      loadSongTags();
    }
  }, [isExpanded, user, songId]);

  const loadSongTags = async () => {
    if (!user || !songId) return;
    
    setIsLoadingTags(true);
    try {
      const songTags = await taggingService.getSongTags(songId, user.id);
      setTags(songTags);
    } catch (error) {
      console.error('Failed to load song tags:', error);
      setTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  React.useEffect(() => {
    animateExpansion(animatedValues, isExpanded);
  }, [isExpanded]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
      <GradientCard colors={theme.colors.gradients.track}>
        <TouchableOpacity 
          style={styles.header}
          onPress={() => onToggleExpansion(_index)}
        >
          <View style={styles.albumArt}>
            {track.album_image_url ? (
              <Image 
                source={{ uri: track.album_image_url }}
                style={styles.albumImage}
              />
            ) : (
              <View style={styles.albumPlaceholder} />
            )}
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{track.name}</Text>
            <Text style={styles.trackArtist}>{track.artist}</Text>
            {track.album && <Text style={styles.trackAlbum}>Album: {track.album}</Text>}
          </View>
          <View style={styles.actions}>
            <Text style={styles.trackTime}>
              {formatTime(track.played_at)}
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
                songId={songId}
                onTagsChanged={loadSongTags}
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
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  trackArtist: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  actions: {
    alignItems: 'flex-end',
  },
  trackTime: {
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