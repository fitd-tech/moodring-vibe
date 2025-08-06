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
        expect(getByText('Connect with Spotify')).toBeTruthy();
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
        const loginButton = getByText('Connect with Spotify');
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
    const mockBackendAuthResponse = {
      user: {
        id: 1,
        spotify_id: 'test_user',
        email: 'test@example.com',
        display_name: 'Test User',
        profile_image_url: 'https://example.com/avatar.jpg',
        created_at: '2025-08-06T01:00:00Z',
        updated_at: '2025-08-06T01:00:00Z',
      },
      access_token: 'backend_jwt_token',
    };

    beforeEach(() => {
      // Mock successful backend auth data retrieval
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockBackendAuthResponse));
    });

    it('renders authenticated screen when user is logged in', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('MOODRING')).toBeTruthy();
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('test@example.com')).toBeTruthy();
      });
    });

    it('displays dashboard sections for authenticated user', async () => {
      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('RECENT TRACKS')).toBeTruthy();
        expect(getByText('QUICK ACTIONS')).toBeTruthy();
        expect(getByText('Create New Tag')).toBeTruthy();
        expect(getByText('Browse Playlists')).toBeTruthy();
        expect(getByText('Generate Playlist')).toBeTruthy();
      });
    });

    it('shows user avatar placeholder with first letter of display name', async () => {
      // Mock auth data without profile image to test placeholder
      const mockAuthWithoutImage = {
        user: {
          id: 1,
          spotify_id: 'test_user',
          email: 'test@example.com',
          display_name: 'Test User',
          profile_image_url: null,
          created_at: '2025-08-06T01:00:00Z',
          updated_at: '2025-08-06T01:00:00Z',
        },
        access_token: 'backend_jwt_token',
      };

      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockAuthWithoutImage));
      
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
        expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('moodring_auth');
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

    it('handles backend authentication failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Backend authentication failed'),
      });

      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        { type: 'success', params: { code: 'invalid_code' } } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/Backend authentication failed/)).toBeTruthy();
      });
    });

    it('handles backend server error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        { type: 'success', params: { code: 'valid_code' } } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/Failed to authenticate with backend/)).toBeTruthy();
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
        const loginButton = getByText('Connect with Spotify');
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(getByText('Failed to start login process')).toBeTruthy();
      });
    });
  });

  describe('Backend OAuth Flow', () => {
    it('exchanges authorization code with backend successfully', async () => {
      const mockBackendResponse = {
        user: {
          id: 1,
          spotify_id: 'test_user',
          email: 'test@example.com',
          display_name: 'Test User',
          profile_image_url: null,
          created_at: '2025-08-06T01:00:00Z',
          updated_at: '2025-08-06T01:00:00Z',
        },
        access_token: 'backend_jwt_token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      mockUseAuthRequest.mockReturnValue([
        { codeVerifier: 'test-verifier' } as unknown,
        { type: 'success', params: { code: 'auth_code' } } as unknown,
        jest.fn(),
      ] as ReturnType<typeof useAuthRequest>);

      render(<App />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/auth/spotify',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: 'auth_code',
              code_verifier: 'test-verifier',
            }),
          })
        );
        expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
          'moodring_auth',
          JSON.stringify(mockBackendResponse)
        );
      });
    });
  });
});
