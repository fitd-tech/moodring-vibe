import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { TagSuggestions } from '../TagSuggestions';
import { Tag } from '../../../../types';

// Mock theme
jest.mock('../../../../styles/theme', () => ({
  theme: {
    colors: {
      ui: { overlay: 'rgba(255, 255, 255, 0.1)' },
      text: { secondary: 'rgba(255, 255, 255, 0.8)' },
      accent: { purple: '#8a2be2' },
    },
    spacing: { xs: 4, sm: 8, lg: 16 },
    borderRadius: { lg: 12 },
    typography: {
      fontSize: { sm: 14 },
      fontWeight: { medium: '500' },
    },
  },
}));

const mockUnusedTags: Tag[] = [
  {
    id: 1,
    user_id: 1,
    name: 'rock',
    color: '#ff0000',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'jazz',
    color: '#00ff00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    name: 'classical',
    color: '#0000ff',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    user_id: 1,
    name: 'electronic',
    color: '#ffff00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 5,
    user_id: 1,
    name: 'folk',
    color: '#ff00ff',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('TagSuggestions', () => {
  const mockOnToggleShow = jest.fn();
  const mockOnAddTag = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders toggle button when there are unused tags', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Show Available Tags (5)')).toBeTruthy();
    });

    it('does not render when there are no unused tags', () => {
      const { toJSON } = render(
        <TagSuggestions
          unusedTags={[]}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      // Component should return null and render nothing
      expect(toJSON()).toBeNull();
    });

    it('shows tag suggestions when showAvailableTags is true', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Hide Available Tags (5)')).toBeTruthy();
      expect(screen.getByText('rock')).toBeTruthy();
      expect(screen.getByText('jazz')).toBeTruthy();
      expect(screen.getByText('classical')).toBeTruthy();
      expect(screen.getByText('electronic')).toBeTruthy();
      expect(screen.getByText('folk')).toBeTruthy();
    });

    it('hides tag suggestions when showAvailableTags is false', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Show Available Tags (5)')).toBeTruthy();
      expect(screen.queryByText('rock')).toBeNull();
      expect(screen.queryByText('jazz')).toBeNull();
    });

    it('displays correct count in toggle button', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags.slice(0, 3)}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Show Available Tags (3)')).toBeTruthy();
    });
  });

  describe('Toggle Functionality', () => {
    it('calls onToggleShow when toggle button is pressed', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      const toggleButton = screen.getByText('Show Available Tags (5)');
      fireEvent.press(toggleButton);

      expect(mockOnToggleShow).toHaveBeenCalledTimes(1);
    });

    it('updates toggle button text based on showAvailableTags state', () => {
      const { rerender } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Show Available Tags (5)')).toBeTruthy();

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Hide Available Tags (5)')).toBeTruthy();
      expect(screen.queryByText('Show Available Tags (5)')).toBeNull();
    });

    it('allows multiple toggle button presses', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      const toggleButton = screen.getByText('Show Available Tags (5)');

      fireEvent.press(toggleButton);
      fireEvent.press(toggleButton);
      fireEvent.press(toggleButton);

      expect(mockOnToggleShow).toHaveBeenCalledTimes(3);
    });
  });

  describe('Tag Selection', () => {
    it('calls onAddTag when a suggestion tag is pressed', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      const rockTag = screen.getByText('rock');
      fireEvent.press(rockTag);

      expect(mockOnAddTag).toHaveBeenCalledWith(mockUnusedTags[0]);
      expect(mockOnAddTag).toHaveBeenCalledTimes(1);
    });

    it('calls onAddTag with correct tag for different selections', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      fireEvent.press(screen.getByText('jazz'));
      expect(mockOnAddTag).toHaveBeenCalledWith(mockUnusedTags[1]);

      fireEvent.press(screen.getByText('classical'));
      expect(mockOnAddTag).toHaveBeenCalledWith(mockUnusedTags[2]);

      expect(mockOnAddTag).toHaveBeenCalledTimes(2);
    });

    it('allows selecting multiple tags in sequence', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      fireEvent.press(screen.getByText('rock'));
      fireEvent.press(screen.getByText('jazz'));
      fireEvent.press(screen.getByText('electronic'));

      expect(mockOnAddTag).toHaveBeenCalledTimes(3);
      expect(mockOnAddTag).toHaveBeenNthCalledWith(1, mockUnusedTags[0]);
      expect(mockOnAddTag).toHaveBeenNthCalledWith(2, mockUnusedTags[1]);
      expect(mockOnAddTag).toHaveBeenNthCalledWith(3, mockUnusedTags[3]);
    });

    it('can select the same tag multiple times', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      const rockTag = screen.getByText('rock');

      fireEvent.press(rockTag);
      fireEvent.press(rockTag);

      expect(mockOnAddTag).toHaveBeenCalledTimes(2);
      expect(mockOnAddTag).toHaveBeenCalledWith(mockUnusedTags[0]);
    });
  });

  describe('Loading State', () => {
    it('disables tag suggestion buttons when loading', () => {
      const { UNSAFE_getAllByType } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={true}
        />
      );

      const touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      // First TouchableOpacity is the toggle button, rest are tag buttons
      const tagButtons = touchableOpacities.slice(1);

      expect(tagButtons[0].props.disabled).toBe(true);
      expect(tagButtons[1].props.disabled).toBe(true);
    });

    it('allows toggle button interaction when loading', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={true}
        />
      );

      const toggleButton = screen.getByText('Show Available Tags (5)');
      fireEvent.press(toggleButton);

      expect(mockOnToggleShow).toHaveBeenCalledTimes(1);
    });

    it('handles loading state changes correctly', () => {
      const { rerender, UNSAFE_getAllByType } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={true}
        />
      );

      let touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      let tagButtons = touchableOpacities.slice(1);
      expect(tagButtons[0].props.disabled).toBe(true);

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      tagButtons = touchableOpacities.slice(1);
      expect(tagButtons[0].props.disabled).toBe(false);

      fireEvent.press(screen.getByText('rock'));
      expect(mockOnAddTag).toHaveBeenCalledWith(mockUnusedTags[0]);
    });
  });

  describe('Dynamic Tag Updates', () => {
    it('updates displayed tags when unusedTags prop changes', () => {
      const { rerender } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags.slice(0, 2)}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('rock')).toBeTruthy();
      expect(screen.getByText('jazz')).toBeTruthy();
      expect(screen.queryByText('classical')).toBeNull();

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('rock')).toBeTruthy();
      expect(screen.getByText('jazz')).toBeTruthy();
      expect(screen.getByText('classical')).toBeTruthy();
      expect(screen.getByText('electronic')).toBeTruthy();
      expect(screen.getByText('folk')).toBeTruthy();
    });

    it('updates count in toggle button when unusedTags changes', () => {
      const { rerender } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags.slice(0, 2)}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Show Available Tags (2)')).toBeTruthy();

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Show Available Tags (5)')).toBeTruthy();
      expect(screen.queryByText('Show Available Tags (2)')).toBeNull();
    });

    it('hides component when unusedTags becomes empty', () => {
      const { rerender, toJSON } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags.slice(0, 1)}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('rock')).toBeTruthy();

      rerender(
        <TagSuggestions
          unusedTags={[]}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(toJSON()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles tags with special characters in names', () => {
      const specialTags: Tag[] = [
        {
          id: 1,
          user_id: 1,
          name: 'rock & roll',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          name: "90's music",
          color: '#00ff00',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 3,
          user_id: 1,
          name: 'música latina',
          color: '#0000ff',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      render(
        <TagSuggestions
          unusedTags={specialTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('rock & roll')).toBeTruthy();
      expect(screen.getByText("90's music")).toBeTruthy();
      expect(screen.getByText('música latina')).toBeTruthy();

      fireEvent.press(screen.getByText('rock & roll'));
      expect(mockOnAddTag).toHaveBeenCalledWith(specialTags[0]);
    });

    it('handles tags with very long names', () => {
      const longNameTags: Tag[] = [
        {
          id: 1,
          user_id: 1,
          name: 'this is an extremely long tag name that might cause display issues',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      render(
        <TagSuggestions
          unusedTags={longNameTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(
        screen.getByText('this is an extremely long tag name that might cause display issues')
      ).toBeTruthy();

      fireEvent.press(
        screen.getByText('this is an extremely long tag name that might cause display issues')
      );
      expect(mockOnAddTag).toHaveBeenCalledWith(longNameTags[0]);
    });

    it('handles single tag correctly', () => {
      render(
        <TagSuggestions
          unusedTags={[mockUnusedTags[0]]}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Hide Available Tags (1)')).toBeTruthy();
      expect(screen.getByText('rock')).toBeTruthy();

      fireEvent.press(screen.getByText('rock'));
      expect(mockOnAddTag).toHaveBeenCalledWith(mockUnusedTags[0]);
    });

    it('handles large number of tags', () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        user_id: 1,
        name: `tag${i + 1}`,
        color: '#ff0000',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      render(
        <TagSuggestions
          unusedTags={manyTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('Hide Available Tags (20)')).toBeTruthy();
      expect(screen.getByText('tag1')).toBeTruthy();
      expect(screen.getByText('tag20')).toBeTruthy();
    });
  });

  describe('Component State Management', () => {
    it('maintains consistency between showAvailableTags and displayed content', () => {
      const { rerender } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.queryByText('rock')).toBeNull();

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('rock')).toBeTruthy();

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      expect(screen.queryByText('rock')).toBeNull();
    });

    it('handles callback function changes', () => {
      const firstOnToggleShow = jest.fn();
      const secondOnToggleShow = jest.fn();
      const firstOnAddTag = jest.fn();
      const secondOnAddTag = jest.fn();

      const { rerender } = render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={firstOnToggleShow}
          onAddTag={firstOnAddTag}
          isLoading={false}
        />
      );

      fireEvent.press(screen.getByText('Show Available Tags (5)'));
      expect(firstOnToggleShow).toHaveBeenCalledTimes(1);

      rerender(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={secondOnToggleShow}
          onAddTag={secondOnAddTag}
          isLoading={false}
        />
      );

      fireEvent.press(screen.getByText('rock'));
      expect(secondOnAddTag).toHaveBeenCalledWith(mockUnusedTags[0]);
      expect(firstOnAddTag).not.toHaveBeenCalled();

      fireEvent.press(screen.getByText('Hide Available Tags (5)'));
      expect(secondOnToggleShow).toHaveBeenCalledTimes(1);
      expect(firstOnToggleShow).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility structure', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={true}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      // Toggle button should be accessible
      expect(screen.getByText('Hide Available Tags (5)')).toBeTruthy();

      // All tag buttons should be accessible
      expect(screen.getByText('rock')).toBeTruthy();
      expect(screen.getByText('jazz')).toBeTruthy();
      expect(screen.getByText('classical')).toBeTruthy();
    });

    it('maintains proper interaction flow', () => {
      render(
        <TagSuggestions
          unusedTags={mockUnusedTags}
          showAvailableTags={false}
          onToggleShow={mockOnToggleShow}
          onAddTag={mockOnAddTag}
          isLoading={false}
        />
      );

      // Should be able to navigate and interact with toggle
      const toggleButton = screen.getByText('Show Available Tags (5)');
      fireEvent.press(toggleButton);
      expect(mockOnToggleShow).toHaveBeenCalled();
    });
  });
});
