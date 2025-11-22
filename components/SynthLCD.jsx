/**
 * @file SynthLCD.jsx
 * @brief LCD display component for text and status information
 *
 * @description
 * A retro-style LCD display component with classic green-on-dark styling.
 * Supports single or multi-line text display with automatic truncation.
 *
 * ## Use Cases
 * - **Patch Name Display**: Show current preset/patch name
 * - **Parameter Readout**: Display detailed parameter values
 * - **Bank/Program Selection**: Show bank and program numbers
 * - **MIDI Monitor**: Display incoming MIDI data
 * - **Status Messages**: Show system status and notifications
 * - **Tempo/BPM Display**: Show current tempo
 * - **Tuner Display**: Show note name and cents offset
 *
 * ## Display Modes
 * - **Single Line**: Compact display for patch names or values
 * - **Two Lines**: Header + value or category + selection
 *
 * ## Styling
 * - Classic green phosphor LCD aesthetic
 * - Text glow for authentic appearance
 * - Monospace font for aligned readouts
 * - Auto-truncation with ellipsis for long text
 *
 * @example
 * ```jsx
 * // Single line patch name
 * <SynthLCD text="VINTAGE BRASS" />
 *
 * // Two-line display with category
 * <SynthLCD
 *   text={['FILTER', 'CUTOFF: 2400Hz']}
 *   lines={2}
 * />
 *
 * // MIDI display
 * <SynthLCD
 *   text={['CH: 1 | CC: 74', 'VALUE: 127']}
 *   lines={2}
 * />
 * ```
 */

import React from 'react';

export const SynthLCD = ({ text = "STUDIO SYNTH", lines = 1 }) => {
  const displayLines = Array.isArray(text) ? text : [text];

  return (
    <div
      style={{
        fontFamily: 'var(--synth-font-mono)',
        width: lines === 1 ? '200px' : '240px',
        padding: '8px 12px',
        background: 'linear-gradient(180deg, #2a3a2a, #1a2a1a)',
        borderRadius: '4px',
        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8), 2px 2px 6px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {displayLines.slice(0, lines).map((line, index) => (
          <div
            key={index}
            style={{
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#88ff88',
              textShadow: '0 0 8px rgba(136,255,136,0.6), 0 0 4px rgba(136,255,136,0.4)',
              fontSize: lines === 1 ? '14px' : '12px',
              letterSpacing: '0.05em',
            }}
          >
            {line || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
};
