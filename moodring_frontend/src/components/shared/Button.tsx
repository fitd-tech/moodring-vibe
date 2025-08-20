import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../styles/theme';
import { ClassNameProps } from '../../../nativewind-env';

interface ButtonProps extends ClassNameProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  textClassName?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  className,
  textClassName,
  testID,
}) => {
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  // Default TailwindCSS classes for each variant
  const getButtonClasses = () => {
    const baseClasses = 'py-4 px-8 items-center border-2 rounded-lg';
    const variantClasses = {
      primary: 'bg-purple-600 border-purple-600 shadow-lg',
      secondary: 'bg-gray-800 border-gray-600',
      outline: 'bg-transparent border-gray-600',
    };
    const disabledClasses = disabled ? 'bg-gray-800 opacity-50' : '';

    return `${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className || ''}`.trim();
  };

  const getTextClasses = () => {
    const baseTextClasses = 'text-lg font-semibold text-white';
    return `${baseTextClasses} ${textClassName || ''}`.trim();
  };

  // Fallback to StyleSheet if TailwindCSS classes don't work
  const buttonStyle = className
    ? undefined
    : [styles.base, styles[variant], disabled && styles.disabled, style];
  const buttonTextStyle = textClassName
    ? undefined
    : [styles.baseText, styles[`${variant}Text`], textStyle];

  return (
    <TouchableOpacity
      className={className ? getButtonClasses() : undefined}
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
    >
      <Text
        className={textClassName !== undefined ? getTextClasses() : undefined}
        style={buttonTextStyle}
      >
        {title}
      </Text>
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
