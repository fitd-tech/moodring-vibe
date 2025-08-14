import { renderHook, act } from '@testing-library/react-native';
import { useSpotifyTokenManagement } from '../useSpotifyTokenManagement';
import { authService } from '../../../services/authService';
import { BackendUser } from '../../../types';

// Mock the modules
jest.mock('../../../services/authService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Define mock user type
const createMockUser = (id: number, hasExpiredToken = false): BackendUser => ({
  id,
  spotify_id: `spotify_${id}`,
  email: `user${id}@example.com`,
  display_name: `User ${id}`,
  spotify_access_token: hasExpiredToken ? 'expired_token' : 'valid_token',
  spotify_refresh_token: 'refresh_token',
  token_expires_at: hasExpiredToken
    ? new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    : new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  profile_image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('useSpotifyTokenManagement', () => {
  const mockRefreshUserToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.isTokenExpired.mockReturnValue(false);
  });

  describe('getValidToken', () => {
    it('returns token and user when both are valid', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toEqual({
        token: 'valid_token',
        user: testUser,
      });
    });

    it('returns null when user is null', async () => {
      const { result } = renderHook(() =>
        useSpotifyTokenManagement(null, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toBeNull();
    });

    it('returns null when authToken is null', async () => {
      const testUser = createMockUser(1);
      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, null, mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toBeNull();
    });

    it('uses override parameters when provided', async () => {
      const testUser = createMockUser(1);
      const overrideUser = createMockUser(2);
      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken(overrideUser, 'override_token');
      });

      expect(tokenResult).toEqual({
        token: 'valid_token', // Uses user's spotify_access_token
        user: overrideUser,
      });
    });

    it('uses authToken when user has no spotify_access_token', async () => {
      const testUser = { ...createMockUser(1), spotify_access_token: '' };
      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toEqual({
        token: 'auth_token',
        user: testUser,
      });
    });

    it('refreshes token when expired', async () => {
      const expiredUser = createMockUser(1, true);
      const refreshedUser = createMockUser(1);
      const refreshResult = {
        user: refreshedUser,
        token: 'new_token',
      };

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockRefreshUserToken.mockResolvedValue(refreshResult);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(expiredUser, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(mockAuthService.isTokenExpired).toHaveBeenCalledWith(expiredUser);
      expect(mockRefreshUserToken).toHaveBeenCalledWith(expiredUser.id);
      expect(tokenResult).toEqual({
        token: 'valid_token', // Uses refreshed user's spotify_access_token
        user: refreshedUser,
      });
    });

    it('handles refresh failure gracefully', async () => {
      const expiredUser = createMockUser(1, true);

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockRefreshUserToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(expiredUser, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(mockRefreshUserToken).toHaveBeenCalledWith(expiredUser.id);
      expect(tokenResult).toEqual({
        token: 'expired_token', // Falls back to original token
        user: expiredUser,
      });
    });

    it('uses refresh token when spotify_access_token is not available in refresh result', async () => {
      const expiredUser = createMockUser(1, true);
      const refreshResult = {
        user: { ...createMockUser(1), spotify_access_token: '' }, // No spotify_access_token
        token: 'fallback_token',
      };

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockRefreshUserToken.mockResolvedValue(refreshResult);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(expiredUser, 'auth_token', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toEqual({
        token: 'fallback_token', // Uses refresh result token
        user: refreshResult.user,
      });
    });
  });

  describe('handleTokenExpiredError', () => {
    it('handles TOKEN_EXPIRED error by refreshing token and retrying', async () => {
      const testUser = createMockUser(1);
      const refreshResult = {
        user: createMockUser(1),
        token: 'new_token',
      };
      const mockApiCall = jest.fn().mockResolvedValue('api_result');
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockRefreshUserToken.mockResolvedValue(refreshResult);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const apiResult = await act(async () => {
        return await result.current.handleTokenExpiredError(
          tokenExpiredError,
          testUser,
          mockApiCall
        );
      });

      expect(mockRefreshUserToken).toHaveBeenCalledWith(testUser.id);
      expect(mockApiCall).toHaveBeenCalledWith('valid_token'); // Uses spotify_access_token
      expect(apiResult).toBe('api_result');
    });

    it('uses fallback token when spotify_access_token is not available', async () => {
      const testUser = createMockUser(1);
      const refreshResult = {
        user: { ...createMockUser(1), spotify_access_token: '' },
        token: 'fallback_token',
      };
      const mockApiCall = jest.fn().mockResolvedValue('api_result');
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockRefreshUserToken.mockResolvedValue(refreshResult);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const apiResult = await act(async () => {
        return await result.current.handleTokenExpiredError(
          tokenExpiredError,
          testUser,
          mockApiCall
        );
      });

      expect(mockApiCall).toHaveBeenCalledWith('fallback_token');
      expect(apiResult).toBe('api_result');
    });

    it('returns null for non-TOKEN_EXPIRED errors', async () => {
      const testUser = createMockUser(1);
      const mockApiCall = jest.fn();
      const otherError = new Error('OTHER_ERROR');

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const apiResult = await act(async () => {
        return await result.current.handleTokenExpiredError(otherError, testUser, mockApiCall);
      });

      expect(mockRefreshUserToken).not.toHaveBeenCalled();
      expect(mockApiCall).not.toHaveBeenCalled();
      expect(apiResult).toBeNull();
    });

    it('returns null when refresh fails', async () => {
      const testUser = createMockUser(1);
      const mockApiCall = jest.fn();
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockRefreshUserToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const apiResult = await act(async () => {
        return await result.current.handleTokenExpiredError(
          tokenExpiredError,
          testUser,
          mockApiCall
        );
      });

      expect(mockRefreshUserToken).toHaveBeenCalledWith(testUser.id);
      expect(mockApiCall).not.toHaveBeenCalled();
      expect(apiResult).toBeNull();
    });

    it('handles API call failure after successful refresh', async () => {
      const testUser = createMockUser(1);
      const refreshResult = {
        user: createMockUser(1),
        token: 'new_token',
      };
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API_FAILED'));
      const tokenExpiredError = new Error('TOKEN_EXPIRED');

      mockRefreshUserToken.mockResolvedValue(refreshResult);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      await act(async () => {
        await expect(
          result.current.handleTokenExpiredError(tokenExpiredError, testUser, mockApiCall)
        ).rejects.toThrow('API_FAILED');
      });

      expect(mockRefreshUserToken).toHaveBeenCalledWith(testUser.id);
      expect(mockApiCall).toHaveBeenCalledWith('valid_token');
    });
  });

  describe('Integration scenarios', () => {
    it('handles complex token refresh scenario', async () => {
      const expiredUser = createMockUser(1, true);
      const refreshedUser = createMockUser(1);
      const refreshResult = {
        user: refreshedUser,
        token: 'refresh_token_value',
      };

      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockRefreshUserToken.mockResolvedValue(refreshResult);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(expiredUser, 'auth_token', mockRefreshUserToken)
      );

      // First get valid token (should refresh)
      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toEqual({
        token: 'valid_token',
        user: refreshedUser,
      });

      // Then handle an error with the refreshed user
      const mockApiCall = jest.fn().mockResolvedValue('success');
      const error = new Error('TOKEN_EXPIRED');

      const errorResult = await act(async () => {
        return await result.current.handleTokenExpiredError(error, refreshedUser, mockApiCall);
      });

      expect(errorResult).toBe('success');
      expect(mockApiCall).toHaveBeenCalledWith('valid_token');
    });

    it('handles edge case with empty tokens', async () => {
      const userWithEmptyTokens = {
        ...createMockUser(1),
        spotify_access_token: '',
      };

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(userWithEmptyTokens, '', mockRefreshUserToken)
      );

      const tokenResult = await act(async () => {
        return await result.current.getValidToken();
      });

      expect(tokenResult).toBeNull();
    });

    it('handles null refresh result in error handler', async () => {
      const testUser = createMockUser(1);
      const mockApiCall = jest.fn();
      const error = new Error('TOKEN_EXPIRED');

      mockRefreshUserToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSpotifyTokenManagement(testUser, 'auth_token', mockRefreshUserToken)
      );

      const errorResult = await act(async () => {
        return await result.current.handleTokenExpiredError(error, testUser, mockApiCall);
      });

      expect(errorResult).toBeNull();
      expect(mockApiCall).not.toHaveBeenCalled();
    });
  });
});
