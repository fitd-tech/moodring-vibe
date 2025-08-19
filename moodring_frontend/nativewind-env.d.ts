/// <reference types="nativewind/types" />

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Extend React Native component props with className support
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
}

// Custom component props with className support
export interface ClassNameProps {
  className?: string;
}

// Style utility types
export type TailwindStyle = ViewStyle | TextStyle | ImageStyle;