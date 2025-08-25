import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BackendUser } from '../types';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: BackendUser | null;
  authToken: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (_user: BackendUser | null) => void;
  setAuthToken: (_token: string | null) => void;
  setError: (_error: string | null) => void;
  logout: () => Promise<void>;
  refreshUserToken: (_userId: number) => Promise<{ user: BackendUser; token: string } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshPromise, setRefreshPromise] = useState<Promise<{ user: BackendUser; token: string } | null> | null>(null);

  const logout = async () => {
    await authService.clearStoredAuthData();
    setUser(null);
    setAuthToken(null);
    setError(null);
    setIsLoading(false);
  };

  const refreshUserToken = async (userId: number) => {
    // If there's already a refresh in progress, wait for it
    if (refreshPromise) {
      if (__DEV__) {
        console.log(`[AuthContext] Token refresh already in progress for user ${userId}, waiting...`);
      }
      return await refreshPromise;
    }

    // Create and store the refresh promise to prevent concurrent refreshes
    const promise = (async () => {
      try {
        if (__DEV__) {
          console.log(`[AuthContext] Starting new token refresh for user ${userId}`);
        }
        const refreshedAuth = await authService.refreshSpotifyToken(userId);
        setUser(refreshedAuth.user);
        setAuthToken(refreshedAuth.access_token);
        await authService.saveAuthData(refreshedAuth);
        
        return {
          user: refreshedAuth.user,
          token: refreshedAuth.access_token,
        };
      } catch (error) {
        if (__DEV__) {
          console.warn('[AuthContext] Token refresh failed:', error);
        }
        return null;
      } finally {
        // Clear the promise when done (success or failure)
        setRefreshPromise(null);
      }
    })();

    setRefreshPromise(promise);
    return await promise;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const savedAuth = await authService.loadSavedAuthData();
        if (savedAuth) {
          setUser(savedAuth.user);
          setAuthToken(savedAuth.access_token);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to load saved auth:', error);
        }
        await authService.clearStoredAuthData();
        setUser(null);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    authToken,
    isLoading,
    error,
    setUser,
    setAuthToken,
    setError,
    logout,
    refreshUserToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
