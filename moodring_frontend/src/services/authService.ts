import * as SecureStore from 'expo-secure-store';
import { BackendAuthResponse, BackendUser } from '../types';

export class AuthService {
  private readonly AUTH_KEY = 'moodring_auth';
  private readonly LEGACY_TOKEN_KEY = 'spotify_tokens';

  async authenticateWithBackend(code: string, codeVerifier: string): Promise<BackendAuthResponse> {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/auth/spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend authentication failed: ${response.status} - ${errorText}`);
      }

      const authData = await response.json();
      return authData;
    } catch (err) {
      throw new Error(`Failed to authenticate with backend: ${err}`);
    }
  }

  async refreshSpotifyToken(userId: number): Promise<BackendAuthResponse> {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/auth/refresh/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const authData = await response.json();
      return authData;
    } catch (err) {
      throw new Error(`Failed to refresh token: ${err}`);
    }
  }

  async saveAuthData(authData: BackendAuthResponse): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.AUTH_KEY, JSON.stringify(authData));
    } catch (error) {
      if (__DEV__) {
        console.warn('Error saving auth data:', error);
      }
    }
  }

  async loadSavedAuthData(): Promise<BackendAuthResponse | null> {
    try {
      const authString = await SecureStore.getItemAsync(this.AUTH_KEY);
      if (authString) {
        return JSON.parse(authString);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Error loading saved auth data:', error);
      }
    }
    return null;
  }

  async clearStoredAuthData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.AUTH_KEY);
      await SecureStore.deleteItemAsync(this.LEGACY_TOKEN_KEY);
    } catch (error) {
      if (__DEV__) {
        console.warn('Error clearing auth data:', error);
      }
    }
  }

  isTokenExpired(user: BackendUser): boolean {
    if (!user.token_expires_at) {
      return true;
    }
    const expiryTime = new Date(user.token_expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();
    return timeUntilExpiry <= bufferTime;
  }
}

export const authService = new AuthService();