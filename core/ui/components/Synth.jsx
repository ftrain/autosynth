/**
 * @file Synth.jsx
 * @brief Main synthesizer container component
 *
 * @description
 * The Synth component is the top-level container for building complete synthesizer
 * interfaces. It provides a vertically stacked layout with consistent styling,
 * and serves as the main wrapper for SynthRow components.
 *
 * ## Use Cases
 * - **Complete Synthesizer UI**: Wrap multiple SynthRow components to create a full synth interface
 * - **Effect Rack**: Stack effect modules vertically for a rack-style layout
 * - **Modular System**: Container for modular synth patches with multiple sections
 * - **Control Surface**: DAW control surface with multiple rows of controls
 * - **Sound Design Panel**: Complex sound design interfaces with organized sections
 *
 * ## Layout Patterns
 * - Stack rows of oscillators, filters, envelopes, and effects
 * - Group related controls into labeled sections
 * - Create consistent spacing and alignment across the entire interface
 *
 * @example
 * ```jsx
 * <Synth title="STUDIO LEAD" subtitle="Analog Modeling Synthesizer">
 *   <SynthRow label="OSCILLATORS">
 *     <DualModeOscillator prefix="osc1" />
 *     <DualModeOscillator prefix="osc2" />
 *   </SynthRow>
 *   <SynthRow label="FILTER">
 *     <SynthKnob label="CUTOFF" />
 *     <SynthKnob label="RESONANCE" />
 *     <SynthADSR label="FILTER ENV" />
 *   </SynthRow>
 *   <SynthRow label="OUTPUT">
 *     <SynthVUMeter label="L" />
 *     <SynthVUMeter label="R" />
 *     <TransportControls />
 *   </SynthRow>
 * </Synth>
 * ```
 */

import React from 'react';

export const Synth = ({
  /** Child components (typically SynthRow elements) */
  children,
  /** Main title displayed at the top of the synth */
  title,
  /** Subtitle or model name displayed below the title */
  subtitle,
  /** Gap between rows */
  gap = 'var(--synth-space-lg)',
  /** Padding inside the synth container */
  padding = 'var(--synth-space-xl)',
  /** Additional inline styles */
  style = {},
  /** Width of the synth container ('auto', 'full', or specific value) */
  width = 'auto',
  /** Show a decorative border around the synth */
  showBorder = true,
  /** Background style variant */
  variant = 'default',
}) => {
  const widthValue = width === 'full' ? '100%' : width === 'auto' ? 'fit-content' : width;

  const variantStyles = {
    default: {
      background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
    },
    dark: {
      background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
    },
    panel: {
      background: 'linear-gradient(145deg, #252525, #1a1a1a)',
    },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        padding,
        width: widthValue,
        borderRadius: 'var(--synth-radius-lg)',
        boxShadow: showBorder
          ? '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.1)'
          : '0 4px 20px rgba(0,0,0,0.5)',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {/* Header section */}
      {(title || subtitle) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--synth-space-xs)',
            paddingBottom: 'var(--synth-space-md)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 'var(--synth-space-sm)',
          }}
        >
          {title && (
            <div
              style={{
                color: 'var(--synth-text-primary)',
                fontSize: 'var(--synth-font-size-lg)',
                fontWeight: 'var(--synth-font-weight-bold)',
                letterSpacing: 'var(--synth-letter-spacing-wide)',
                textShadow: '0 0 10px rgba(255,255,255,0.3)',
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              style={{
                color: 'var(--synth-text-secondary)',
                fontSize: 'var(--synth-font-size-xs)',
                letterSpacing: 'var(--synth-letter-spacing-wide)',
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Content rows */}
      {children}
    </div>
  );
};

export default Synth;
