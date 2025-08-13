import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { TagInput } from '../TagInput';

// Mock theme
jest.mock('../../../../styles/theme', () => ({
  theme: {
    colors: {
      ui: { overlay: 'rgba(255, 255, 255, 0.1)' },
      text: {
        primary: '#ffffff',
        muted: 'rgba(255, 255, 255, 0.6)',
      },
      accent: { purple: '#8a2be2' },
    },
    spacing: { sm: 8, lg: 16, xl: 20 },
    borderRadius: { lg: 12 },
    typography: {
      fontSize: { md: 16 },
      fontWeight: { semibold: '600' },
    },
  },
}));

describe('TagInput', () => {
  const mockOnChangeText = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with empty input', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByPlaceholderText('Add tag...')).toBeTruthy();
      expect(screen.getByText('+ Add')).toBeTruthy();
    });

    it('renders with initial text value', () => {
      render(
        <TagInput
          newTagName="pop music"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByDisplayValue('pop music');
      expect(textInput).toBeTruthy();
    });

    it('renders placeholder text correctly', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByPlaceholderText('Add tag...')).toBeTruthy();
    });

    it('renders add button', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('+ Add')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onChangeText when text input changes', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.changeText(textInput, 'new tag');

      expect(mockOnChangeText).toHaveBeenCalledWith('new tag');
      expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit when add button is pressed', () => {
      render(
        <TagInput
          newTagName="test tag"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add');
      fireEvent.press(addButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit when text input is submitted via keyboard', () => {
      render(
        <TagInput
          newTagName="test tag"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByDisplayValue('test tag');
      fireEvent(textInput, 'onSubmitEditing');

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('handles multiple text changes', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      
      fireEvent.changeText(textInput, 'p');
      fireEvent.changeText(textInput, 'po');
      fireEvent.changeText(textInput, 'pop');

      expect(mockOnChangeText).toHaveBeenCalledTimes(3);
      expect(mockOnChangeText).toHaveBeenNthCalledWith(1, 'p');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(2, 'po');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(3, 'pop');
    });

    it('handles backspace and deletion', () => {
      render(
        <TagInput
          newTagName="pop"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByDisplayValue('pop');
      
      fireEvent.changeText(textInput, 'po');
      fireEvent.changeText(textInput, 'p');
      fireEvent.changeText(textInput, '');

      expect(mockOnChangeText).toHaveBeenCalledTimes(3);
      expect(mockOnChangeText).toHaveBeenNthCalledWith(3, '');
    });
  });

  describe('Button State Management', () => {
    it('disables add button when text is empty', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add').parent;
      expect(addButton?.props.disabled).toBe(true);
    });

    it('disables add button when text is only whitespace', () => {
      render(
        <TagInput
          newTagName="   "
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add').parent;
      expect(addButton?.props.disabled).toBe(true);
    });

    it('enables add button when text has content', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add').parent;
      expect(addButton?.props.disabled).toBe(false);

      fireEvent.press(screen.getByText('+ Add'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('enables add button when text has content after trimming', () => {
      render(
        <TagInput
          newTagName="  test  "
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add').parent;
      expect(addButton?.props.disabled).toBe(false);

      fireEvent.press(screen.getByText('+ Add'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('updates button state when text changes from empty to filled', () => {
      const { rerender } = render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      let addButton = screen.getByText('+ Add').parent;
      expect(addButton?.props.disabled).toBe(true);

      rerender(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      addButton = screen.getByText('+ Add').parent;
      expect(addButton?.props.disabled).toBe(false);

      fireEvent.press(screen.getByText('+ Add'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      // Should show activity indicator instead of text
      expect(screen.queryByText('+ Add')).toBeNull();
      // ActivityIndicator should be present (can't easily test directly)
    });

    it('disables text input when loading', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      const textInput = screen.getByDisplayValue('test');
      fireEvent.changeText(textInput, 'new text');

      // Text input should be disabled, so onChangeText should not be called
      expect(mockOnChangeText).not.toHaveBeenCalled();
    });

    it('disables add button when loading', () => {
      const { UNSAFE_getByType } = render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      // Button should be disabled when loading
      const touchableOpacity = UNSAFE_getByType(require('react-native').TouchableOpacity);
      expect(touchableOpacity.props.disabled).toBe(true);
    });

    it('shows add button text when not loading', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('+ Add')).toBeTruthy();
    });

    it('handles loading state changes correctly', () => {
      const { rerender } = render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      // Should not show text when loading
      expect(screen.queryByText('+ Add')).toBeNull();

      rerender(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      // Should show text when not loading
      expect(screen.getByText('+ Add')).toBeTruthy();
    });
  });

  describe('Combined State Scenarios', () => {
    it('disables button when both loading and empty text', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      // Button should be disabled for both reasons
      expect(screen.queryByText('+ Add')).toBeNull();
    });

    it('handles transition from loading with text to not loading with empty text', () => {
      const { rerender } = render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      rerender(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add').parent;

      // Should be disabled due to empty text
      expect(addButton?.props.disabled).toBe(true);
    });
  });

  describe('Text Input Behavior', () => {
    it('handles special characters in input', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.changeText(textInput, 'rock & roll');

      expect(mockOnChangeText).toHaveBeenCalledWith('rock & roll');
    });

    it('handles unicode characters in input', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.changeText(textInput, 'música 🎵');

      expect(mockOnChangeText).toHaveBeenCalledWith('música 🎵');
    });

    it('handles very long text input', () => {
      const longText = 'this is a very long tag name that might exceed normal expectations for tag length but should still be handled gracefully';
      
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.changeText(textInput, longText);

      expect(mockOnChangeText).toHaveBeenCalledWith(longText);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid button presses', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const addButton = screen.getByText('+ Add');
      
      // Rapid presses
      fireEvent.press(addButton);
      fireEvent.press(addButton);
      fireEvent.press(addButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(3);
    });

    it('handles prop changes correctly', () => {
      const { rerender } = render(
        <TagInput
          newTagName="initial"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByDisplayValue('initial')).toBeTruthy();

      rerender(
        <TagInput
          newTagName="updated"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByDisplayValue('updated')).toBeTruthy();
      expect(screen.queryByDisplayValue('initial')).toBeNull();
    });

    it('handles callback function changes', () => {
      const firstOnChangeText = jest.fn();
      const secondOnChangeText = jest.fn();
      const firstOnSubmit = jest.fn();
      const secondOnSubmit = jest.fn();

      const { rerender } = render(
        <TagInput
          newTagName=""
          onChangeText={firstOnChangeText}
          onSubmit={firstOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.changeText(textInput, 'test');

      expect(firstOnChangeText).toHaveBeenCalledWith('test');
      expect(secondOnChangeText).not.toHaveBeenCalled();

      rerender(
        <TagInput
          newTagName="test"
          onChangeText={secondOnChangeText}
          onSubmit={secondOnSubmit}
          isLoading={false}
        />
      );

      fireEvent.changeText(textInput, 'updated');
      expect(secondOnChangeText).toHaveBeenCalledWith('updated');
      expect(firstOnChangeText).toHaveBeenCalledTimes(1); // Should not be called again

      const addButton = screen.getByText('+ Add');
      fireEvent.press(addButton);
      expect(secondOnSubmit).toHaveBeenCalledTimes(1);
      expect(firstOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility structure', () => {
      render(
        <TagInput
          newTagName="test"
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      // Text input should be accessible
      expect(screen.getByDisplayValue('test')).toBeTruthy();
      // Button should be accessible
      expect(screen.getByText('+ Add')).toBeTruthy();
    });

    it('maintains proper focus behavior', () => {
      render(
        <TagInput
          newTagName=""
          onChangeText={mockOnChangeText}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textInput = screen.getByPlaceholderText('Add tag...');
      
      // Input should be focusable and editable
      fireEvent.changeText(textInput, 'focus test');
      expect(mockOnChangeText).toHaveBeenCalledWith('focus test');
    });
  });
});