import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BackendUser } from '../../types';
import { GradientCard } from '../shared/GradientCard';
import { theme } from '../../styles/theme';
import { ClassNameProps } from '../../../nativewind-env';

interface UserProfileProps extends ClassNameProps {
  user: BackendUser;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, className }) => {
  return (
    <GradientCard colors={theme.colors.gradients.profile} className={className}>
      <View
        className={className ? 'flex-row items-center' : undefined}
        style={className ? undefined : styles.profileHeader}
      >
        {user.profile_image_url ? (
          <Image
            source={{ uri: user.profile_image_url }}
            className={
              className ? 'w-20 h-20 rounded-full mr-5 border-4 border-cyan-400' : undefined
            }
            style={className ? undefined : styles.profileImage}
          />
        ) : (
          <View
            className={
              className
                ? 'w-20 h-20 rounded-full bg-orange-500 justify-center items-center mr-5 border-4 border-yellow-400'
                : undefined
            }
            style={className ? undefined : styles.avatarContainer}
          >
            <Text
              className={className ? 'text-3xl font-bold text-white' : undefined}
              style={className ? styles.avatarPlaceholderShadow : styles.avatarPlaceholder}
            >
              {user.display_name?.charAt(0).toUpperCase() ||
                user.spotify_id.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View
          className={className ? 'flex-1' : undefined}
          style={className ? undefined : styles.userInfo}
        >
          <Text
            className={className ? 'text-xl font-bold text-white mb-1' : undefined}
            style={className ? undefined : styles.userName}
          >
            {user.display_name || user.spotify_id}
          </Text>
          <Text
            className={className ? 'text-base text-white opacity-70' : undefined}
            style={className ? undefined : styles.userEmail}
          >
            {user.email}
          </Text>
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
  avatarPlaceholderShadow: {
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
