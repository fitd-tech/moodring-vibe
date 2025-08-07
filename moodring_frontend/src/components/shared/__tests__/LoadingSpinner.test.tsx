import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingSpinner } from '../LoadingSpinner';
import { theme } from '../../../styles/theme';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Custom loading text" />);
    
    expect(screen.getByText('Custom loading text')).toBeTruthy();
  });

  it('renders in compact mode with horizontal layout', () => {
    render(<LoadingSpinner text="Refreshing..." compact />);
    
    const text = screen.getByText('Refreshing...');
    const container = text.parent;
    
    expect(text).toBeTruthy();
    expect(container).toHaveStyle({
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    });
  });

  it('renders in non-compact mode with vertical layout', () => {
    render(<LoadingSpinner text="Loading..." compact={false} />);
    
    const text = screen.getByText('Loading...');
    expect(text).toBeTruthy();
    
    // In non-compact mode, the component should use the regular container style
    // We can verify this by checking if the compact style is NOT applied
    expect(text.parent).not.toHaveStyle({
      flexDirection: 'row',
    });
  });

  it('applies compact text styling when compact=true', () => {
    render(<LoadingSpinner text="Compact text" compact />);
    
    const text = screen.getByText('Compact text');
    expect(text).toHaveStyle({
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    });
  });

  it('applies regular text styling when compact=false', () => {
    render(<LoadingSpinner text="Regular text" compact={false} />);
    
    const text = screen.getByText('Regular text');
    expect(text).toHaveStyle({
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
    });
  });

  it('renders with small size when specified', () => {
    render(<LoadingSpinner size="small" />);
    
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders with large size when specified', () => {
    render(<LoadingSpinner size="large" />);
    
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders with custom color when specified', () => {
    const customColor = '#ff0000';
    render(<LoadingSpinner color={customColor} />);
    
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('combines all props correctly', () => {
    render(
      <LoadingSpinner
        text="Custom compact loading"
        size="small"
        color={theme.colors.accent.cyan}
        compact
      />
    );
    
    const text = screen.getByText('Custom compact loading');
    expect(text).toBeTruthy();
    expect(text.parent).toHaveStyle({
      flexDirection: 'row',
    });
  });
});