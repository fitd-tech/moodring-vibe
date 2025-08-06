// Hook for managing animation values and transitions
import { Animated } from 'react-native';
import { theme } from '../styles/theme';
import { AnimatedValues } from '../types';

export const useAnimation = () => {
  const createAnimatedValues = (): AnimatedValues => ({
    height: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(1),
    rotation: new Animated.Value(0),
  });

  const animateExpansion = (values: AnimatedValues, expand: boolean) => {
    const duration = theme.animation.duration.slow;
    const springConfig = theme.animation.spring;

    if (expand) {
      Animated.parallel([
        Animated.timing(values.height, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(values.opacity, {
          toValue: 1,
          duration: duration * 0.8,
          useNativeDriver: false,
        }),
        Animated.spring(values.scale, {
          toValue: 1.02,
          ...springConfig,
          useNativeDriver: false,
        }),
        Animated.timing(values.rotation, {
          toValue: 1,
          duration: duration * 0.6,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(values.height, {
          toValue: 0,
          duration: duration * 0.8,
          useNativeDriver: false,
        }),
        Animated.timing(values.opacity, {
          toValue: 0,
          duration: duration * 0.6,
          useNativeDriver: false,
        }),
        Animated.spring(values.scale, {
          toValue: 1,
          ...springConfig,
          useNativeDriver: false,
        }),
        Animated.timing(values.rotation, {
          toValue: 0,
          duration: duration * 0.6,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  return {
    createAnimatedValues,
    animateExpansion,
  };
};