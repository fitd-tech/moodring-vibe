import { authService } from '../../services/authService';
// SpotifyTokenResult type imported but used in external modules only
import { BackendUser } from '../../types';

export const useSpotifyTokenManagement = (
  user: BackendUser | null,
  authToken: string | null,
  refreshUserToken: (_userId: number) => Promise<{ user: BackendUser; token: string } | null>
) => {
  const getValidToken = async (
    currentUser?: BackendUser,
    currentToken?: string
  ): Promise<{ token: string; user: BackendUser } | null> => {
    const activeUser = currentUser || user;
    const activeToken = currentToken || authToken;

    if (!activeUser || !activeToken) return null;

    let spotifyToken = activeUser.spotify_access_token || activeToken;
    let validUser = activeUser;

    if (authService.isTokenExpired(activeUser)) {
      const refreshResult = await refreshUserToken(activeUser.id);
      if (refreshResult) {
        spotifyToken = refreshResult.user.spotify_access_token || refreshResult.token;
        validUser = refreshResult.user;
      }
    }

    return { token: spotifyToken, user: validUser };
  };

  const handleTokenExpiredError = async <T>(
    error: unknown,
    activeUser: BackendUser,
    apiCall: (_token: string) => Promise<T>
  ): Promise<T | null> => {
    if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
      const refreshResult = await refreshUserToken(activeUser.id);
      if (refreshResult) {
        return apiCall(refreshResult.user.spotify_access_token || refreshResult.token);
      }
    }
    return null;
  };

  return {
    getValidToken,
    handleTokenExpiredError,
  };
};