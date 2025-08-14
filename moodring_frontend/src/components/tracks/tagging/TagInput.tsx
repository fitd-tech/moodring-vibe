import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { theme } from '../../../styles/theme';

interface TagInputProps {
  newTagName: string;
  onChangeText: (_text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  newTagName,
  onChangeText,
  onSubmit,
  isLoading,
}) => {
  return (
    <View style={styles.addTagContainer}>
      <TextInput
        style={styles.addTagInput}
        placeholder="Add tag..."
        placeholderTextColor={theme.colors.text.muted}
        value={newTagName}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!isLoading}
      />
      <TouchableOpacity
        style={[styles.addButton, isLoading && styles.addButtonDisabled]}
        onPress={onSubmit}
        disabled={isLoading || !newTagName.trim()}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.text.primary} />
        ) : (
          <Text style={styles.addButtonText}>+ Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
