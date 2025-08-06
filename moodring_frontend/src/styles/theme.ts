export const theme = {
  colors: {
    background: {
      primary: '#1a0a1a',
      card: '#2a0a2a',
      nowPlaying: '#2a0a2a',
      track: '#4a1458',
      action: '#1a0a0a',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
      muted: 'rgba(255, 255, 255, 0.6)',
    },
    accent: {
      purple: '#8a2be2',
      cyan: '#00ffff',
      orange: '#ff6600',
      yellow: '#ffff00',
      pink: '#ff69b4',
      magenta: '#ff00aa',
    },
    gradients: {
      profile: ['#1a0a1a', '#0d0d0d', '#1a0a2e'],
      nowPlaying: ['#2a0a2a', '#0d0d0d', '#0a2a2a'],
      track: ['#4a1458', '#2d0a35', '#1a0a2a'],
      action: ['#1a0a0a', '#0d0d0d', '#2a0a1a'],
      error: ['#4a1458', '#2d0a35', '#1a0a2a'],
      features: ['#4a1458', '#2d0a35', '#1a0a2a'],
    },
    ui: {
      border: 'rgba(255, 255, 255, 0.1)',
      overlay: 'rgba(255, 255, 255, 0.1)',
      tag: 'rgba(138, 43, 226, 0.7)',
      tagRemove: 'rgba(255, 255, 255, 0.2)',
    },
    shadow: {
      default: '#000',
      purple: '#8a2be2',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 20,
    full: 40,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      xxl: 32,
      xxxl: 48,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '900',
    },
    letterSpacing: {
      sm: 1,
      md: 2,
      lg: 4,
    },
  },
  shadow: {
    default: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    purple: {
      shadowColor: '#8a2be2',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 12,
    },
    playing: {
      shadowColor: '#8a2be2',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      elevation: 4,
    },
  },
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 400,
    },
    spring: {
      tension: 100,
      friction: 8,
    },
  },
} as const;

export type Theme = typeof theme;