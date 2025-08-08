import { renderHook } from '@testing-library/react-native';

// Mock all react-native Animated functions first
const mockTiming = jest.fn(() => ({ start: jest.fn() }));
const mockSpring = jest.fn(() => ({ start: jest.fn() }));
const mockParallel = jest.fn(() => ({ start: jest.fn() }));
const mockAnimatedValue = {
  setValue: jest.fn(),
  interpolate: jest.fn(() => mockAnimatedValue),
};

// Mock react-native with hoisted variables
jest.mock('react-native', () => {
  const mockTiming = jest.fn(() => ({ start: jest.fn() }));
  const mockSpring = jest.fn(() => ({ start: jest.fn() }));  
  const mockParallel = jest.fn(() => ({ start: jest.fn() }));
  const mockAnimatedValue = {
    setValue: jest.fn(),
    interpolate: jest.fn(() => mockAnimatedValue),
  };

  return {
    Animated: {
      Value: jest.fn(() => mockAnimatedValue),
      timing: mockTiming,
      spring: mockSpring,
      parallel: mockParallel,
    },
  };
});

// Mock theme
jest.mock('../../styles/theme', () => ({
  theme: {
    animation: {
      duration: {
        slow: 400,
      },
      spring: {
        tension: 100,
        friction: 8,
      },
    },
  },
}));

import { Animated } from 'react-native';
import { useAnimation } from '../useAnimation';

