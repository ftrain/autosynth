/**
 * @file presets.ts
 * @brief Pre-defined theme presets
 */

import { SynthTheme } from '../types/theme';

/**
 * Vintage Dark theme (default)
 * Classic black and white synthesizer aesthetic
 */
export const vintageTheme: SynthTheme = {
  id: 'vintage',
  name: 'Vintage Dark',
  description: 'Classic black and white synth aesthetic inspired by vintage hardware',
  colors: {
    background: {
      darkest: '#0a0a0a',
      darker: '#1a1a1a',
      dark: '#2a2a2a',
      medium: '#3a3a3a',
      light: '#4a4a4a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#999999',
      tertiary: '#666666',
    },
    accent: {
      primary: '#2563eb',
      secondary: '#3b82f6',
      glow: 'rgba(37, 99, 235, 0.4)',
    },
  },
  effects: {
    shadows: {
      inset: 'inset 2px 2px 4px rgba(0,0,0,0.6)',
      raised: '2px 2px 6px rgba(0,0,0,0.5)',
      pressed: 'inset 3px 3px 6px rgba(0,0,0,0.9), inset -2px -2px 4px rgba(60,60,60,0.2)',
      glow: '0 0 20px rgba(255, 255, 255, 0.6)',
    },
    gradients: {
      panel: ['#2a2a2a', '#1a1a1a'],
      knob: ['#3a3a3a', '#252525'],
      button: ['#c8c4b8', '#b0ac9a'],
      inset: ['#1a1a1a', '#2a2a2a'],
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    monoFamily: '"Courier New", "Monaco", monospace',
    sizes: {
      xs: 8,
      sm: 10,
      md: 11,
      lg: 13,
      xl: 14,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  borderRadius: {
    sm: 3,
    md: 4,
    lg: 8,
    round: '50%',
  },
  transitions: {
    fast: 'all 0.1s ease',
    normal: 'all 0.15s ease',
    slow: 'all 0.2s ease',
  },
};

/**
 * Cyberpunk theme
 * Neon colors with dark purple backgrounds
 */
export const cyberpunkTheme: SynthTheme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon-infused dark theme with cyberpunk aesthetics',
  colors: {
    background: {
      darkest: '#0a0015',
      darker: '#1a0030',
      dark: '#2a0045',
      medium: '#3a0060',
      light: '#4a0075',
    },
    text: {
      primary: '#00ff9f',
      secondary: '#00ffff',
      tertiary: '#00aa66',
    },
    accent: {
      primary: '#00ff9f',
      secondary: '#00ffff',
      glow: 'rgba(0, 255, 159, 0.6)',
    },
  },
  effects: {
    shadows: {
      inset: 'inset 2px 2px 4px rgba(0,0,0,0.8)',
      raised: '2px 2px 8px rgba(0, 255, 159, 0.3)',
      pressed: 'inset 3px 3px 6px rgba(0,0,0,0.95)',
      glow: '0 0 30px rgba(0, 255, 159, 0.8), 0 0 60px rgba(0, 255, 159, 0.4)',
    },
    gradients: {
      panel: ['#2a0045', '#1a0030'],
      knob: ['#3a0060', '#2a0045'],
      button: ['#00ff9f', '#00aa66'],
      inset: ['#1a0030', '#2a0045'],
    },
  },
  typography: vintageTheme.typography,
  spacing: vintageTheme.spacing,
  borderRadius: vintageTheme.borderRadius,
  transitions: {
    fast: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Analog Warm theme
 * Warm browns and oranges inspired by vintage analog gear
 */
export const analogTheme: SynthTheme = {
  id: 'analog',
  name: 'Analog Warm',
  description: 'Warm, vintage aesthetic inspired by classic analog synthesizers',
  colors: {
    background: {
      darkest: '#1a0f00',
      darker: '#2a1f10',
      dark: '#3a2f20',
      medium: '#4a3f30',
      light: '#5a4f40',
    },
    text: {
      primary: '#fff5e0',
      secondary: '#d4af37',
      tertiary: '#aa8844',
    },
    accent: {
      primary: '#ff6b35',
      secondary: '#ff8c42',
      glow: 'rgba(255, 107, 53, 0.5)',
    },
  },
  effects: {
    shadows: {
      inset: 'inset 2px 2px 4px rgba(0,0,0,0.6)',
      raised: '2px 2px 6px rgba(0,0,0,0.7)',
      pressed: 'inset 3px 3px 6px rgba(0,0,0,0.9)',
      glow: '0 0 20px rgba(255, 107, 53, 0.6)',
    },
    gradients: {
      panel: ['#3a2f20', '#2a1f10'],
      knob: ['#4a3f30', '#3a2f20'],
      button: ['#d4af37', '#aa8844'],
      inset: ['#2a1f10', '#3a2f20'],
    },
  },
  typography: vintageTheme.typography,
  spacing: vintageTheme.spacing,
  borderRadius: vintageTheme.borderRadius,
  transitions: vintageTheme.transitions,
};

/**
 * Minimal theme
 * Clean, light interface with minimal styling
 */
export const minimalTheme: SynthTheme = {
  id: 'minimal',
  name: 'Minimal Light',
  description: 'Clean, minimalist light theme for modern interfaces',
  colors: {
    background: {
      darkest: '#ffffff',
      darker: '#f5f5f5',
      dark: '#e5e5e5',
      medium: '#d5d5d5',
      light: '#c5c5c5',
    },
    text: {
      primary: '#000000',
      secondary: '#444444',
      tertiary: '#888888',
    },
    accent: {
      primary: '#0066cc',
      secondary: '#0080ff',
      glow: 'rgba(0, 102, 204, 0.3)',
    },
  },
  effects: {
    shadows: {
      inset: 'inset 1px 1px 2px rgba(0,0,0,0.1)',
      raised: '1px 1px 3px rgba(0,0,0,0.2)',
      pressed: 'inset 2px 2px 4px rgba(0,0,0,0.15)',
      glow: '0 0 15px rgba(0, 102, 204, 0.4)',
    },
    gradients: {
      panel: ['#e5e5e5', '#f5f5f5'],
      knob: ['#d5d5d5', '#e5e5e5'],
      button: ['#ffffff', '#f0f0f0'],
      inset: ['#f5f5f5', '#e5e5e5'],
    },
  },
  typography: vintageTheme.typography,
  spacing: vintageTheme.spacing,
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 6,
    round: '50%',
  },
  transitions: vintageTheme.transitions,
};

/**
 * Nord theme
 * Popular Nord color palette
 */
export const nordTheme: SynthTheme = {
  id: 'nord',
  name: 'Nord',
  description: 'Arctic, north-bluish color palette',
  colors: {
    background: {
      darkest: '#2e3440',
      darker: '#3b4252',
      dark: '#434c5e',
      medium: '#4c566a',
      light: '#5e6b82',
    },
    text: {
      primary: '#eceff4',
      secondary: '#d8dee9',
      tertiary: '#a3be8c',
    },
    accent: {
      primary: '#88c0d0',
      secondary: '#81a1c1',
      glow: 'rgba(136, 192, 208, 0.4)',
    },
  },
  effects: {
    shadows: {
      inset: 'inset 2px 2px 4px rgba(0,0,0,0.4)',
      raised: '2px 2px 6px rgba(0,0,0,0.5)',
      pressed: 'inset 3px 3px 6px rgba(0,0,0,0.7)',
      glow: '0 0 20px rgba(136, 192, 208, 0.5)',
    },
    gradients: {
      panel: ['#434c5e', '#3b4252'],
      knob: ['#4c566a', '#434c5e'],
      button: ['#88c0d0', '#5e81ac'],
      inset: ['#3b4252', '#434c5e'],
    },
  },
  typography: vintageTheme.typography,
  spacing: vintageTheme.spacing,
  borderRadius: vintageTheme.borderRadius,
  transitions: vintageTheme.transitions,
};

/**
 * Solarized Dark theme
 * Popular Solarized color scheme
 */
export const solarizedTheme: SynthTheme = {
  id: 'solarized',
  name: 'Solarized Dark',
  description: 'Precision colors for machines and people',
  colors: {
    background: {
      darkest: '#002b36',
      darker: '#073642',
      dark: '#0e4652',
      medium: '#155663',
      light: '#1c6674',
    },
    text: {
      primary: '#fdf6e3',
      secondary: '#93a1a1',
      tertiary: '#657b83',
    },
    accent: {
      primary: '#268bd2',
      secondary: '#2aa198',
      glow: 'rgba(38, 139, 210, 0.4)',
    },
  },
  effects: {
    shadows: {
      inset: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
      raised: '2px 2px 6px rgba(0,0,0,0.6)',
      pressed: 'inset 3px 3px 6px rgba(0,0,0,0.8)',
      glow: '0 0 20px rgba(38, 139, 210, 0.5)',
    },
    gradients: {
      panel: ['#0e4652', '#073642'],
      knob: ['#155663', '#0e4652'],
      button: ['#268bd2', '#2aa198'],
      inset: ['#073642', '#0e4652'],
    },
  },
  typography: vintageTheme.typography,
  spacing: vintageTheme.spacing,
  borderRadius: vintageTheme.borderRadius,
  transitions: vintageTheme.transitions,
};

/**
 * All available theme presets
 */
export const THEME_PRESETS: Record<string, SynthTheme> = {
  vintage: vintageTheme,
  cyberpunk: cyberpunkTheme,
  analog: analogTheme,
  minimal: minimalTheme,
  nord: nordTheme,
  solarized: solarizedTheme,
};

/**
 * Get theme by ID
 */
export function getTheme(id: string): SynthTheme | undefined {
  return THEME_PRESETS[id];
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Object.keys(THEME_PRESETS);
}
