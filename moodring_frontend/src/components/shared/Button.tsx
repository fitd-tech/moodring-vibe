import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  testID,
}) => {
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };
  const buttonStyle = [
    styles.base,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.baseText,
    styles[`${variant}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
    >
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxxl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  primary: {
    backgroundColor: theme.colors.accent.purple,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    ...theme.shadow.purple,
  },
  secondary: {
    backgroundColor: theme.colors.ui.overlay,
    borderColor: theme.colors.ui.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.ui.border,
  },
  disabled: {
    backgroundColor: theme.colors.ui.overlay,
    shadowOpacity: 0,
  },
  baseText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  primaryText: {
    color: theme.colors.text.primary,
  },
  secondaryText: {
    color: theme.colors.text.primary,
  },
  outlineText: {
    color: theme.colors.text.primary,
  },
});