import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { CurrentlyPlaying, Tag } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { TaggingInterface } from './TaggingInterface';
import { useAnimation } from '../../hooks/useAnimation';
import { theme } from '../../styles/theme';

interface NowPlayingProps {
  currentlyPlaying: CurrentlyPlaying | null;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  currentlyPlaying,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedValues = useRef(useAnimation().createAnimatedValues()).current;
  const { animateExpansion } = useAnimation();

  const mockTags: Tag[] = [
    { id: 1, name: 'synthwave', user_id: 1, color: undefined, created_at: '', updated_at: '' },
    { id: 2, name: 'currently-playing', user_id: 1, color: undefined, created_at: '', updated_at: '' },
  ];

  const toggleExpansion = () => {
    const expanding = !isExpanded;
    setIsExpanded(expanding);
    animateExpansion(animatedValues, expanding);
  };

  if (!currentlyPlaying) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: animatedValues.scale }],
        },
      ]}
    >
      <GradientCard colors={theme.colors.gradients.nowPlaying}>
        <Text style={styles.title}>NOW PLAYING</Text>
        <TouchableOpacity style={styles.header} onPress={toggleExpansion}>
          <View style={styles.albumArt}>
            {currentlyPlaying.album_image_url ? (
              <Image 
                source={{ uri: currentlyPlaying.album_image_url }}
                style={styles.albumImage}
              />
            ) : (
              <View style={styles.albumPlaceholder} />
            )}
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackName}>{currentlyPlaying.name}</Text>
            <Text style={styles.trackArtist}>by {currentlyPlaying.artist}</Text>
            <Text style={styles.trackAlbum}>{currentlyPlaying.album}</Text>
          </View>
          <View style={styles.actions}>
            <View style={[styles.playingIndicator, currentlyPlaying.is_playing && styles.playing]} />
            <TouchableOpacity style={styles.menuButton}>
              <Animated.Text 
                style={[
                  styles.menuIcon,
                  {
                    transform: [{
                      rotate: animatedValues.rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                ⌄
              </Animated.Text>
            </TouchableOpacity>
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
            <TaggingInterface
              tags={mockTags}
              songId={currentlyPlaying?.song_id || `${currentlyPlaying?.name || 'unknown'}__${currentlyPlaying?.artist || 'unknown'}`}
              onTagsChanged={() => {}}
            />
            <TouchableOpacity style={styles.collapseButton} onPress={toggleExpansion}>
              <Text style={styles.collapseText}>Collapse</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </GradientCard>
    </Animated.View>
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
  trackName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
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
  playingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.ui.overlay,
    alignSelf: 'flex-end',
  },
  playing: {
    backgroundColor: theme.colors.accent.purple,
    ...theme.shadow.playing,
  },
  menuButton: {
    padding: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  menuIcon: {
    fontSize: 20,
    color: theme.colors.text.muted,
  },
  expandedContent: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
    marginTop: theme.spacing.lg,
  },
  collapseButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
  },
  collapseText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
});