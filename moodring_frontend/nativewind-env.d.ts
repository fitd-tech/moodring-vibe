/// <reference types="nativewind/types" />

import React from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Enhanced compatibility layer for React Native 0.81 + NativeWind v4 + Reanimated v3
// This addresses TypeScript strict typing issues and provides comprehensive className support

// Global augmentation for React intrinsic elements with more aggressive type overriding
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any element to have className - more permissive approach
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [elemName: string]: any;
    }
    
    interface Element {
      className?: string;
    }
    
    interface ElementClass {
      className?: string;
    }
  }
}

// More aggressive React Native component type overrides for className support
declare module 'react-native' {
  // Core component interfaces with className support
  interface ViewProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface TextProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface TouchableOpacityProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface PressableProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface ScrollViewProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface ImageProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface TextInputProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface ModalProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface ActivityIndicatorProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface FlatListProps<_ItemT> {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface SectionListProps<_ItemT, _SectionT> {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface TouchableWithoutFeedbackProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface TouchableHighlightProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface RefreshControlProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface SwitchProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface SliderProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface PickerProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface StatusBarProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface KeyboardAvoidingViewProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  // SafeAreaView has been removed to avoid deprecated react-native SafeAreaView
  // Use SafeAreaView from 'react-native-safe-area-context' directly instead
}

// react-native-safe-area-context component type overrides
declare module 'react-native-safe-area-context' {
  interface SafeAreaViewProps {
    className?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

// Expo component type overrides
declare module 'expo-linear-gradient' {
  import { ViewStyle } from 'react-native';
  
  interface LinearGradientProps {
    className?: string;
    children?: React.ReactNode;
    colors: readonly (string | number)[];
    locations?: readonly number[] | undefined;
    start?: readonly [number, number] | {x: number, y: number} | undefined;
    end?: readonly [number, number] | {x: number, y: number} | undefined;
    style?: ViewStyle | ViewStyle[] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

// Custom component props with className support
export interface ClassNameProps {
  className?: string;
}

// Style utility types
export type TailwindStyle = ViewStyle | TextStyle | ImageStyle;
