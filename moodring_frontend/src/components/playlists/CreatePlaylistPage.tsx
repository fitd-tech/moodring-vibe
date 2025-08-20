import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { Button } from '../shared/Button';
import { GradientCard } from '../shared/GradientCard';
import { ClassNameProps } from '../../../nativewind-env';
import { mockTags, mockSongs, createSelectableTags, TagSelectionState } from './mockData';

interface EntityType {
  type: 'songs' | 'albums' | 'playlists';
  label: string;
  enabled: boolean;
}

interface CreatePlaylistPageProps extends ClassNameProps {
  onBack?: () => void;
  onCreatePlaylist?: (_playlistName: string, _entityTypes: string[], _selectedTags: string[]) => void;
}

export const CreatePlaylistPage: React.FC<CreatePlaylistPageProps> = ({
  onBack,
  onCreatePlaylist,
  className,
}) => {
  const insets = useSafeAreaInsets();
  
  const [playlistName, setPlaylistName] = useState('');
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([
    { type: 'songs', label: 'Songs', enabled: true },
    { type: 'albums', label: 'Albums', enabled: false },
    { type: 'playlists', label: 'Playlists', enabled: false },
  ]);
  const [selectableTags, setSelectableTags] = useState<TagSelectionState[]>(
    createSelectableTags(mockTags.slice(0, 10))
  );
  const [showAllTags, setShowAllTags] = useState(false);
  const [displayedSongs] = useState(mockSongs.slice(0, 12));

  const handleEntityTypeToggle = (type: 'songs' | 'albums' | 'playlists') => {
    setEntityTypes(prev =>
      prev.map(entity =>
        entity.type === type
          ? { ...entity, enabled: !entity.enabled }
          : entity
      )
    );
  };

  const handleTagToggle = (tagId: number) => {
    setSelectableTags(prev => prev.map(tag => 
      tag.id === tagId ? { ...tag, isSelected: !tag.isSelected } : tag
    ));
  };

  const handleLoadMoreTags = () => {
    if (!showAllTags) {
      setSelectableTags(createSelectableTags(mockTags.slice(0, 30)));
      setShowAllTags(true);
    }
  };

  const handleCreatePlaylist = () => {
    if (playlistName.trim() && onCreatePlaylist) {
      const enabledEntityTypes = entityTypes
        .filter(entity => entity.enabled)
        .map(entity => entity.type);
      
      const selectedTagNames = selectableTags
        .filter(tag => tag.isSelected)
        .map(tag => tag.name);
      
      onCreatePlaylist(playlistName.trim(), enabledEntityTypes, selectedTagNames);
    }
  };

  const isCreateDisabled = !playlistName.trim() || !entityTypes.some(entity => entity.enabled);

  return (
    <View style={styles.wrapper} className={className}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]}
        testID="create-playlist-scroll-view"
      >
        <View style={styles.header}>
          <Text style={styles.title}>CREATE PLAYLIST</Text>
          <Text style={styles.subtitle}>Generate a custom playlist from your tagged content</Text>
        </View>

        <View style={styles.content}>
          {/* Tag Selection Section - Now First */}
          <GradientCard
            colors={theme.colors.gradients.action}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Tag Selection</Text>
            <Text style={styles.sectionDescription}>
              Select tags to filter your content
            </Text>
            <View style={styles.tagGrid}>
              {selectableTags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagOption,
                    tag.isSelected && styles.tagOptionSelected,
                  ]}
                  onPress={() => handleTagToggle(tag.id)}
                  testID={`tag-option-${tag.id}`}
                  className={`border-2 rounded-lg px-4 py-3 m-1 ${
                    tag.isSelected
                      ? 'border-purple-400 bg-purple-400/30'
                      : 'border-gray-500 bg-transparent'
                  }`}
                >
                  <View style={styles.tagContent}>
                    <View 
                      style={[
                        styles.tagColorIndicator, 
                        { backgroundColor: tag.color }
                      ]} 
                    />
                    <Text
                      style={[
                        styles.tagLabel,
                        tag.isSelected && styles.tagLabelSelected,
                      ]}
                      className={`text-sm font-medium ${
                        tag.isSelected ? 'text-purple-200' : 'text-gray-300'
                      }`}
                    >
                      {tag.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {!showAllTags && (
              <Button
                title="LOAD 20 MORE"
                onPress={handleLoadMoreTags}
                variant="outline"
                style={styles.loadMoreButton}
                testID="load-more-tags-button"
                className="bg-transparent border-2 border-purple-500 rounded-lg py-3 px-6 mt-4"
                textClassName="text-purple-300 text-md font-semibold"
              />
            )}
          </GradientCard>

          {/* Entity Type Selection Section - Now Second */}
          <GradientCard
            colors={theme.colors.gradients.features}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Include Content Types</Text>
            <Text style={styles.sectionDescription}>
              Select which types of content to include in your playlist
            </Text>
            <View style={styles.entityTypesContainer}>
              {entityTypes.map(entity => (
                <TouchableOpacity
                  key={entity.type}
                  style={[
                    styles.entityTypeOption,
                    entity.enabled && styles.entityTypeOptionActive,
                  ]}
                  onPress={() => handleEntityTypeToggle(entity.type)}
                  testID={`entity-type-${entity.type}`}
                  className={`border-2 rounded-lg p-4 mb-3 ${
                    entity.enabled 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-gray-600 bg-transparent'
                  }`}
                >
                  <Text
                    style={[
                      styles.entityTypeLabel,
                      entity.enabled && styles.entityTypeLabelActive,
                    ]}
                    className={`text-lg font-semibold ${
                      entity.enabled ? 'text-purple-300' : 'text-gray-300'
                    }`}
                  >
                    {entity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GradientCard>

          {/* Playlist Name Section - Now Third */}
          <GradientCard
            colors={theme.colors.gradients.track}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Playlist Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter playlist name..."
              placeholderTextColor={theme.colors.text.muted}
              value={playlistName}
              onChangeText={setPlaylistName}
              maxLength={100}
              testID="playlist-name-input"
              className="bg-transparent text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg p-4 text-lg"
            />
          </GradientCard>

          {/* Create Button */}
          <View style={styles.createButtonContainer}>
            <Button
              title="CREATE PLAYLIST"
              onPress={handleCreatePlaylist}
              disabled={isCreateDisabled}
              variant="primary"
              testID="create-playlist-button"
              className={`py-4 px-8 ${
                isCreateDisabled 
                  ? 'bg-gray-600 opacity-50' 
                  : 'bg-purple-600 shadow-lg shadow-purple-500/50'
              } border-2 border-purple-600 rounded-lg`}
              textClassName="text-white text-lg font-bold tracking-wider"
            />
            
            {onBack && (
              <Button
                title="BACK"
                onPress={onBack}
                variant="outline"
                style={styles.backButton}
                testID="back-button"
                className="bg-transparent border-2 border-gray-600 rounded-lg py-4 px-8 mt-4"
                textClassName="text-gray-300 text-lg font-semibold"
              />
            )}
          </View>

          {/* Song Preview Section */}
          <GradientCard
            colors={theme.colors.gradients.track}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>SONGS TO BE ADDED</Text>
            <Text style={styles.sectionDescription}>
              Preview of songs that will be included in your playlist
            </Text>
            <View style={styles.songPreviewContainer}>
              {displayedSongs.map((song, index) => (
                <View key={index} style={styles.songPreviewCard} testID={`song-preview-${index}`}>
                  <View style={styles.songAlbumArt}>
                    {song.album_image_url ? (
                      <Image 
                        source={{ uri: song.album_image_url }} 
                        style={styles.songAlbumImage} 
                      />
                    ) : (
                      <View style={styles.songAlbumPlaceholder} />
                    )}
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{song.name}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                    <Text style={styles.songAlbum} numberOfLines={1}>{song.album}</Text>
                  </View>
                </View>
              ))}
            </View>
          </GradientCard>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.letterSpacing.md,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    letterSpacing: theme.typography.letterSpacing.sm,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    minHeight: 56,
  },
  entityTypesContainer: {
    gap: theme.spacing.md,
  },
  entityTypeOption: {
    borderWidth: 2,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  entityTypeOptionActive: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  entityTypeLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  entityTypeLabelActive: {
    color: theme.colors.accent.purple,
  },
  tagSelectionPlaceholder: {
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  placeholderSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  createButtonContainer: {
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  backButton: {
    marginTop: theme.spacing.lg,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  tagOption: {
    borderWidth: 2,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    margin: theme.spacing.xs,
    backgroundColor: 'transparent',
  },
  tagOptionSelected: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  tagLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  tagLabelSelected: {
    color: theme.colors.accent.purple,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
  },
  songPreviewContainer: {
    gap: theme.spacing.md,
  },
  songPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  songAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  songAlbumImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  songAlbumPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.sm,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  songArtist: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  songAlbum: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
});