import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BackendUser } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { theme } from '../../styles/theme';

interface UserProfileProps {
  user: BackendUser;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <GradientCard colors={theme.colors.gradients.profile}>
      <View style={styles.profileHeader}>
        {user.profile_image_url ? (
          <Image 
            source={{ uri: user.profile_image_url }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarPlaceholder}>
              {user.display_name?.charAt(0).toUpperCase() || user.spotify_id.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.display_name || user.spotify_id}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xl,
    borderWidth: 3,
    borderColor: theme.colors.accent.cyan,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xl,
    borderWidth: 3,
    borderColor: theme.colors.accent.yellow,
  },
  avatarPlaceholder: {
    fontSize: 30,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.normal,
    opacity: 0.7,
  },
});