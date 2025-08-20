import React from 'react';
import { StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { ClassNameProps } from '../../../nativewind-env';

interface GradientCardProps extends ClassNameProps {
  colors: readonly string[];
  style?: ViewStyle;
  children: React.ReactNode;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  colors,
  style,
  children,
  className,
}) => {
  // TailwindCSS classes
  const getCardClasses = () => {
    const baseClasses = 'p-6 rounded-lg mb-5 shadow-lg';
    return `${baseClasses} ${className || ''}`.trim();
  };

  // Use TailwindCSS if className provided, otherwise fallback to StyleSheet
  const cardStyle = className ? undefined : [styles.card, style];

  return (
    <LinearGradient
      colors={colors as readonly [ColorValue, ColorValue, ...ColorValue[]]}
      className={className ? getCardClasses() : undefined}
      style={cardStyle || style}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.default,
  },
});
