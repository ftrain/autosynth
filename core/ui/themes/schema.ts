/**
 * @file schema.ts
 * @brief Theme schema and utilities
 */

import { SynthTheme } from '../types/theme';

/**
 * Apply a theme to the document
 * Sets CSS custom properties on the root element
 */
export function applyTheme(theme: SynthTheme): void {
  const root = document.documentElement;

  // Apply background colors
  root.style.setProperty('--synth-bg-darkest', theme.colors.background.darkest);
  root.style.setProperty('--synth-bg-darker', theme.colors.background.darker);
  root.style.setProperty('--synth-bg-dark', theme.colors.background.dark);
  root.style.setProperty('--synth-bg-medium', theme.colors.background.medium);
  root.style.setProperty('--synth-bg-light', theme.colors.background.light);

  // Apply text colors
  root.style.setProperty('--synth-text-primary', theme.colors.text.primary);
  root.style.setProperty('--synth-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--synth-text-tertiary', theme.colors.text.tertiary);

  // Apply accent colors
  root.style.setProperty('--synth-accent-primary', theme.colors.accent.primary);
  if (theme.colors.accent.secondary) {
    root.style.setProperty('--synth-accent-secondary', theme.colors.accent.secondary);
  }
  root.style.setProperty('--synth-accent-glow', theme.colors.accent.glow);

  // Apply gradients
  root.style.setProperty(
    '--synth-gradient-panel',
    `linear-gradient(145deg, ${theme.effects.gradients.panel[0]}, ${theme.effects.gradients.panel[1]})`
  );
  root.style.setProperty(
    '--synth-gradient-knob',
    `linear-gradient(145deg, ${theme.effects.gradients.knob[0]}, ${theme.effects.gradients.knob[1]})`
  );
  root.style.setProperty(
    '--synth-gradient-button',
    `linear-gradient(145deg, ${theme.effects.gradients.button[0]}, ${theme.effects.gradients.button[1]})`
  );

  // Apply shadows
  root.style.setProperty('--synth-shadow-inset', theme.effects.shadows.inset);
  root.style.setProperty('--synth-shadow-raised', theme.effects.shadows.raised);
  root.style.setProperty('--synth-shadow-pressed', theme.effects.shadows.pressed);
  root.style.setProperty('--synth-shadow-glow', theme.effects.shadows.glow);

  // Apply typography
  root.style.setProperty('--synth-font-sans', theme.typography.fontFamily);
  if (theme.typography.monoFamily) {
    root.style.setProperty('--synth-font-mono', theme.typography.monoFamily);
  }
  root.style.setProperty('--synth-font-size-xs', `${theme.typography.sizes.xs}px`);
  root.style.setProperty('--synth-font-size-sm', `${theme.typography.sizes.sm}px`);
  root.style.setProperty('--synth-font-size-md', `${theme.typography.sizes.md}px`);
  root.style.setProperty('--synth-font-size-lg', `${theme.typography.sizes.lg}px`);
  root.style.setProperty('--synth-font-size-xl', `${theme.typography.sizes.xl}px`);

  // Apply spacing
  root.style.setProperty('--synth-space-xs', `${theme.spacing.xs}px`);
  root.style.setProperty('--synth-space-sm', `${theme.spacing.sm}px`);
  root.style.setProperty('--synth-space-md', `${theme.spacing.md}px`);
  root.style.setProperty('--synth-space-lg', `${theme.spacing.lg}px`);
  root.style.setProperty('--synth-space-xl', `${theme.spacing.xl}px`);

  // Apply border radius
  root.style.setProperty('--synth-radius-sm', `${theme.borderRadius.sm}px`);
  root.style.setProperty('--synth-radius-md', `${theme.borderRadius.md}px`);
  root.style.setProperty('--synth-radius-lg', `${theme.borderRadius.lg}px`);
  root.style.setProperty('--synth-radius-round', theme.borderRadius.round);

  // Apply transitions
  root.style.setProperty('--synth-transition-fast', theme.transitions.fast);
  root.style.setProperty('--synth-transition-normal', theme.transitions.normal);
  root.style.setProperty('--synth-transition-slow', theme.transitions.slow);

  // Set data-theme attribute for CSS theme selectors
  root.setAttribute('data-theme', theme.id);
}

/**
 * Export current theme from CSS custom properties
 */
