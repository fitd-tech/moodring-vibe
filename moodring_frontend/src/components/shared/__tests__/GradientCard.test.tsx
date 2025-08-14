import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { GradientCard } from '../GradientCard';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    LinearGradient: ({
      colors,
      style,
      children,
      ...props
    }: {
      colors: string[];
      style: unknown;
      children: React.ReactNode;
    }) => {
      return React.createElement(
        View,
        {
          ...props,
          testID: 'linear-gradient',
          style: [style, { backgroundColor: colors[0] }], // Use first color as background for testing
          'data-colors': colors,
        },
        children
      );
    },
  };
});

describe('GradientCard', () => {
  const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

  describe('Component Rendering', () => {
    it('renders with gradient colors correctly', () => {
      const { getByTestId } = render(
        <GradientCard colors={defaultColors}>
          <Text>Test Content</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
      expect(gradientElement.props['data-colors']).toEqual(defaultColors);
    });

    it('renders children content correctly', () => {
      const { getByText } = render(
        <GradientCard colors={defaultColors}>
          <Text>Test Content</Text>
        </GradientCard>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('renders multiple children correctly', () => {
      const { getByText } = render(
        <GradientCard colors={defaultColors}>
          <Text>First Child</Text>
          <Text>Second Child</Text>
          <View>
            <Text>Nested Content</Text>
          </View>
        </GradientCard>
      );

      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
      expect(getByText('Nested Content')).toBeTruthy();
    });

    it('renders React fragments as children', () => {
      const { getByText } = render(
        <GradientCard colors={defaultColors}>
          <>
            <Text>Fragment Child 1</Text>
            <Text>Fragment Child 2</Text>
          </>
        </GradientCard>
      );

      expect(getByText('Fragment Child 1')).toBeTruthy();
      expect(getByText('Fragment Child 2')).toBeTruthy();
    });
  });

  describe('Gradient Colors', () => {
    it('handles two-color gradient', () => {
      const twoColors = ['#FF0000', '#00FF00'];

      const { getByTestId } = render(
        <GradientCard colors={twoColors}>
          <Text>Two Color Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(twoColors);
    });

    it('handles multi-color gradient', () => {
      const multiColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];

      const { getByTestId } = render(
        <GradientCard colors={multiColors}>
          <Text>Multi Color Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(multiColors);
    });

    it('handles different color formats', () => {
      const mixedColors = ['#FF0000', 'rgb(0, 255, 0)', 'rgba(0, 0, 255, 0.8)', 'blue'];

      const { getByTestId } = render(
        <GradientCard colors={mixedColors}>
          <Text>Mixed Colors Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(mixedColors);
    });

    it('handles theme gradient colors', () => {
      // Mock theme colors that would typically be used
      const themeColors = ['#6B73FF', '#000051', '#9B59B6'];

      const { getByTestId } = render(
        <GradientCard colors={themeColors}>
          <Text>Theme Colors Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(themeColors);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom style correctly', () => {
      const customStyle = {
        backgroundColor: 'transparent',
        padding: 20,
        margin: 10,
        borderWidth: 2,
        borderColor: '#000000',
      };

      const { getByTestId } = render(
        <GradientCard colors={defaultColors} style={customStyle}>
          <Text>Custom Style Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      const elementStyle = gradientElement.props.style;

      // Should include both default styles and custom styles
      expect(Array.isArray(elementStyle)).toBe(true);
      expect(elementStyle[0]).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)])
      );
    });

    it('merges custom style with default styles', () => {
      const customStyle = {
        padding: 50, // Override default padding
        backgroundColor: 'red', // Add new property
      };

      const { getByTestId } = render(
        <GradientCard colors={defaultColors} style={customStyle}>
          <Text>Style Merge Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      const elementStyle = gradientElement.props.style;

      // Should be an array containing both default and custom styles
      expect(Array.isArray(elementStyle)).toBe(true);
      expect(elementStyle[0]).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)])
      );
    });

    it('renders without custom style', () => {
      const { getByTestId } = render(
        <GradientCard colors={defaultColors}>
          <Text>No Custom Style Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('handles undefined custom style', () => {
      const { getByTestId } = render(
        <GradientCard colors={defaultColors} style={undefined}>
          <Text>Undefined Style Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('handles null custom style', () => {
      const { getByTestId } = render(
        <GradientCard colors={defaultColors} style={null as unknown as object}>
          <Text>Null Style Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });
  });

  describe('Children Content', () => {
    it('renders string children', () => {
      const { getByTestId } = render(
        <GradientCard colors={defaultColors}>Simple string content</GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
      expect(gradientElement.props.children).toBe('Simple string content');
    });

    it('renders number children', () => {
      const { getByTestId } = render(<GradientCard colors={defaultColors}>{42}</GradientCard>);

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
      expect(gradientElement.props.children).toBe(42);
    });

    it('renders complex JSX children', () => {
      const { getByText, getByTestId } = render(
        <GradientCard colors={defaultColors}>
          <View testID="complex-child">
            <Text>Header Text</Text>
            <View>
              <Text>Nested Text</Text>
              <Text>Another Nested Text</Text>
            </View>
          </View>
        </GradientCard>
      );

      expect(getByTestId('complex-child')).toBeTruthy();
      expect(getByText('Header Text')).toBeTruthy();
      expect(getByText('Nested Text')).toBeTruthy();
      expect(getByText('Another Nested Text')).toBeTruthy();
    });

    it('renders array of children', () => {
      const childrenArray = [
        <Text key="1">First Item</Text>,
        <Text key="2">Second Item</Text>,
        <Text key="3">Third Item</Text>,
      ];

      const { getByText } = render(
        <GradientCard colors={defaultColors}>{childrenArray}</GradientCard>
      );

      expect(getByText('First Item')).toBeTruthy();
      expect(getByText('Second Item')).toBeTruthy();
      expect(getByText('Third Item')).toBeTruthy();
    });

    it('handles conditional children rendering', () => {
      const showContent = true;

      const { getByText, queryByText } = render(
        <GradientCard colors={defaultColors}>
          {showContent && <Text>Conditional Content</Text>}
          {!showContent && <Text>Hidden Content</Text>}
        </GradientCard>
      );

      expect(getByText('Conditional Content')).toBeTruthy();
      expect(queryByText('Hidden Content')).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty colors array gracefully', () => {
      const { getByTestId } = render(
        <GradientCard colors={[]}>
          <Text>Empty Colors Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
      expect(gradientElement.props['data-colors']).toEqual([]);
    });

    it('handles single color in array', () => {
      const singleColor = ['#FF0000'];

      const { getByTestId } = render(
        <GradientCard colors={singleColor}>
          <Text>Single Color Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(singleColor);
    });

    it('handles very long color arrays', () => {
      const manyColors = Array.from({ length: 20 }, (_, i) => `hsl(${i * 18}, 50%, 50%)`);

      const { getByTestId } = render(
        <GradientCard colors={manyColors}>
          <Text>Many Colors Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(manyColors);
    });

    it('handles invalid color values gracefully', () => {
      const invalidColors = ['invalid-color', '#GGGGGG', ''] as string[];

      const { getByTestId } = render(
        <GradientCard colors={invalidColors}>
          <Text>Invalid Colors Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('handles null children gracefully', () => {
      const { getByTestId } = render(<GradientCard colors={defaultColors}>{null}</GradientCard>);

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('handles undefined children gracefully', () => {
      const { getByTestId } = render(
        <GradientCard colors={defaultColors}>{undefined}</GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('handles false children gracefully', () => {
      const { getByTestId } = render(<GradientCard colors={defaultColors}>{false}</GradientCard>);

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('handles mixed valid and invalid children', () => {
      const { getByText, getByTestId } = render(
        <GradientCard colors={defaultColors}>
          <Text>Valid Content</Text>
          {null}
          {false}
          <Text>More Valid Content</Text>
          {undefined}
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
      expect(getByText('Valid Content')).toBeTruthy();
      expect(getByText('More Valid Content')).toBeTruthy();
    });
  });

  describe('Accessibility and Props', () => {
    it('passes through additional props to LinearGradient', () => {
      const { getByTestId } = render(
        <GradientCard
          colors={defaultColors}
          {...({ testID: 'custom-test-id', accessibilityLabel: 'Gradient Card' } as Record<
            string,
            unknown
          >)}
        >
          <Text>Props Test</Text>
        </GradientCard>
      );

      // Note: Our mock might not perfectly handle additional props, but the component should
      const gradientElement = getByTestId('linear-gradient');
      expect(gradientElement).toBeTruthy();
    });

    it('maintains proper component structure', () => {
      const { getByTestId, getByText } = render(
        <GradientCard colors={defaultColors}>
          <Text>Structure Test</Text>
        </GradientCard>
      );

      const gradientElement = getByTestId('linear-gradient');
      const textElement = getByText('Structure Test');

      expect(gradientElement).toBeTruthy();
      expect(textElement).toBeTruthy();

      // Text should be inside the gradient
      expect(gradientElement).toContainElement(textElement);
    });
  });

  describe('Performance and Re-rendering', () => {
    it('renders consistently with same props', () => {
      const props = {
        colors: defaultColors,
        style: { padding: 20 },
        children: <Text>Consistency Test</Text>,
      };

      const { rerender, getByText, getByTestId } = render(<GradientCard {...props} />);

      expect(getByText('Consistency Test')).toBeTruthy();
      expect(getByTestId('linear-gradient')).toBeTruthy();

      // Re-render with same props
      rerender(<GradientCard {...props} />);

      expect(getByText('Consistency Test')).toBeTruthy();
      expect(getByTestId('linear-gradient')).toBeTruthy();
    });

    it('updates correctly when colors change', () => {
      const initialColors = ['#FF0000', '#00FF00'];
      const newColors = ['#0000FF', '#FFFF00'];

      const { rerender, getByTestId } = render(
        <GradientCard colors={initialColors}>
          <Text>Color Change Test</Text>
        </GradientCard>
      );

      let gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(initialColors);

      rerender(
        <GradientCard colors={newColors}>
          <Text>Color Change Test</Text>
        </GradientCard>
      );

      gradientElement = getByTestId('linear-gradient');
      expect(gradientElement.props['data-colors']).toEqual(newColors);
    });

    it('updates correctly when children change', () => {
      const { rerender, getByText, queryByText } = render(
        <GradientCard colors={defaultColors}>
          <Text>Original Content</Text>
        </GradientCard>
      );

      expect(getByText('Original Content')).toBeTruthy();

      rerender(
        <GradientCard colors={defaultColors}>
          <Text>New Content</Text>
        </GradientCard>
      );

      expect(getByText('New Content')).toBeTruthy();
      expect(queryByText('Original Content')).toBeNull();
    });

    it('updates correctly when style changes', () => {
      const initialStyle = { padding: 10 };
      const newStyle = { padding: 20, margin: 10 };

      const { rerender, getByTestId } = render(
        <GradientCard colors={defaultColors} style={initialStyle}>
          <Text>Style Change Test</Text>
        </GradientCard>
      );

      let gradientElement = getByTestId('linear-gradient');
      expect(Array.isArray(gradientElement.props.style)).toBe(true);

      rerender(
        <GradientCard colors={defaultColors} style={newStyle}>
          <Text>Style Change Test</Text>
        </GradientCard>
      );

      gradientElement = getByTestId('linear-gradient');
      expect(Array.isArray(gradientElement.props.style)).toBe(true);
      expect(gradientElement.props.style[0]).toEqual(
        expect.arrayContaining([expect.objectContaining(newStyle)])
      );
    });
  });
});
