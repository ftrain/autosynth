/**
 * @file generator.ts
 * @brief LLM-friendly theme generation utilities
 *
 * This file provides utilities for generating themes programmatically,
 * making it easy for LLMs to create custom themes from natural language descriptions.
 */

import { SynthTheme } from '../types/theme';
import { vintageTheme } from './presets';

/**
 * Color manipulation utilities
 */

/**
 * Lighten a hex color by a percentage
 */
function lighten(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) * (1 + amount)));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * (1 + amount)));
  const b = Math.min(255, Math.floor((num & 0x0000FF) * (1 + amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Darken a hex color by a percentage
 */
// @ts-expect-error - Unused function kept for future use
function darken(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.floor((num >> 16) * (1 - amount));
  const g = Math.floor(((num >> 8) & 0x00FF) * (1 - amount));
  const b = Math.floor((num & 0x0000FF) * (1 - amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convert hex to rgba with alpha
 */
function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate a complete theme from a base color
 * Perfect for LLM use - just provide a primary color and get a full theme
 */
export function generateThemeFromColor(
  primaryColor: string,
  options: {
    id?: string;
    name?: string;
    description?: string;
    style?: 'dark' | 'light';
    saturation?: 'low' | 'medium' | 'high';
  } = {}
): SynthTheme {
  const {
    id = 'custom',
    name = 'Custom Theme',
    description = 'Generated theme',
    style = 'dark',
  } = options;

  const isDark = style === 'dark';

  // Generate background colors
  const backgrounds = isDark
    ? {
        darkest: '#0a0a0a',
        darker: '#1a1a1a',
        dark: '#2a2a2a',
        medium: '#3a3a3a',
        light: '#4a4a4a',
      }
    : {
        darkest: '#ffffff',
        darker: '#f5f5f5',
        dark: '#e5e5e5',
        medium: '#d5d5d5',
        light: '#c5c5c5',
      };

  // Generate text colors
  const texts = isDark
    ? {
        primary: '#ffffff',
        secondary: '#999999',
        tertiary: '#666666',
      }
    : {
        primary: '#000000',
        secondary: '#444444',
        tertiary: '#888888',
      };

  // Use primary color for accent
  const accent = {
    primary: primaryColor,
    secondary: lighten(primaryColor, 0.1),
    glow: hexToRgba(primaryColor, 0.4),
  };

  // Generate shadows appropriate for light/dark
  const shadowOpacity = isDark ? 0.6 : 0.2;
  const shadows = {
    inset: `inset 2px 2px 4px rgba(0,0,0,${shadowOpacity})`,
    raised: `2px 2px 6px rgba(0,0,0,${shadowOpacity + 0.1})`,
    pressed: `inset 3px 3px 6px rgba(0,0,0,${shadowOpacity + 0.2})`,
    glow: `0 0 20px ${hexToRgba(primaryColor, 0.6)}`,
  };

  // Generate gradients
  const gradients = {
    panel: [backgrounds.dark, backgrounds.darker] as [string, string],
    knob: [backgrounds.medium, backgrounds.dark] as [string, string],
    button: isDark
      ? (['#c8c4b8', '#b0ac9a'] as [string, string])
      : ([lighten(primaryColor, 0.3), lighten(primaryColor, 0.2)] as [string, string]),
    inset: [backgrounds.darker, backgrounds.dark] as [string, string],
  };

  return {
    id,
    name,
    description,
    colors: {
      background: backgrounds,
      text: texts,
      accent,
    },
    effects: {
      shadows,
      gradients,
    },
    typography: vintageTheme.typography,
    spacing: vintageTheme.spacing,
    borderRadius: vintageTheme.borderRadius,
    transitions: vintageTheme.transitions,
  };
}

/**
 * Generate a monochromatic theme from a single hue
 * LLM can specify just a hue (0-360) and get a full theme
 */
export function generateMonochromaticTheme(
  hue: number,
  options: {
    id?: string;
    name?: string;
    saturation?: number;
    lightness?: number;
  } = {}
): SynthTheme {
  const {
    id = 'monochrome',
    name = 'Monochrome Theme',
    saturation = 20,
    lightness = 15,
  } = options;

  // Generate HSL colors with same hue
  const backgrounds = {
    darkest: `hsl(${hue}, ${saturation}%, ${lightness * 0.4}%)`,
    darker: `hsl(${hue}, ${saturation}%, ${lightness * 0.8}%)`,
    dark: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    medium: `hsl(${hue}, ${saturation}%, ${lightness * 1.5}%)`,
    light: `hsl(${hue}, ${saturation}%, ${lightness * 2}%)`,
  };

  const texts = {
    primary: `hsl(${hue}, ${saturation * 0.5}%, 95%)`,
    secondary: `hsl(${hue}, ${saturation * 0.5}%, 70%)`,
    tertiary: `hsl(${hue}, ${saturation * 0.5}%, 50%)`,
  };

  const accent = {
    primary: `hsl(${hue}, ${saturation * 3}%, ${lightness * 3}%)`,
    secondary: `hsl(${hue}, ${saturation * 2.5}%, ${lightness * 3.5}%)`,
    glow: `hsla(${hue}, ${saturation * 3}%, ${lightness * 3}%, 0.4)`,
  };

  return {
    id,
    name,
    description: `Monochromatic theme based on hue ${hue}°`,
    colors: {
      background: backgrounds,
      text: texts,
      accent,
    },
    effects: {
      shadows: {
        inset: 'inset 2px 2px 4px rgba(0,0,0,0.6)',
        raised: '2px 2px 6px rgba(0,0,0,0.5)',
        pressed: 'inset 3px 3px 6px rgba(0,0,0,0.9)',
        glow: `0 0 20px ${accent.glow}`,
      },
      gradients: {
        panel: [backgrounds.dark, backgrounds.darker] as [string, string],
        knob: [backgrounds.medium, backgrounds.dark] as [string, string],
        button: [
          `hsl(${hue}, ${saturation * 2}%, 75%)`,
          `hsl(${hue}, ${saturation * 2}%, 65%)`,
        ] as [string, string],
        inset: [backgrounds.darker, backgrounds.dark] as [string, string],
      },
    },
    typography: vintageTheme.typography,
    spacing: vintageTheme.spacing,
    borderRadius: vintageTheme.borderRadius,
    transitions: vintageTheme.transitions,
  };
}

/**
 * Create a theme variant by modifying an existing theme
 * Useful for LLMs to make quick adjustments
 */
export function createThemeVariant(
  baseTheme: SynthTheme,
  overrides: Partial<SynthTheme>
): SynthTheme {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
      background: {
        ...baseTheme.colors.background,
        ...overrides.colors?.background,
      },
      text: {
        ...baseTheme.colors.text,
        ...overrides.colors?.text,
      },
      accent: {
        ...baseTheme.colors.accent,
        ...overrides.colors?.accent,
      },
    },
    effects: {
      ...baseTheme.effects,
      ...overrides.effects,
      shadows: {
        ...baseTheme.effects.shadows,
        ...overrides.effects?.shadows,
      },
      gradients: {
        ...baseTheme.effects.gradients,
        ...overrides.effects?.gradients,
      },
    },
  };
}

/**
 * LLM helper: Generate theme from natural language description
 * This provides a simple interface for LLMs to create themes
 *
 * Example usage by LLM:
 * ```
 * const theme = generateThemeFromDescription({
 *   colors: {
 *     primary: '#ff6b35',  // orange
 *     background: 'dark',
 *   },
 *   style: 'retro',
 *   name: 'Sunset Synth'
 * });
 * ```
 */
export function generateThemeFromDescription(config: {
  colors: {
    primary: string;
    background?: 'dark' | 'light';
    secondary?: string;
  };
  style?: 'modern' | 'retro' | 'cyberpunk' | 'minimal';
  name: string;
  description?: string;
}): SynthTheme {
  const { colors, style = 'modern', name, description } = config;
  const baseTheme = generateThemeFromColor(colors.primary, {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description: description || `Custom ${style} theme`,
    style: colors.background || 'dark',
  });

  // Apply style-specific adjustments
  switch (style) {
    case 'cyberpunk':
      return createThemeVariant(baseTheme, {
        effects: {
          ...baseTheme.effects,
          shadows: {
            ...baseTheme.effects.shadows,
            glow: `0 0 30px ${hexToRgba(colors.primary, 0.8)}, 0 0 60px ${hexToRgba(colors.primary, 0.4)}`,
          },
        },
        transitions: {
          fast: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          normal: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      });

    case 'minimal':
      return createThemeVariant(baseTheme, {
        borderRadius: {
          sm: 2,
          md: 4,
          lg: 6,
          round: '50%',
        },
        effects: {
          ...baseTheme.effects,
          shadows: {
            inset: 'inset 1px 1px 2px rgba(0,0,0,0.1)',
            raised: '1px 1px 3px rgba(0,0,0,0.2)',
            pressed: 'inset 2px 2px 4px rgba(0,0,0,0.15)',
            glow: baseTheme.effects.shadows.glow,
          },
        },
      });

    case 'retro':
      return createThemeVariant(baseTheme, {
        borderRadius: {
          sm: 3,
          md: 4,
          lg: 8,
          round: '50%',
        },
      });

    default:
      return baseTheme;
  }
}
