import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { ClassNameProps } from '../../../nativewind-env';

interface LoadingSpinnerProps extends ClassNameProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
  compact?: boolean;
  textClassName?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  size = 'large',
  color = theme.colors.accent.purple,
  compact = false,
  className,
  textClassName,
}) => {
  // TailwindCSS classes
  const getContainerClasses = () => {
    const baseClasses = compact 
      ? 'flex-row justify-center items-center py-2 px-3'
      : 'flex-1 justify-center items-center bg-black p-5 pt-15';
    return `${baseClasses} ${className || ''}`.trim();
  };

  const getTextClasses = () => {
    const baseClasses = compact
      ? 'text-white text-sm ml-2 font-medium'
      : 'text-white text-base mt-3 font-bold';
    return `${baseClasses} ${textClassName || ''}`.trim();
  };

  // Fallback to StyleSheet if no className provided
  const containerStyle = className ? undefined : (compact ? styles.compactContainer : styles.container);
  const textStyle = textClassName !== undefined ? undefined : (compact ? styles.compactText : styles.text);

  return (
    <View 
      className={className !== undefined ? getContainerClasses() : undefined}
      style={containerStyle}
    >
      <ActivityIndicator size={size} color={color} testID="activity-indicator" />
      <Text 
        className={textClassName !== undefined ? getTextClasses() : undefined}
        style={textStyle}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  compactText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
