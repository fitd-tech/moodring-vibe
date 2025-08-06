import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TaggingInterface } from '../TaggingInterface';
import { Tag } from '../../../types';

describe('TaggingInterface', () => {
  const mockTags: Tag[] = [
    { id: '1', name: 'pop' },
    { id: '2', name: 'recent' },
  ];

  const mockOnRemoveTag = jest.fn();
  const mockOnAddTag = jest.fn();

  beforeEach(() => {
    mockOnRemoveTag.mockClear();
    mockOnAddTag.mockClear();
  });

  it('renders tags correctly', () => {
    const { getByText } = render(
      <TaggingInterface
        tags={mockTags}
        onRemoveTag={mockOnRemoveTag}
        onAddTag={mockOnAddTag}
      />
    );

    expect(getByText('Tags')).toBeTruthy();
    expect(getByText('pop')).toBeTruthy();
    expect(getByText('recent')).toBeTruthy();
  });

  it('calls onRemoveTag when remove button is pressed', () => {
    const { getAllByText } = render(
      <TaggingInterface
        tags={mockTags}
        onRemoveTag={mockOnRemoveTag}
        onAddTag={mockOnAddTag}
      />
    );

    const removeButtons = getAllByText('×');
    fireEvent.press(removeButtons[0]);
    
    expect(mockOnRemoveTag).toHaveBeenCalledWith('1');
  });

  it('calls onAddTag when add button is pressed', () => {
    const { getByText } = render(
      <TaggingInterface
        tags={mockTags}
        onRemoveTag={mockOnRemoveTag}
        onAddTag={mockOnAddTag}
      />
    );

    fireEvent.press(getByText('+ Add'));
    expect(mockOnAddTag).toHaveBeenCalled();
  });

  it('renders with empty tags array', () => {
    const { getByText, queryByText } = render(
      <TaggingInterface
        tags={[]}
        onRemoveTag={mockOnRemoveTag}
        onAddTag={mockOnAddTag}
      />
    );

    expect(getByText('Tags')).toBeTruthy();
    expect(queryByText('pop')).toBeNull();
    expect(queryByText('recent')).toBeNull();
  });
});