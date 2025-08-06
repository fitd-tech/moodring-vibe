import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GradientCard } from '../shared/GradientCard';
import { Button } from '../shared/Button';
import { theme } from '../../styles/theme';

interface LoginScreenProps {
  error: string | null;
  onLogin: () => void;
  isLoginDisabled: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  error,
  onLogin,
  isLoginDisabled,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.appTitleContainer}>
          <Text style={styles.appTitle}>MOODRING</Text>
        </View>
        <Text style={styles.tagline}>Organize your music with powerful tags</Text>

        {error && (
          <GradientCard colors={theme.colors.gradients.error} style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </GradientCard>
        )}

        <GradientCard colors={theme.colors.gradients.features} style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you can do:</Text>
          <Text style={styles.featureItem}>• Tag your songs and playlists</Text>
          <Text style={styles.featureItem}>• Create hierarchical organization</Text>
          <Text style={styles.featureItem}>• Generate smart playlists</Text>
          <Text style={styles.featureItem}>• Discover music patterns</Text>
        </GradientCard>

        <View style={styles.authSection}>
          <Text style={styles.authText}>Connect your Spotify account to get started</Text>

          <Button
            title="Connect with Spotify"
            onPress={onLogin}
            disabled={isLoginDisabled}
            variant="primary"
            style={styles.loginButton}
          />

          <Text style={styles.disclaimerText}>
            We'll only access your music library and playlists.{'\n'}
            Your data stays private and secure.
          </Text>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitleContainer: {
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'rgba(138, 43, 226, 0.5)',
    ...theme.shadow.purple,
  },
  appTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.heavy,
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: theme.typography.letterSpacing.lg,
    textShadowColor: theme.colors.accent.purple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl + theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.normal,
    opacity: 0.8,
  },
  errorContainer: {
    marginBottom: theme.spacing.xxl,
    width: '100%',
  },
  errorText: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    opacity: 0.9,
  },
  featuresContainer: {
    marginBottom: theme.spacing.xxxl + theme.spacing.sm,
    width: '100%',
  },
  featuresTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: theme.typography.letterSpacing.sm,
    opacity: 0.9,
  },
  featureItem: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
    fontWeight: theme.typography.fontWeight.normal,
    opacity: 0.8,
  },
  authSection: {
    alignItems: 'center',
    width: '100%',
  },
  authText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl - theme.spacing.sm,
    opacity: 0.9,
  },
  loginButton: {
    marginBottom: theme.spacing.xxl,
    width: '100%',
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.6,
  },
});