/**
 * @file SynthRow.jsx
 * @brief Layout component for organizing synth controls in horizontal rows
 *
 * @description
 * SynthRow is a flexible horizontal layout component designed for arranging
 * synthesizer controls in organized rows. It supports optional labels, dividers,
 * and various alignment options.
 *
 * ## Use Cases
 * - **Oscillator Section**: Group oscillator controls (waveform, tune, level) horizontally
 * - **Filter Bank**: Arrange filter knobs (cutoff, resonance, env amount) in a row
 * - **Envelope Controls**: Place ADSR knobs or envelope display with related controls
 * - **Mixer Channel**: Combine fader, pan, mute, solo controls in a channel strip
 * - **Effect Parameters**: Group delay time, feedback, mix knobs together
 * - **Modulation Section**: Arrange LFO with destination controls
 * - **Master Section**: Combine volume, pan, and output meters
 *
 * ## Layout Patterns
 * - Use `justify="space-between"` for controls that should span the full width
 * - Use `justify="center"` for centered control groups
 * - Use `wrap={true}` for responsive layouts that wrap on smaller screens
 * - Combine with `label` prop to create labeled sections
 *
 * @example
 * ```jsx
 * // Basic oscillator row
 * <SynthRow label="OSCILLATOR 1">
 *   <SynthKnob label="WAVE" options={['SIN', 'SAW', 'SQR']} />
 *   <SynthKnob label="TUNE" min={-24} max={24} />
 *   <SynthKnob label="FINE" min={-100} max={100} />
 *   <SynthKnob label="LEVEL" min={0} max={100} />
 * </SynthRow>
 *
 * // Filter section with envelope
 * <SynthRow label="FILTER" justify="flex-start" gap="var(--synth-space-xl)">
 *   <SynthKnob label="CUTOFF" />
 *   <SynthKnob label="RESO" />
 *   <SynthADSR label="FILTER ENV" />
 * </SynthRow>
 * ```
 */

import React from 'react';

export const SynthRow = ({
  /** Child components to arrange horizontally */
  children,
  /** Optional label displayed above the row */
  label,
  /** Gap between child elements */
  gap = 'var(--synth-space-xl)',
  /** Vertical alignment of children */
  align = 'flex-start',
  /** Horizontal distribution of children */
  justify = 'flex-start',
  /** Padding inside the row container */
  padding = 'var(--synth-space-md)',
  /** Whether children should wrap to new lines */
  wrap = false,
  /** Show a subtle background panel */
  showPanel = false,
  /** Show divider line below the row */
  showDivider = false,
  /** Additional inline styles */
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: label ? 'var(--synth-space-sm)' : 0,
      }}
    >
      {/* Section label */}
      {label && (
        <div
          style={{
            color: 'var(--synth-text-secondary)',
            fontSize: 'var(--synth-font-size-xs)',
            fontWeight: 'var(--synth-font-weight-bold)',
            letterSpacing: 'var(--synth-letter-spacing-wide)',
            paddingLeft: padding,
          }}
        >
          {label}
        </div>
      )}

      {/* Row content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap,
          padding,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          ...(showPanel && {
            background: 'var(--synth-gradient-panel)',
            borderRadius: 'var(--synth-radius-md)',
            boxShadow: 'var(--synth-shadow-sm)',
          }),
          ...style,
        }}
      >
        {children}
      </div>

      {/* Optional divider */}
      {showDivider && (
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            margin: `var(--synth-space-sm) ${padding}`,
          }}
        />
      )}
    </div>
  );
};

export default SynthRow;
