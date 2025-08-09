import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Tag, NewTag } from '../../types';
import { theme } from '../../styles/theme';
import { taggingService } from '../../services/taggingService';
import { useAuth } from '../../contexts/AuthContext';

interface TaggingInterfaceProps {
  tags: Tag[];
  songId: string;
  onTagsChanged: () => void;
}

export const TaggingInterface: React.FC<TaggingInterfaceProps> = ({
  tags,
  songId,
  onTagsChanged,
}) => {
  const { user } = useAuth();
  const [newTagName, setNewTagName] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvailableTags, setShowAvailableTags] = useState(false);

  useEffect(() => {
    if (user) {
      loadAvailableTags();
    }
  }, [user]);

  const loadAvailableTags = async () => {
    if (!user) return;
    
    try {
      const userTags = await taggingService.getUserTags(user.id);
      setAvailableTags(userTags);
    } catch (error) {
      console.error('Failed to load available tags:', error);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await taggingService.removeTagFromSong(songId, user.id, tagId);
      onTagsChanged();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove tag from song');
      console.error('Failed to remove tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!user || !newTagName.trim()) return;
    
    setIsLoading(true);
    try {
      // Create new tag
      const tagData: NewTag = {
        name: newTagName.trim(),
        user_id: user.id,
      };
      
      const newTag = await taggingService.createTag(user.id, tagData);
      
      // Add tag to song
      await taggingService.addTagToSong(songId, user.id, newTag.id);
      
      setNewTagName('');
      setShowAvailableTags(false);
      await loadAvailableTags(); // Refresh available tags
      onTagsChanged();
    } catch (error) {
      Alert.alert('Error', 'Failed to create and add tag');
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExistingTag = async (tag: Tag) => {
    if (!user) return;
    
    // Check if tag is already added to this song
    const isAlreadyAdded = tags.some(t => t.id === tag.id);
    if (isAlreadyAdded) {
      Alert.alert('Tag Already Added', 'This tag is already applied to this song.');
      return;
    }
    
    setIsLoading(true);
    try {
      await taggingService.addTagToSong(songId, user.id, tag.id);
      setShowAvailableTags(false);
      onTagsChanged();
    } catch (error) {
      Alert.alert('Error', 'Failed to add tag to song');
      console.error('Failed to add existing tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUnusedTags = () => {
    const usedTagIds = new Set(tags.map(tag => tag.id));
    return availableTags.filter(tag => !usedTagIds.has(tag.id));
  };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      
      {/* Current tags */}
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tag}>
            <Text style={styles.tagText}>{tag.name}</Text>
            <TouchableOpacity 
              style={styles.tagRemove}
              onPress={() => handleRemoveTag(tag.id)}
              disabled={isLoading}
            >
              <Text style={styles.tagRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      {/* Add new tag */}
      <View style={styles.addTagContainer}>
        <TextInput
          style={styles.addTagInput}
          placeholder="Add tag..."
          placeholderTextColor={theme.colors.text.muted}
          value={newTagName}
          onChangeText={setNewTagName}
          onSubmitEditing={handleCreateAndAddTag}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.addButton, isLoading && styles.addButtonDisabled]} 
          onPress={handleCreateAndAddTag}
          disabled={isLoading || !newTagName.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.text.primary} />
          ) : (
            <Text style={styles.addButtonText}>+ Add</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Existing tags suggestions */}
      {getUnusedTags().length > 0 && (
        <>
          <TouchableOpacity 
            style={styles.suggestionToggle}
            onPress={() => setShowAvailableTags(!showAvailableTags)}
          >
            <Text style={styles.suggestionToggleText}>
              {showAvailableTags ? 'Hide' : 'Show'} Available Tags ({getUnusedTags().length})
            </Text>
          </TouchableOpacity>
          
          {showAvailableTags && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
              {getUnusedTags().map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.suggestionTag}
                  onPress={() => handleAddExistingTag(tag)}
                  disabled={isLoading}
                >
                  <Text style={styles.suggestionTagText}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.tag,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing.sm,
  },
  tagRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.ui.tagRemove,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRemoveText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: 25,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  addButton: {
    backgroundColor: theme.colors.accent.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  addButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  suggestionToggle: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  suggestionToggleText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  suggestionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  suggestionTag: {
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent.purple,
  },
  suggestionTagText: {
    color: theme.colors.accent.purple,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});