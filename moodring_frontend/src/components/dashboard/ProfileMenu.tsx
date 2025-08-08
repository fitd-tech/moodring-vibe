import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { BackendUser } from '../../types';
import { theme } from '../../styles/theme';

interface ProfileMenuProps {
  user: BackendUser;
  onCreatePlaylist?: () => void;
  onBrowseTags?: () => void;
  onSettings?: () => void;
  onLogout: () => void;
}

interface MenuOption {
  id: string;
  label: string;
  onPress: () => void;
  icon?: string;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  user,
  onCreatePlaylist,
  onBrowseTags,
  onSettings,
  onLogout,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const menuOptions: MenuOption[] = [
    {
      id: 'create-playlist',
      label: 'Create playlist',
      onPress: () => {
        setIsMenuVisible(false);
        onCreatePlaylist?.();
      },
    },
    {
      id: 'browse-tags',
      label: 'Browse tags',
      onPress: () => {
        setIsMenuVisible(false);
        onBrowseTags?.();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      onPress: () => {
        setIsMenuVisible(false);
        onSettings?.();
      },
    },
    {
      id: 'logout',
      label: 'Log out',
      onPress: () => {
        setIsMenuVisible(false);
        onLogout();
      },
    },
  ];

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={toggleMenu}
        testID="profile-menu-button"
      >
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
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeMenu}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.display_name || user.spotify_id}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            
            <View style={styles.menuDivider} />
            
            <View style={styles.menuOptions}>
              {menuOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.menuOption}
                  onPress={option.onPress}
                  testID={`menu-option-${option.id}`}
                >
                  <Text 
                    style={[
                      styles.menuOptionText,
                      option.id === 'logout' && styles.logoutText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  profileButton: {
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.shadow.default,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.accent.purple,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent.yellow,
  },
  avatarPlaceholder: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90, // Adjust based on safe area
    paddingRight: theme.spacing.xl,
  },
  menuContainer: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: theme.colors.shadow.default,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  menuHeader: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.normal,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
  },
  menuOptions: {
    paddingVertical: theme.spacing.sm,
  },
  menuOption: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
  },
  menuOptionText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  logoutText: {
    color: theme.colors.accent.pink,
  },
});