export function exportTheme(): SynthTheme {
  const root = getComputedStyle(document.documentElement);
  const themeId = document.documentElement.getAttribute('data-theme') || 'custom';

  return {
    id: themeId,
    name: 'Exported Theme',
    description: 'Theme exported from current CSS variables',
    colors: {
      background: {
        darkest: root.getPropertyValue('--synth-bg-darkest').trim(),
        darker: root.getPropertyValue('--synth-bg-darker').trim(),
        dark: root.getPropertyValue('--synth-bg-dark').trim(),
        medium: root.getPropertyValue('--synth-bg-medium').trim(),
        light: root.getPropertyValue('--synth-bg-light').trim(),
      },
      text: {
        primary: root.getPropertyValue('--synth-text-primary').trim(),
        secondary: root.getPropertyValue('--synth-text-secondary').trim(),
        tertiary: root.getPropertyValue('--synth-text-tertiary').trim(),
      },
      accent: {
        primary: root.getPropertyValue('--synth-accent-primary').trim(),
        secondary: root.getPropertyValue('--synth-accent-secondary').trim(),
        glow: root.getPropertyValue('--synth-accent-glow').trim(),
      },
    },
    effects: {
      shadows: {
        inset: root.getPropertyValue('--synth-shadow-inset').trim(),
        raised: root.getPropertyValue('--synth-shadow-raised').trim(),
        pressed: root.getPropertyValue('--synth-shadow-pressed').trim(),
        glow: root.getPropertyValue('--synth-shadow-glow').trim(),
      },
      gradients: {
        // Parse gradient strings - simplified
        panel: ['#2a2a2a', '#1a1a1a'],
        knob: ['#3a3a3a', '#252525'],
        button: ['#c8c4b8', '#b0ac9a'],
        inset: ['#1a1a1a', '#2a2a2a'],
      },
    },
    typography: {
      fontFamily: root.getPropertyValue('--synth-font-sans').trim(),
      monoFamily: root.getPropertyValue('--synth-font-mono').trim(),
      sizes: {
        xs: parseInt(root.getPropertyValue('--synth-font-size-xs')),
        sm: parseInt(root.getPropertyValue('--synth-font-size-sm')),
        md: parseInt(root.getPropertyValue('--synth-font-size-md')),
        lg: parseInt(root.getPropertyValue('--synth-font-size-lg')),
        xl: parseInt(root.getPropertyValue('--synth-font-size-xl')),
      },
    },
    spacing: {
      xs: parseInt(root.getPropertyValue('--synth-space-xs')),
      sm: parseInt(root.getPropertyValue('--synth-space-sm')),
      md: parseInt(root.getPropertyValue('--synth-space-md')),
      lg: parseInt(root.getPropertyValue('--synth-space-lg')),
      xl: parseInt(root.getPropertyValue('--synth-space-xl')),
    },
    borderRadius: {
      sm: parseInt(root.getPropertyValue('--synth-radius-sm')),
      md: parseInt(root.getPropertyValue('--synth-radius-md')),
      lg: parseInt(root.getPropertyValue('--synth-radius-lg')),
      round: root.getPropertyValue('--synth-radius-round').trim(),
    },
    transitions: {
      fast: root.getPropertyValue('--synth-transition-fast').trim(),
      normal: root.getPropertyValue('--synth-transition-normal').trim(),
      slow: root.getPropertyValue('--synth-transition-slow').trim(),
    },
  };
}

/**
 * Validate theme structure
 */
export function validateTheme(theme: Partial<SynthTheme>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!theme.id) errors.push('Missing theme.id');
  if (!theme.name) errors.push('Missing theme.name');
  if (!theme.colors) errors.push('Missing theme.colors');
  if (!theme.effects) errors.push('Missing theme.effects');

  // Validate color format (simple hex check)
  const validateColor = (color: string | undefined, name: string) => {
    if (!color) {
      errors.push(`Missing ${name}`);
      return;
    }
    if (!color.match(/^(#[0-9a-fA-F]{3,8}|rgba?\(.*\))$/)) {
      errors.push(`Invalid color format for ${name}: ${color}`);
    }
  };

  if (theme.colors?.background) {
    validateColor(theme.colors.background.darkest, 'background.darkest');
    validateColor(theme.colors.background.darker, 'background.darker');
    validateColor(theme.colors.background.dark, 'background.dark');
    validateColor(theme.colors.background.medium, 'background.medium');
    validateColor(theme.colors.background.light, 'background.light');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
