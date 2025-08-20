import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GradientCard } from '../shared/GradientCard';
import { Button } from '../shared/Button';
import { theme } from '../../styles/theme';
import { ClassNameProps } from '../../../nativewind-env';

interface LoginScreenProps extends ClassNameProps {
  error: string | null;
  onLogin: () => void;
  isLoginDisabled: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  error, 
  onLogin, 
  isLoginDisabled, 
  className 
}) => {
  // Use TailwindCSS classes if provided, otherwise fallback to StyleSheet
  return (
    <View 
      className={className ? `flex-1 bg-black p-5 pt-15 ${className}` : undefined}
      style={className ? undefined : styles.container}
    >
      <View 
        className={className ? "flex-1 justify-center items-center" : undefined}
        style={className ? undefined : styles.loginContainer}
      >
        {/* App Title with retro styling */}
        <View 
          className={className ? "mb-2 px-5 py-2 bg-purple-900/20 rounded-lg border-2 border-purple-500/50 shadow-lg" : undefined}
          style={className ? undefined : styles.appTitleContainer}
        >
          <Text 
            className={className ? "text-5xl font-black text-white text-center tracking-widest" : undefined}
            style={className ? styles.appTitleShadow : styles.appTitle}
          >
            MOODRING
          </Text>
        </View>

        <Text 
          className={className ? "text-lg text-white text-center mb-10 opacity-80" : undefined}
          style={className ? undefined : styles.tagline}
        >
          Organize your music with powerful tags
        </Text>

        {/* Error message */}
        {error && (
          <GradientCard 
            colors={theme.colors.gradients.error} 
            className={className ? "mb-6 w-full" : undefined}
            style={className ? undefined : styles.errorContainer}
          >
            <Text 
              className={className ? "text-white text-center text-sm font-medium opacity-90" : undefined}
              style={className ? undefined : styles.errorText}
            >
              {error}
            </Text>
          </GradientCard>
        )}

        {/* Features section */}
        <GradientCard 
          colors={theme.colors.gradients.features} 
          className={className ? "mb-10 w-full" : undefined}
          style={className ? undefined : styles.featuresContainer}
        >
          <Text 
            className={className ? "text-base font-semibold text-white mb-4 tracking-wide opacity-90" : undefined}
            style={className ? undefined : styles.featuresTitle}
          >
            What you can do:
          </Text>
          <Text 
            className={className ? "text-base text-white mb-2 opacity-80" : undefined}
            style={className ? undefined : styles.featureItem}
          >
            • Tag your songs and playlists
          </Text>
          <Text 
            className={className ? "text-base text-white mb-2 opacity-80" : undefined}
            style={className ? undefined : styles.featureItem}
          >
            • Create hierarchical organization
          </Text>
          <Text 
            className={className ? "text-base text-white mb-2 opacity-80" : undefined}
            style={className ? undefined : styles.featureItem}
          >
            • Generate smart playlists
          </Text>
          <Text 
            className={className ? "text-base text-white opacity-80" : undefined}
            style={className ? undefined : styles.featureItem}
          >
            • Discover music patterns
          </Text>
        </GradientCard>

        {/* Authentication section */}
        <View 
          className={className ? "items-center w-full" : undefined}
          style={className ? undefined : styles.authSection}
        >
          <Text 
            className={className ? "text-base text-white text-center mb-8 opacity-90" : undefined}
            style={className ? undefined : styles.authText}
          >
            Connect your Spotify account to get started
          </Text>

          <Button
            title="Connect with Spotify"
            onPress={onLogin}
            disabled={isLoginDisabled}
            variant="primary"
            className={className ? "mb-6 w-full" : undefined}
            style={className ? undefined : styles.loginButton}
          />

          <Text 
            className={className ? "text-sm text-white text-center opacity-60" : undefined}
            style={className ? styles.disclaimerTextInline : styles.disclaimerText}
          >
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
  appTitleShadow: {
    textShadowColor: theme.colors.accent.purple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  disclaimerTextInline: {
    lineHeight: 20,
  },
});
