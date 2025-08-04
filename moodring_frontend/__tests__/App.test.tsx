import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';
import * as SecureStore from 'expo-secure-store';
import { useAuthRequest } from 'expo-auth-session';

// Mock the environment variable
process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID = 'test_client_id';

// Mock the hooks and modules
jest.mock('expo-auth-session');
jest.mock('expo-secure-store');

const mockUseAuthRequest = useAuthRequest as jest.MockedFunction<typeof useAuthRequest>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthRequest.mockReturnValue([
      { codeVerifier: 'test-verifier' } as unknown,
      null,
      jest.fn(),
    ] as ReturnType<typeof useAuthRequest>);
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe('Login Screen', () => {
    it('renders login screen when user is not authenticated', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('🎵 Moodring')).toBeTruthy();
        expect(getByText('Organize your music with powerful tags')).toBeTruthy();
        expect(getByText('🎧 Connect with Spotify')).toBeTruthy();
      });
    });

    it('displays feature list on login screen', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('What you can do:')).toBeTruthy();
        expect(getByText('• Tag your songs and playlists')).toBeTruthy();
        expect(getByText('• Create hierarchical organization')).toBeTruthy();
        expect(getByText('• Generate smart playlists')).toBeTruthy();
        expect(getByText('• Discover music patterns')).toBeTruthy();
      });
    });

    it('shows disclaimer text', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/We'll only access your music library and playlists/)).toBeTruthy();
        expect(getByText(/Your data stays private and secure/)).toBeTruthy();
      });
    });

    it('calls promptAsync when login button is pressed', async () => {
      const mockPromptAsync = jest.fn();
      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        null,
        mockPromptAsync,
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        const loginButton = getByText('🎧 Connect with Spotify');
        fireEvent.press(loginButton);
        expect(mockPromptAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', async () => {
      mockSecureStore.getItemAsync.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByText } = render(<App />);

      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('Authenticated State', () => {
    const mockTokens = {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    const mockUser = {
      id: 'test_user',
      display_name: 'Test User',
      email: 'test@example.com',
      images: [{ url: 'https://example.com/avatar.jpg' }],
      followers: { total: 100 },
    };

    beforeEach(() => {
      // Mock successful token retrieval
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockTokens));

      // Mock successful user profile fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });
    });

    it('renders authenticated screen when user is logged in', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('🎵 Moodring')).toBeTruthy();
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('test@example.com')).toBeTruthy();
        expect(getByText('100 followers')).toBeTruthy();
      });
    });

    it('displays welcome message and features for authenticated user', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(
          getByText('Welcome to Moodring! Ready to organize your music with tags?')
        ).toBeTruthy();
        expect(getByText('🎵 Access your playlists and saved music')).toBeTruthy();
        expect(getByText('🏷️ Create hierarchical tags for organization')).toBeTruthy();
        expect(getByText('📚 Generate custom playlists from tags')).toBeTruthy();
        expect(getByText('🔄 Sync back to your Spotify account')).toBeTruthy();
      });
    });

    it('shows user avatar placeholder with first letter of display name', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('T')).toBeTruthy(); // First letter of "Test User"
      });
    });

    it('calls logout function when sign out is pressed', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        const signOutButton = getByText('Sign Out');
        fireEvent.press(signOutButton);
        expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('spotify_tokens');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when authentication fails', async () => {
      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        {
          type: 'error',
          error: 'access_denied',
          params: { error_description: 'User denied access' },
        } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/Authentication error:/)).toBeTruthy();
      });
    });

    it('handles missing CLIENT_ID environment variable', () => {
      // Temporarily remove the env var
      const originalClientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
      delete process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

      expect(() => {
        jest.resetModules();
        require('../App');
      }).toThrow('Missing EXPO_PUBLIC_SPOTIFY_CLIENT_ID environment variable');

      // Restore the env var
      process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID = originalClientId;
    });

    it('handles token exchange failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        { type: 'success', params: { code: 'invalid_code' } } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/Failed to exchange code for tokens/)).toBeTruthy();
      });
    });

    it('handles user profile fetch failure', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'valid_token',
              refresh_token: 'refresh_token',
              expires_in: 3600,
              token_type: 'Bearer',
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        { type: 'success', params: { code: 'valid_code' } } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/Failed to fetch user profile/)).toBeTruthy();
      });
    });

    it('handles login process failure', async () => {
      const mockPromptAsync = jest.fn().mockRejectedValue(new Error('Login failed'));
      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        null,
        mockPromptAsync,
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        const loginButton = getByText('🎧 Connect with Spotify');
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(getByText('Failed to start login process')).toBeTruthy();
      });
    });
  });

  describe('OAuth Flow', () => {
    it('exchanges authorization code for tokens successfully', async () => {
      const mockTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokens),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'test_user',
              display_name: 'Test User',
              email: 'test@example.com',
              images: [],
              followers: { total: 0 },
            }),
        });

      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        { type: 'success', params: { code: 'auth_code' } } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      render(<App />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://accounts.spotify.com/api/token',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
        );
        expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
          'spotify_tokens',
          JSON.stringify(mockTokens)
        );
      });
    });
  });
});
