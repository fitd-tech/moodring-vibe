import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tag } from '../../../types';
import { theme } from '../../../styles/theme';
import { useTagging } from './useTagging';
import { CurrentTags } from './CurrentTags';
import { TagInput } from './TagInput';
import { TagSuggestions } from './TagSuggestions';

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
  const {
    newTagName,
    setNewTagName,
    isLoading,
    showAvailableTags,
    setShowAvailableTags,
    handleRemoveTag,
    handleCreateAndAddTag,
    handleAddExistingTag,
    getUnusedTags,
  } = useTagging({ tags, songId, onTagsChanged });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>

      <CurrentTags tags={tags} onRemoveTag={handleRemoveTag} isLoading={isLoading} />

      <TagInput
        newTagName={newTagName}
        onChangeText={setNewTagName}
        onSubmit={handleCreateAndAddTag}
        isLoading={isLoading}
      />

      <TagSuggestions
        unusedTags={getUnusedTags()}
        showAvailableTags={showAvailableTags}
        onToggleShow={() => setShowAvailableTags(!showAvailableTags)}
        onAddTag={handleAddExistingTag}
        isLoading={isLoading}
      />
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
});
