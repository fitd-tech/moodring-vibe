import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { CurrentTags } from '../CurrentTags';
import { Tag } from '../../../../types';

// Mock theme
jest.mock('../../../../styles/theme', () => ({
  theme: {
    colors: {
      ui: {
        tag: '#ff6b9d',
        tagRemove: 'rgba(255, 255, 255, 0.2)',
      },
      text: {
        primary: '#ffffff',
      },
    },
    spacing: { sm: 8, lg: 16, xl: 20 },
    borderRadius: { lg: 12 },
    typography: {
      fontSize: { sm: 14 },
      fontWeight: { medium: '500', bold: '700' },
    },
  },
}));

const mockTags: Tag[] = [
  {
    id: 1,
    user_id: 1,
    name: 'pop',
    color: '#ff0000',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'favorite',
    color: '#00ff00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    name: 'rock',
    color: '#0000ff',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('CurrentTags', () => {
  const mockOnRemoveTag = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders tags correctly', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('favorite')).toBeTruthy();
      expect(screen.getByText('rock')).toBeTruthy();
    });

    it('renders with empty tags array', () => {
      render(
        <CurrentTags
          tags={[]}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.queryByText('×')).toBeNull();
    });

    it('renders remove buttons for each tag', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      const removeButtons = screen.getAllByText('×');
      expect(removeButtons).toHaveLength(3);
    });

    it('renders single tag correctly', () => {
      render(
        <CurrentTags
          tags={[mockTags[0]]}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('×')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onRemoveTag when remove button is pressed', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      const removeButtons = screen.getAllByText('×');
      fireEvent.press(removeButtons[0]);

      expect(mockOnRemoveTag).toHaveBeenCalledWith(1);
      expect(mockOnRemoveTag).toHaveBeenCalledTimes(1);
    });

    it('calls onRemoveTag with correct tag id for different tags', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      const removeButtons = screen.getAllByText('×');
      
      fireEvent.press(removeButtons[1]); // Second tag
      expect(mockOnRemoveTag).toHaveBeenCalledWith(2);

      fireEvent.press(removeButtons[2]); // Third tag
      expect(mockOnRemoveTag).toHaveBeenCalledWith(3);

      expect(mockOnRemoveTag).toHaveBeenCalledTimes(2);
    });

    it('allows multiple remove button presses', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      const removeButtons = screen.getAllByText('×');
      
      fireEvent.press(removeButtons[0]);
      fireEvent.press(removeButtons[0]);
      fireEvent.press(removeButtons[1]);

      expect(mockOnRemoveTag).toHaveBeenCalledTimes(3);
      expect(mockOnRemoveTag).toHaveBeenNthCalledWith(1, 1);
      expect(mockOnRemoveTag).toHaveBeenNthCalledWith(2, 1);
      expect(mockOnRemoveTag).toHaveBeenNthCalledWith(3, 2);
    });
  });

  describe('Loading State', () => {
    it('disables remove buttons when loading', () => {
      const { UNSAFE_getAllByType } = render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={true}
        />
      );

      const removeButtons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      
      // Check that buttons are disabled
      expect(removeButtons[0].props.disabled).toBe(true);
      expect(removeButtons[1].props.disabled).toBe(true);
    });

    it('enables remove buttons when not loading', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      const removeButtons = screen.getAllByText('×');
      fireEvent.press(removeButtons[0]);

      expect(mockOnRemoveTag).toHaveBeenCalledWith(1);
    });

    it('handles loading state change correctly', () => {
      const { rerender, UNSAFE_getAllByType } = render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={true}
        />
      );

      let removeButtons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      expect(removeButtons[0].props.disabled).toBe(true);

      // Change to not loading
      rerender(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      removeButtons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      expect(removeButtons[0].props.disabled).toBe(false);

      fireEvent.press(screen.getAllByText('×')[0]);
      expect(mockOnRemoveTag).toHaveBeenCalledWith(1);
    });
  });

  describe('Tags Prop Changes', () => {
    it('updates when tags prop changes', () => {
      const { rerender } = render(
        <CurrentTags
          tags={[mockTags[0]]}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.queryByText('favorite')).toBeNull();

      rerender(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('favorite')).toBeTruthy();
      expect(screen.getByText('rock')).toBeTruthy();
    });

    it('removes tags from display when tags prop changes', () => {
      const { rerender } = render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('favorite')).toBeTruthy();

      rerender(
        <CurrentTags
          tags={[mockTags[0]]}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.queryByText('favorite')).toBeNull();
      expect(screen.queryByText('rock')).toBeNull();
    });

    it('updates remove button count when tags change', () => {
      const { rerender } = render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getAllByText('×')).toHaveLength(3);

      rerender(
        <CurrentTags
          tags={[mockTags[0]]}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getAllByText('×')).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles tags with special characters in names', () => {
      const specialTags: Tag[] = [
        {
          id: 1,
          user_id: 1,
          name: 'pop & rock',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          name: '90\'s music',
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
        <CurrentTags
          tags={specialTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('pop & rock')).toBeTruthy();
      expect(screen.getByText('90\'s music')).toBeTruthy();
      expect(screen.getByText('música latina')).toBeTruthy();
    });

    it('handles tags with very long names', () => {
      const longNameTag: Tag[] = [
        {
          id: 1,
          user_id: 1,
          name: 'this is a very long tag name that might cause layout issues',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      render(
        <CurrentTags
          tags={longNameTag}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('this is a very long tag name that might cause layout issues')).toBeTruthy();
      expect(screen.getByText('×')).toBeTruthy();
    });

    it('handles tags with empty string names', () => {
      const emptyNameTag: Tag[] = [
        {
          id: 1,
          user_id: 1,
          name: '',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      render(
        <CurrentTags
          tags={emptyNameTag}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      expect(screen.getByText('×')).toBeTruthy();
    });

    it('handles duplicate tag ids correctly', () => {
      const duplicateIdTags: Tag[] = [
        {
          id: 1,
          user_id: 1,
          name: 'tag1',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 1, // Same ID
          user_id: 1,
          name: 'tag2',
          color: '#00ff00',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      render(
        <CurrentTags
          tags={duplicateIdTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      // React should handle duplicate keys, component should still render
      expect(screen.getByText('tag1')).toBeTruthy();
      expect(screen.getByText('tag2')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('renders with proper structure for screen readers', () => {
      render(
        <CurrentTags
          tags={mockTags}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      // Each tag should have its name text and remove button
      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('favorite')).toBeTruthy();
      expect(screen.getByText('rock')).toBeTruthy();
      
      const removeButtons = screen.getAllByText('×');
      expect(removeButtons).toHaveLength(3);
    });
  });

  describe('Component Props Validation', () => {
    it('renders with minimal required props', () => {
      render(
        <CurrentTags
          tags={[]}
          onRemoveTag={mockOnRemoveTag}
          isLoading={false}
        />
      );

      // Should render without errors
      expect(screen.queryByText('×')).toBeNull();
    });

    it('handles onRemoveTag function changes', () => {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();

      const { rerender } = render(
        <CurrentTags
          tags={[mockTags[0]]}
          onRemoveTag={firstHandler}
          isLoading={false}
        />
      );

      fireEvent.press(screen.getByText('×'));
      expect(firstHandler).toHaveBeenCalledWith(1);
      expect(secondHandler).not.toHaveBeenCalled();

      rerender(
        <CurrentTags
          tags={[mockTags[0]]}
          onRemoveTag={secondHandler}
          isLoading={false}
        />
      );

      fireEvent.press(screen.getByText('×'));
      expect(secondHandler).toHaveBeenCalledWith(1);
      expect(firstHandler).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});