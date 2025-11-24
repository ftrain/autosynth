/**
 * @file theme.ts
 * @brief TypeScript type definitions for theming system
 */

/**
 * Color palette for backgrounds
 */
export interface BackgroundColors {
  darkest: string;
  darker: string;
  dark: string;
  medium: string;
  light: string;
}

/**
 * Color palette for text
 */
export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

/**
 * Accent colors with optional secondary and glow
 */
export interface AccentColors {
  primary: string;
  secondary?: string;
  glow: string;
}

/**
 * Shadow definitions
 */
export interface ShadowEffects {
  inset: string;
  raised: string;
  pressed: string;
  glow: string;
}

/**
 * Gradient definitions (stored as [start, end] tuples)
 */
export interface GradientEffects {
  panel: [string, string];
  knob: [string, string];
  button: [string, string];
  inset: [string, string];
}

/**
 * Typography settings
 */
export interface Typography {
  fontFamily: string;
  monoFamily?: string;
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

/**
 * Spacing scale
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Border radius values
 */
export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  round: string;
}

/**
 * Transition timing
 */
export interface Transitions {
  fast: string;
  normal: string;
  slow: string;
}

/**
 * Complete theme definition
 */
export interface SynthTheme {
  /** Unique theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the theme */
  description: string;
  /** Color palette */
  colors: {
    background: BackgroundColors;
    text: TextColors;
    accent: AccentColors;
  };
  /** Visual effects */
  effects: {
    shadows: ShadowEffects;
    gradients: GradientEffects;
  };
  /** Typography settings */
  typography: Typography;
  /** Spacing scale */
  spacing: Spacing;
  /** Border radius values */
  borderRadius: BorderRadius;
  /** Transition timing */
  transitions: Transitions;
}

/**
 * Partial theme for overrides
 */
export type ThemeOverride = Partial<SynthTheme>;

/**
 * Theme preset name
 */
export type ThemePreset = 'vintage' | 'cyberpunk' | 'analog' | 'minimal' | 'nord' | 'solarized';
