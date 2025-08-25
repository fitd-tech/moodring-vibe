import React, { useState, useEffect } from 'react';
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
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ProfileMenu } from '../dashboard/ProfileMenu';
import { ClassNameProps } from '../../../nativewind-env';
import { TagSelectionState, Track } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { playlistService } from '../../services/playlistService';
import { taggingService } from '../../services/taggingService';

interface EntityType {
  type: 'songs' | 'albums' | 'playlists';
  label: string;
  enabled: boolean;
}

interface LoadingStates {
  tags: boolean;
  songs: boolean;
  creating: boolean;
}

interface ErrorStates {
  tags: string | null;
  songs: string | null;
  creating: string | null;
}

interface CreatePlaylistPageProps extends ClassNameProps {
  onBack?: () => void;
  onCreatePlaylist?: (
    _playlistName: string,
    _entityTypes: string[],
    _selectedTags: string[]
  ) => void;
  onHome?: () => void;
  onBrowseTags?: () => void;
  onSettings?: () => void;
  onLogout: () => void;
}

export const CreatePlaylistPage: React.FC<CreatePlaylistPageProps> = ({
  onBack,
  onCreatePlaylist,
  onHome,
  onBrowseTags,
  onSettings,
  onLogout,
  className,
}) => {
  const insets = useSafeAreaInsets();
  const { user, authToken } = useAuth();

  const [playlistName, setPlaylistName] = useState('');
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([
    { type: 'songs', label: 'Songs', enabled: true },
    { type: 'albums', label: 'Albums', enabled: false },
    { type: 'playlists', label: 'Playlists', enabled: false },
  ]);
  const [selectableTags, setSelectableTags] = useState<TagSelectionState[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Track[]>([]);
  const [allFilteredSongs, setAllFilteredSongs] = useState<Track[]>([]);
  const [hasMoreSongs, setHasMoreSongs] = useState(false);
  const [currentSongOffset, setCurrentSongOffset] = useState(0);
  const [hasMoreTags, setHasMoreTags] = useState(false);
  const [totalTags, setTotalTags] = useState(0);
  const [currentTagOffset, setCurrentTagOffset] = useState(0);
  const [loading, setLoading] = useState<LoadingStates>({
    tags: true,
    songs: false,
    creating: false,
  });
  const [errors, setErrors] = useState<ErrorStates>({
    tags: null,
    songs: null,
    creating: null,
  });

  // Load initial tags
  useEffect(() => {
    loadInitialTags();
  }, [user]);

  // Update filtered songs when tags or entity types change
  useEffect(() => {
    updateFilteredSongs();
  }, [selectableTags, entityTypes]);

  const loadInitialTags = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, tags: true }));
    setErrors(prev => ({ ...prev, tags: null }));

    try {
      const response = await playlistService.getUserTagsPaginated(user.id, 10, 0);
      const tagSelectionStates = response.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color || '#8a2be2',
        selectionState: 'none' as const,
      }));

      setSelectableTags(tagSelectionStates);
      setHasMoreTags(response.hasMore);
      setTotalTags(response.total);
      setCurrentTagOffset(10);

      if (__DEV__) {
        console.log(
          '[CreatePlaylistPage] Loaded tags:',
          tagSelectionStates.length,
          tagSelectionStates
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[CreatePlaylistPage] Error loading tags:', error);
      }
      setErrors(prev => ({ ...prev, tags: 'Failed to load tags. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, tags: false }));
    }
  };

  const loadMoreTags = async () => {
    if (!user || !hasMoreTags) return;

    setLoading(prev => ({ ...prev, tags: true }));
    setErrors(prev => ({ ...prev, tags: null }));

    try {
      const response = await playlistService.getUserTagsPaginated(user.id, 20, currentTagOffset);
      const newTagSelectionStates = response.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color || '#8a2be2',
        selectionState: 'none' as const,
      }));

      setSelectableTags(prev => [...prev, ...newTagSelectionStates]);
      setHasMoreTags(response.hasMore);
      setCurrentTagOffset(prev => prev + 20);
    } catch (error) {
      if (__DEV__) {
        console.error('[CreatePlaylistPage] Error loading more tags:', error);
      }
      setErrors(prev => ({ ...prev, tags: 'Failed to load more tags. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, tags: false }));
    }
  };

  const updateFilteredSongs = async () => {
    if (!user || !authToken) return;

    const includedTagIds = selectableTags.filter(tag => tag.selectionState === 'include').map(tag => tag.id);
    const excludedTagIds = selectableTags.filter(tag => tag.selectionState === 'exclude').map(tag => tag.id);
    const enabledContentTypes = entityTypes
      .filter(entity => entity.enabled)
      .map(entity => entity.type);

    if (__DEV__) {
      console.log('[CreatePlaylistPage] updateFilteredSongs called:', {
        includedTagIds,
        excludedTagIds,
        enabledContentTypes,
        selectableTagsCount: selectableTags.length,
        includedTagsCount: selectableTags.filter(tag => tag.selectionState === 'include').length,
        excludedTagsCount: selectableTags.filter(tag => tag.selectionState === 'exclude').length,
      });
    }

    if (includedTagIds.length === 0 || enabledContentTypes.length === 0) {
      if (__DEV__) {
        console.log(
          '[CreatePlaylistPage] No tags selected or no content types enabled, clearing songs'
        );
      }
      setFilteredSongs([]);
      setAllFilteredSongs([]);
      setHasMoreSongs(false);
      setCurrentSongOffset(0);
      return;
    }

    setLoading(prev => ({ ...prev, songs: true }));
    setErrors(prev => ({ ...prev, songs: null }));

    try {
      const spotifyToken = user.spotify_access_token;
      if (!spotifyToken) {
        throw new Error('Spotify token not available');
      }

      let songs = await playlistService.getFilteredContent(
        user.id,
        includedTagIds,
        enabledContentTypes,
        spotifyToken
      );

      // Filter out songs with excluded tags
      if (excludedTagIds.length > 0) {
        const excludedSongs = await playlistService.getFilteredContent(
          user.id,
          excludedTagIds,
          enabledContentTypes,
          spotifyToken
        );
        
        // Create a Set of excluded song identifiers using the same logic as taggingService.generateSongId
        const excludedSongIdentifiers = new Set(
          excludedSongs.map(song => taggingService.generateSongId(song.name, song.artist))
        );
        
        // Filter out songs that match excluded identifiers
        songs = songs.filter(song => {
          const songIdentifier = taggingService.generateSongId(song.name, song.artist);
          return !excludedSongIdentifiers.has(songIdentifier);
        });
        
        if (__DEV__) {
          console.log(`[CreatePlaylistPage] Exclusion filtering:`, {
            originalSongCount: songs.length + excludedSongs.length,
            excludedSongCount: excludedSongs.length,
            finalSongCount: songs.length,
            excludedSongIdentifiers: Array.from(excludedSongIdentifiers),
            excludedSongTitles: excludedSongs.map(s => `"${s.name}" by ${s.artist}`)
          });
        }
      }

      // Store all songs and show first 20
      setAllFilteredSongs(songs);
      setFilteredSongs(songs.slice(0, 20));
      setHasMoreSongs(songs.length > 20);
      setCurrentSongOffset(20);
    } catch (error) {
      if (__DEV__) {
        console.error('[CreatePlaylistPage] Error filtering songs:', error);
      }
      setErrors(prev => ({ ...prev, songs: 'Failed to load songs. Please try again.' }));
      setFilteredSongs([]);
      setAllFilteredSongs([]);
      setHasMoreSongs(false);
      setCurrentSongOffset(0);
    } finally {
      setLoading(prev => ({ ...prev, songs: false }));
    }
  };

  const handleEntityTypeToggle = (type: 'songs' | 'albums' | 'playlists') => {
    setEntityTypes(prev =>
      prev.map(entity => (entity.type === type ? { ...entity, enabled: !entity.enabled } : entity))
    );
  };

  const handleTagToggle = (tagId: number) => {
    setSelectableTags(prev =>
      prev.map(tag => {
        if (tag.id === tagId) {
          // Cycle through states: none → include → exclude → none
          const nextState = 
            tag.selectionState === 'none' ? 'include' :
            tag.selectionState === 'include' ? 'exclude' :
            'none';
            
          if (__DEV__) {
            console.log(`[CreatePlaylistPage] Tag "${tag.name}" (ID: ${tagId}) state changed: ${tag.selectionState} → ${nextState}`);
          }
          
          return { ...tag, selectionState: nextState };
        }
        return tag;
      })
    );
  };

  const loadMoreSongs = () => {
    if (!hasMoreSongs || allFilteredSongs.length === 0) return;

    const nextBatch = allFilteredSongs.slice(currentSongOffset, currentSongOffset + 20);
    setFilteredSongs(prev => [...prev, ...nextBatch]);
    setCurrentSongOffset(prev => prev + 20);
    setHasMoreSongs(currentSongOffset + 20 < allFilteredSongs.length);
  };

  const handleLoadMoreTags = () => {
    loadMoreTags();
  };

  const handleLoadMoreSongs = () => {
    loadMoreSongs();
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || !user || !authToken) return;

    const selectedTagIds = selectableTags.filter(tag => tag.selectionState === 'include').map(tag => tag.id);
    const enabledEntityTypes = entityTypes
      .filter(entity => entity.enabled)
      .map(entity => entity.type);

    if (selectedTagIds.length === 0 || enabledEntityTypes.length === 0) return;

    setLoading(prev => ({ ...prev, creating: true }));
    setErrors(prev => ({ ...prev, creating: null }));

    try {
      const spotifyToken = user.spotify_access_token;
      if (!spotifyToken) {
        throw new Error('Spotify token not available');
      }

      const playlistRequest = {
        name: playlistName.trim(),
        userId: user.id,
        selectedTagIds,
        contentTypes: enabledEntityTypes,
      };

      const result = await playlistService.createPlaylistOnSpotify(playlistRequest, spotifyToken);

      if (onCreatePlaylist) {
        const selectedTagNames = selectableTags.filter(tag => tag.selectionState === 'include').map(tag => tag.name);
        onCreatePlaylist(playlistName.trim(), enabledEntityTypes, selectedTagNames);
      }

      if (__DEV__) {
        console.log('[CreatePlaylistPage] Playlist created:', result);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[CreatePlaylistPage] Error creating playlist:', error);
      }
      setErrors(prev => ({ ...prev, creating: 'Failed to create playlist. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const isCreateDisabled =
    !playlistName.trim() ||
    !entityTypes.some(entity => entity.enabled) ||
    !selectableTags.some(tag => tag.selectionState === 'include') ||
    loading.creating;

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
          <GradientCard colors={theme.colors.gradients.action} style={styles.section}>
            <Text style={styles.sectionTitle}>Select Tags</Text>
            <Text style={styles.sectionDescription}>
              Choose tags to include or exclude from your playlist. Include:{' '}
              {selectableTags.filter(tag => tag.selectionState === 'include').length}, Exclude:{' '}
              {selectableTags.filter(tag => tag.selectionState === 'exclude').length}, Total: {selectableTags.length}
            </Text>

            {errors.tags && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.tags}</Text>
              </View>
            )}

            {loading.tags && selectableTags.length === 0 ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="small" />
                <Text style={styles.loadingText}>Loading tags...</Text>
              </View>
            ) : selectableTags.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No tags found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create some tags first to generate playlists
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.tagGrid}>
                  {selectableTags.map(tag => (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagOption,
                        tag.selectionState === 'include' && styles.tagOptionIncluded,
                        tag.selectionState === 'exclude' && styles.tagOptionExcluded
                      ]}
                      onPress={() => handleTagToggle(tag.id)}
                      testID={`tag-option-${tag.id}`}
                      className={`border-2 rounded-lg px-4 py-3 m-1 ${
                        tag.selectionState === 'include'
                          ? 'border-purple-400 bg-purple-400/30'
                          : tag.selectionState === 'exclude'
                          ? 'border-red-400 bg-red-400/30'
                          : 'border-gray-500 bg-transparent'
                      }`}
                    >
                      <View style={styles.tagContent}>
                        <View style={[styles.tagColorIndicator, { backgroundColor: tag.color }]} />
                        <Text
                          style={[
                            styles.tagLabel,
                            tag.selectionState === 'include' && styles.tagLabelIncluded,
                            tag.selectionState === 'exclude' && styles.tagLabelExcluded
                          ]}
                          className={`text-sm font-medium ${
                            tag.selectionState === 'include'
                              ? 'text-purple-200'
                              : tag.selectionState === 'exclude'
                              ? 'text-red-200'
                              : 'text-gray-300'
                          }`}
                        >
                          {tag.selectionState === 'exclude' ? '✗ ' : ''}{tag.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {hasMoreTags && (
                  <Button
                    title={loading.tags ? 'LOADING...' : 'LOAD 20 MORE'}
                    onPress={handleLoadMoreTags}
                    disabled={loading.tags}
                    variant="outline"
                    style={styles.loadMoreButton}
                    testID="load-more-tags-button"
                    className="bg-transparent border-2 border-purple-500 rounded-lg py-3 px-6 mt-4"
                    textClassName="text-purple-300 text-md font-semibold"
                  />
                )}

                <Text style={styles.tagCountText}>
                  Showing {selectableTags.length} of {totalTags} tags
                </Text>
              </>
            )}
          </GradientCard>

          {/* Entity Type Selection Section - Now Second */}
          <GradientCard colors={theme.colors.gradients.features} style={styles.section}>
            <Text style={styles.sectionTitle}>Include Content Types</Text>
            <Text style={styles.sectionDescription}>
              Select which types of content to include in your playlist
            </Text>
            <View style={styles.entityTypesContainer}>
              {entityTypes.map(entity => (
                <TouchableOpacity
                  key={entity.type}
                  style={[styles.entityTypeOption, entity.enabled && styles.entityTypeOptionActive]}
                  onPress={() => handleEntityTypeToggle(entity.type)}
                  testID={`entity-type-${entity.type}`}
                  className={`border-2 rounded-lg p-4 mb-3 ${
                    entity.enabled
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 bg-transparent'
                  }`}
                >
                  <Text
                    style={[styles.entityTypeLabel, entity.enabled && styles.entityTypeLabelActive]}
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
          <GradientCard colors={theme.colors.gradients.track} style={styles.section}>
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
            {errors.creating && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.creating}</Text>
              </View>
            )}

            <Button
              title={loading.creating ? 'CREATING...' : 'CREATE PLAYLIST'}
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
          <GradientCard colors={theme.colors.gradients.track} style={styles.section}>
            <Text style={styles.sectionTitle}>SONGS TO BE ADDED</Text>
            <Text style={styles.sectionDescription}>
              Preview of songs that will be included in your playlist
            </Text>

            {errors.songs && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.songs}</Text>
              </View>
            )}

            {loading.songs ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="small" />
                <Text style={styles.loadingText}>Loading songs...</Text>
              </View>
            ) : filteredSongs.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  {selectableTags.some(tag => tag.selectionState === 'include')
                    ? 'No songs found with included tags'
                    : 'Select tags and content types to see songs'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {selectableTags.some(tag => tag.selectionState === 'include')
                    ? 'Try selecting different tags or content types'
                    : 'Choose which tags to include/exclude and content types for your playlist'}
                </Text>
              </View>
            ) : (
              <View style={styles.songPreviewContainer}>
                {filteredSongs.map((song, index) => (
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
                      <Text style={styles.songTitle} numberOfLines={1}>
                        {song.name}
                      </Text>
                      <Text style={styles.songArtist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                      <Text style={styles.songAlbum} numberOfLines={1}>
                        {song.album}
                      </Text>
                    </View>
                  </View>
                ))}

                {hasMoreSongs && (
                  <Button
                    title="LOAD 20 MORE"
                    onPress={handleLoadMoreSongs}
                    variant="outline"
                    style={styles.loadMoreButton}
                    testID="load-more-songs-button"
                    className="bg-transparent border-2 border-purple-500 rounded-lg py-3 px-6 mt-4"
                    textClassName="text-purple-300 text-md font-semibold"
                  />
                )}

                {filteredSongs.length > 0 && (
                  <>
                    <Text style={styles.songCountText}>
                      Showing {filteredSongs.length} of {allFilteredSongs.length} songs from your
                      Spotify library
                    </Text>
                    <Text style={styles.songInfoText}>
                      Only songs you've saved to Spotify are shown. Save more tagged songs to see
                      them here.
                    </Text>
                  </>
                )}
              </View>
            )}
          </GradientCard>
        </View>
      </ScrollView>

      {/* Fixed position ProfileMenu outside ScrollView */}
      {user && (
        <View
          style={[
            styles.fixedProfileMenuContainer,
            {
              top: insets.top + theme.spacing.sm,
              right: theme.spacing.xl,
            },
          ]}
        >
          <ProfileMenu
            user={user}
            onCreatePlaylist={undefined} // Current page is already Create Playlist
            onHome={onHome}
            onBrowseTags={onBrowseTags}
            onSettings={onSettings}
            onLogout={onLogout}
          />
        </View>
      )}

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    position: 'relative',
  },
  fixedProfileMenuContainer: {
    position: 'absolute',
    zIndex: 1000,
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
  tagOptionIncluded: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
  },
  tagOptionExcluded: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
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
  tagLabelIncluded: {
    color: theme.colors.accent.purple,
  },
  tagLabelExcluded: {
    color: '#ff6666',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.md,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  emptyStateContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  tagCountText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  songCountText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  songInfoText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 16,
    paddingHorizontal: theme.spacing.md,
  },
});
