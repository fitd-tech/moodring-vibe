import React from 'react';
import { StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

interface GradientCardProps {
  colors: readonly string[];
  style?: ViewStyle;
  children: React.ReactNode;
}

export const GradientCard: React.FC<GradientCardProps> = ({ colors, style, children }) => {
  return (
    <LinearGradient
      colors={colors as readonly [ColorValue, ColorValue, ...ColorValue[]]}
      style={[styles.card, style]}
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