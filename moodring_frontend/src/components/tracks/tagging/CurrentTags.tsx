import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tag } from '../../../types';
import { theme } from '../../../styles/theme';

interface CurrentTagsProps {
  tags: Tag[];
  onRemoveTag: (_tagId: number) => void;
  isLoading: boolean;
}

export const CurrentTags: React.FC<CurrentTagsProps> = ({ tags, onRemoveTag, isLoading }) => {
  return (
    <View style={styles.tagsContainer}>
      {tags.map(tag => (
        <View key={tag.id} style={styles.tag}>
          <Text style={styles.tagText}>{tag.name}</Text>
          <TouchableOpacity
            style={styles.tagRemove}
            onPress={() => onRemoveTag(tag.id)}
            disabled={isLoading}
          >
            <Text style={styles.tagRemoveText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
});
