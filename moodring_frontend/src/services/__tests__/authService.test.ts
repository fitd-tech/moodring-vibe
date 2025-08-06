import { authService } from '../authService';
import { BackendUser } from '../../types';

describe('AuthService', () => {
  const mockUser: BackendUser = {
    id: 1,
    spotify_id: 'test_spotify_id',
    email: 'test@example.com',
    display_name: 'Test User',
    spotify_access_token: 'test_access_token',
    spotify_refresh_token: 'test_refresh_token',
    token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    profile_image_url: 'https://example.com/image.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isTokenExpired', () => {
    it('returns true when token_expires_at is null', () => {
      const user = { ...mockUser, token_expires_at: null };
      expect(authService.isTokenExpired(user)).toBe(true);
    });

    it('returns true when token expires within 5 minutes', () => {
      const user = {
        ...mockUser,
        token_expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 minutes from now
      };
      expect(authService.isTokenExpired(user)).toBe(true);
    });

    it('returns false when token expires in more than 5 minutes', () => {
      const user = {
        ...mockUser,
        token_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      };
      expect(authService.isTokenExpired(user)).toBe(false);
    });

    it('returns true when token has already expired', () => {
      const user = {
        ...mockUser,
        token_expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      };
      expect(authService.isTokenExpired(user)).toBe(true);
    });
  });

  describe('authenticateWithBackend', () => {
    it('successfully authenticates with valid code and verifier', async () => {
      const mockResponse = {
        user: mockUser,
        access_token: 'test_backend_token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await authService.authenticateWithBackend('test_code', 'test_verifier');
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/spotify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'test_code',
            code_verifier: 'test_verifier',
          }),
        })
      );
    });

    it('throws error when backend returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request'),
      });

      await expect(
        authService.authenticateWithBackend('test_code', 'test_verifier')
      ).rejects.toThrow('Failed to authenticate with backend');
    });
  });

  describe('refreshSpotifyToken', () => {
    it('successfully refreshes token', async () => {
      const mockResponse = {
        user: mockUser,
        access_token: 'new_backend_token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await authService.refreshSpotifyToken(1);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/refresh/1',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('throws error when refresh fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      });

      await expect(
        authService.refreshSpotifyToken(1)
      ).rejects.toThrow('Failed to refresh token');
    });
  });
});