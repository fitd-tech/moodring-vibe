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

  async refreshSpotifyToken(userId: number, retryAttempt = 0): Promise<BackendAuthResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      if (__DEV__) {
        console.log(`[AuthService] Refreshing token for user ${userId} (attempt ${retryAttempt + 1}/${maxRetries + 1})...`);
      }

      // Create timeout mechanism compatible with React Native
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 10000); // 10 second timeout

      try {
        const response = await fetch(`${backendUrl}/auth/refresh/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Use React Native compatible AbortController
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Parse the error to determine if it's retryable
          const isRetryable = this.isRetryableError(response.status, errorText);
          
          if (__DEV__) {
            console.warn(`[AuthService] Token refresh failed with backend ${response.status} error (retryable: ${isRetryable}):`, errorText);
          }

          // If retryable and we haven't exhausted retries, wait and retry
          if (isRetryable && retryAttempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryAttempt); // Exponential backoff
            if (__DEV__) {
              console.log(`[AuthService] Retrying token refresh in ${delay}ms...`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.refreshSpotifyToken(userId, retryAttempt + 1);
          }

          throw new Error(`Token refresh failed with backend ${response.status} error: ${errorText}`);
        }

        const authData = await response.json();
        if (__DEV__) {
          console.log(`[AuthService] Token refresh successful for user ${userId} after ${retryAttempt + 1} attempt(s)`);
        }
        return authData;
      } finally {
        // Always clear timeout regardless of outcome
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // Handle timeout and network errors
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message.includes('timeout')) {
          if (__DEV__) {
            console.warn(`[AuthService] Token refresh timeout (attempt ${retryAttempt + 1})`);
          }
          if (retryAttempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryAttempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.refreshSpotifyToken(userId, retryAttempt + 1);
          }
        }
      }

      if (__DEV__) {
        console.error(`[AuthService] Token refresh failed after ${retryAttempt + 1} attempt(s):`, err);
      }
      throw new Error(`Failed to refresh token: ${err}`);
    }
  }

  private isRetryableError(status: number, errorText: string): boolean {
    // 500 Internal Server Error - often temporary
    if (status === 500) return true;
    
    // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    if (status >= 502 && status <= 504) return true;
    
    // Specific Spotify errors that are often temporary
    if (errorText.includes('Failed to remove token')) return true;
    if (errorText.includes('server_error')) return true;
    if (errorText.includes('temporarily_unavailable')) return true;
    
    // Network/connection errors
    if (errorText.includes('network')) return true;
    if (errorText.includes('timeout')) return true;
    
    return false;
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