describe('useAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked functions
    const mockedAnimated = Animated as any;
    
    // Set up return values
    mockedAnimated.timing.mockReturnValue({
      start: jest.fn((callback) => callback && callback()),
    });
    
    mockedAnimated.spring.mockReturnValue({
      start: jest.fn((callback) => callback && callback()),
    });
    
    mockedAnimated.parallel.mockReturnValue({
      start: jest.fn((callback) => callback && callback()),
    });
  });

  it('creates animated values with default initial values', () => {
    const { result } = renderHook(() => useAnimation());
    const animatedValues = result.current.createAnimatedValues();

    const mockedAnimated = Animated as any;
    expect(mockedAnimated.Value).toHaveBeenCalledTimes(4);
    expect(mockedAnimated.Value).toHaveBeenNthCalledWith(1, 0); // height
    expect(mockedAnimated.Value).toHaveBeenNthCalledWith(2, 0); // opacity
    expect(mockedAnimated.Value).toHaveBeenNthCalledWith(3, 1); // scale
    expect(mockedAnimated.Value).toHaveBeenNthCalledWith(4, 0); // rotation

    expect(animatedValues).toHaveProperty('scale');
    expect(animatedValues).toHaveProperty('rotation');
    expect(animatedValues).toHaveProperty('height');
    expect(animatedValues).toHaveProperty('opacity');
  });

  it('animates expansion when isExpanded is true', () => {
    const { result } = renderHook(() => useAnimation());
    const mockedAnimated = Animated as any;
    
    const mockAnimatedValues = {
      scale: mockAnimatedValue,
      rotation: mockAnimatedValue,
      height: mockAnimatedValue,
      opacity: mockAnimatedValue,
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    expect(mockedAnimated.timing).toHaveBeenCalledTimes(3); // height, opacity, rotation
    expect(mockedAnimated.spring).toHaveBeenCalledTimes(1); // scale uses spring
    expect(mockedAnimated.parallel).toHaveBeenCalledTimes(1);
    
    // Verify timing calls for expansion
    expect(mockedAnimated.timing).toHaveBeenNthCalledWith(1, mockAnimatedValues.height, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    });
    expect(mockedAnimated.timing).toHaveBeenNthCalledWith(2, mockAnimatedValues.opacity, {
      toValue: 1,
      duration: 320, // 400 * 0.8
      useNativeDriver: false,
    });
    expect(mockedAnimated.spring).toHaveBeenNthCalledWith(1, mockAnimatedValues.scale, {
      toValue: 1.02,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    });
    expect(mockedAnimated.timing).toHaveBeenNthCalledWith(3, mockAnimatedValues.rotation, {
      toValue: 1,
      duration: 240, // 400 * 0.6
      useNativeDriver: false,
    });
  });

  it('animates collapse when isExpanded is false', () => {
    const { result } = renderHook(() => useAnimation());
    const mockedAnimated = Animated as any;
    
    const mockAnimatedValues = {
      scale: mockAnimatedValue,
      rotation: mockAnimatedValue,
      height: mockAnimatedValue,
      opacity: mockAnimatedValue,
    };

    result.current.animateExpansion(mockAnimatedValues, false);

    expect(mockedAnimated.timing).toHaveBeenCalledTimes(3); // height, opacity, rotation
    expect(mockedAnimated.spring).toHaveBeenCalledTimes(1); // scale uses spring
    expect(mockedAnimated.parallel).toHaveBeenCalledTimes(1);
    
    // Verify timing calls for collapse
    expect(mockedAnimated.timing).toHaveBeenNthCalledWith(1, mockAnimatedValues.height, {
      toValue: 0,
      duration: 320, // 400 * 0.8
      useNativeDriver: false,
    });
    expect(mockedAnimated.timing).toHaveBeenNthCalledWith(2, mockAnimatedValues.opacity, {
      toValue: 0,
      duration: 240, // 400 * 0.6
      useNativeDriver: false,
    });
    expect(mockedAnimated.spring).toHaveBeenNthCalledWith(1, mockAnimatedValues.scale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    });
    expect(mockedAnimated.timing).toHaveBeenNthCalledWith(3, mockAnimatedValues.rotation, {
      toValue: 0,
      duration: 240, // 400 * 0.6
      useNativeDriver: false,
    });
  });

  it('starts parallel animation', () => {
    const { result } = renderHook(() => useAnimation());
    const mockedAnimated = Animated as any;
    
    const mockAnimatedValues = {
      scale: mockAnimatedValue,
      rotation: mockAnimatedValue,
      height: mockAnimatedValue,
      opacity: mockAnimatedValue,
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    expect(mockedAnimated.parallel).toHaveBeenCalledWith([
      expect.any(Object), // height timing
      expect.any(Object), // opacity timing
      expect.any(Object), // scale spring
      expect.any(Object), // rotation timing
    ]);

    const startMethod = mockedAnimated.parallel.mock.results[0]?.value?.start;
    expect(startMethod).toHaveBeenCalled();
  });

  it('handles animation completion callback', () => {
    const { result } = renderHook(() => useAnimation());
    const mockedAnimated = Animated as any;
    
    const mockAnimatedValues = {
      scale: mockAnimatedValue,
      rotation: mockAnimatedValue,  
      height: mockAnimatedValue,
      opacity: mockAnimatedValue,
    };

    // Override parallel mock for this test
    const mockStartFn = jest.fn((callback) => {
      if (callback) callback();
    });
    mockedAnimated.parallel.mockReturnValue({
      start: mockStartFn,
    });

    result.current.animateExpansion(mockAnimatedValues, true);

    expect(mockStartFn).toHaveBeenCalled();
  });

  it('maintains consistent animation duration base', () => {
    const { result } = renderHook(() => useAnimation());
    const mockedAnimated = Animated as any;
    
    const mockAnimatedValues = {
      scale: mockAnimatedValue,
      rotation: mockAnimatedValue,
      height: mockAnimatedValue,
      opacity: mockAnimatedValue,
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    // Check that timing calls have appropriate durations
    const timingCalls = mockedAnimated.timing.mock.calls;
    expect(timingCalls).toHaveLength(3);
    expect(timingCalls[0][1].duration).toBe(400); // height: full duration
    expect(timingCalls[1][1].duration).toBe(320); // opacity: 0.8 * duration
    expect(timingCalls[2][1].duration).toBe(240); // rotation: 0.6 * duration
  });

  it('uses correct native driver settings', () => {
    const { result } = renderHook(() => useAnimation());
    const mockedAnimated = Animated as any;
    
    const mockAnimatedValues = {
      scale: mockAnimatedValue,
      rotation: mockAnimatedValue,
      height: mockAnimatedValue,
      opacity: mockAnimatedValue,
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    // Check that all animations use useNativeDriver: false
    const timingCalls = mockedAnimated.timing.mock.calls;
    const springCalls = mockedAnimated.spring.mock.calls;
    
    expect(timingCalls[0][1].useNativeDriver).toBe(false); // height
    expect(timingCalls[1][1].useNativeDriver).toBe(false); // opacity  
    expect(springCalls[0][1].useNativeDriver).toBe(false); // scale
    expect(timingCalls[2][1].useNativeDriver).toBe(false); // rotation
  });
});