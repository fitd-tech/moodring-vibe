import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { ExpansionProvider, useExpansion, SectionType, CardType } from '../ExpansionContext';

// Test component that uses the ExpansionContext
const TestComponent: React.FC<{
  sectionType: SectionType;
  cardType: CardType;
  index: number;
  testId: string;
}> = ({ sectionType, cardType, index, testId }) => {
  const { isExpanded, toggleExpansion, collapseAll } = useExpansion();
  const expanded = isExpanded(sectionType, cardType, index);

  return (
    <>
      <TouchableOpacity
        testID={`toggle-${testId}`}
        onPress={() => toggleExpansion(sectionType, cardType, index)}
      >
        <Text>Toggle {testId}</Text>
      </TouchableOpacity>
      <TouchableOpacity testID={`collapse-all`} onPress={collapseAll}>
        <Text>Collapse All</Text>
      </TouchableOpacity>
      <Text testID={`status-${testId}`}>{expanded ? 'Expanded' : 'Collapsed'}</Text>
    </>
  );
};

// Test component that uses the context without provider (should throw error)
const TestComponentWithoutProvider: React.FC = () => {
  useExpansion();
  return <Text>Should not render</Text>;
};

describe('ExpansionContext', () => {
  describe('ExpansionProvider', () => {
    it('provides expansion context to child components', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test-1" />
        </ExpansionProvider>
      );

      expect(getByTestId('status-test-1')).toBeTruthy();
      expect(getByTestId('toggle-test-1')).toBeTruthy();
      expect(getByTestId('collapse-all')).toBeTruthy();
    });

    it('throws error when useExpansion is used without provider', () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useExpansion must be used within an ExpansionProvider');

      console.error = originalError;
    });
  });

  describe('expansion state management', () => {
    it('initially has no expanded cards', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test-1" />
        </ExpansionProvider>
      );

      expect(getByTestId('status-test-1').children[0]).toBe('Collapsed');
    });

    it('expands a card when toggled', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test-1" />
        </ExpansionProvider>
      );

      // Initially collapsed
      expect(getByTestId('status-test-1').children[0]).toBe('Collapsed');

      // Toggle to expand
      fireEvent.press(getByTestId('toggle-test-1'));
      expect(getByTestId('status-test-1').children[0]).toBe('Expanded');
    });

    it('collapses an expanded card when toggled again', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test-1" />
        </ExpansionProvider>
      );

      // Toggle to expand
      fireEvent.press(getByTestId('toggle-test-1'));
      expect(getByTestId('status-test-1').children[0]).toBe('Expanded');

      // Toggle again to collapse
      fireEvent.press(getByTestId('toggle-test-1'));
      expect(getByTestId('status-test-1').children[0]).toBe('Collapsed');
    });

    it('allows only one card to be expanded at a time', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test-1" />
          <TestComponent sectionType="top-tracks" cardType="track" index={0} testId="test-2" />
        </ExpansionProvider>
      );

      // Expand first card
      fireEvent.press(getByTestId('toggle-test-1'));
      expect(getByTestId('status-test-1').children[0]).toBe('Expanded');
      expect(getByTestId('status-test-2').children[0]).toBe('Collapsed');

      // Expand second card - should collapse first
      fireEvent.press(getByTestId('toggle-test-2'));
      expect(getByTestId('status-test-1').children[0]).toBe('Collapsed');
      expect(getByTestId('status-test-2').children[0]).toBe('Expanded');
    });

    it('collapses all cards when collapseAll is called', () => {
      const { getAllByTestId, getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test-1" />
          <TestComponent sectionType="top-tracks" cardType="track" index={0} testId="test-2" />
        </ExpansionProvider>
      );

      // Expand a card
      fireEvent.press(getByTestId('toggle-test-1'));
      expect(getByTestId('status-test-1').children[0]).toBe('Expanded');

      // Collapse all - use the first collapse-all button since there are multiple
      const collapseButtons = getAllByTestId('collapse-all');
      fireEvent.press(collapseButtons[0]);
      expect(getByTestId('status-test-1').children[0]).toBe('Collapsed');
      expect(getByTestId('status-test-2').children[0]).toBe('Collapsed');
    });

    it('distinguishes between different section types', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="recent" />
          <TestComponent
            sectionType="saved-playlists"
            cardType="playlist"
            index={0}
            testId="playlist"
          />
        </ExpansionProvider>
      );

      // Expand track card
      fireEvent.press(getByTestId('toggle-recent'));
      expect(getByTestId('status-recent').children[0]).toBe('Expanded');
      expect(getByTestId('status-playlist').children[0]).toBe('Collapsed');

      // Expand playlist card - should collapse track card
      fireEvent.press(getByTestId('toggle-playlist'));
      expect(getByTestId('status-recent').children[0]).toBe('Collapsed');
      expect(getByTestId('status-playlist').children[0]).toBe('Expanded');
    });

    it('distinguishes between different indices within same section', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="track-0" />
          <TestComponent sectionType="recent-tracks" cardType="track" index={1} testId="track-1" />
        </ExpansionProvider>
      );

      // Expand first track
      fireEvent.press(getByTestId('toggle-track-0'));
      expect(getByTestId('status-track-0').children[0]).toBe('Expanded');
      expect(getByTestId('status-track-1').children[0]).toBe('Collapsed');

      // Expand second track - should collapse first
      fireEvent.press(getByTestId('toggle-track-1'));
      expect(getByTestId('status-track-0').children[0]).toBe('Collapsed');
      expect(getByTestId('status-track-1').children[0]).toBe('Expanded');
    });
  });

  describe('isExpanded method', () => {
    it('correctly identifies expanded state for matching section, type, and index', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="saved-albums" cardType="album" index={2} testId="album" />
        </ExpansionProvider>
      );

      // Initially collapsed
      expect(getByTestId('status-album').children[0]).toBe('Collapsed');

      // Expand the card
      fireEvent.press(getByTestId('toggle-album'));
      expect(getByTestId('status-album').children[0]).toBe('Expanded');
    });

    it('returns false for non-matching section type', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="recent" />
          <TestComponent sectionType="top-tracks" cardType="track" index={0} testId="top" />
        </ExpansionProvider>
      );

      // Expand recent tracks card
      fireEvent.press(getByTestId('toggle-recent'));
      expect(getByTestId('status-recent').children[0]).toBe('Expanded');
      expect(getByTestId('status-top').children[0]).toBe('Collapsed');
    });

    it('returns false for non-matching card type', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="saved-tracks" cardType="track" index={0} testId="track" />
          <TestComponent
            sectionType="saved-playlists"
            cardType="playlist"
            index={0}
            testId="playlist"
          />
        </ExpansionProvider>
      );

      // Expand track card
      fireEvent.press(getByTestId('toggle-track'));
      expect(getByTestId('status-track').children[0]).toBe('Expanded');
      expect(getByTestId('status-playlist').children[0]).toBe('Collapsed');
    });

    it('returns false for non-matching index', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="track-0" />
          <TestComponent sectionType="recent-tracks" cardType="track" index={1} testId="track-1" />
        </ExpansionProvider>
      );

      // Expand index 0
      fireEvent.press(getByTestId('toggle-track-0'));
      expect(getByTestId('status-track-0').children[0]).toBe('Expanded');
      expect(getByTestId('status-track-1').children[0]).toBe('Collapsed');
    });
  });

  describe('edge cases', () => {
    it('handles rapid successive toggles correctly', () => {
      const { getByTestId } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test" />
        </ExpansionProvider>
      );

      // Rapid toggles
      fireEvent.press(getByTestId('toggle-test'));
      fireEvent.press(getByTestId('toggle-test'));
      fireEvent.press(getByTestId('toggle-test'));

      // Should end up expanded (odd number of presses)
      expect(getByTestId('status-test').children[0]).toBe('Expanded');
    });

    it('maintains state when provider is re-rendered with same children', () => {
      const { getByTestId, rerender } = render(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test" />
        </ExpansionProvider>
      );

      // Expand card
      fireEvent.press(getByTestId('toggle-test'));
      expect(getByTestId('status-test').children[0]).toBe('Expanded');

      // Re-render provider with same children
      rerender(
        <ExpansionProvider>
          <TestComponent sectionType="recent-tracks" cardType="track" index={0} testId="test" />
        </ExpansionProvider>
      );

      // State should persist across re-renders
      expect(getByTestId('status-test').children[0]).toBe('Expanded');
    });
  });
});
