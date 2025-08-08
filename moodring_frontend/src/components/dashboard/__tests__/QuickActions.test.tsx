import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { QuickActions } from '../QuickActions';

describe('QuickActions', () => {
  it('renders all action buttons correctly', () => {
    render(<QuickActions />);

    expect(screen.getByText('QUICK ACTIONS')).toBeTruthy();
    expect(screen.getByText('Create New Tag')).toBeTruthy();
    expect(screen.getByText('Browse Playlists')).toBeTruthy();
    expect(screen.getByText('Generate Playlist')).toBeTruthy();
  });

  it('calls onCreateTag when Create New Tag button is pressed', () => {
    const mockOnCreateTag = jest.fn();
    render(<QuickActions onCreateTag={mockOnCreateTag} />);

    const createButton = screen.getByText('Create New Tag');
    fireEvent.press(createButton);

    expect(mockOnCreateTag).toHaveBeenCalledTimes(1);
  });

  it('calls onBrowsePlaylists when Browse Playlists button is pressed', () => {
    const mockOnBrowsePlaylists = jest.fn();
    render(<QuickActions onBrowsePlaylists={mockOnBrowsePlaylists} />);

    const browseButton = screen.getByText('Browse Playlists');
    fireEvent.press(browseButton);

    expect(mockOnBrowsePlaylists).toHaveBeenCalledTimes(1);
  });

  it('calls onGeneratePlaylist when Generate Playlist button is pressed', () => {
    const mockOnGeneratePlaylist = jest.fn();
    render(<QuickActions onGeneratePlaylist={mockOnGeneratePlaylist} />);

    const generateButton = screen.getByText('Generate Playlist');
    fireEvent.press(generateButton);

    expect(mockOnGeneratePlaylist).toHaveBeenCalledTimes(1);
  });

  it('calls all callbacks when all props are provided', () => {
    const mockOnCreateTag = jest.fn();
    const mockOnBrowsePlaylists = jest.fn();
    const mockOnGeneratePlaylist = jest.fn();

    render(
      <QuickActions
        onCreateTag={mockOnCreateTag}
        onBrowsePlaylists={mockOnBrowsePlaylists}
        onGeneratePlaylist={mockOnGeneratePlaylist}
      />
    );

    fireEvent.press(screen.getByText('Create New Tag'));
    fireEvent.press(screen.getByText('Browse Playlists'));
    fireEvent.press(screen.getByText('Generate Playlist'));

    expect(mockOnCreateTag).toHaveBeenCalledTimes(1);
    expect(mockOnBrowsePlaylists).toHaveBeenCalledTimes(1);
    expect(mockOnGeneratePlaylist).toHaveBeenCalledTimes(1);
  });

  it('renders correctly with no props (uses default functions)', () => {
    render(<QuickActions />);

    // Should not throw errors when pressing buttons with default functions
    const createButton = screen.getByText('Create New Tag');
    const browseButton = screen.getByText('Browse Playlists');
    const generateButton = screen.getByText('Generate Playlist');

    expect(() => {
      fireEvent.press(createButton);
      fireEvent.press(browseButton);
      fireEvent.press(generateButton);
    }).not.toThrow();
  });

  it('renders correct button structure', () => {
    render(<QuickActions />);

    const createButton = screen.getByText('Create New Tag').parent;
    const browseButton = screen.getByText('Browse Playlists').parent;
    const generateButton = screen.getByText('Generate Playlist').parent;

    expect(createButton).toBeTruthy();
    expect(browseButton).toBeTruthy();
    expect(generateButton).toBeTruthy();
  });
});