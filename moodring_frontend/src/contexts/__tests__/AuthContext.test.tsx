import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';
import { Text } from 'react-native';

// Mock authService
jest.mock('../../services/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component to access auth context
const TestComponent: React.FC = () => {
  const { 
    user, 
    authToken, 
    isLoading, 
    error, 
    setUser, 
    setAuthToken, 
    setError, 
    logout 
  } = useAuth();

  return (
    <>
      <Text testID="user">{user ? user.display_name : 'No user'}</Text>
      <Text testID="token">{authToken || 'No token'}</Text>
      <Text testID="loading">{isLoading ? 'Loading' : 'Not loading'}</Text>
      <Text testID="error">{error || 'No error'}</Text>
      <Text testID="setUser" onPress={() => setUser({
        id: 1,
        spotify_id: 'test_user',
        email: 'test@example.com',
        display_name: 'Test User',
        profile_image_url: null,
        spotify_access_token: 'access-token',
        spotify_refresh_token: 'refresh-token',
        token_expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })}>Set User</Text>
      <Text testID="setToken" onPress={() => setAuthToken('test-token')}>Set Token</Text>
      <Text testID="setError" onPress={() => setError('Test error')}>Set Error</Text>
      <Text testID="logout" onPress={() => logout()}>Logout</Text>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state values', () => {
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').children[0]).toBe('No user');
    expect(getByTestId('token').children[0]).toBe('No token');
    expect(getByTestId('error').children[0]).toBe('No error');
  });

  it('loads stored auth data on initialization', async () => {
    const mockAuthData = {
      user: {
        id: 1,
        spotify_id: 'stored_user',
        email: 'stored@example.com',
        display_name: 'Stored User',
        profile_image_url: null,
        spotify_access_token: 'stored-access-token',
        spotify_refresh_token: 'stored-refresh-token',
        token_expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      access_token: 'stored-token',
    };

    mockAuthService.loadSavedAuthData.mockResolvedValue(mockAuthData);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('user').children[0]).toBe('Stored User');
      expect(getByTestId('token').children[0]).toBe('stored-token');
      expect(getByTestId('loading').children[0]).toBe('Not loading');
    });
  });

  it('handles error when loading stored auth data fails', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockAuthService.loadSavedAuthData.mockRejectedValue(new Error('Storage error'));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('Not loading');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load saved auth:', expect.any(Error));
    });

    consoleWarnSpy.mockRestore();
  });

  it('handles logout successfully', async () => {
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);
    mockAuthService.clearStoredAuthData.mockResolvedValue();

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('Not loading');
    });

    // Set user and token first
    const setUserText = getByTestId('setUser');
    const setTokenText = getByTestId('setToken');
    
    setUserText.props.onPress();
    setTokenText.props.onPress();

    // Now logout
    const logoutText = getByTestId('logout');
    await waitFor(() => {
      logoutText.props.onPress();
    });

    await waitFor(() => {
      expect(mockAuthService.clearStoredAuthData).toHaveBeenCalled();
      expect(getByTestId('user').children[0]).toBe('No user');
      expect(getByTestId('token').children[0]).toBe('No token');
    });
  });


  it('updates user state when setUser is called', async () => {
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('Not loading');
    });

    const setUserText = getByTestId('setUser');
    setUserText.props.onPress();

    await waitFor(() => {
      expect(getByTestId('user').children[0]).toBe('Test User');
    });
  });

  it('updates token state when setAuthToken is called', async () => {
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('Not loading');
    });

    const setTokenText = getByTestId('setToken');
    setTokenText.props.onPress();

    await waitFor(() => {
      expect(getByTestId('token').children[0]).toBe('test-token');
    });
  });

  it('updates error state when setError is called', async () => {
    mockAuthService.loadSavedAuthData.mockResolvedValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('Not loading');
    });

    const setErrorText = getByTestId('setError');
    setErrorText.props.onPress();

    await waitFor(() => {
      expect(getByTestId('error').children[0]).toBe('Test error');
    });
  });

  it('maintains loading state during initialization', () => {
    // Mock a delayed response to test loading state
    mockAuthService.loadSavedAuthData.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(null), 100))
    );

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('loading').children[0]).toBe('Loading');
  });
});