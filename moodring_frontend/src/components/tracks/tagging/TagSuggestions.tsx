import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Tag } from '../../../types';
import { theme } from '../../../styles/theme';

interface TagSuggestionsProps {
  unusedTags: Tag[];
  showAvailableTags: boolean;
  onToggleShow: () => void;
  onAddTag: (_tag: Tag) => void;
  isLoading: boolean;
}

export const TagSuggestions: React.FC<TagSuggestionsProps> = ({
  unusedTags,
  showAvailableTags,
  onToggleShow,
  onAddTag,
  isLoading,
}) => {
  if (unusedTags.length === 0) {
    return null;
  }

  return (
    <>
      <TouchableOpacity style={styles.suggestionToggle} onPress={onToggleShow}>
        <Text style={styles.suggestionToggleText}>
          {showAvailableTags ? 'Hide' : 'Show'} Available Tags ({unusedTags.length})
        </Text>
      </TouchableOpacity>

      {showAvailableTags && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
        >
          {unusedTags.map(tag => (
            <TouchableOpacity
              key={tag.id}
              style={styles.suggestionTag}
              onPress={() => onAddTag(tag)}
              disabled={isLoading}
            >
              <Text style={styles.suggestionTagText}>{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
