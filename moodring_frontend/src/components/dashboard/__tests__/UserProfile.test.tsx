import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';
import { BackendUser } from '../../../types';

const mockUserWithImage: BackendUser = {
  id: 1,
  spotify_id: 'test_user',
  email: 'test@example.com',
  display_name: 'Test User',
  profile_image_url: 'https://example.com/avatar.jpg',
  spotify_access_token: 'access-token',
  spotify_refresh_token: 'refresh-token',
  token_expires_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUserWithoutImage: BackendUser = {
  id: 2,
  spotify_id: 'no_image_user',
  email: 'noimage@example.com',
  display_name: 'No Image User',
  profile_image_url: null,
  spotify_access_token: 'access-token',
  spotify_refresh_token: 'refresh-token',
  token_expires_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUserWithoutDisplayName: BackendUser = {
  id: 3,
  spotify_id: 'spotify_user_123',
  email: 'nodisplay@example.com',
  display_name: null,
  profile_image_url: null,
  spotify_access_token: 'access-token',
  spotify_refresh_token: 'refresh-token',
  token_expires_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('UserProfile', () => {
  it('renders user profile with image correctly', () => {
    const { UNSAFE_getByType } = render(<UserProfile user={mockUserWithImage} />);

    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
    
    const image = UNSAFE_getByType(require('react-native').Image);
    expect(image.props.source.uri).toBe('https://example.com/avatar.jpg');
  });

  it('renders user profile without image (shows avatar placeholder)', () => {
    render(<UserProfile user={mockUserWithoutImage} />);

    expect(screen.getByText('No Image User')).toBeTruthy();
    expect(screen.getByText('noimage@example.com')).toBeTruthy();
    
    // Should show first letter of display name as avatar placeholder
    expect(screen.getByText('N')).toBeTruthy();
  });

  it('renders user profile without display name (uses spotify_id)', () => {
    render(<UserProfile user={mockUserWithoutDisplayName} />);

    expect(screen.getByText('spotify_user_123')).toBeTruthy();
    expect(screen.getByText('nodisplay@example.com')).toBeTruthy();
    
    // Should show first letter of spotify_id as avatar placeholder
    expect(screen.getByText('S')).toBeTruthy();
  });

  it('displays display_name when available', () => {
    render(<UserProfile user={mockUserWithImage} />);

    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.queryByText('test_user')).toBeNull();
  });

  it('falls back to spotify_id when display_name is null', () => {
    render(<UserProfile user={mockUserWithoutDisplayName} />);

    expect(screen.getByText('spotify_user_123')).toBeTruthy();
    expect(screen.queryByText('No Display Name')).toBeNull();
  });

  it('renders profile image when profile_image_url is provided', () => {
    const { UNSAFE_getByType } = render(<UserProfile user={mockUserWithImage} />);
    
    const image = UNSAFE_getByType(require('react-native').Image);
    expect(image).toBeTruthy();
    expect(image.props.source.uri).toBe('https://example.com/avatar.jpg');
  });

  it('renders avatar placeholder when profile_image_url is null', () => {
    render(<UserProfile user={mockUserWithoutImage} />);
    
    // Should not render Image component
    expect(() => screen.UNSAFE_getByType(require('react-native').Image)).toThrow();
    
    // Should render avatar placeholder
    expect(screen.getByText('N')).toBeTruthy();
  });

  it('shows correct avatar placeholder for display_name', () => {
    const userWithLowerCaseName: BackendUser = {
      ...mockUserWithoutImage,
      display_name: 'john doe',
    };

    render(<UserProfile user={userWithLowerCaseName} />);

    // Should uppercase the first letter
    expect(screen.getByText('J')).toBeTruthy();
  });

  it('shows correct avatar placeholder for spotify_id when no display_name', () => {
    const userWithLowerCaseSpotifyId: BackendUser = {
      ...mockUserWithoutDisplayName,
      spotify_id: 'lowercase_spotify_user',
    };

    render(<UserProfile user={userWithLowerCaseSpotifyId} />);

    // Should uppercase the first letter of spotify_id
    expect(screen.getByText('L')).toBeTruthy();
  });

  it('renders email correctly', () => {
    render(<UserProfile user={mockUserWithImage} />);

    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('handles edge case where display_name is empty string', () => {
    const userWithEmptyDisplayName: BackendUser = {
      ...mockUserWithoutImage,
      display_name: '',
    };

    render(<UserProfile user={userWithEmptyDisplayName} />);

    // Should fall back to spotify_id
    expect(screen.getByText('no_image_user')).toBeTruthy();
    // Avatar should use first letter of spotify_id
    expect(screen.getByText('N')).toBeTruthy();
  });
});