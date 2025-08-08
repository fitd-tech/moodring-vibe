import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileMenu } from '../ProfileMenu';
import { BackendUser } from '../../../types';

const mockUser: BackendUser = {
  id: 123,
  spotify_id: 'test_user_123',
  email: 'test@example.com',
  display_name: 'Test User',
  profile_image_url: 'https://example.com/profile.jpg',
  spotify_access_token: 'access-token',
  spotify_refresh_token: 'refresh-token',
  token_expires_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ProfileMenu', () => {
  const defaultProps = {
    user: mockUser,
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile button with user image', () => {
    render(<ProfileMenu {...defaultProps} />);
    
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
  });

  it('renders profile button with avatar placeholder when no image', () => {
    const userWithoutImage: BackendUser = {
      ...mockUser,
      profile_image_url: null,
    };
    
    render(<ProfileMenu {...defaultProps} user={userWithoutImage} />);
    
    expect(screen.getByTestId('profile-menu-button')).toBeTruthy();
    expect(screen.getByText('T')).toBeTruthy(); // First letter of display name
  });

  it('opens menu when profile button is pressed', () => {
    render(<ProfileMenu {...defaultProps} />);
    
    fireEvent.press(screen.getByTestId('profile-menu-button'));
    
    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('renders all menu options', () => {
    render(<ProfileMenu {...defaultProps} />);
    
    fireEvent.press(screen.getByTestId('profile-menu-button'));
    
    expect(screen.getByText('Create playlist')).toBeTruthy();
    expect(screen.getByText('Browse tags')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Log out')).toBeTruthy();
  });

  it('calls onCreatePlaylist when create playlist option is pressed', () => {
    const onCreatePlaylist = jest.fn();
    render(<ProfileMenu {...defaultProps} onCreatePlaylist={onCreatePlaylist} />);
    
    fireEvent.press(screen.getByTestId('profile-menu-button'));
    fireEvent.press(screen.getByTestId('menu-option-create-playlist'));
    
    expect(onCreatePlaylist).toHaveBeenCalledTimes(1);
  });

  it('calls onBrowseTags when browse tags option is pressed', () => {
    const onBrowseTags = jest.fn();
    render(<ProfileMenu {...defaultProps} onBrowseTags={onBrowseTags} />);
    
    fireEvent.press(screen.getByTestId('profile-menu-button'));
    fireEvent.press(screen.getByTestId('menu-option-browse-tags'));
    
    expect(onBrowseTags).toHaveBeenCalledTimes(1);
  });

  it('calls onSettings when settings option is pressed', () => {
    const onSettings = jest.fn();
    render(<ProfileMenu {...defaultProps} onSettings={onSettings} />);
    
    fireEvent.press(screen.getByTestId('profile-menu-button'));
    fireEvent.press(screen.getByTestId('menu-option-settings'));
    
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when log out option is pressed', () => {
    const onLogout = jest.fn();
    render(<ProfileMenu {...defaultProps} onLogout={onLogout} />);
    
    fireEvent.press(screen.getByTestId('profile-menu-button'));
    fireEvent.press(screen.getByTestId('menu-option-logout'));
    
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});