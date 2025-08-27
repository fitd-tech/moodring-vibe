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
import { Ionicons } from '@expo/vector-icons';
import { SearchResult, Tag } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { TaggingInterface } from '../tracks/tagging/TaggingInterface';
import { useAnimation } from '../../hooks/useAnimation';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';
import { useAuth } from '../../contexts/AuthContext';

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  isExpanded: boolean;
  onToggleExpansion: (_index: number) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  index,
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
    // Generate entity ID based on result type
    if (result.type === 'track') {
      const generatedEntityId = taggingService.generateEntityId(result.name, result.artist);
      setSongId(generatedEntityId);
    } else if (result.type === 'album') {
      const generatedEntityId = taggingService.generateEntityId(result.name, result.artist);
      setSongId(generatedEntityId);
    } else if (result.type === 'playlist') {
      const generatedEntityId = taggingService.generateEntityId(result.name, result.owner);
      setSongId(generatedEntityId);
    }
  }, [result]);

  useEffect(() => {
    if (isExpanded && user && songId) {
      loadItemTags();
    }
  }, [isExpanded, user, songId]);

  const loadItemTags = async () => {
    if (!user || !songId) return;

    setIsLoadingTags(true);
    try {
      const itemTags = await taggingService.getEntityTags(result.type, songId, user.id);
      setTags(itemTags);
    } catch {
      setTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  React.useEffect(() => {
    animateExpansion(animatedValues, isExpanded);
  }, [isExpanded]);

  const getResultIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (result.type) {
      case 'track':
        return 'musical-notes';
      case 'album':
        return 'disc';
      case 'playlist':
        return 'list';
      default:
        return 'musical-notes';
    }
  };

  const getResultSubtitle = (): string => {
    switch (result.type) {
      case 'track':
        return result.album;
      case 'album':
        return `${result.track_count} tracks`;
      case 'playlist':
        return `${result.track_count} tracks by ${result.owner}`;
      default:
        return '';
    }
  };

  const getResultMetadata = (): string => {
    switch (result.type) {
      case 'track':
        return `Popularity: ${result.popularity}`;
      case 'album':
        return `Released: ${result.release_date}`;
      case 'playlist':
        return result.description || 'Playlist';
      default:
        return '';
    }
  };

  const getSpotifyTrackId = (): string | undefined => {
    switch (result.type) {
      case 'track':
        return result.song_id;
      case 'album':
        return result.album_id;
      case 'playlist':
        return result.playlist_id;
      default:
        return undefined;
    }
  };

  const getGradientColors = () => {
    switch (result.type) {
      case 'track':
        return theme.colors.gradients.track;
      case 'album':
        return theme.colors.gradients.album || theme.colors.gradients.track;
      case 'playlist':
        return theme.colors.gradients.playlist || theme.colors.gradients.track;
      default:
        return theme.colors.gradients.track;
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
      <GradientCard colors={getGradientColors()}>
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => onToggleExpansion(index)}
          testID={`search-result-card-${index}`}
        >
          <View style={styles.imageContainer}>
            {(result.type === 'track' && result.album_image_url) ||
             (result.type === 'album' && result.image_url) ||
             (result.type === 'playlist' && result.image_url) ? (
              <Image 
                source={{ 
                  uri: result.type === 'track' ? result.album_image_url :
                       result.type === 'album' ? result.image_url :
                       result.type === 'playlist' ? result.image_url : undefined
                }} 
                style={styles.image} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name={getResultIcon()}
                  size={24}
                  color={theme.colors.text.secondary}
                />
              </View>
            )}
          </View>
          
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {result.name}
            </Text>
            <Text style={styles.resultArtist} numberOfLines={1}>
              {result.type === 'track' || result.type === 'album' ? 
                result.artist : 
                result.type === 'playlist' ? 
                  result.owner : 'Unknown'}
            </Text>
            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {getResultSubtitle()}
            </Text>
          </View>
          
          <View style={styles.metadata}>
            <View style={styles.resultType}>
              <Ionicons
                name={getResultIcon()}
                size={16}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.resultTypeText}>
                {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
              </Text>
            </View>
            <Text style={styles.resultMetadata} numberOfLines={1}>
              {getResultMetadata()}
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
                entityId={songId}
                entityType={result.type}
                spotifyId={getSpotifyTrackId() || ''}
                onTagsChanged={loadItemTags}
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
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  resultArtist: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  metadata: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  resultType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  resultTypeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  resultMetadata: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'right',
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