import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useTagging } from '../useTagging';
import { taggingService } from '../../../../services/taggingService';
import { useAuth } from '../../../../contexts/AuthContext';
import { Tag, BackendUser, NewTag } from '../../../../types';

// Mock the modules
jest.mock('../../../../services/taggingService');
jest.mock('../../../../contexts/AuthContext');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

const mockTaggingService = taggingService as jest.Mocked<typeof taggingService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

// Define mock user type
const createMockUser = (id: number): BackendUser => ({
  id,
  spotify_id: `spotify_${id}`,
  email: `user${id}@example.com`,
  display_name: `User ${id}`,
  spotify_access_token: 'mock_access_token',
  spotify_refresh_token: 'mock_refresh_token',
  token_expires_at: new Date().toISOString(),
  profile_image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

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
];

const mockAvailableTags: Tag[] = [
  {
    id: 3,
    user_id: 1,
    name: 'rock',
    color: '#0000ff',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    user_id: 1,
    name: 'jazz',
    color: '#ffff00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  ...mockTags, // Include already used tags
];

const mockSongTag = {
  id: 1,
  user_id: 1,
  song_id: 'test_song',
  tag_id: 1,
  created_at: '2024-01-01T00:00:00Z',
};

describe('useTagging', () => {
  const mockOnTagsChanged = jest.fn();
  const testUser = createMockUser(1);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock return values
    mockUseAuth.mockReturnValue({
      user: testUser,
      authToken: 'test_token',
      isLoading: false,
      error: null,
      setUser: jest.fn(),
      setAuthToken: jest.fn(),
      setError: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: jest.fn(),
    });

    mockTaggingService.getUserTags.mockResolvedValue(mockAvailableTags);
    mockTaggingService.createTag.mockResolvedValue(mockTags[0]);
    mockTaggingService.addTagToSong.mockResolvedValue(mockSongTag);
    mockTaggingService.removeTagFromSong.mockResolvedValue(undefined);

    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      expect(result.current.newTagName).toBe('');
      expect(result.current.availableTags).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.showAvailableTags).toBe(false);
    });

    it('loads available tags when user is present', async () => {
      renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTaggingService.getUserTags).toHaveBeenCalledWith(testUser.id);
    });

    it('does not load available tags when user is null', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        authToken: null,
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn(),
        refreshUserToken: jest.fn(),
      });

      renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTaggingService.getUserTags).not.toHaveBeenCalled();
    });
  });

  describe('loadAvailableTags', () => {
    it('successfully loads and sets available tags', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.availableTags).toEqual(mockAvailableTags);
    });

    it('handles errors when loading available tags', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTaggingService.getUserTags.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.availableTags).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load available tags:', expect.any(Error));
    });
  });

  describe('handleRemoveTag', () => {
    it('successfully removes a tag', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await result.current.handleRemoveTag(1);
      });

      expect(mockTaggingService.removeTagFromSong).toHaveBeenCalledWith('test_song', testUser.id, 1);
      expect(mockOnTagsChanged).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during tag removal', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      // Start the removal operation
      const removePromise = act(async () => {
        await result.current.handleRemoveTag(1);
      });

      // After starting, loading should be false (completed)
      await removePromise;

      expect(mockTaggingService.removeTagFromSong).toHaveBeenCalledWith('test_song', 1, 1);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles errors during tag removal', async () => {
      mockTaggingService.removeTagFromSong.mockRejectedValue(new Error('Remove failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await result.current.handleRemoveTag(1);
      });

      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to remove tag from song');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove tag:', expect.any(Error));
      expect(mockOnTagsChanged).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('does not remove tag when user is null', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        authToken: null,
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn(),
        refreshUserToken: jest.fn(),
      });

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await result.current.handleRemoveTag(1);
      });

      expect(mockTaggingService.removeTagFromSong).not.toHaveBeenCalled();
      expect(mockOnTagsChanged).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateAndAddTag', () => {
    it('successfully creates and adds a new tag', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      // Set tag name
      act(() => {
        result.current.setNewTagName('new tag');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      const expectedTagData: NewTag = {
        name: 'new tag',
        user_id: testUser.id,
      };

      expect(mockTaggingService.createTag).toHaveBeenCalledWith(testUser.id, expectedTagData);
      expect(mockTaggingService.addTagToSong).toHaveBeenCalledWith('test_song', testUser.id, mockTags[0].id);
      expect(result.current.newTagName).toBe('');
      expect(result.current.showAvailableTags).toBe(false);
      expect(mockOnTagsChanged).toHaveBeenCalledTimes(1);
    });

    it('trims whitespace from tag name', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setNewTagName('  spaced tag  ');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      const expectedTagData: NewTag = {
        name: 'spaced tag',
        user_id: testUser.id,
      };

      expect(mockTaggingService.createTag).toHaveBeenCalledWith(testUser.id, expectedTagData);
    });

    it('does not create tag when name is empty', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      expect(mockTaggingService.createTag).not.toHaveBeenCalled();
      expect(mockTaggingService.addTagToSong).not.toHaveBeenCalled();
    });

    it('does not create tag when name is only whitespace', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setNewTagName('   ');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      expect(mockTaggingService.createTag).not.toHaveBeenCalled();
      expect(mockTaggingService.addTagToSong).not.toHaveBeenCalled();
    });

    it('refreshes available tags after creating new tag', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setNewTagName('new tag');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      // Should call getUserTags twice: once on mount, once after creating tag
      expect(mockTaggingService.getUserTags).toHaveBeenCalledTimes(2);
    });

    it('handles errors during tag creation', async () => {
      mockTaggingService.createTag.mockRejectedValue(new Error('Create failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setNewTagName('new tag');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to create and add tag');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag:', expect.any(Error));
      expect(mockOnTagsChanged).not.toHaveBeenCalled();
      expect(result.current.newTagName).toBe('new tag'); // Should not clear on error
    });

    it('handles errors during tag addition after successful creation', async () => {
      mockTaggingService.addTagToSong.mockRejectedValue(new Error('Add failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setNewTagName('new tag');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      expect(mockTaggingService.createTag).toHaveBeenCalled();
      expect(mockTaggingService.addTagToSong).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to create and add tag');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag:', expect.any(Error));
    });

    it('does not create tag when user is null', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        authToken: null,
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn(),
        refreshUserToken: jest.fn(),
      });

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setNewTagName('new tag');
      });

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      expect(mockTaggingService.createTag).not.toHaveBeenCalled();
    });
  });

  describe('handleAddExistingTag', () => {
    it('successfully adds an existing tag', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      const tagToAdd = mockAvailableTags[0]; // rock tag

      await act(async () => {
        await result.current.handleAddExistingTag(tagToAdd);
      });

      expect(mockTaggingService.addTagToSong).toHaveBeenCalledWith('test_song', testUser.id, tagToAdd.id);
      expect(result.current.showAvailableTags).toBe(false);
      expect(mockOnTagsChanged).toHaveBeenCalledTimes(1);
    });

    it('prevents adding duplicate tags', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      // Try to add a tag that's already in the tags array
      const duplicateTag = mockTags[0];

      await act(async () => {
        await result.current.handleAddExistingTag(duplicateTag);
      });

      expect(mockAlert).toHaveBeenCalledWith('Tag Already Added', 'This tag is already applied to this song.');
      expect(mockTaggingService.addTagToSong).not.toHaveBeenCalled();
      expect(mockOnTagsChanged).not.toHaveBeenCalled();
    });

    it('handles errors during tag addition', async () => {
      mockTaggingService.addTagToSong.mockRejectedValue(new Error('Add failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      const tagToAdd = mockAvailableTags[0];

      await act(async () => {
        await result.current.handleAddExistingTag(tagToAdd);
      });

      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to add tag to song');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add existing tag:', expect.any(Error));
      expect(mockOnTagsChanged).not.toHaveBeenCalled();
    });

    it('does not add tag when user is null', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        authToken: null,
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn(),
        refreshUserToken: jest.fn(),
      });

      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      const tagToAdd = mockAvailableTags[0];

      await act(async () => {
        await result.current.handleAddExistingTag(tagToAdd);
      });

      expect(mockTaggingService.addTagToSong).not.toHaveBeenCalled();
    });
  });

  describe('getUnusedTags', () => {
    it('returns tags that are not currently applied', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags, // pop, favorite
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const unusedTags = result.current.getUnusedTags();
      
      // Should only include rock and jazz, not pop and favorite
      expect(unusedTags).toHaveLength(2);
      expect(unusedTags.map(tag => tag.name)).toEqual(['rock', 'jazz']);
    });

    it('returns all available tags when no tags are applied', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: [], // No tags applied
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const unusedTags = result.current.getUnusedTags();
      expect(unusedTags).toEqual(mockAvailableTags);
    });

    it('returns empty array when all tags are applied', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockAvailableTags, // All tags applied
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const unusedTags = result.current.getUnusedTags();
      expect(unusedTags).toEqual([]);
    });

    it('updates when available tags change', async () => {
      const { result, rerender } = renderHook((props) =>
        useTagging(props),
        {
          initialProps: {
            tags: mockTags,
            songId: 'test_song',
            onTagsChanged: mockOnTagsChanged,
          }
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let unusedTags = result.current.getUnusedTags();
      expect(unusedTags).toHaveLength(2);

      // Change the tags prop to include more applied tags
      rerender({
        tags: [...mockTags, mockAvailableTags[0]], // Add rock tag
        songId: 'test_song',
        onTagsChanged: mockOnTagsChanged,
      });

      unusedTags = result.current.getUnusedTags();
      expect(unusedTags).toHaveLength(1); // Only jazz should remain
      expect(unusedTags[0].name).toBe('jazz');
    });
  });

  describe('State management', () => {
    it('manages newTagName state correctly', () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      expect(result.current.newTagName).toBe('');

      act(() => {
        result.current.setNewTagName('test tag');
      });

      expect(result.current.newTagName).toBe('test tag');

      act(() => {
        result.current.setNewTagName('');
      });

      expect(result.current.newTagName).toBe('');
    });

    it('manages showAvailableTags state correctly', () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      expect(result.current.showAvailableTags).toBe(false);

      act(() => {
        result.current.setShowAvailableTags(true);
      });

      expect(result.current.showAvailableTags).toBe(true);

      act(() => {
        result.current.setShowAvailableTags(false);
      });

      expect(result.current.showAvailableTags).toBe(false);
    });

    it('resets showAvailableTags when creating new tag', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setShowAvailableTags(true);
        result.current.setNewTagName('new tag');
      });

      expect(result.current.showAvailableTags).toBe(true);

      await act(async () => {
        await result.current.handleCreateAndAddTag();
      });

      expect(result.current.showAvailableTags).toBe(false);
    });

    it('resets showAvailableTags when adding existing tag', async () => {
      const { result } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      act(() => {
        result.current.setShowAvailableTags(true);
      });

      expect(result.current.showAvailableTags).toBe(true);

      await act(async () => {
        await result.current.handleAddExistingTag(mockAvailableTags[0]);
      });

      expect(result.current.showAvailableTags).toBe(false);
    });
  });

  describe('User changes', () => {
    it('reloads available tags when user changes', async () => {
      const newUser = createMockUser(2);
      
      const { rerender } = renderHook(() =>
        useTagging({
          tags: mockTags,
          songId: 'test_song',
          onTagsChanged: mockOnTagsChanged,
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTaggingService.getUserTags).toHaveBeenCalledWith(testUser.id);

      // Change user
      mockUseAuth.mockReturnValue({
        user: newUser,
        authToken: 'test_token',
        isLoading: false,
        error: null,
        setUser: jest.fn(),
        setAuthToken: jest.fn(),
        setError: jest.fn(),
        logout: jest.fn(),
        refreshUserToken: jest.fn(),
      });

      rerender({
        tags: mockTags,
        songId: 'test_song',
        onTagsChanged: mockOnTagsChanged,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTaggingService.getUserTags).toHaveBeenCalledWith(newUser.id);
    });
  });
});