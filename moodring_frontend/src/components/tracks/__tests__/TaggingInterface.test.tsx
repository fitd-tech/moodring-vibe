import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TaggingInterface } from '../TaggingInterface';
import { Tag } from '../../../types';
import { taggingService } from '../../../services/taggingService';

// Mock the tagging service
jest.mock('../../../services/taggingService');
const mockTaggingService = taggingService as jest.Mocked<typeof taggingService>;

// Mock theme
jest.mock('../../../styles/theme', () => ({
  theme: {
    colors: {
      ui: {
        tag: '#ff6b9d',
        overlay: 'rgba(255, 255, 255, 0.1)',
        tagRemove: 'rgba(255, 255, 255, 0.2)',
      },
      text: {
        primary: '#ffffff',
        muted: 'rgba(255, 255, 255, 0.6)',
        secondary: 'rgba(255, 255, 255, 0.8)',
      },
      background: { primary: '#1a0a1a' },
      accent: { purple: '#8a2be2' },
    },
    spacing: { xs: 4, sm: 8, lg: 16, xl: 20 },
    borderRadius: { lg: 12 },
    typography: {
      fontSize: { sm: 14, md: 16 },
      fontWeight: { medium: '500', semibold: '600', bold: '700' },
    },
  },
}));

// Mock the AuthContext hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      spotify_id: 'test_spotify_id',
      email: 'test@example.com',
      display_name: 'Test User',
      spotify_access_token: 'test_token',
      spotify_refresh_token: null,
      token_expires_at: null,
      profile_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  }),
}));

describe('TaggingInterface', () => {
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
      name: 'recent',
      color: '#00ff00',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockOnTagsChanged = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTaggingService.getUserTags.mockResolvedValue([]);
    mockTaggingService.createTag.mockResolvedValue(mockTags[0]);
    mockTaggingService.addTagToSong.mockResolvedValue({
      id: 1,
      user_id: 1,
      song_id: 'test_song',
      tag_id: 1,
      created_at: '2024-01-01T00:00:00Z',
    });
  });

  it('renders tags correctly', () => {
    const { getByText } = render(
      <TaggingInterface tags={mockTags} songId="test_song" onTagsChanged={mockOnTagsChanged} />
    );

    expect(getByText('Tags')).toBeTruthy();
    expect(getByText('pop')).toBeTruthy();
    expect(getByText('recent')).toBeTruthy();
  });

  it('calls onTagsChanged when remove button is pressed', async () => {
    mockTaggingService.removeTagFromSong.mockResolvedValue(undefined);

    const { getAllByText } = render(
      <TaggingInterface tags={mockTags} songId="test_song" onTagsChanged={mockOnTagsChanged} />
    );

    const removeButtons = getAllByText('×');
    fireEvent.press(removeButtons[0]);

    await waitFor(() => {
      expect(mockTaggingService.removeTagFromSong).toHaveBeenCalledWith('test_song', 1, 1);
      expect(mockOnTagsChanged).toHaveBeenCalled();
    });
  });

  it('creates and adds new tag when add button is pressed', async () => {
    const { getByPlaceholderText, getByText } = render(
      <TaggingInterface tags={[]} songId="test_song" onTagsChanged={mockOnTagsChanged} />
    );

    const textInput = getByPlaceholderText('Add tag...');
    fireEvent.changeText(textInput, 'new tag');
    fireEvent.press(getByText('+ Add'));

    await waitFor(() => {
      expect(mockTaggingService.createTag).toHaveBeenCalledWith(1, {
        name: 'new tag',
        user_id: 1,
      });
      expect(mockTaggingService.addTagToSong).toHaveBeenCalledWith('test_song', 1, 1);
      expect(mockOnTagsChanged).toHaveBeenCalled();
    });
  });

  it('renders with empty tags array', () => {
    const { getByText, queryByText } = render(
      <TaggingInterface tags={[]} songId="test_song" onTagsChanged={mockOnTagsChanged} />
    );

    expect(getByText('Tags')).toBeTruthy();
    expect(queryByText('pop')).toBeNull();
    expect(queryByText('recent')).toBeNull();
  });

  it('loads available tags on mount', async () => {
    const availableTags = [mockTags[0]];
    mockTaggingService.getUserTags.mockResolvedValue(availableTags);

    render(<TaggingInterface tags={[]} songId="test_song" onTagsChanged={mockOnTagsChanged} />);

    await waitFor(() => {
      expect(mockTaggingService.getUserTags).toHaveBeenCalledWith(1);
    });
  });
});
