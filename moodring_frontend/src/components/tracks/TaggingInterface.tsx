import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tag } from '../../types';
import { theme } from '../../styles/theme';

interface TaggingInterfaceProps {
  tags: Tag[];
  onRemoveTag: (_tagId: string) => void;
  onAddTag: () => void;
}

export const TaggingInterface: React.FC<TaggingInterfaceProps> = ({
  tags,
  onRemoveTag,
  onAddTag,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tag}>
            <Text style={styles.tagText}>{tag.name}</Text>
            <TouchableOpacity 
              style={styles.tagRemove}
              onPress={() => onRemoveTag(tag.id)}
            >
              <Text style={styles.tagRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.addTagContainer}>
        <View style={styles.addTagInput}>
          <Text style={styles.addTagPlaceholder}>Add tag...</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAddTag}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
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
  },
  addTagPlaceholder: {
    color: theme.colors.text.muted,
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
});