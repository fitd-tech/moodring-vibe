import { renderHook } from '@testing-library/react-native';
import { useAnimation } from '../useAnimation';

// Mock Animated functions
const mockTiming = jest.fn(() => ({ start: jest.fn() }));
const mockParallel = jest.fn(() => ({ start: jest.fn() }));

// Mock Animated Value
const mockAnimatedValue = {
  setValue: jest.fn(),
  interpolate: jest.fn(() => mockAnimatedValue),
};

jest.doMock('react-native', () => ({
  Animated: {
    Value: jest.fn(() => mockAnimatedValue),
    timing: mockTiming,
    parallel: mockParallel,
  },
}));

describe('useAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock timing to return an object with start method
    mockTiming.mockReturnValue({
      start: jest.fn((callback) => callback && callback()),
    });
    
    // Mock parallel to return an object with start method
    mockParallel.mockReturnValue({
      start: jest.fn((callback) => callback && callback()),
    });
  });

  it('creates animated values with default initial values', () => {
    const { result } = renderHook(() => useAnimation());

    const animatedValues = result.current.createAnimatedValues();

    expect(Animated.Value).toHaveBeenCalledTimes(4);
    expect(Animated.Value).toHaveBeenNthCalledWith(1, 1); // scale
    expect(Animated.Value).toHaveBeenNthCalledWith(2, 0); // rotation
    expect(Animated.Value).toHaveBeenNthCalledWith(3, 0); // height
    expect(Animated.Value).toHaveBeenNthCalledWith(4, 0); // opacity

    expect(animatedValues).toHaveProperty('scale');
    expect(animatedValues).toHaveProperty('rotation');
    expect(animatedValues).toHaveProperty('height');
    expect(animatedValues).toHaveProperty('opacity');
  });

  it('animates expansion when isExpanded is true', () => {
    const { result } = renderHook(() => useAnimation());
    
    const mockAnimatedValues = {
      scale: { setValue: jest.fn() },
      rotation: { setValue: jest.fn() },
      height: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    expect(mockTiming).toHaveBeenCalledTimes(4);
    expect(mockParallel).toHaveBeenCalledTimes(1);
    
    // Verify timing calls for expansion
    expect(mockTiming).toHaveBeenNthCalledWith(1, mockAnimatedValues.scale, {
      toValue: 1.02,
      duration: 300,
      useNativeDriver: true,
    });
    expect(mockTiming).toHaveBeenNthCalledWith(2, mockAnimatedValues.rotation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });
    expect(mockTiming).toHaveBeenNthCalledWith(3, mockAnimatedValues.height, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    });
    expect(mockTiming).toHaveBeenNthCalledWith(4, mockAnimatedValues.opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });
  });

  it('animates collapse when isExpanded is false', () => {
    const { result } = renderHook(() => useAnimation());
    
    const mockAnimatedValues = {
      scale: { setValue: jest.fn() },
      rotation: { setValue: jest.fn() },
      height: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
    };

    result.current.animateExpansion(mockAnimatedValues, false);

    expect(mockTiming).toHaveBeenCalledTimes(4);
    expect(mockParallel).toHaveBeenCalledTimes(1);
    
    // Verify timing calls for collapse
    expect(mockTiming).toHaveBeenNthCalledWith(1, mockAnimatedValues.scale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });
    expect(mockTiming).toHaveBeenNthCalledWith(2, mockAnimatedValues.rotation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
    expect(mockTiming).toHaveBeenNthCalledWith(3, mockAnimatedValues.height, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    });
    expect(mockTiming).toHaveBeenNthCalledWith(4, mockAnimatedValues.opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
  });

  it('starts parallel animation', () => {
    const { result } = renderHook(() => useAnimation());
    
    const mockAnimatedValues = {
      scale: { setValue: jest.fn() },
      rotation: { setValue: jest.fn() },
      height: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    const parallelAnimation = mockParallel.mock.calls[0][0];
    expect(parallelAnimation).toHaveLength(4); // Four timing animations

    const startMethod = mockParallel.mock.results[0].value.start;
    expect(startMethod).toHaveBeenCalled();
  });

  it('handles animation completion callback', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useAnimation());
    
    const mockAnimatedValues = {
      scale: { setValue: jest.fn() },
      rotation: { setValue: jest.fn() },
      height: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
    };

    // Mock parallel start to call the callback
    mockParallel.mockReturnValue({
      start: jest.fn((callback) => {
        if (callback) callback();
      }),
    });

    result.current.animateExpansion(mockAnimatedValues, true);

    // The parallel animation should have been started
    expect(mockParallel().start).toHaveBeenCalled();
  });

  it('maintains consistent animation duration', () => {
    const { result } = renderHook(() => useAnimation());
    
    const mockAnimatedValues = {
      scale: { setValue: jest.fn() },
      rotation: { setValue: jest.fn() },
      height: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    // All timing animations should use 300ms duration
    mockTiming.mock.calls.forEach(call => {
      expect(call[1].duration).toBe(300);
    });
  });

  it('uses correct native driver settings', () => {
    const { result } = renderHook(() => useAnimation());
    
    const mockAnimatedValues = {
      scale: { setValue: jest.fn() },
      rotation: { setValue: jest.fn() },
      height: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
    };

    result.current.animateExpansion(mockAnimatedValues, true);

    // Scale, rotation, and opacity should use native driver
    expect(mockTiming.mock.calls[0][1].useNativeDriver).toBe(true); // scale
    expect(mockTiming.mock.calls[1][1].useNativeDriver).toBe(true); // rotation
    expect(mockTiming.mock.calls[2][1].useNativeDriver).toBe(false); // height (layout property)
    expect(mockTiming.mock.calls[3][1].useNativeDriver).toBe(true); // opacity
  });
});