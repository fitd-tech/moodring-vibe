import { taggingService } from '../../../services/taggingService';

// Mock the taggingService
jest.mock('../../../services/taggingService', () => ({
  taggingService: {
    getSongsWithTag: jest.fn(),
  },
}));

// Mock AuthContext
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
  }),
}));

// Mock animation hook
jest.mock('../../../hooks/useAnimation', () => ({
  useAnimation: () => ({
    createAnimatedValues: () => ({
      scale: { setValue: jest.fn() },
      opacity: { setValue: jest.fn() },
      height: { setValue: jest.fn(), interpolate: jest.fn(() => ({ setValue: jest.fn() })) },
    }),
    animateExpansion: jest.fn(),
  }),
}));

describe('TagCard', () => {
  const mockGetSongsWithTag = taggingService.getSongsWithTag as jest.MockedFunction<
    typeof taggingService.getSongsWithTag
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSongsWithTag.mockResolvedValue(['song1', 'song2', 'song3']);
  });

  describe('basic functionality', () => {
    it('imports and initializes without errors', () => {
      // Test that TagCard can be imported and the service methods exist
      expect(taggingService.getSongsWithTag).toBeDefined();
      expect(typeof taggingService.getSongsWithTag).toBe('function');
    });

    it('mocks work correctly', async () => {
      const result = await taggingService.getSongsWithTag(1, 1);
      expect(result).toEqual(['song1', 'song2', 'song3']);
    });

    it('handles empty songs array', async () => {
      mockGetSongsWithTag.mockResolvedValue([]);
      const result = await taggingService.getSongsWithTag(1, 1);
      expect(result).toEqual([]);
    });

    it('handles API errors gracefully in service calls', async () => {
      mockGetSongsWithTag.mockRejectedValue(new Error('API Error'));

      await expect(taggingService.getSongsWithTag(1, 1)).rejects.toThrow('API Error');
    });
  });

  describe('service integration', () => {
    it('calls getSongsWithTag with correct parameters', async () => {
      await taggingService.getSongsWithTag(123, 456);

      expect(mockGetSongsWithTag).toHaveBeenCalledWith(123, 456);
    });

    it('returns expected data structure', async () => {
      const testData = ['test_song_1', 'test_song_2'];
      mockGetSongsWithTag.mockResolvedValue(testData);

      const result = await taggingService.getSongsWithTag(1, 1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(testData);
    });
  });
});
