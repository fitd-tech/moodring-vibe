import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByTestId } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled={true} testID="disabled-button" />
    );
    
    const button = getByTestId('disabled-button');
    fireEvent.press(button);
    
    // Since we explicitly set onPress to undefined when disabled, it should not be called
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { getByText, rerender } = render(
      <Button title="Primary" onPress={mockOnPress} variant="primary" />
    );
    
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button title="Secondary" onPress={mockOnPress} variant="secondary" />);
    expect(getByText('Secondary')).toBeTruthy();

    rerender(<Button title="Outline" onPress={mockOnPress} variant="outline" />);
    expect(getByText('Outline')).toBeTruthy();
  });
});