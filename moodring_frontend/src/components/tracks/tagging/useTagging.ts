import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Tag, NewTag } from '../../../types';
import { taggingService } from '../../../services/taggingService';
import { useAuth } from '../../../contexts/AuthContext';

interface UseTaggingProps {
  tags: Tag[];
  entityId: string;
  entityType?: 'track' | 'album' | 'playlist';
  spotifyId: string;
  onTagsChanged: () => void;
}

export const useTagging = ({ tags, entityId, entityType = 'track', spotifyId, onTagsChanged }: UseTaggingProps) => {
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
    } catch {
      // Silently fail for available tags loading
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await taggingService.removeTagFromEntity(entityType, entityId, user.id, tagId);
      onTagsChanged();
    } catch {
      Alert.alert('Error', `Failed to remove tag from ${entityType}`);
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

      // Add tag to entity
      await taggingService.addTagToEntity(entityType, entityId, user.id, newTag.id, spotifyId);

      setNewTagName('');
      setShowAvailableTags(false);
      await loadAvailableTags(); // Refresh available tags
      onTagsChanged();
    } catch {
      Alert.alert('Error', `Failed to create and add tag to ${entityType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExistingTag = async (tag: Tag) => {
    if (!user) return;

    // Check if tag is already added to this entity
    const isAlreadyAdded = tags.some(t => t.id === tag.id);
    if (isAlreadyAdded) {
      Alert.alert('Tag Already Added', `This tag is already applied to this ${entityType}.`);
      return;
    }

    setIsLoading(true);
    try {
      await taggingService.addTagToEntity(entityType, entityId, user.id, tag.id, spotifyId);
      setShowAvailableTags(false);
      onTagsChanged();
    } catch {
      Alert.alert('Error', `Failed to add tag to ${entityType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getUnusedTags = () => {
    const usedTagIds = new Set(tags.map(tag => tag.id));
    return availableTags.filter(tag => !usedTagIds.has(tag.id));
  };

  return {
    newTagName,
    setNewTagName,
    availableTags,
    isLoading,
    showAvailableTags,
    setShowAvailableTags,
    handleRemoveTag,
    handleCreateAndAddTag,
    handleAddExistingTag,
    getUnusedTags,
  };
};
