import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GradientCard } from '../shared/GradientCard';
import { theme } from '../../styles/theme';

interface QuickActionsProps {
  onCreateTag?: () => void;
  onBrowsePlaylists?: () => void;
  onGeneratePlaylist?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateTag = () => {},
  onBrowsePlaylists = () => {},
  onGeneratePlaylist = () => {},
}) => {
  return (
    <GradientCard colors={theme.colors.gradients.action}>
      <Text style={styles.title}>QUICK ACTIONS</Text>
      <TouchableOpacity style={styles.actionButton} onPress={onCreateTag}>
        <Text style={styles.actionButtonText}>Create New Tag</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onBrowsePlaylists}>
        <Text style={styles.actionButtonText}>Browse Playlists</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onGeneratePlaylist}>
        <Text style={styles.actionButtonText}>Generate Playlist</Text>
      </TouchableOpacity>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: theme.typography.letterSpacing.sm,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  actionButton: {
    backgroundColor: theme.colors.ui.overlay,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  actionButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});