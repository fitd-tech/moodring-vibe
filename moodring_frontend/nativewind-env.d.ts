/// <reference types="nativewind/types" />

import React from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Temporary compatibility layer for React Native 0.81 + NativeWind
// This addresses TypeScript strict typing issues until NativeWind fully supports RN 0.81

// Global augmentation for React intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any element to have className
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [elemName: string]: any;
    }
  }
}

// React Native component type overrides for className support
declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface TouchableOpacityProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
  }

  interface ImageProps {
    className?: string;
  }

  interface TextInputProps {
    className?: string;
  }

  interface ModalProps {
    className?: string;
  }

  interface ActivityIndicatorProps {
    className?: string;
  }

  interface FlatListProps<_ItemT> {
    className?: string;
  }

  interface SectionListProps<_ItemT, _SectionT> {
    className?: string;
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
