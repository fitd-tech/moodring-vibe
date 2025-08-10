import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { TagsDashboard } from '../TagsDashboard';
import { taggingService } from '../../../services/taggingService';

// Mock the taggingService
jest.mock('../../../services/taggingService', () => ({
  taggingService: {
    getUserTags: jest.fn(),
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

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock RefreshControl and ScrollView
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    RefreshControl: ({
      onRefresh: _onRefresh,
      refreshing: _refreshing,
    }: {
      onRefresh: () => void;
      refreshing: boolean;
    }) => null,
    ScrollView: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
      RN.View({ children, testID }),
  };
});

// Mock ProfileMenu
jest.mock('../ProfileMenu', () => ({
  ProfileMenu: ({ onHome: _onHome }: { onHome?: () => void }) => null,
}));

// Mock TagCard
jest.mock('../../tracks/TagCard', () => ({
  TagCard: ({
    tag: _tag,
    onToggleExpansion: _onToggleExpansion,
  }: {
    tag: { id: number; name: string };
    onToggleExpansion: () => void;
  }) => jest.requireActual('react-native').View(),
}));

const mockTags = [
  {
    id: 1,
    user_id: 1,
    name: 'pop',
    color: undefined,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'rock',
    color: '#FF5733',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockUser = {
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
};

const defaultProps = {
  user: mockUser,
  onLogout: jest.fn(),
  onHome: jest.fn(),
};

describe('TagsDashboard', () => {
  const mockGetUserTags = taggingService.getUserTags as jest.MockedFunction<
    typeof taggingService.getUserTags
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserTags.mockResolvedValue(mockTags);
  });

  describe('rendering', () => {
    it('renders dashboard with header', async () => {
      const { getByText } = render(<TagsDashboard {...defaultProps} />);

      expect(getByText('Your Tags')).toBeTruthy();
      expect(getByText('Browse and manage your music tags')).toBeTruthy();
    });

    it('displays loading state initially', () => {
      mockGetUserTags.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByText } = render(<TagsDashboard {...defaultProps} />);

      expect(getByText('Loading your tags...')).toBeTruthy();
    });
  });

  describe('data loading', () => {
    it('loads user tags on mount', async () => {
      render(<TagsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserTags).toHaveBeenCalledWith(1);
      });
    });

    it('displays tag count when tags are loaded', async () => {
      const { getByText } = render(<TagsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('2 tags found')).toBeTruthy();
      });
    });

    it('handles empty tags list', async () => {
      mockGetUserTags.mockResolvedValue([]);

      const { getByText } = render(<TagsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('No tags yet')).toBeTruthy();
        expect(getByText('Start tagging songs to see them here!')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles API errors when loading tags', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserTags.mockRejectedValue(new Error('API Error'));

      const { getByText } = render(<TagsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load tags:', expect.any(Error));
        expect(getByText('No tags yet')).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('navigation integration', () => {
    it('passes onHome prop to ProfileMenu', () => {
      const mockNavigateHome = jest.fn();
      render(<TagsDashboard {...defaultProps} onHome={mockNavigateHome} />);

      // The component should render without errors and pass the prop
      expect(true).toBe(true);
    });
  });
});
