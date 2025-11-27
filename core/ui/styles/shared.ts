/**
 * @file shared.ts
 * @brief Shared style utilities using CSS custom properties
 *
 * These utilities convert CSS variables to inline styles for React components.
 * All values reference design tokens from tokens.css.
 */

import { CSSProperties } from 'react';

/**
 * Shared style utilities for synth components
 */
export const synthStyles = {
  /**
   * Panel/group container style
   */
  panel: {
    background: 'var(--synth-gradient-panel)',
    border: 'var(--synth-border-width) solid var(--synth-border-color)',
    borderRadius: 'var(--synth-radius-lg)',
    padding: 'var(--synth-space-lg)',
    marginBottom: 'var(--synth-space-xl)',
    boxShadow: 'var(--synth-shadow-panel)',
  } as CSSProperties,

  /**
   * Panel title/header style
   */
  panelTitle: {
    margin: '0 0 var(--synth-space-lg) 0',
    fontSize: 'var(--synth-font-size-xl)',
    color: 'var(--synth-text-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: 'var(--synth-letter-spacing-wide)',
    fontWeight: 'var(--synth-font-weight-bold)',
    textShadow: '0 0 8px rgba(255,255,255,0.3)',
  } as CSSProperties,

  /**
   * Knob container (label + knob + value)
   */
  knobContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 'var(--synth-space-sm)',
  } as CSSProperties,

  /**
   * Knob label text
   */
  knobLabel: {
    color: 'var(--synth-text-primary)',
    fontSize: 'var(--synth-font-size-md)',
    fontWeight: 'var(--synth-font-weight-bold)',
    letterSpacing: 'var(--synth-letter-spacing-normal)',
    textAlign: 'center' as const,
  } as CSSProperties,

  /**
   * Knob body style (dynamic based on state and value)
   */
  knobBody: (isDragging: boolean = false, glowIntensity: number = 0, ledColor: string | null = null): CSSProperties => {
    // Use LED color if provided (for stepped knobs), otherwise calculate gray glow
    const bgColor = ledColor || `rgb(${Math.round(glowIntensity * 200)}, ${Math.round(glowIntensity * 200)}, ${Math.round(glowIntensity * 200)})`;

    return {
      position: 'relative',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'var(--synth-transition-normal)',
      width: 'var(--synth-knob-size)',
      height: 'var(--synth-knob-size)',
      background: bgColor,
      borderRadius: 'var(--synth-radius-round)',
      boxShadow: isDragging
        ? 'inset 2px 2px 6px rgba(0,0,0,0.5), 4px 4px 8px rgba(0,0,0,0.6)'
        : 'inset 2px 2px 4px rgba(0,0,0,0.5), 4px 4px 8px rgba(0,0,0,0.6)',
      touchAction: 'none',
    };
  },

  /**
   * Knob inner circle
   */
  knobInner: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 'var(--synth-knob-inner-size)',
    height: 'var(--synth-knob-inner-size)',
    background: 'var(--synth-gradient-knob)',
    borderRadius: 'var(--synth-radius-round)',
    boxShadow: '2px 2px 4px rgba(0,0,0,0.6)',
    transform: 'translate(-50%, -50%)',
    transformOrigin: 'center center',
  } as CSSProperties,

  /**
   * Knob indicator (pointer)
   */
  knobIndicator: (rotation: number): CSSProperties => ({
    position: 'absolute',
    top: '4px',
    left: '50%',
    width: 'var(--synth-knob-indicator-width)',
    height: 'var(--synth-knob-indicator-height)',
    background: 'linear-gradient(180deg, #ffffff, #e0e0e0)',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.5)',
    transform: `translateX(-50%) rotate(${rotation}deg)`,
    transformOrigin: 'center calc(var(--synth-knob-inner-size) / 2 - 4px)',
    borderRadius: '0',
  }),

  /**
   * Knob value display
   */
  knobValue: {
    color: 'var(--synth-text-secondary)',
    fontSize: 'var(--synth-font-size-md)',
    fontFamily: 'var(--synth-font-mono)',
    textAlign: 'center' as const,
  } as CSSProperties,

  /**
   * Toggle button style (matches knob size with red glow when on)
   */
  toggleButton: (isOn: boolean, isPressed: boolean): CSSProperties => ({
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'var(--synth-transition-fast)',
    width: 'var(--synth-knob-size)',
    height: 'var(--synth-knob-size)',
    borderRadius: 'var(--synth-radius-round)',
    background: isOn
      ? 'radial-gradient(circle at center, #ff3232, #cc0000)'
      : 'radial-gradient(circle at center, #2a2a2a, #0a0a0a)',
    boxShadow: isPressed
      ? 'inset 2px 2px 6px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.6)'
      : isOn
        ? 'inset 2px 2px 4px rgba(0,0,0,0.5), 0 0 16px rgba(255,50,50,0.8), 0 0 8px rgba(255,50,50,0.5), 4px 4px 8px rgba(0,0,0,0.6)'
        : 'inset 2px 2px 4px rgba(0,0,0,0.5), 4px 4px 8px rgba(0,0,0,0.6)',
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
  }),

  /**
   * Multi-switch container
   */
  multiSwitchContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--synth-space-xs)',
    padding: 'var(--synth-space-sm)',
    borderRadius: 'var(--synth-radius-md)',
    background: 'var(--synth-gradient-inset)',
    boxShadow: 'var(--synth-shadow-inset), var(--synth-shadow-raised)',
  } as CSSProperties,

  /**
   * Multi-switch button
   */
  multiSwitchButton: (isActive: boolean): CSSProperties => ({
    position: 'relative',
    padding: '4px 16px',
    cursor: 'pointer',
    transition: 'var(--synth-transition-normal)',
    textAlign: 'center',
    minWidth: '60px',
    background: isActive
      ? 'var(--synth-gradient-button-active)'
      : 'var(--synth-gradient-button)',
    boxShadow: isActive
      ? 'inset 1px 1px 3px rgba(0,0,0,0.2), 1px 1px 2px rgba(255,255,255,0.3)'
      : '1px 1px 2px rgba(0,0,0,0.15)',
    borderRadius: 'var(--synth-radius-sm)',
  }),

  /**
   * Slider track
   */
  sliderTrack: (orientation: 'vertical' | 'horizontal'): CSSProperties => ({
    position: 'relative',
    background: 'var(--synth-gradient-inset)',
    borderRadius: 'var(--synth-radius-md)',
    boxShadow: 'var(--synth-shadow-inset)',
    ...(orientation === 'vertical'
      ? { width: '24px', height: '200px' }
      : { width: '200px', height: '24px' }
    ),
  }),

  /**
   * Slider thumb
   */
  sliderThumb: (isDragging: boolean): CSSProperties => ({
    position: 'absolute',
    width: '20px',
    height: '20px',
    background: 'var(--synth-gradient-knob)',
    borderRadius: 'var(--synth-radius-round)',
    boxShadow: isDragging
      ? 'var(--synth-shadow-raised), var(--synth-shadow-glow-accent)'
      : 'var(--synth-shadow-raised)',
    cursor: 'pointer',
    transition: 'var(--synth-transition-fast)',
  }),

  /**
   * ADSR visualizer container
   */
  adsrContainer: {
    position: 'relative' as const,
    width: '280px',
    height: '120px',
    background: 'var(--synth-gradient-inset)',
    borderRadius: 'var(--synth-radius-base)',
    boxShadow: 'var(--synth-shadow-inset), var(--synth-shadow-raised)',
    padding: '10px',
  } as CSSProperties,

  /**
   * ADSR parameter control box
   */
  adsrParamBox: (isActive: boolean): CSSProperties => ({
    cursor: 'pointer',
    userSelect: 'none',
    width: '48px',
    height: '48px',
    borderRadius: 'var(--synth-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive
      ? 'var(--synth-gradient-inset)'
      : 'var(--synth-gradient-knob)',
    boxShadow: isActive
      ? 'var(--synth-shadow-inset-deep)'
      : 'var(--synth-shadow-raised)',
  }),

  /**
   * Sequencer step button
   */
  sequencerStep: (isActive: boolean, isCurrentStep: boolean): CSSProperties => ({
    height: 'var(--synth-button-height)',
    background: isActive
      ? 'radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0)'
      : 'var(--synth-gradient-inset)',
    border: isCurrentStep
      ? '2px solid var(--synth-accent-primary)'
      : 'var(--synth-border-width) solid var(--synth-border-color)',
    borderRadius: 'var(--synth-radius-sm)',
    cursor: 'pointer',
    transition: 'var(--synth-transition-fast)',
    boxShadow: isActive
      ? 'var(--synth-shadow-raised), var(--synth-shadow-glow)'
      : 'var(--synth-shadow-inset)',
  }),

  /**
   * LED indicator
   */
  led: (isOn: boolean, color: string = '#ffffff'): CSSProperties => ({
    width: '12px',
    height: '12px',
    borderRadius: 'var(--synth-radius-round)',
    background: isOn
      ? `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`
      : 'var(--synth-bg-dark)',
    boxShadow: isOn
      ? `0 0 12px ${color}, 0 0 6px ${color}88, var(--synth-shadow-inset)`
      : 'var(--synth-shadow-inset)',
    transition: 'var(--synth-transition-normal)',
  }),

  /**
   * LCD display
   */
  lcd: {
    background: '#1a3a1a',
    color: '#33ff33',
    fontFamily: 'var(--synth-font-mono)',
    fontSize: 'var(--synth-font-size-base)',
    padding: 'var(--synth-space-sm) var(--synth-space-md)',
    borderRadius: 'var(--synth-radius-md)',
    boxShadow: 'var(--synth-shadow-inset-deep)',
    textShadow: '0 0 4px #33ff33',
    letterSpacing: 'var(--synth-letter-spacing-tight)',
  } as CSSProperties,

  /**
   * Row layout
   */
  row: (gap: string | number = 'var(--synth-space-lg)', wrap: boolean = false): CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    flexWrap: wrap ? 'wrap' as const : 'nowrap' as const,
    alignItems: 'flex-start',
  }),

  /**
   * Column layout
   */
  column: (gap: string | number = 'var(--synth-space-lg)'): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: typeof gap === 'number' ? `${gap}px` : gap,
  }),

  /**
   * Button base style
   */
  button: (variant: 'primary' | 'secondary' = 'secondary', isActive: boolean = false): CSSProperties => ({
    padding: 'var(--synth-button-padding)',
    fontSize: 'var(--synth-font-size-md)',
    fontWeight: 'var(--synth-font-weight-bold)',
    fontFamily: 'var(--synth-font-mono)',
    background: variant === 'primary' && isActive
      ? 'linear-gradient(145deg, #fff, #ddd)'
      : 'var(--synth-gradient-button)',
    color: variant === 'primary' && isActive
      ? '#000'
      : 'var(--synth-text-secondary)',
    border: `var(--synth-border-width-thick) solid ${variant === 'primary' && isActive ? '#fff' : 'var(--synth-border-color)'}`,
    borderRadius: 'var(--synth-radius-md)',
    cursor: 'pointer',
    transition: 'var(--synth-transition-slow)',
    boxShadow: variant === 'primary' && isActive
      ? 'var(--synth-shadow-glow-accent)'
      : 'var(--synth-shadow-inset)',
  }),

  /**
   * Dropdown/select style
   */
  select: {
    padding: '6px 12px',
    fontSize: 'var(--synth-font-size-md)',
    fontWeight: 'var(--synth-font-weight-bold)',
    fontFamily: 'var(--synth-font-mono)',
    background: 'var(--synth-gradient-inset)',
    color: 'var(--synth-text-primary)',
    border: 'var(--synth-border-width-thick) solid var(--synth-border-color)',
    borderRadius: 'var(--synth-radius-md)',
    cursor: 'pointer',
    boxShadow: 'var(--synth-shadow-inset), var(--synth-shadow-raised)',
    minWidth: '120px',
  } as CSSProperties,
};

/**
 * Helper to merge custom styles with base styles
 */
export function mergeStyles(
  baseStyle: CSSProperties,
  customStyle?: CSSProperties
): CSSProperties {
  return { ...baseStyle, ...customStyle };
}

/**
 * Helper to apply conditional styles
 */
export function conditionalStyle(
  condition: boolean,
  trueStyle: CSSProperties,
  falseStyle: CSSProperties = {}
): CSSProperties {
  return condition ? trueStyle : falseStyle;
}
