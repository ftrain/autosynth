/**
 * @file SynthLED.jsx
 * @brief LED indicator component for status display
 *
 * @description
 * A simple LED indicator light with multiple color options.
 * Shows on/off state with realistic glow effects when active.
 *
 * ## Use Cases
 * - **Signal Present**: Indicate audio signal on a channel
 * - **MIDI Activity**: Flash on MIDI input/output
 * - **Clip Warning**: Red LED for signal clipping
 * - **Sync Status**: Show external sync lock
 * - **Power Indicator**: Basic on/off status
 * - **Mode Selection**: Show active mode in a group
 * - **Voice Activity**: Indicate active polyphony voices
 * - **Envelope Stage**: Show current envelope phase
 *
 * ## Available Colors
 * - **White**: General purpose indicator
 * - **Red**: Warnings, clipping, record status
 * - **Green**: Good status, sync, power on
 * - **Blue**: MIDI activity, special modes
 *
 * ## Animation
 * - Control `active` prop externally for blinking effects
 * - Use interval timers for MIDI activity simulation
 * - Can be controlled by audio analysis for level indication
 *
 * @example
 * ```jsx
 * // Status indicators row
 * <SynthRow>
 *   <SynthLED label="POWER" active={true} color="green" />
 *   <SynthLED label="MIDI" active={midiActivity} color="blue" />
 *   <SynthLED label="CLIP" active={isClipping} color="red" />
 * </SynthRow>
 *
 * // Blinking tempo LED
 * const [beat, setBeat] = useState(false);
 * <SynthLED label="TEMPO" active={beat} color="white" />
 * ```
 */

import React from 'react';

export const SynthLED = ({ label = "SIGNAL", active = false, color = "white" }) => {
  const colorMap = {
    white: {
      on: 'radial-gradient(circle at center, rgba(255,255,255,1), rgba(255,255,255,0.6))',
      glow: 'rgba(255,255,255,0.8)',
      off: '#333',
    },
    red: {
      on: 'radial-gradient(circle at center, rgba(255,50,50,1), rgba(255,50,50,0.6))',
      glow: 'rgba(255,50,50,0.8)',
      off: '#3a1a1a',
    },
    green: {
      on: 'radial-gradient(circle at center, rgba(50,255,50,1), rgba(50,255,50,0.6))',
      glow: 'rgba(50,255,50,0.8)',
      off: '#1a3a1a',
    },
    blue: {
      on: 'radial-gradient(circle at center, rgba(50,150,255,1), rgba(50,150,255,0.6))',
      glow: 'rgba(50,150,255,0.8)',
      off: '#1a1a3a',
    },
  };

  const selectedColor = colorMap[color] || colorMap.white;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--synth-space-sm)' }}>
      <div style={{ color: 'var(--synth-text-tertiary)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px' }}>{label}</div>
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          transition: 'all 150ms',
          background: active ? selectedColor.on : selectedColor.off,
          boxShadow: active
            ? `0 0 12px ${selectedColor.glow}, 0 0 6px ${selectedColor.glow}, inset 0 0 4px rgba(255,255,255,0.3)`
            : 'inset 1px 1px 2px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  );
};
